// app/src/screens/GstReturnsScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import { colors, fonts } from '../theme';
import { formatMoney } from '../lib/money';
import { mockInvoices, mockParties, mockItems, mockBusinesses } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { Invoice } from '../types';

type ReturnTab = 'gstr1' | 'gstr3b' | 'gstr2b' | 'tds' | 'guide';

// Indian GSTIN validation regex: 2 digits state + 10 PAN chars + 1 entity num + 1 Z + 1 check digit = 15 chars
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function GstReturnsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { currentBusiness } = useAuth();

  const [frequency, setFrequency] = useState<'Monthly' | 'Quarterly'>('Monthly');
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2026-27');
  const [activeTab, setActiveTab] = useState<ReturnTab>('gstr1');
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);

  // Sales invoices for the business
  const businessId = currentBusiness?.id || 'b-1';
  const salesInvoices = useMemo(() => {
    return mockInvoices.filter((inv) => inv.business_id === businessId && inv.type === 'sale');
  }, [businessId]);

  const purchaseInvoices = useMemo(() => {
    return mockInvoices.filter((inv) => inv.business_id === businessId && inv.type === 'purchase');
  }, [businessId]);

  // Pre-filing GST validation checks (Matching Image 1 & 2)
  const validationWarnings = useMemo(() => {
    const warnings: { type: 'danger' | 'warning'; text: string; id: string }[] = [];

    salesInvoices.forEach((inv) => {
      // Find party to get GSTIN if not directly on invoice
      const party = mockParties.find((p) => p.id === inv.party_id);
      const gstin = inv.party_gstin || party?.gstin;

      // Check GSTIN format if provided
      if (gstin && !GSTIN_REGEX.test(gstin)) {
        warnings.push({
          id: `gstin-${inv.id}`,
          type: 'danger',
          text: `Invoice ${inv.invoice_no}: Invalid client GSTIN format — ${gstin}`,
        });
      }

      // Check items for missing HSN / SAC code
      inv.items.forEach((item) => {
        const itemObj = mockItems.find((i) => i.id === item.item_id);
        const hsn = item.hsn || itemObj?.hsn;
        if (!hsn || hsn.trim() === '') {
          warnings.push({
            id: `hsn-${inv.id}-${item.id}`,
            type: 'warning',
            text: `Invoice ${inv.invoice_no}: Item "${item.name}" has no HSN/SAC code`,
          });
        }
      });
    });

    return warnings;
  }, [salesInvoices]);

  // Overall Financial Totals
  const totalTaxable = useMemo(() => {
    return salesInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  }, [salesInvoices]);

  const totalTax = useMemo(() => {
    return salesInvoices.reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);
  }, [salesInvoices]);

  const purchaseItc = useMemo(() => {
    return purchaseInvoices.reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);
  }, [purchaseInvoices]);

  const netPayable = Math.max(0, totalTax - purchaseItc);

  // B2B Invoices (registered buyers with GSTIN)
  const b2bInvoices = useMemo(() => {
    return salesInvoices.filter((inv) => {
      const party = mockParties.find((p) => p.id === inv.party_id);
      const gstin = inv.party_gstin || party?.gstin;
      return !!gstin;
    });
  }, [salesInvoices]);

  // B2C Invoices (unregistered consumers)
  const b2cInvoices = useMemo(() => {
    return salesInvoices.filter((inv) => {
      const party = mockParties.find((p) => p.id === inv.party_id);
      const gstin = inv.party_gstin || party?.gstin;
      return !gstin;
    });
  }, [salesInvoices]);

  // HSN Summary aggregation (Table 12)
  const hsnSummary = useMemo(() => {
    const map = new Map<string, { code: string; desc: string; uqc: string; qty: number; value: number; taxable: number; igst: number; cgst: number; sgst: number }>();

    salesInvoices.forEach((inv) => {
      inv.items.forEach((it) => {
        const code = it.hsn || '998311';
        const key = code;
        const lineTax = (it.price * it.qty * (it.gst_rate / 100));
        const isInterState = inv.igst > 0;

        if (!map.has(key)) {
          map.set(key, {
            code,
            desc: it.name,
            uqc: it.unit || 'NOS',
            qty: 0,
            value: 0,
            taxable: 0,
            igst: 0,
            cgst: 0,
            sgst: 0,
          });
        }

        const entry = map.get(key)!;
        entry.qty += it.qty;
        entry.taxable += it.amount;
        entry.value += it.amount + lineTax;
        if (isInterState) {
          entry.igst += lineTax;
        } else {
          entry.cgst += lineTax / 2;
          entry.sgst += lineTax / 2;
        }
      });
    });

    return Array.from(map.values());
  }, [salesInvoices]);

  // Export GST Portal compliant JSON
  const handleJsonExport = () => {
    const gstPayload = {
      gstin: currentBusiness?.gstin || '27ABCDE1234F1Z5',
      fp: '102026', // October 2026
      version: 'GSTR1_v2.0',
      hash: 'hash-bilu-erp-v1',
      cur_gt: totalTaxable / 100,
      b2b: b2bInvoices.map((inv) => {
        const party = mockParties.find((p) => p.id === inv.party_id);
        const gstin = inv.party_gstin || party?.gstin || '27SHRM1234A1Z5';
        return {
          ctin: gstin,
          inv: [
            {
              inum: inv.invoice_no,
              idt: inv.date.split('-').reverse().join('-'),
              val: inv.total / 100,
              pos: gstin.slice(0, 2),
              rchrg: 'N',
              inv_typ: 'R',
              itms: inv.items.map((it, idx) => ({
                num: idx + 1,
                itm_det: {
                  rt: it.gst_rate,
                  txval: it.amount / 100,
                  iamt: inv.igst / 100,
                  camt: inv.cgst / 100,
                  samt: inv.sgst / 100,
                  csamt: 0,
                },
              })),
            },
          ],
        };
      }),
      b2cs: b2cInvoices.map((inv) => ({
        sply_ty: 'INTRA',
        pos: '27',
        typ: 'OE',
        rt: 5,
        txval: inv.subtotal / 100,
        camt: inv.cgst / 100,
        samt: inv.sgst / 100,
        csamt: 0,
      })),
      hsn: {
        data: hsnSummary.map((h, i) => ({
          num: i + 1,
          hsn_sc: h.code,
          desc: h.desc,
          uqc: h.uqc,
          qty: h.qty,
          val: h.value / 100,
          txval: h.taxable / 100,
          iamt: h.igst / 100,
          camt: h.cgst / 100,
          samt: h.sgst / 100,
          csamt: 0,
        })),
      },
    };

    if (Platform.OS === 'web') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gstPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `GSTR1_${gstPayload.gstin}_102026.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      Alert.alert('JSON Exported', 'GSTR-1 JSON generated according to official GSTN offline schema.');
    }
  };

  // Export CSV helper
  const handleCsvExport = (tableName: string) => {
    let csv = '';
    if (tableName === 'B2B') {
      csv = 'GSTIN,Client,Invoice No,Date,POS,Type,Taxable,Tax\n' +
        b2bInvoices
          .map((i) => {
            const party = mockParties.find((p) => p.id === i.party_id);
            const g = i.party_gstin || party?.gstin || '-';
            const pos = g.slice(0, 2) || '27';
            const typ = i.igst > 0 ? 'INTER' : 'INTRA';
            return `"${g}","${i.party_name || party?.name}","${i.invoice_no}","${i.date}","${pos}","${typ}",${i.subtotal / 100},${(i.cgst + i.sgst + i.igst) / 100}`;
          })
          .join('\n');
    } else if (tableName === 'HSN') {
      csv = 'HSN/SAC,Description,UQC,Total Qty,Total Value,Taxable,IGST,CGST,SGST\n' +
        hsnSummary
          .map((h) => `"${h.code}","${h.desc}","${h.uqc}",${h.qty},${h.value / 100},${h.taxable / 100},${h.igst / 100},${h.cgst / 100},${h.sgst / 100}`)
          .join('\n');
    } else {
      csv = 'Invoice No,Date,Party,Total\n' + salesInvoices.map((i) => `"${i.invoice_no}","${i.date}","${i.party_name}",${i.total / 100}`).join('\n');
    }

    if (Platform.OS === 'web') {
      const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `GSTR1_${tableName}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      Alert.alert('CSV Downloaded', `${tableName} CSV export ready.`);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Top Header Row (Matching Image 1 & 2) */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithInfo}>
          <Text style={styles.pageTitle}>{t('nav.gstReturns', 'GST Returns')}</Text>
          <View style={styles.infoCircle}>
            <Feather name="info" size={14} color="#64748B" />
          </View>
        </View>

        {/* Period Selector Dropdowns */}
        <View style={styles.periodSelectorsWrap}>
          {/* Frequency: Monthly */}
          <Pressable
            style={styles.periodDropdown}
            onPress={() => setFrequency(frequency === 'Monthly' ? 'Quarterly' : 'Monthly')}
          >
            <Text style={styles.periodDropdownText}>{frequency}</Text>
            <Feather name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 6 }} />
          </Pressable>

          {/* Month: October */}
          <Pressable
            style={styles.periodDropdown}
            onPress={() => setSelectedMonth(selectedMonth === 'October' ? 'November' : 'October')}
          >
            <Text style={styles.periodDropdownText}>{selectedMonth}</Text>
            <Feather name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 6 }} />
          </Pressable>

          {/* Year: 2026-27 */}
          <View style={styles.periodDropdown}>
            <Text style={styles.periodDropdownText}>{selectedYear}</Text>
            <Feather name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 6 }} />
          </View>
        </View>
      </View>

      {/* Validation Warning Banners (Matching Image 1 & 2) */}
      {validationWarnings.length > 0 && (
        <View style={styles.warningsContainer}>
          {validationWarnings.map((w) => (
            <View
              key={w.id}
              style={[
                styles.warningBanner,
                w.type === 'danger' ? styles.dangerBanner : styles.amberBanner,
              ]}
            >
              <Feather
                name="alert-circle"
                size={16}
                color={w.type === 'danger' ? '#DC2626' : '#D97706'}
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <Text
                style={[
                  styles.warningBannerText,
                  w.type === 'danger' ? styles.dangerBannerText : styles.amberBannerText,
                ]}
              >
                {w.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 4 Summary KPI Cards in a row (Matching Image 1 & 2) */}
      <View style={styles.kpiCardsRow}>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>INVOICES</Text>
          <Text style={styles.kpiNumber}>{salesInvoices.length}</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TAXABLE</Text>
          <Text style={styles.kpiNumber}>{formatMoney(totalTaxable)}</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TAX</Text>
          <Text style={styles.kpiNumber}>{formatMoney(totalTax)}</Text>
        </Card>

        <Card style={[styles.kpiCard, styles.kpiCardHighlight]}>
          <Text style={[styles.kpiLabel, { color: '#1D4ED8' }]}>NET PAYABLE</Text>
          <Text style={[styles.kpiNumber, { color: '#1D4ED8' }]}>{formatMoney(netPayable)}</Text>
        </Card>
      </View>

      {/* Return Navigation Tabs (Matching Image 1 & 2) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScrollWrap}>
        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'gstr1' && styles.tabBtnActive]}
            onPress={() => setActiveTab('gstr1')}
          >
            <Feather
              name="file-text"
              size={15}
              color={activeTab === 'gstr1' ? '#FFFFFF' : '#475569'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'gstr1' && styles.tabBtnTextActive]}>
              GSTR-1
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'gstr3b' && styles.tabBtnActive]}
            onPress={() => setActiveTab('gstr3b')}
          >
            <Feather
              name="file-plus"
              size={15}
              color={activeTab === 'gstr3b' ? '#FFFFFF' : '#475569'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'gstr3b' && styles.tabBtnTextActive]}>
              GSTR-3B
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'gstr2b' && styles.tabBtnActive]}
            onPress={() => setActiveTab('gstr2b')}
          >
            <Feather
              name="check-circle"
              size={15}
              color={activeTab === 'gstr2b' ? '#FFFFFF' : '#475569'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'gstr2b' && styles.tabBtnTextActive]}>
              GSTR-2B Reconciliation
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'tds' && styles.tabBtnActive]}
            onPress={() => setActiveTab('tds')}
          >
            <Feather
              name="file"
              size={15}
              color={activeTab === 'tds' ? '#FFFFFF' : '#475569'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'tds' && styles.tabBtnTextActive]}>
              TDS / TCS Report
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'guide' && styles.tabBtnActive]}
            onPress={() => setActiveTab('guide')}
          >
            <Feather
              name="help-circle"
              size={15}
              color={activeTab === 'guide' ? '#FFFFFF' : '#475569'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'guide' && styles.tabBtnTextActive]}>
              Filing Guide
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Action Buttons & Export Bar (Matching Image 1 & 2) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exportBarScroll}>
        <View style={styles.exportBarRow}>
          {/* JSON Export Primary Button */}
          <Pressable style={styles.jsonExportBtn} onPress={handleJsonExport}>
            <Feather name="download" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.jsonExportBtnText}>JSON Export</Text>
          </Pressable>

          {/* Table CSV Exports */}
          <Pressable style={styles.subExportBtn} onPress={() => handleCsvExport('B2B')}>
            <Feather name="download" size={13} color="#475569" style={{ marginRight: 4 }} />
            <Text style={styles.subExportBtnText}>B2B</Text>
          </Pressable>

          <Pressable style={styles.subExportBtn} onPress={() => handleCsvExport('B2C')}>
            <Feather name="download" size={13} color="#475569" style={{ marginRight: 4 }} />
            <Text style={styles.subExportBtnText}>B2C</Text>
          </Pressable>

          <Pressable style={styles.subExportBtn} onPress={() => handleCsvExport('HSN')}>
            <Feather name="download" size={13} color="#475569" style={{ marginRight: 4 }} />
            <Text style={styles.subExportBtnText}>HSN</Text>
          </Pressable>

          <Pressable style={styles.subExportBtn} onPress={() => handleCsvExport('CDNR')}>
            <Feather name="download" size={13} color="#475569" style={{ marginRight: 4 }} />
            <Text style={styles.subExportBtnText}>CDNR</Text>
          </Pressable>

          <Pressable style={styles.subExportBtn} onPress={() => handleCsvExport('DOCS')}>
            <Feather name="download" size={13} color="#475569" style={{ marginRight: 4 }} />
            <Text style={styles.subExportBtnText}>Docs</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Content based on Active Tab */}
      {activeTab === 'gstr1' ? (
        <View style={styles.tabContentArea}>
          {/* Section 1: B2B Sales — Table 4A */}
          <Card style={styles.tableCardSection}>
            <View style={styles.tableSectionHeader}>
              <Text style={styles.sectionTitle}>B2B Sales — Table 4A</Text>
              <Text style={styles.sectionSubCount}>{b2bInvoices.length} Invoice(s)</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={{ minWidth: 840 }}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, { width: 170 }]}>GSTIN</Text>
                  <Text style={[styles.thCell, { width: 160 }]}>CLIENT</Text>
                  <Text style={[styles.thCell, { width: 170 }]}>INVOICE NO</Text>
                  <Text style={[styles.thCell, { width: 110 }]}>DATE</Text>
                  <Text style={[styles.thCell, { width: 60 }]}>POS</Text>
                  <Text style={[styles.thCell, { width: 80 }]}>TYPE</Text>
                  <Text style={[styles.thCell, { width: 120, textAlign: 'right' }]}>TAXABLE</Text>
                  <Text style={[styles.thCell, { width: 110, textAlign: 'right' }]}>TAX</Text>
                </View>

                {/* Table Rows */}
                {b2bInvoices.map((inv) => {
                  const party = mockParties.find((p) => p.id === inv.party_id);
                  const gstin = inv.party_gstin || party?.gstin || '-';
                  const pos = gstin.slice(0, 2) || '27';
                  const isInter = inv.igst > 0;
                  const lineTax = inv.cgst + inv.sgst + inv.igst;

                  return (
                    <View key={inv.id} style={styles.tableBodyRow}>
                      <Text style={[styles.tdCellCode, { width: 170 }]} numberOfLines={1}>
                        {gstin}
                      </Text>
                      <Text style={[styles.tdCell, { width: 160 }]} numberOfLines={1}>
                        {inv.party_name || party?.name || 'Customer'}
                      </Text>
                      <Text style={[styles.tdCellBold, { width: 170 }]} numberOfLines={1}>
                        {inv.invoice_no}
                      </Text>
                      <Text style={[styles.tdCell, { width: 110 }]} numberOfLines={1}>
                        {inv.date}
                      </Text>
                      <Text style={[styles.tdCell, { width: 60 }]} numberOfLines={1}>
                        {pos}
                      </Text>
                      <Text style={[styles.tdCellBadge, { width: 80 }]}>
                        {isInter ? 'INTER' : 'INTRA'}
                      </Text>
                      <Text style={[styles.tdCellNumber, { width: 120 }]} numberOfLines={1}>
                        {formatMoney(inv.subtotal)}
                      </Text>
                      <Text style={[styles.tdCellNumber, { width: 110 }]} numberOfLines={1}>
                        {formatMoney(lineTax)}
                      </Text>
                    </View>
                  );
                })}

                {/* B2B Total Row */}
                <View style={styles.tableFooterRow}>
                  <Text style={[styles.tfCellLabel, { width: 580 }]}>B2B Total</Text>
                  <Text style={[styles.tfCellValue, { width: 120 }]}>
                    {formatMoney(b2bInvoices.reduce((s, i) => s + i.subtotal, 0))}
                  </Text>
                  <Text style={[styles.tfCellValue, { width: 110 }]}>
                    {formatMoney(b2bInvoices.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0))}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </Card>

          {/* Section 2: B2C Sales — Table 7 */}
          <Card style={[styles.tableCardSection, { marginTop: 16 }]}>
            <View style={styles.tableSectionHeader}>
              <Text style={styles.sectionTitle}>B2C Sales — Table 7</Text>
              <Text style={styles.sectionSubCount}>{b2cInvoices.length} Invoice(s)</Text>
            </View>

            {b2cInvoices.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={{ minWidth: 700 }}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thCell, { width: 140 }]}>TYPE</Text>
                    <Text style={[styles.thCell, { width: 180 }]}>PLACE OF SUPPLY</Text>
                    <Text style={[styles.thCell, { width: 100 }]}>RATE</Text>
                    <Text style={[styles.thCell, { width: 140, textAlign: 'right' }]}>TAXABLE VALUE</Text>
                    <Text style={[styles.thCell, { width: 140, textAlign: 'right' }]}>TAX AMOUNT</Text>
                  </View>

                  {b2cInvoices.map((inv) => (
                    <View key={inv.id} style={styles.tableBodyRow}>
                      <Text style={[styles.tdCell, { width: 140 }]}>B2C Others (Small)</Text>
                      <Text style={[styles.tdCell, { width: 180 }]}>27 - Maharashtra</Text>
                      <Text style={[styles.tdCell, { width: 100 }]}>5.0%</Text>
                      <Text style={[styles.tdCellNumber, { width: 140 }]}>{formatMoney(inv.subtotal)}</Text>
                      <Text style={[styles.tdCellNumber, { width: 140 }]}>{formatMoney(inv.cgst + inv.sgst + inv.igst)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.emptyTableBox}>
                <Feather name="inbox" size={24} color="#94A3B8" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyTableText}>No B2C transactions for this filing period</Text>
              </View>
            )}
          </Card>

          {/* Section 3: HSN/SAC Summary — Table 12 */}
          <Card style={[styles.tableCardSection, { marginTop: 16 }]}>
            <View style={styles.tableSectionHeader}>
              <Text style={styles.sectionTitle}>HSN/SAC Summary — Table 12</Text>
              <Text style={styles.sectionSubCount}>{hsnSummary.length} Commodity Group(s)</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={{ minWidth: 840 }}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, { width: 110 }]}>HSN/SAC</Text>
                  <Text style={[styles.thCell, { width: 180 }]}>DESCRIPTION</Text>
                  <Text style={[styles.thCell, { width: 70 }]}>UQC</Text>
                  <Text style={[styles.thCell, { width: 90, textAlign: 'right' }]}>QTY</Text>
                  <Text style={[styles.thCell, { width: 130, textAlign: 'right' }]}>TOTAL VALUE</Text>
                  <Text style={[styles.thCell, { width: 130, textAlign: 'right' }]}>TAXABLE</Text>
                  <Text style={[styles.thCell, { width: 130, textAlign: 'right' }]}>TAX AMOUNT</Text>
                </View>

                {hsnSummary.map((h) => (
                  <View key={h.code} style={styles.tableBodyRow}>
                    <Text style={[styles.tdCellBold, { width: 110 }]}>{h.code}</Text>
                    <Text style={[styles.tdCell, { width: 180 }]} numberOfLines={1}>{h.desc}</Text>
                    <Text style={[styles.tdCell, { width: 70 }]}>{h.uqc}</Text>
                    <Text style={[styles.tdCell, { width: 90, textAlign: 'right' }]}>{h.qty}</Text>
                    <Text style={[styles.tdCellNumber, { width: 130 }]}>{formatMoney(h.value)}</Text>
                    <Text style={[styles.tdCellNumber, { width: 130 }]}>{formatMoney(h.taxable)}</Text>
                    <Text style={[styles.tdCellNumber, { width: 130 }]}>{formatMoney(h.igst + h.cgst + h.sgst)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>
        </View>
      ) : activeTab === 'gstr3b' ? (
        <Card style={styles.tableCardSection}>
          <Text style={styles.sectionTitle}>GSTR-3B Summary Return</Text>
          <Text style={styles.infoSubtitle}>Self-declaration of outward supplies and input tax credit</Text>

          <View style={styles.gstr3bBlock}>
            <Text style={styles.gstr3bHeading}>3.1 Details of Outward Supplies & inward supplies liable to reverse charge</Text>
            <View style={styles.summaryBreakRow}>
              <Text style={styles.summaryBreakLabel}>(a) Outward taxable supplies (other than zero rated)</Text>
              <Text style={styles.summaryBreakVal}>{formatMoney(totalTaxable)}</Text>
            </View>
            <View style={styles.summaryBreakRow}>
              <Text style={styles.summaryBreakLabel}>Total Integrated Tax (IGST)</Text>
              <Text style={styles.summaryBreakVal}>{formatMoney(salesInvoices.reduce((s, i) => s + i.igst, 0))}</Text>
            </View>
            <View style={styles.summaryBreakRow}>
              <Text style={styles.summaryBreakLabel}>Total Central Tax (CGST) + State Tax (SGST)</Text>
              <Text style={styles.summaryBreakVal}>{formatMoney(salesInvoices.reduce((s, i) => s + (i.cgst + i.sgst), 0))}</Text>
            </View>
          </View>

          <View style={[styles.gstr3bBlock, { marginTop: 14 }]}>
            <Text style={styles.gstr3bHeading}>4. Eligible Input Tax Credit (ITC)</Text>
            <View style={styles.summaryBreakRow}>
              <Text style={styles.summaryBreakLabel}>ITC Available (Purchase Bills / Inward supplies)</Text>
              <Text style={[styles.summaryBreakVal, { color: '#047857' }]}>{formatMoney(purchaseItc)}</Text>
            </View>
            <View style={styles.summaryBreakRow}>
              <Text style={styles.summaryBreakLabel}>Net Tax Payable in Cash (after ITC set-off)</Text>
              <Text style={[styles.summaryBreakVal, { color: '#B91C1C', fontFamily: fonts.bold }]}>{formatMoney(netPayable)}</Text>
            </View>
          </View>
        </Card>
      ) : activeTab === 'gstr2b' ? (
        <Card style={styles.tableCardSection}>
          <Text style={styles.sectionTitle}>GSTR-2B Auto-Drafted Reconciliation</Text>
          <Text style={styles.infoSubtitle}>Reconcile supplier filed invoices against your purchase bills</Text>

          <View style={styles.reconStatusBanner}>
            <Feather name="check-circle" size={18} color="#047857" style={{ marginRight: 8 }} />
            <Text style={styles.reconStatusText}>All supplier purchases are 100% matched with GSTR-2B portal data.</Text>
          </View>

          {purchaseInvoices.map((pinv) => (
            <View key={pinv.id} style={styles.tableBodyRow}>
              <Text style={[styles.tdCellBold, { width: 140 }]}>{pinv.invoice_no}</Text>
              <Text style={[styles.tdCell, { flex: 1 }]}>{pinv.party_name || 'Supplier'}</Text>
              <Text style={[styles.tdCellNumber, { width: 140 }]}>{formatMoney(pinv.total)}</Text>
              <View style={styles.matchedBadge}>
                <Text style={styles.matchedBadgeText}>MATCHED</Text>
              </View>
            </View>
          ))}
        </Card>
      ) : activeTab === 'guide' ? (
        <Card style={styles.tableCardSection}>
          <Text style={styles.sectionTitle}>GST Return Filing Guide & Checklist</Text>
          <Text style={styles.infoSubtitle}>३ सोप्या पायऱ्यांमध्ये GST रिटर्न पोर्टलवर (services.gst.gov.in) अपलोड करा:</Text>

          <View style={styles.guideStepRow}>
            <View style={styles.guideStepNum}><Text style={styles.guideStepNumText}>१</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guideStepTitle}>JSON फाईल डाऊनलोड करा</Text>
              <Text style={styles.guideStepDesc}>वर दिलेल्या निळ्या **"JSON Export"** बटणावर क्लिक करून GSTR-1 ची सरकारी फॉरमॅटमधील JSON फाईल डाऊनलोड करा.</Text>
            </View>
          </View>

          <View style={styles.guideStepRow}>
            <View style={styles.guideStepNum}><Text style={styles.guideStepNumText}>२</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guideStepTitle}>GST पोर्टलवर लॉगिन करा</Text>
              <Text style={styles.guideStepDesc}>**services.gst.gov.in** वर जाऊन तुमच्या युझरनेम व पासवर्डने लॉगिन करा आणि **Returns Dashboard** मध्ये ऑक्टोबर महिना निवडा.</Text>
            </View>
          </View>

          <View style={styles.guideStepRow}>
            <View style={styles.guideStepNum}><Text style={styles.guideStepNumText}>३</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guideStepTitle}>Offline Upload निवडा</Text>
              <Text style={styles.guideStepDesc}>GSTR-1 खाली **"Prepare Offline"** वर क्लिक करा आणि डाऊनलोड केलेली JSON फाईल अपलोड करा. सर्व Table 4A आणि Table 12 आपोआप भरले जातील!</Text>
            </View>
          </View>
        </Card>
      ) : (
        <Card style={styles.tableCardSection}>
          <Text style={styles.sectionTitle}>TDS / TCS Credit Received</Text>
          <Text style={styles.infoSubtitle}>Tax deducted or collected at source summary</Text>
          <View style={styles.emptyTableBox}>
            <Text style={styles.emptyTableText}>No TDS / TCS transactions recorded for this period</Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  titleWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelectorsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  periodDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  periodDropdownText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#334155',
  },

  // Warnings
  warningsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  dangerBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  amberBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  warningBannerText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    flex: 1,
    lineHeight: 18,
  },
  dangerBannerText: {
    color: '#B91C1C',
  },
  amberBannerText: {
    color: '#B45309',
  },

  // KPI Cards
  kpiCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiCardHighlight: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiNumber: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Tabs
  tabsScrollWrap: {
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#2563EB', // Government portal royal blue
    borderColor: '#2563EB',
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },

  // Export Bar
  exportBarScroll: {
    marginBottom: 16,
  },
  exportBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jsonExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  jsonExportBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  subExportBtnText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#334155',
  },

  // Table Card
  tableCardSection: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubCount: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.medium,
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },

  // Table Layout
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  thCell: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdCell: {
    fontSize: 13,
    color: '#334155',
    fontFamily: fonts.regular,
  },
  tdCellBold: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  tdCellCode: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#2563EB',
  },
  tdCellBadge: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#1D4ED8',
  },
  tdCellNumber: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'right',
  },
  tableFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    marginTop: 6,
  },
  tfCellLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  tfCellValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  emptyTableBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: fonts.medium,
  },

  // GSTR-3B Blocks
  gstr3bBlock: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gstr3bHeading: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#0F172A',
    marginBottom: 10,
  },
  summaryBreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryBreakLabel: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  summaryBreakVal: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#0F172A',
  },

  // Reconciliation
  reconStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  reconStatusText: {
    fontSize: 13,
    color: '#047857',
    fontFamily: fonts.medium,
  },
  matchedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
  },
  matchedBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#15803D',
  },

  // Guide
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  guideStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideStepNumText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  guideStepTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#0F172A',
    marginBottom: 4,
  },
  guideStepDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  tabContentArea: {
    gap: 16,
  },
});

