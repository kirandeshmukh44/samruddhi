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
import { mockInvoices, mockParties, mockItems } from '../services/mockData';

const PERIOD_OPTIONS = [
  'This month',
  'This quarter',
  'This financial year',
  'Custom range',
];

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

const REPORT_CARDS: ReportItem[] = [
  {
    id: 'sales',
    title: 'Sales report',
    description: 'Detailed sale invoices, customer breakdown and tax details.',
    icon: 'file-text',
  },
  {
    id: 'purchase',
    title: 'Purchase report',
    description: 'Vendor bills, expense entries and input tax credit data.',
    icon: 'shopping-cart',
  },
  {
    id: 'party_statement',
    title: 'Party statement',
    description: 'Customer and supplier ledger balances, debits and credits.',
    icon: 'users',
  },
  {
    id: 'stock_summary',
    title: 'Stock summary',
    description: 'Closing stock valuation, low stock and item quantities.',
    icon: 'package',
  },
  {
    id: 'gst_summary',
    title: 'GST summary',
    description: 'GSTR-1, GSTR-3B monthly tax summary, CGST, SGST & IGST.',
    icon: 'percent',
  },
  {
    id: 'bill_profit',
    title: 'Bill-wise profit',
    description: 'Gross margin, net profitability analysis on every sale bill.',
    icon: 'trending-up',
  },
];

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [period, setPeriod] = useState('This month');
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);

  // Live KPI calculations from mock data
  const totalSalesPaise = mockInvoices
    .filter((i) => i.type === 'sale')
    .reduce((sum, i) => sum + i.total, 0);

  const totalPurchasesPaise = mockInvoices
    .filter((i) => i.type === 'purchase')
    .reduce((sum, i) => sum + i.total, 0);

  const profitPaise = Math.max(0, totalSalesPaise - totalPurchasesPaise);

  const gstPayablePaise = mockInvoices
    .filter((i) => i.type === 'sale')
    .reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);

  const handleExportCsv = (reportTitle: string) => {
    if (Platform.OS === 'web') {
      const csvContent =
        'data:text/csv;charset=utf-8,Invoice/Ref,Party,Date,Amount,Status\n' +
        mockInvoices
          .map((i) => `${i.invoice_no},${i.party_name || i.party_id},${i.date},${i.total / 100},${i.status}`)
          .join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Exporting ${reportTitle} to CSV...`);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header: h1 "Reports" and a period select on the right */}
      <View style={styles.headerRow}>
        <Text style={styles.h1Title}>Reports</Text>

        <Pressable
          style={styles.periodSelectBtn}
          onPress={() => setPeriodModalOpen(false || true)}
          accessibilityRole="combobox"
        >
          <Text style={styles.periodSelectText}>{period}</Text>
          <Feather name="chevron-down" size={16} color="#0F172A" style={{ marginLeft: 8 }} />
        </Pressable>
      </View>

      {/* Row of 4 KPI cards: desktop row, mobile 2x2 */}
      <View style={[styles.kpiContainer, isDesktop ? styles.kpiRowDesktop : styles.kpiGridMobile]}>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total sale</Text>
          <Text style={[styles.kpiValue, { color: '#0F766E' }]}>
            {formatMoney(totalSalesPaise)}
          </Text>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total purchase</Text>
          <Text style={[styles.kpiValue, { color: '#B91C1C' }]}>
            {formatMoney(totalPurchasesPaise)}
          </Text>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Profit</Text>
          <Text style={[styles.kpiValue, { color: '#047857' }]}>
            {formatMoney(profitPaise)}
          </Text>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>GST payable</Text>
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
                  <Feather name={report.icon} size={20} color="#0F766E" />
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
                {period === opt && <Feather name="check" size={18} color="#0F766E" />}
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
                  <Feather name="download" size={14} color="#0F766E" style={{ marginRight: 4 }} />
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

            {/* Responsive Report Content: Mobile Cards vs Desktop Table */}
            <ScrollView style={{ flex: 1, marginTop: 14 }} showsVerticalScrollIndicator={false}>
              {width < 768 ? (
                /* Mobile Card View: Clean, spacious, zero text wrapping */
                <View style={styles.mobileReportList}>
                  {mockInvoices.map((inv) => {
                    const isPaid = inv.status === 'paid';
                    const isPartial = inv.status === 'partial';
                    const statusBg = isPaid ? '#DCFCE7' : isPartial ? '#FEF3C7' : '#FEE2E2';
                    const statusColor = isPaid ? '#15803D' : isPartial ? '#92400E' : '#B91C1C';

                    return (
                      <View key={inv.id} style={styles.mobileReportCard}>
                        <View style={styles.mobileReportTopRow}>
                          <Text style={styles.mobileReportInvNo}>{inv.invoice_no}</Text>
                          <View style={[styles.reportBadge, { backgroundColor: statusBg }]}>
                            <Text style={[styles.reportBadgeText, { color: statusColor }]}>
                              {inv.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.mobileReportMidRow}>
                          <Text style={styles.mobileReportParty} numberOfLines={1}>
                            {inv.party_name || 'Customer'}
                          </Text>
                          <Text style={styles.mobileReportAmount}>
                            {formatMoney(inv.total)}
                          </Text>
                        </View>

                        <View style={styles.mobileReportBtmRow}>
                          <Feather name="calendar" size={13} color="#64748B" style={{ marginRight: 6 }} />
                          <Text style={styles.mobileReportDate}>{inv.date}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                /* Desktop Table View with horizontal protection */
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ minWidth: 700 }}>
                    <View style={styles.reportTableHeader}>
                      <Text style={[styles.rth, { width: 140 }]} numberOfLines={1}>INVOICE / REF</Text>
                      <Text style={[styles.rth, { width: 200 }]} numberOfLines={1}>PARTY NAME</Text>
                      <Text style={[styles.rth, { width: 120 }]} numberOfLines={1}>DATE</Text>
                      <Text style={[styles.rth, { width: 130, textAlign: 'right' }]} numberOfLines={1}>AMOUNT</Text>
                      <Text style={[styles.rth, { width: 110, textAlign: 'right' }]} numberOfLines={1}>STATUS</Text>
                    </View>

                    {mockInvoices.map((inv) => (
                      <View key={inv.id} style={styles.reportTableRow}>
                        <Text style={[styles.rtdBold, { width: 140 }]} numberOfLines={1}>{inv.invoice_no}</Text>
                        <Text style={[styles.rtd, { width: 200 }]} numberOfLines={1}>{inv.party_name || 'Customer'}</Text>
                        <Text style={[styles.rtd, { width: 120 }]} numberOfLines={1}>{inv.date}</Text>
                        <Text style={[styles.rtdBold, { width: 130, textAlign: 'right' }]} numberOfLines={1}>
                          {formatMoney(inv.total)}
                        </Text>
                        <Text
                          style={[
                            styles.rtd,
                            {
                              width: 110,
                              textAlign: 'right',
                              color: inv.status === 'paid' ? '#047857' : inv.status === 'partial' ? '#B45309' : '#B91C1C',
                              fontWeight: '600',
                              textTransform: 'capitalize',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {inv.status}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    backgroundColor: '#F0FDFA',
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  modalOptionTextActive: {
    color: '#0F766E',
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
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportCsvText: {
    color: '#0F766E',
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
    color: '#0F766E',
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
});
