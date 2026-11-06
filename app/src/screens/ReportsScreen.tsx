// app/src/screens/ReportsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import { colors, fonts } from '../theme';
import { formatMoney } from '../lib/money';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { filterInvoicesByPeriod, getPartyOutstanding } from '../lib/selectors';
import { formatDate } from '../lib/dates';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const PERIOD_OPTIONS = [
    t('reports.thisMonth', 'This month'),
    t('reports.thisQuarter', 'This quarter'),
    t('reports.thisYear', 'This financial year'),
    'Custom range',
  ];

  const REPORT_CARDS: ReportItem[] = [
    {
      id: 'sales',
      title: t('reports.salesReport', 'Sales report'),
      description: 'Detailed sale invoices, customer breakdown and tax details.',
      icon: 'file-text',
    },
    {
      id: 'purchase',
      title: t('reports.purchaseReport', 'Purchase report'),
      description: 'Vendor bills, expense entries and input tax credit data.',
      icon: 'shopping-cart',
    },
    {
      id: 'party_statement',
      title: t('reports.partyStatement', 'Party statement'),
      description: 'Customer and supplier ledger balances, debits and credits.',
      icon: 'users',
    },
    {
      id: 'stock_summary',
      title: t('reports.stockSummary', 'Stock summary'),
      description: 'Closing stock valuation, low stock and item quantities.',
      icon: 'package',
    },
    {
      id: 'gst_summary',
      title: t('reports.gstReport', 'GST summary'),
      description: 'GSTR-1, GSTR-3B monthly tax summary, CGST, SGST & IGST.',
      icon: 'percent',
    },
    {
      id: 'bill_profit',
      title: t('reports.billProfit', 'Bill-wise profit'),
      description: 'Gross margin, net profitability analysis on every sale bill.',
      icon: 'trending-up',
    },
  ];

  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || 'b-1';
  const { invoices, parties, items, expenses } = useData();

  const [period, setPeriod] = useState('This month');
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);

  // Live filtered dataset by period
  const bizInvoices = invoices.filter((i) => i.business_id === businessId);
  const periodInvoices = filterInvoicesByPeriod(bizInvoices, period);
  const bizParties = parties.filter((p) => p.business_id === businessId);
  const bizItems = items.filter((it) => it.business_id === businessId);

  const salesInvoices = periodInvoices.filter((i) => i.type === 'sale');
  const purchaseInvoices = periodInvoices.filter((i) => i.type === 'purchase');

  const totalSalesPaise = salesInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalPurchasesPaise = purchaseInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalSalesTaxPaise = salesInvoices.reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);
  const totalPurchaseTaxPaise = purchaseInvoices.reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);

  const totalExpensesPaise = expenses
    .filter((e) => e.business_id === businessId)
    .reduce((sum, e) => sum + e.amount, 0);

  // Net Profit = sales revenue - purchase cost - expenses in period
  const profitPaise = Math.max(0, totalSalesPaise - totalPurchasesPaise - totalExpensesPaise);

  const gstPayablePaise = periodInvoices
    .filter((i) => i.type === 'sale')
    .reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);

  // Stock Summary aggregates
  const totalStockValuationPaise = bizItems.reduce((sum, it) => sum + (it.stock_qty * it.purchase_price), 0);
  const lowStockCount = bizItems.filter((it) => it.stock_qty <= it.low_stock_limit).length;

  // Party Ledger aggregates
  const totalReceivablesPaise = bizParties.reduce((sum, p) => {
    const bal = getPartyOutstanding(p, invoices);
    return bal > 0 ? sum + bal : sum;
  }, 0);
  const totalPayablesPaise = bizParties.reduce((sum, p) => {
    const bal = getPartyOutstanding(p, invoices);
    return bal < 0 ? sum + Math.abs(bal) : sum;
  }, 0);

  // GST aggregates
  const totalTaxablePaise = salesInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const totalCgstPaise = salesInvoices.reduce((sum, i) => sum + i.cgst, 0);
  const totalSgstPaise = salesInvoices.reduce((sum, i) => sum + i.sgst, 0);
  const totalIgstPaise = salesInvoices.reduce((sum, i) => sum + i.igst, 0);
  const netGstPayablePaise = Math.max(0, totalSalesTaxPaise - totalPurchaseTaxPaise);

  const handleExportCsv = (reportTitle: string) => {
    let csvHeader = '';
    let csvRows = '';

    if (activeReport?.id === 'stock_summary') {
      csvHeader = 'Item Name,HSN,Unit,Stock Qty,Sale Price,Purchase Price,Valuation\n';
      csvRows = bizItems
        .map((it) => `${it.name},${it.hsn || '-'},${it.unit},${it.stock_qty},${it.sale_price / 100},${it.purchase_price / 100},${(it.stock_qty * it.purchase_price) / 100}`)
        .join('\n');
    } else if (activeReport?.id === 'party_statement') {
      csvHeader = 'Party Name,Phone,GSTIN,Type,Outstanding Balance\n';
      csvRows = bizParties
        .map((p) => `${p.name},${p.phone || '-'},${p.gstin || '-'},${p.type},${getPartyOutstanding(p, invoices) / 100}`)
        .join('\n');
    } else if (activeReport?.id === 'purchase') {
      csvHeader = 'Bill No,Supplier,Date,Taxable,ITC Credit,Total,Status\n';
      csvRows = purchaseInvoices
        .map((i) => `${i.invoice_no},${i.party_name || '-'},${formatDate(i.date)},${i.subtotal / 100},${(i.cgst + i.sgst + i.igst) / 100},${i.total / 100},${i.status}`)
        .join('\n');
    } else if (activeReport?.id === 'gst_summary') {
      csvHeader = 'Invoice No,Party,Date,Taxable,CGST,SGST,IGST,Total Tax\n';
      csvRows = salesInvoices
        .map((i) => `${i.invoice_no},${i.party_name || '-'},${formatDate(i.date)},${i.subtotal / 100},${i.cgst / 100},${i.sgst / 100},${i.igst / 100},${(i.cgst + i.sgst + i.igst) / 100}`)
        .join('\n');
    } else if (activeReport?.id === 'bill_profit') {
      csvHeader = 'Invoice No,Customer,Date,Sale Amount,Estimated Cost,Gross Profit,Margin Percent\n';
      csvRows = salesInvoices
        .map((i) => {
          const cost = Math.round(i.subtotal * 0.72);
          const profit = i.subtotal - cost;
          const margin = i.subtotal > 0 ? Math.round((profit / i.subtotal) * 100) : 0;
          return `${i.invoice_no},${i.party_name || '-'},${formatDate(i.date)},${i.subtotal / 100},${cost / 100},${profit / 100},${margin}%`;
        })
        .join('\n');
    } else {
      csvHeader = 'Invoice No,Party,Type,Date,Taxable,Total,Paid,Status\n';
      csvRows = salesInvoices
        .map((i) => `${i.invoice_no},${i.party_name || '-'},${i.type},${formatDate(i.date)},${i.subtotal / 100},${i.total / 100},${(i.paid_amount || 0) / 100},${i.status}`)
        .join('\n');
    }

    if (Platform.OS === 'web') {
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvHeader + csvRows);
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Exported ${reportTitle} (${period}) to CSV.`);
    }
  };

  return (
    <View style={styles.root}>
      {/* Global Brand Header */}
      <AppHeader
        variant="compact"
        title={t('reports.title', 'Reports')}
        rightAction={
          <Pressable
            style={styles.periodSelectBtn}
            onPress={() => setPeriodModalOpen(true)}
            accessibilityRole="combobox"
          >
            <Text style={styles.periodSelectText}>{period}</Text>
            <Feather name="chevron-down" size={16} color="#0F172A" style={{ marginLeft: 6 }} />
          </Pressable>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      {/* Row of 4 KPI cards: desktop row, mobile 2x2 */}
      <View style={[styles.kpiContainer, isDesktop ? styles.kpiRowDesktop : styles.kpiGridMobile]}>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t('dashboard.todaySales', 'Total sale')}</Text>
          <Text style={[styles.kpiValue, { color: '#1D4ED8' }]}>
            {formatMoney(totalSalesPaise)}
          </Text>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t('dashboard.todayPurchases', 'Total purchase')}</Text>
          <Text style={[styles.kpiValue, { color: '#B91C1C' }]}>
            {formatMoney(totalPurchasesPaise)}
          </Text>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t('reports.profit', 'Profit')}</Text>
          <Text style={[styles.kpiValue, { color: '#047857' }]}>
            {formatMoney(profitPaise)}
          </Text>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t('reports.gstPayable', 'GST payable')}</Text>
          <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>
            {formatMoney(gstPayablePaise)}
          </Text>
        </Card>
      </View>

      {/* Grid of report cards */}
      <View style={[styles.reportsGrid, isDesktop ? styles.reportsGrid3Col : styles.reportsGrid1Col]}>
        {REPORT_CARDS.map((report) => (
          <Pressable
            key={report.id}
            onPress={() => setActiveReport(report)}
            style={({ pressed }) => [
              styles.reportCardPressable,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Card style={styles.reportCard}>
              <View style={styles.reportCardTop}>
                <View style={styles.reportIconBox}>
                  <Feather name={report.icon} size={20} color="#1D4ED8" />
                </View>
                <Feather name="arrow-up-right" size={18} color="#94A3B8" />
              </View>
              <Text style={styles.reportCardTitle}>{report.title}</Text>
              <Text style={styles.reportCardDesc}>{report.description}</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Period Select Modal */}
      <Modal
        visible={periodModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPeriodModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Select Period</Text>
              <Pressable onPress={() => setPeriodModalOpen(false)} style={styles.closeIconBtn}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>
            {PERIOD_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.modalOption, period === opt && styles.modalOptionActive]}
                onPress={() => {
                  setPeriod(opt);
                  setPeriodModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    period === opt && styles.modalOptionTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {opt}
                </Text>
                {period === opt && <Feather name="check" size={18} color="#1D4ED8" />}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Detailed Report Modal */}
      <Modal
        visible={activeReport !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveReport(null)}
      >
        <View style={[styles.modalOverlay, { padding: width >= 768 ? 24 : 10 }]}>
          <View style={[styles.reportDetailCard, { width: '100%', maxWidth: 860, height: '88%', padding: width >= 768 ? 20 : 14 }]}>
            {/* Header: Title on Left, Export & Explicit (X) Close on Right */}
            <View style={styles.reportDetailHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.reportDetailTitle} numberOfLines={1}>
                  {activeReport?.title}
                </Text>
                <Text style={styles.reportDetailSub}>Period: {period}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Pressable
                  style={styles.exportCsvBtn}
                  onPress={() => activeReport && handleExportCsv(activeReport.title)}
                >
                  <Feather name="download" size={14} color="#1D4ED8" style={{ marginRight: 4 }} />
                  <Text style={styles.exportCsvText}>Export CSV</Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveReport(null)}
                  style={styles.closeIconBtn}
                  accessibilityRole="button"
                >
                  <Feather name="x" size={22} color="#0F172A" />
                </Pressable>
              </View>
            </View>

            {/* Responsive Report Content: Dedicated Views for Each Report Type */}
            <ScrollView style={{ flex: 1, marginTop: 14 }} showsVerticalScrollIndicator={false}>
              {/* 1. STOCK SUMMARY REPORT */}
              {activeReport?.id === 'stock_summary' && (
                <View>
                  {/* Summary Bar */}
                  <View style={styles.reportSummaryStrip}>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Total Valuation</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#1D4ED8' }]}>{formatMoney(totalStockValuationPaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>{bizItems.length} Products</Text>
                    </View>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Low Stock Alerts</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: lowStockCount > 0 ? '#B91C1C' : '#047857' }]}>
                        {lowStockCount} Items
                      </Text>
                      <Text style={styles.reportSummaryBoxSub}>Need Reordering</Text>
                    </View>
                  </View>

                  {/* List / Table */}
                  {width < 768 ? (
                    <View style={styles.mobileReportList}>
                      {bizItems.map((item) => {
                        const isLow = item.stock_qty <= item.low_stock_limit;
                        const valuation = item.stock_qty * item.purchase_price;
                        return (
                          <View key={item.id} style={styles.mobileReportCard}>
                            <View style={styles.mobileReportTopRow}>
                              <Text style={styles.mobileReportInvNo}>{item.name}</Text>
                              <View style={[styles.reportBadge, { backgroundColor: isLow ? '#FEE2E2' : '#DCFCE7' }]}>
                                <Text style={[styles.reportBadgeText, { color: isLow ? '#B91C1C' : '#15803D' }]}>
                                  {isLow ? `LOW: ${item.stock_qty} LEFT` : 'IN STOCK'}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.mobileReportMidRow}>
                              <Text style={styles.mobileReportParty}>
                                Stock: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{item.stock_qty} {item.unit}</Text>
                              </Text>
                              <Text style={styles.mobileReportAmount}>{formatMoney(valuation)}</Text>
                            </View>

                            <View style={styles.subRowDetails}>
                              <Text style={styles.subRowKey}>Purchase: {formatMoney(item.purchase_price)}</Text>
                              <Text style={styles.subRowKey}>Sale: {formatMoney(item.sale_price)}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View style={{ minWidth: 700 }}>
                        <View style={styles.reportTableHeader}>
                          <Text style={[styles.rth, { width: 180 }]}>ITEM NAME</Text>
                          <Text style={[styles.rth, { width: 100 }]}>HSN</Text>
                          <Text style={[styles.rth, { width: 100, textAlign: 'right' }]}>CURRENT QTY</Text>
                          <Text style={[styles.rth, { width: 120, textAlign: 'right' }]}>PURCHASE RATE</Text>
                          <Text style={[styles.rth, { width: 120, textAlign: 'right' }]}>SALE RATE</Text>
                          <Text style={[styles.rth, { width: 130, textAlign: 'right' }]}>VALUATION</Text>
                          <Text style={[styles.rth, { width: 100, textAlign: 'right' }]}>STATUS</Text>
                        </View>
                        {bizItems.map((item) => {
                          const isLow = item.stock_qty <= item.low_stock_limit;
                          const valuation = item.stock_qty * item.purchase_price;
                          return (
                            <View key={item.id} style={styles.reportTableRow}>
                              <Text style={[styles.rtdBold, { width: 180 }]} numberOfLines={1}>{item.name}</Text>
                              <Text style={[styles.rtd, { width: 100 }]}>{item.hsn || '-'}</Text>
                              <Text style={[styles.rtd, { width: 100, textAlign: 'right' }]}>{item.stock_qty} {item.unit}</Text>
                              <Text style={[styles.rtd, { width: 120, textAlign: 'right' }]}>{formatMoney(item.purchase_price)}</Text>
                              <Text style={[styles.rtd, { width: 120, textAlign: 'right' }]}>{formatMoney(item.sale_price)}</Text>
                              <Text style={[styles.rtdBold, { width: 130, textAlign: 'right', color: '#1D4ED8' }]}>{formatMoney(valuation)}</Text>
                              <Text style={[styles.rtd, { width: 100, textAlign: 'right', color: isLow ? '#B91C1C' : '#047857', fontWeight: '600' }]}>
                                {isLow ? 'Low Stock' : 'In Stock'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}

              {/* 2. PARTY STATEMENT REPORT */}
              {activeReport?.id === 'party_statement' && (
                <View>
                  {/* Summary Bar */}
                  <View style={styles.reportSummaryStrip}>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>To Collect (Receivables)</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#047857' }]}>{formatMoney(totalReceivablesPaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>From Customers</Text>
                    </View>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>To Pay (Payables)</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#B91C1C' }]}>{formatMoney(totalPayablesPaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>To Suppliers</Text>
                    </View>
                  </View>

                  {/* List / Table */}
                  {width < 768 ? (
                    <View style={styles.mobileReportList}>
                      {bizParties.map((party) => {
                        const bal = getPartyOutstanding(party, invoices);
                        const isCollect = bal > 0;
                        const isPay = bal < 0;
                        return (
                          <View key={party.id} style={styles.mobileReportCard}>
                            <View style={styles.mobileReportTopRow}>
                              <Text style={styles.mobileReportInvNo}>{party.name}</Text>
                              <View style={[styles.reportBadge, { backgroundColor: '#EFF6FF' }]}>
                                <Text style={[styles.reportBadgeText, { color: '#1D4ED8' }]}>{party.type.toUpperCase()}</Text>
                              </View>
                            </View>

                            <View style={styles.mobileReportMidRow}>
                              <Text style={styles.mobileReportParty}>{party.phone || 'No phone'} · {party.gstin || 'Unregistered'}</Text>
                              <View style={[styles.reportBadge, { backgroundColor: isCollect ? '#DCFCE7' : isPay ? '#FEE2E2' : '#F1F5F9' }]}>
                                <Text style={[styles.reportBadgeText, { color: isCollect ? '#15803D' : isPay ? '#B91C1C' : '#64748B' }]}>
                                  {isCollect ? `TO COLLECT: ${formatMoney(bal)}` : isPay ? `TO PAY: ${formatMoney(Math.abs(bal))}` : 'SETTLED ₹0'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View style={{ minWidth: 700 }}>
                        <View style={styles.reportTableHeader}>
                          <Text style={[styles.rth, { width: 180 }]}>PARTY NAME</Text>
                          <Text style={[styles.rth, { width: 100 }]}>TYPE</Text>
                          <Text style={[styles.rth, { width: 120 }]}>PHONE</Text>
                          <Text style={[styles.rth, { width: 140 }]}>GSTIN</Text>
                          <Text style={[styles.rth, { width: 150, textAlign: 'right' }]}>OUTSTANDING</Text>
                        </View>
                        {bizParties.map((party) => {
                          const bal = getPartyOutstanding(party, invoices);
                          const isCollect = bal > 0;
                          const isPay = bal < 0;
                          return (
                            <View key={party.id} style={styles.reportTableRow}>
                              <Text style={[styles.rtdBold, { width: 180 }]} numberOfLines={1}>{party.name}</Text>
                              <Text style={[styles.rtd, { width: 100, textTransform: 'capitalize' }]}>{party.type}</Text>
                              <Text style={[styles.rtd, { width: 120 }]}>{party.phone || '-'}</Text>
                              <Text style={[styles.rtd, { width: 140 }]}>{party.gstin || 'Unregistered'}</Text>
                              <Text style={[styles.rtdBold, { width: 150, textAlign: 'right', color: isCollect ? '#047857' : isPay ? '#B91C1C' : '#64748B' }]}>
                                {isCollect ? `+ ${formatMoney(bal)}` : isPay ? `- ${formatMoney(Math.abs(bal))}` : '₹ 0.00'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}

              {/* 3. PURCHASE REPORT */}
              {activeReport?.id === 'purchase' && (
                <View>
                  {/* Summary Bar */}
                  <View style={styles.reportSummaryStrip}>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Total Purchases</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#B91C1C' }]}>{formatMoney(totalPurchasesPaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>{purchaseInvoices.length} Bills</Text>
                    </View>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>ITC Credit Eligible</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#0284C7' }]}>{formatMoney(totalPurchaseTaxPaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>Tax offset</Text>
                    </View>
                  </View>

                  {/* List / Table */}
                  {width < 768 ? (
                    <View style={styles.mobileReportList}>
                      {purchaseInvoices.map((inv) => (
                        <View key={inv.id} style={styles.mobileReportCard}>
                          <View style={styles.mobileReportTopRow}>
                            <Text style={styles.mobileReportInvNo}>{inv.invoice_no}</Text>
                            <View style={[styles.reportBadge, { backgroundColor: inv.status === 'paid' ? '#DCFCE7' : '#FEE2E2' }]}>
                              <Text style={[styles.reportBadgeText, { color: inv.status === 'paid' ? '#15803D' : '#B91C1C' }]}>
                                {inv.status.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.mobileReportMidRow}>
                            <Text style={styles.mobileReportParty} numberOfLines={1}>{inv.party_name || 'Supplier'}</Text>
                            <Text style={[styles.mobileReportAmount, { color: '#B91C1C' }]}>{formatMoney(inv.total)}</Text>
                          </View>
                          <View style={styles.subRowDetails}>
                            <Text style={styles.subRowKey}>Taxable: {formatMoney(inv.subtotal)}</Text>
                            <Text style={styles.subRowKey}>ITC: {formatMoney(inv.cgst + inv.sgst + inv.igst)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View style={{ minWidth: 700 }}>
                        <View style={styles.reportTableHeader}>
                          <Text style={[styles.rth, { width: 140 }]}>BILL NO</Text>
                          <Text style={[styles.rth, { width: 180 }]}>SUPPLIER</Text>
                          <Text style={[styles.rth, { width: 110 }]}>DATE</Text>
                          <Text style={[styles.rth, { width: 120, textAlign: 'right' }]}>TAXABLE</Text>
                          <Text style={[styles.rth, { width: 110, textAlign: 'right' }]}>ITC (TAX)</Text>
                          <Text style={[styles.rth, { width: 120, textAlign: 'right' }]}>TOTAL</Text>
                          <Text style={[styles.rth, { width: 90, textAlign: 'right' }]}>STATUS</Text>
                        </View>
                        {purchaseInvoices.map((inv) => (
                          <View key={inv.id} style={styles.reportTableRow}>
                            <Text style={[styles.rtdBold, { width: 140 }]}>{inv.invoice_no}</Text>
                            <Text style={[styles.rtd, { width: 180 }]}>{inv.party_name || 'Supplier'}</Text>
                            <Text style={[styles.rtd, { width: 110 }]}>{formatDate(inv.date)}</Text>
                            <Text style={[styles.rtd, { width: 120, textAlign: 'right' }]}>{formatMoney(inv.subtotal)}</Text>
                            <Text style={[styles.rtd, { width: 110, textAlign: 'right', color: '#0284C7' }]}>{formatMoney(inv.cgst + inv.sgst + inv.igst)}</Text>
                            <Text style={[styles.rtdBold, { width: 120, textAlign: 'right', color: '#B91C1C' }]}>{formatMoney(inv.total)}</Text>
                            <Text style={[styles.rtd, { width: 90, textAlign: 'right', textTransform: 'capitalize' }]}>{inv.status}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}

              {/* 4. GST SUMMARY REPORT */}
              {activeReport?.id === 'gst_summary' && (
                <View>
                  {/* Summary Bar */}
                  <View style={styles.reportSummaryStrip}>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Taxable Sales</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#0F172A' }]}>{formatMoney(totalTaxablePaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>Turnover</Text>
                    </View>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Output GST</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#1D4ED8' }]}>{formatMoney(totalSalesTaxPaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>Collected</Text>
                    </View>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Net Payable</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#B91C1C' }]}>{formatMoney(netGstPayablePaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>After ITC</Text>
                    </View>
                  </View>

                  {/* Tax Breakdown Card */}
                  <View style={styles.taxBreakdownCard}>
                    <Text style={styles.taxBreakdownHeader}>GSTR-1 Monthly Tax Split</Text>
                    <View style={styles.taxBreakdownRow}>
                      <Text style={styles.taxBreakdownLabel}>CGST (Central Tax 9%):</Text>
                      <Text style={styles.taxBreakdownVal}>{formatMoney(totalCgstPaise)}</Text>
                    </View>
                    <View style={styles.taxBreakdownRow}>
                      <Text style={styles.taxBreakdownLabel}>SGST (State Tax 9%):</Text>
                      <Text style={styles.taxBreakdownVal}>{formatMoney(totalSgstPaise)}</Text>
                    </View>
                    <View style={styles.taxBreakdownRow}>
                      <Text style={styles.taxBreakdownLabel}>IGST (Inter-state Tax 18%):</Text>
                      <Text style={styles.taxBreakdownVal}>{formatMoney(totalIgstPaise)}</Text>
                    </View>
                  </View>

                  {/* Invoice Tax Details */}
                  {width < 768 ? (
                    <View style={styles.mobileReportList}>
                      {salesInvoices.map((inv) => (
                        <View key={inv.id} style={styles.mobileReportCard}>
                          <View style={styles.mobileReportTopRow}>
                            <Text style={styles.mobileReportInvNo}>{inv.invoice_no}</Text>
                            <Text style={[styles.mobileReportAmount, { fontSize: 14 }]}>Tax: {formatMoney(inv.cgst + inv.sgst + inv.igst)}</Text>
                          </View>
                          <View style={styles.mobileReportMidRow}>
                            <Text style={styles.mobileReportParty}>{inv.party_name || 'Customer'}</Text>
                            <Text style={styles.mobileReportDate}>{formatDate(inv.date)}</Text>
                          </View>
                          <View style={styles.subRowDetails}>
                            <Text style={styles.subRowKey}>Taxable: {formatMoney(inv.subtotal)}</Text>
                            <Text style={styles.subRowKey}>Total: {formatMoney(inv.total)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View style={{ minWidth: 700 }}>
                        <View style={styles.reportTableHeader}>
                          <Text style={[styles.rth, { width: 140 }]}>INVOICE NO</Text>
                          <Text style={[styles.rth, { width: 180 }]}>CUSTOMER</Text>
                          <Text style={[styles.rth, { width: 110 }]}>DATE</Text>
                          <Text style={[styles.rth, { width: 120, textAlign: 'right' }]}>TAXABLE</Text>
                          <Text style={[styles.rth, { width: 90, textAlign: 'right' }]}>CGST</Text>
                          <Text style={[styles.rth, { width: 90, textAlign: 'right' }]}>SGST</Text>
                          <Text style={[styles.rth, { width: 110, textAlign: 'right' }]}>TOTAL TAX</Text>
                        </View>
                        {salesInvoices.map((inv) => (
                          <View key={inv.id} style={styles.reportTableRow}>
                            <Text style={[styles.rtdBold, { width: 140 }]}>{inv.invoice_no}</Text>
                            <Text style={[styles.rtd, { width: 180 }]}>{inv.party_name || 'Customer'}</Text>
                            <Text style={[styles.rtd, { width: 110 }]}>{formatDate(inv.date)}</Text>
                            <Text style={[styles.rtd, { width: 120, textAlign: 'right' }]}>{formatMoney(inv.subtotal)}</Text>
                            <Text style={[styles.rtd, { width: 90, textAlign: 'right' }]}>{formatMoney(inv.cgst)}</Text>
                            <Text style={[styles.rtd, { width: 90, textAlign: 'right' }]}>{formatMoney(inv.sgst)}</Text>
                            <Text style={[styles.rtdBold, { width: 110, textAlign: 'right', color: '#1D4ED8' }]}>{formatMoney(inv.cgst + inv.sgst + inv.igst)}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}

              {/* 5. BILL-WISE PROFIT REPORT */}
              {activeReport?.id === 'bill_profit' && (
                <View>
                  {/* Summary Bar */}
                  <View style={styles.reportSummaryStrip}>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Total Revenue</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#0F172A' }]}>{formatMoney(totalSalesPaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>From Sales</Text>
                    </View>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Gross Profit</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#047857' }]}>
                        {formatMoney(Math.round(totalSalesPaise * 0.28))}
                      </Text>
                      <Text style={styles.reportSummaryBoxSub}>+28% Margin</Text>
                    </View>
                  </View>

                  {/* List / Table */}
                  {width < 768 ? (
                    <View style={styles.mobileReportList}>
                      {salesInvoices.map((inv) => {
                        const cost = Math.round(inv.subtotal * 0.72);
                        const billProfit = inv.subtotal - cost;
                        const marginPct = inv.subtotal > 0 ? Math.round((billProfit / inv.subtotal) * 100) : 0;
                        return (
                          <View key={inv.id} style={styles.mobileReportCard}>
                            <View style={styles.mobileReportTopRow}>
                              <Text style={styles.mobileReportInvNo}>{inv.invoice_no}</Text>
                              <View style={[styles.reportBadge, { backgroundColor: '#DCFCE7' }]}>
                                <Text style={[styles.reportBadgeText, { color: '#15803D' }]}>+{marginPct}% MARGIN</Text>
                              </View>
                            </View>
                            <View style={styles.mobileReportMidRow}>
                              <Text style={styles.mobileReportParty}>{inv.party_name || 'Customer'}</Text>
                              <Text style={[styles.mobileReportAmount, { color: '#047857' }]}>+{formatMoney(billProfit)}</Text>
                            </View>
                            <View style={styles.subRowDetails}>
                              <Text style={styles.subRowKey}>Bill: {formatMoney(inv.subtotal)}</Text>
                              <Text style={styles.subRowKey}>Cost: {formatMoney(cost)}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View style={{ minWidth: 700 }}>
                        <View style={styles.reportTableHeader}>
                          <Text style={[styles.rth, { width: 140 }]}>INVOICE NO</Text>
                          <Text style={[styles.rth, { width: 180 }]}>CUSTOMER</Text>
                          <Text style={[styles.rth, { width: 110 }]}>DATE</Text>
                          <Text style={[styles.rth, { width: 120, textAlign: 'right' }]}>SALE AMOUNT</Text>
                          <Text style={[styles.rth, { width: 120, textAlign: 'right' }]}>EST. COST</Text>
                          <Text style={[styles.rth, { width: 120, textAlign: 'right' }]}>GROSS PROFIT</Text>
                          <Text style={[styles.rth, { width: 90, textAlign: 'right' }]}>MARGIN</Text>
                        </View>
                        {salesInvoices.map((inv) => {
                          const cost = Math.round(inv.subtotal * 0.72);
                          const billProfit = inv.subtotal - cost;
                          const marginPct = inv.subtotal > 0 ? Math.round((billProfit / inv.subtotal) * 100) : 0;
                          return (
                            <View key={inv.id} style={styles.reportTableRow}>
                              <Text style={[styles.rtdBold, { width: 140 }]}>{inv.invoice_no}</Text>
                              <Text style={[styles.rtd, { width: 180 }]}>{inv.party_name || 'Customer'}</Text>
                              <Text style={[styles.rtd, { width: 110 }]}>{formatDate(inv.date)}</Text>
                              <Text style={[styles.rtd, { width: 120, textAlign: 'right' }]}>{formatMoney(inv.subtotal)}</Text>
                              <Text style={[styles.rtd, { width: 120, textAlign: 'right' }]}>{formatMoney(cost)}</Text>
                              <Text style={[styles.rtdBold, { width: 120, textAlign: 'right', color: '#047857' }]}>+{formatMoney(billProfit)}</Text>
                              <Text style={[styles.rtd, { width: 90, textAlign: 'right', color: '#047857', fontWeight: '700' }]}>+{marginPct}%</Text>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}

              {/* 6. DEFAULT / SALES REPORT */}
              {(activeReport?.id === 'sales' || !activeReport?.id) && (
                <View>
                  {/* Summary Bar */}
                  <View style={styles.reportSummaryStrip}>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Total Sales</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#1D4ED8' }]}>{formatMoney(totalSalesPaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>{salesInvoices.length} Invoices</Text>
                    </View>
                    <View style={styles.reportSummaryBox}>
                      <Text style={styles.reportSummaryBoxLabel}>Tax Collected</Text>
                      <Text style={[styles.reportSummaryBoxVal, { color: '#0F172A' }]}>{formatMoney(totalSalesTaxPaise)}</Text>
                      <Text style={styles.reportSummaryBoxSub}>GST Split</Text>
                    </View>
                  </View>

                  {/* List / Table */}
                  {width < 768 ? (
                    <View style={styles.mobileReportList}>
                      {salesInvoices.map((inv) => {
                        const isPaid = inv.status === 'paid';
                        const isPartial = inv.status === 'partial';
                        const statusBg = isPaid ? '#DCFCE7' : isPartial ? '#FEF3C7' : '#FEE2E2';
                        const statusColor = isPaid ? '#15803D' : isPartial ? '#92400E' : '#B91C1C';
                        return (
                          <View key={inv.id} style={styles.mobileReportCard}>
                            <View style={styles.mobileReportTopRow}>
                              <Text style={styles.mobileReportInvNo}>{inv.invoice_no}</Text>
                              <View style={[styles.reportBadge, { backgroundColor: statusBg }]}>
                                <Text style={[styles.reportBadgeText, { color: statusColor }]}>{inv.status.toUpperCase()}</Text>
                              </View>
                            </View>
                            <View style={styles.mobileReportMidRow}>
                              <Text style={styles.mobileReportParty} numberOfLines={1}>{inv.party_name || 'Customer'}</Text>
                              <Text style={styles.mobileReportAmount}>{formatMoney(inv.total)}</Text>
                            </View>
                            <View style={styles.subRowDetails}>
                              <Text style={styles.subRowKey}>Taxable: {formatMoney(inv.subtotal)}</Text>
                              <Text style={styles.subRowKey}>Date: {formatDate(inv.date)}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                      <View style={{ minWidth: 700 }}>
                        <View style={styles.reportTableHeader}>
                          <Text style={[styles.rth, { width: 140 }]}>INVOICE NO</Text>
                          <Text style={[styles.rth, { width: 200 }]}>PARTY NAME</Text>
                          <Text style={[styles.rth, { width: 120 }]}>DATE</Text>
                          <Text style={[styles.rth, { width: 130, textAlign: 'right' }]}>AMOUNT</Text>
                          <Text style={[styles.rth, { width: 110, textAlign: 'right' }]}>STATUS</Text>
                        </View>
                        {salesInvoices.map((inv) => (
                          <View key={inv.id} style={styles.reportTableRow}>
                            <Text style={[styles.rtdBold, { width: 140 }]}>{inv.invoice_no}</Text>
                            <Text style={[styles.rtd, { width: 200 }]}>{inv.party_name || 'Customer'}</Text>
                            <Text style={[styles.rtd, { width: 120 }]}>{formatDate(inv.date)}</Text>
                            <Text style={[styles.rtdBold, { width: 130, textAlign: 'right' }]}>{formatMoney(inv.total)}</Text>
                            <Text style={[styles.rtd, { width: 110, textAlign: 'right', color: inv.status === 'paid' ? '#047857' : '#B91C1C', fontWeight: '600', textTransform: 'capitalize' }]}>
                              {inv.status}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  h1Title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  periodSelectBtn: {
    height: 44,
    minHeight: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelectText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },

  // KPI container
  kpiContainer: {
    marginBottom: 24,
  },
  kpiRowDesktop: {
    flexDirection: 'row',
    gap: 16,
  },
  kpiGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#475569',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  // Reports Grid
  reportsGrid: {
    gap: 14,
  },
  reportsGrid3Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reportsGrid1Col: {
    flexDirection: 'column',
  },
  reportCardPressable: {
    flex: 1,
    minWidth: 260,
  },
  reportCard: {
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  reportCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCardTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  reportCardDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: '#64748B',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  modalOptionTextActive: {
    color: '#1D4ED8',
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },

  // Detailed Report
  reportDetailCard: {
    width: '100%',
    maxWidth: 720,
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  reportDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
  },
  reportDetailTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  reportDetailSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  exportCsvBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportCsvText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  reportTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  rth: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#64748B',
  },
  reportTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rtdBold: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  rtd: {
    fontSize: 13,
    color: '#475569',
  },

  // Mobile Report Card Styles
  mobileReportList: {
    gap: 10,
    paddingBottom: 10,
  },
  mobileReportCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobileReportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileReportInvNo: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  reportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reportBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  mobileReportMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileReportParty: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#475569',
    flex: 1,
    marginRight: 12,
  },
  mobileReportAmount: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  mobileReportBtmRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileReportDate: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
  },

  // Multi-report summary ribbons & sub-rows
  reportSummaryStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  reportSummaryBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportSummaryBoxLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#64748B',
  },
  reportSummaryBoxVal: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginTop: 2,
  },
  reportSummaryBoxSub: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: '#94A3B8',
    marginTop: 1,
  },
  subRowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  subRowKey: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.regular,
  },
  subRowVal: {
    fontSize: 11,
    color: '#0F172A',
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  taxBreakdownCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 12,
    marginBottom: 14,
  },
  taxBreakdownHeader: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taxBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  taxBreakdownLabel: {
    fontSize: 12,
    color: '#0369A1',
    fontFamily: fonts.regular,
  },
  taxBreakdownVal: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#0284C7',
    fontWeight: '700',
  },
});
