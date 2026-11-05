// app/src/screens/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Modal,
  ScrollView,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getDashboard, DashboardStats } from '../services/dashboard';
import { listInvoices } from '../services/invoices';
import { listItems } from '../services/items';
import { formatMoney } from '../lib/money';
import Card from '../components/Card';
import { colors, fonts } from '../theme';
import { mockParties } from '../services/mockData';
import { setLanguage } from '../i18n';

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const insets = useSafeAreaInsets();
  const { currentBusiness, businesses, switchBusiness } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [businessPickerVisible, setBusinessPickerVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<'Sept' | 'Oct' | 'Nov'>('Nov');

  const monthDetails = {
    Sept: { total: '₹ 1,820.00', bills: 14, growth: '+12.5%' },
    Oct: { total: '₹ 3,850.50', bills: 28, growth: '+22.4%' },
    Nov: { total: '₹ 3,417.76', bills: 22, growth: '+18.4%' },
  };

  useEffect(() => {
    if (!currentBusiness) return;
    getDashboard(currentBusiness.id).then(setStats);
    listInvoices(currentBusiness.id).then((inv) => {
      // Ensure party_name is populated
      const enriched = inv.map((item) => {
        const pObj = item.party_id ? mockParties.find((p) => p.id === item.party_id) : null;
        return {
          ...item,
          party_name: item.party_name || pObj?.name || (item.type === 'sale' ? 'Sharma Retail' : 'Mehta Distributors'),
        };
      });
      setRecent(enriched.slice(0, 8));
    });
    listItems(currentBusiness.id).then((its) =>
      setLowStock(its.filter((i) => i.stock_qty <= i.low_stock_limit))
    );
  }, [currentBusiness]);

  const businessName = currentBusiness?.name || 'Gupta Traders';

  const quickActions = [
    { label: t('dashboard.addSale', 'Sale'), path: '/sale', icon: 'file-text' as const },
    { label: t('dashboard.addPurchase', 'Purchase'), path: '/purchase', icon: 'shopping-cart' as const },
    { label: t('dashboard.addPayment', 'Payment'), path: '/payments', icon: 'credit-card' as const },
    { label: t('dashboard.reports', 'Reports'), path: '/reports', icon: 'bar-chart-2' as const },
    { label: t('dashboard.gstReturns', 'GST Returns'), path: '/gst-returns', icon: 'book-open' as const },
  ];

  const cycleLang = async () => {
    const next = i18n.language === 'en' ? 'hi' : i18n.language === 'hi' ? 'mr' : 'en';
    await setLanguage(next);
  };

  const currentLangLabel =
    i18n.language === 'hi' ? 'हिं' : i18n.language === 'mr' ? 'मरा' : 'EN';

  const handleShareWhatsApp = (tx: any) => {
    const pName = tx.party_name || 'Customer';
    const amountRs = (tx.total / 100).toFixed(2);
    const balanceRs = ((tx.total - (tx.paid_amount || 0)) / 100).toFixed(2);
    const text = `Namaste ${pName},\nInvoice ${tx.invoice_no} of Rs. ${amountRs} from ${businessName}.\nBalance due: Rs. ${balanceRs}.\nThank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
  };

  // Desktop view (>= 900px)
  if (isDesktop) {
    return (
      <View style={{ flex: 1, position: 'relative' }}>
        <ScrollView
          style={styles.desktopRoot}
          contentContainerStyle={styles.desktopScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Desktop Title & BiLU ERP Status Badge */}
          <View style={[styles.desktopHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Text style={styles.desktopTitle}>{t('dashboard.title', 'Dashboard')}</Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                {t('dashboard.welcome', 'Welcome back to BiLU ERP')} · {businessName}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 24, borderWidth: 1, borderColor: '#BFDBFE' }}>
              <Image
                source={require('../../assets/images/bilu-badge.png')}
                style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: '#1D4ED8' }}>
                BiLU ERP {t('common.active', 'Active')}
              </Text>
            </View>
          </View>

        {/* 4 KPI cards in a row */}
        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('dashboard.todaySales', "Today's sale")}</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>
              {stats ? formatMoney(stats.todaySales) : '₹ 0.00'}
            </Text>
          </Card>

          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('dashboard.toCollect', 'To collect')}</Text>
            <Text style={[styles.kpiValue, { color: '#047857' }]}>
              {stats ? formatMoney(stats.toCollect) : '₹ 0.00'}
            </Text>
          </Card>

          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('dashboard.toPay', 'To pay')}</Text>
            <Text style={[styles.kpiValue, { color: '#B91C1C' }]}>
              {stats ? formatMoney(stats.toPay) : '₹ 0.00'}
            </Text>
          </Card>

          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('dashboard.lowStock', 'Low stock items')}</Text>
            <Text style={[styles.kpiValue, { color: colors.accent }]}>
              {stats ? stats.lowStockCount : lowStock.length}
            </Text>
          </Card>
        </View>

        {/* Quick action shortcuts row */}
        <View style={styles.desktopQuickRow}>
          {quickActions.map((action) => (
            <Pressable
              key={action.path}
              style={styles.desktopActionBtn}
              onPress={() => router.push(action.path as any)}
              accessibilityRole="button"
            >
              <Feather name={action.icon} size={18} color={colors.primary} />
              <Text style={styles.desktopActionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Main Content Split: Recent Transactions Table (Left) & Low Stock Panel (Right) */}
        <View style={styles.desktopSplit}>
          {/* Recent transactions as a table (left) */}
          <View style={styles.tablePanel}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>{t('dashboard.recentInvoices', 'Recent transactions')}</Text>
              <Pressable onPress={() => router.push('/sale' as any)} accessibilityRole="button">
                <Text style={styles.viewAllText}>{t('common.viewAll', 'View all')}</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Card style={[styles.tableCard, { minWidth: 680 }]}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 2.5 }]}>{t('dashboard.partyInvoice', 'PARTY / INVOICE')}</Text>
                  <Text style={[styles.th, { flex: 1.2 }]}>{t('dashboard.dateCol', 'DATE')}</Text>
                  <Text style={[styles.th, { flex: 1.2 }]}>{t('dashboard.typeCol', 'TYPE')}</Text>
                  <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>{t('dashboard.totalCol', 'TOTAL')}</Text>
                  <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>{t('dashboard.statusCol', 'STATUS')}</Text>
                </View>

                {recent.length > 0 ? (
                  recent.map((tx) => (
                    <Pressable
                      key={tx.id}
                      style={styles.tableRow}
                      onPress={() => setSelectedTx(tx)}
                    >
                      <View style={{ flex: 2.5 }}>
                        <Text style={styles.txPartyName}>{tx.party_name}</Text>
                        <Text style={styles.txInvoiceSub}>{tx.invoice_no}</Text>
                      </View>
                      <Text style={[styles.td, { flex: 1.2 }]}>{tx.date}</Text>
                      <Text style={[styles.td, { flex: 1.2, textTransform: 'capitalize' }]}>
                        {tx.type === 'sale' ? t('dashboard.addSale', 'Sale') : t('dashboard.addPurchase', 'Purchase')}
                      </Text>
                      <Text style={[styles.td, { flex: 1.5, textAlign: 'right', fontFamily: fonts.semiBold, fontWeight: '600' }]}>
                        {formatMoney(tx.total)}
                      </Text>
                      <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                        <View style={[styles.statusBadge, tx.status === 'paid' ? styles.statusPaid : styles.statusUnpaid]}>
                          <Text style={[styles.statusText, tx.status === 'paid' ? styles.statusPaidText : styles.statusUnpaidText]}>
                            {tx.status === 'paid' ? t('common.paid', 'Paid') : t('common.unpaid', 'Unpaid')}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyTableRow}>
                    <Text style={styles.emptyText}>{t('dashboard.noRecentTransactions', 'No recent transactions')}</Text>
                  </View>
                )}
              </Card>
            </ScrollView>
          </View>

          {/* Low stock panel (right) */}
          <View style={styles.lowStockSidePanel}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>{t('dashboard.lowStockAlert', 'Low-stock alert')}</Text>
              <Pressable onPress={() => router.push('/items' as any)}>
                <Text style={styles.viewAllText}>{t('dashboard.viewItems', 'View items')}</Text>
              </Pressable>
            </View>

            <Card style={styles.lowStockCard}>
              {lowStock.length > 0 ? (
                lowStock.map((it) => (
                  <View key={it.id} style={styles.lowStockRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lowStockName}>{it.name}</Text>
                      <Text style={styles.lowStockSub}>{t('common.lowStock', 'Limit')}: {it.low_stock_limit} {it.unit}</Text>
                    </View>
                    <Text style={styles.lowStockQty}>{it.stock_qty} {it.unit}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTableRow}>
                  <Feather name="check-circle" size={24} color="#047857" style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyText}>{t('dashboard.allStocksHealthy', 'All stocks healthy')}</Text>
                </View>
              )}
            </Card>
          </View>
        </View>

        </ScrollView>

        {/* Floating button "+ New sale" */}
        <Pressable
          style={styles.floatingSaleBtnDesktop}
          onPress={() => router.push('/sale' as any)}
          accessibilityRole="button"
        >
          <Feather name="plus" size={20} color="#0F172A" style={{ marginRight: 6 }} />
          <Text style={styles.floatingSaleText}>{t('dashboard.newSaleBtn', '+ New sale')}</Text>
        </Pressable>
      </View>
    );
  }

  // Mobile View (< 900px)
  return (
    <View style={styles.mobileScreenRoot}>
      <ScrollView
        style={styles.mobileScrollView}
        contentContainerStyle={styles.mobileScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header block BiLU ERP Brand Blue, white text */}
        <View style={[styles.mobileHeaderBlock, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          {/* Row with BiLU logo + business switcher on the left and language button on the right */}
          <View style={styles.mobileTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
              <Image
                source={require('../../assets/images/bilu-badge.png')}
                style={{ width: 38, height: 38, marginRight: 8, borderRadius: 19 }}
                resizeMode="contain"
              />
              <Pressable
                style={styles.businessSwitcherBtn}
                onPress={() => setBusinessPickerVisible(true)}
                accessibilityRole="button"
              >
                <Text style={styles.businessSwitcherText} numberOfLines={1}>
                  {businessName}
                </Text>
                <Feather name="chevron-down" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </Pressable>
            </View>

            <Pressable
              style={styles.langBtnWhite}
              onPress={cycleLang}
              accessibilityRole="button"
            >
              <Text style={styles.langBtnWhiteText}>{currentLangLabel}</Text>
            </Pressable>
          </View>

          {/* "Today's sale" 13px, then amount 32px bold */}
          <Text style={styles.todaySaleLabel}>{t('dashboard.todaySales', "Today's sale")}</Text>
          <Text style={styles.todaySaleValue}>
            {stats ? formatMoney(stats.todaySales) : '₹ 0.00'}
          </Text>
        </View>

        {/* Two white cards side by side overlapping header by 16px */}
        <View style={styles.overlapCardsRow}>
          <Card style={styles.overlapCard}>
            <Text style={styles.overlapCardLabel}>{t('dashboard.toCollect', 'To collect')}</Text>
            <Text style={[styles.overlapCardValue, { color: '#047857' }]}>
              {stats ? formatMoney(stats.toCollect) : '₹ 0.00'}
            </Text>
          </Card>

          <Card style={styles.overlapCard}>
            <Text style={styles.overlapCardLabel}>{t('dashboard.toPay', 'To pay')}</Text>
            <Text style={[styles.overlapCardValue, { color: '#B91C1C' }]}>
              {stats ? formatMoney(stats.toPay) : '₹ 0.00'}
            </Text>
          </Card>
        </View>

        {/* 4 quick-action tiles grid */}
        <View style={styles.tilesGrid}>
          {quickActions.map((tile) => (
            <Pressable
              key={tile.path}
              style={({ pressed }) => [
                styles.tileBox,
                pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
              ]}
              onPress={() => router.push(tile.path as any)}
              accessibilityRole="button"
            >
              <Feather name={tile.icon} size={24} color="#1D4ED8" />
              <Text style={styles.tileLabel}>{tile.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Sales Overview Monthly Trend Chart (Interactive with tap feedback) */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>{t('dashboard.saleOverview', 'Sale Overview')} ({selectedMonth})</Text>
              <Text style={styles.chartSub}>{t('common.total', 'Total Sale')}: {monthDetails[selectedMonth].total} · {monthDetails[selectedMonth].bills} {t('invoices.title', 'bills')}</Text>
            </View>
            <View style={styles.growthBadge}>
              <Feather name="trending-up" size={13} color="#047857" style={{ marginRight: 4 }} />
              <Text style={styles.growthBadgeText}>{monthDetails[selectedMonth].growth}</Text>
            </View>
          </View>

          {/* Multi-month graphical trend bars with interactive tap selection */}
          <View style={styles.chartVisualArea}>
            <View style={styles.chartColsRow}>
              <Pressable
                style={styles.chartCol}
                onPress={() => setSelectedMonth('Sept')}
                accessibilityRole="button"
              >
                <Text style={[styles.colValText, selectedMonth === 'Sept' && { color: '#1D4ED8', fontWeight: '700' }]}>₹ 1.8k</Text>
                <View style={[styles.barFill, { height: 42 }, selectedMonth === 'Sept' && { backgroundColor: '#1D4ED8' }]} />
                <Text style={[styles.monthLabel, selectedMonth === 'Sept' && styles.monthLabelActive]}>Sept</Text>
              </Pressable>

              <Pressable
                style={styles.chartCol}
                onPress={() => setSelectedMonth('Oct')}
                accessibilityRole="button"
              >
                <Text style={[styles.colValText, selectedMonth === 'Oct' && { color: '#7C3AED', fontWeight: '700' }]}>₹ 3.8k</Text>
                <View style={[styles.barFill, styles.barFillPeak, { height: 78 }, selectedMonth === 'Oct' && { backgroundColor: '#7C3AED' }]} />
                <Text style={[styles.monthLabel, selectedMonth === 'Oct' && styles.monthLabelActive]}>Oct</Text>
              </Pressable>

              <Pressable
                style={styles.chartCol}
                onPress={() => setSelectedMonth('Nov')}
                accessibilityRole="button"
              >
                <Text style={[styles.colValText, selectedMonth === 'Nov' && { color: '#1D4ED8', fontWeight: '700' }]}>₹ 3.4k</Text>
                <View style={[styles.barFill, styles.barFillCurrent, { height: 68 }, selectedMonth === 'Nov' && { backgroundColor: '#1D4ED8' }]} />
                <Text style={[styles.monthLabel, selectedMonth === 'Nov' && styles.monthLabelActive]}>Nov</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Cash In-Hand & Monthly Expenses Overview */}
        <View style={styles.cashExpensesRow}>
          <Card style={styles.miniKpiCard}>
            <View style={styles.miniKpiTop}>
              <Feather name="briefcase" size={15} color="#1D4ED8" />
              <Text style={styles.miniKpiLabel}>{t('dashboard.cashInHand', 'Cash In-Hand')}</Text>
            </View>
            <Text style={styles.miniKpiVal}>₹ 14,500.00</Text>
          </Card>

          <Card style={styles.miniKpiCard}>
            <View style={styles.miniKpiTop}>
              <Feather name="file-minus" size={15} color="#B91C1C" />
              <Text style={styles.miniKpiLabel}>{t('dashboard.expenses', 'Expenses (Nov)')}</Text>
            </View>
            <Text style={[styles.miniKpiVal, { color: '#B91C1C' }]}>₹ 3,250.00</Text>
          </Card>
        </View>

        {/* Recent transactions section */}
        <View style={styles.sectionRow}>
          <Text style={styles.recentSectionTitle}>{t('dashboard.recentInvoices', 'Recent transactions')}</Text>
          <Pressable onPress={() => router.push('/sale' as any)} accessibilityRole="button">
            <Text style={styles.viewAllLink}>{t('common.viewAll', 'View all')}</Text>
          </Pressable>
        </View>

        {/* Transaction Rows */}
        <View style={styles.recentRowsList}>
          {recent.length > 0 ? (
            recent.map((inv) => (
              <Pressable
                key={inv.id}
                onPress={() => setSelectedTx(inv)}
                style={({ pressed }) => [
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Card style={styles.txRowCard}>
                  <View style={styles.txRowLeft}>
                    <Text style={styles.partyNameText}>
                      {inv.party_name}
                    </Text>
                    <Text style={styles.invSubtitleText}>
                      {inv.type === 'sale' ? t('dashboard.addSale', 'Sale') : t('dashboard.addPurchase', 'Purchase')} · {inv.invoice_no}
                    </Text>
                  </View>
                  <Text style={styles.txAmountText}>{formatMoney(inv.total)}</Text>
                </Card>
              </Pressable>
            ))
          ) : (
            <Card style={styles.txRowCard}>
              <View style={styles.txRowLeft}>
                <Text style={styles.partyNameText}>Sharma Retail</Text>
                <Text style={styles.invSubtitleText}>{t('dashboard.addSale', 'Sale')} · INV-001</Text>
              </View>
              <Text style={styles.txAmountText}>₹ 2,756.26</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Stationary Floating Button: amber #F59E0B, dark text, "+ New sale", right above the tab bar */}
      <Pressable
        style={({ pressed }) => [
          styles.floatingSaleBtnMobile,
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}
        onPress={() => router.push('/sale' as any)}
        accessibilityRole="button"
      >
        <Feather name="plus" size={20} color="#0F172A" style={{ marginRight: 6 }} />
        <Text style={styles.floatingSaleText}>{t('dashboard.newSaleBtn', '+ New sale')}</Text>
      </Pressable>

      {/* Transaction Detail Modal */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>{selectedTx?.party_name}</Text>
                <Text style={styles.detailSub}>{selectedTx?.invoice_no} · {selectedTx?.date}</Text>
              </View>
              <Pressable
                onPress={() => setSelectedTx(null)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={22} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('invoices.invoiceType', 'Invoice Type')}</Text>
              <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>
                {selectedTx?.type === 'sale' ? t('dashboard.addSale', 'Sale') : t('dashboard.addPurchase', 'Purchase')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('common.total', 'Total Amount')}</Text>
              <Text style={[styles.detailValue, { color: colors.primary, fontFamily: fonts.bold }]}>
                {selectedTx ? formatMoney(selectedTx.total) : '₹ 0.00'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('invoices.amountReceived', 'Paid Amount')}</Text>
              <Text style={[styles.detailValue, { color: '#047857' }]}>
                {selectedTx ? formatMoney(selectedTx.paid_amount || 0) : '₹ 0.00'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('invoices.balanceDue', 'Balance Due')}</Text>
              <Text style={[styles.detailValue, { color: '#B91C1C', fontFamily: fonts.bold }]}>
                {selectedTx ? formatMoney(Math.max(0, selectedTx.total - (selectedTx.paid_amount || 0))) : '₹ 0.00'}
              </Text>
            </View>

            <View style={styles.detailActionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.detailWhatsAppBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => handleShareWhatsApp(selectedTx)}
              >
                <Feather name="share-2" size={18} color="#047857" style={{ marginRight: 8 }} />
                <Text style={styles.detailWhatsAppText}>{t('parties.whatsappReminder', 'Share on WhatsApp')}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.detailPrintBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => {
                  setSelectedTx(null);
                  router.push('/sale' as any);
                }}
              >
                <Feather name="printer" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.detailPrintText}>{t('invoices.print', 'View / Print Invoice')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Business Switcher Modal */}
      <Modal
        visible={businessPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBusinessPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('common.switchBusiness', 'Select Business')}</Text>
              <Pressable
                onPress={() => setBusinessPickerVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            {businesses.map((b) => (
              <Pressable
                key={b.id}
                style={[
                  styles.modalOption,
                  currentBusiness?.id === b.id && styles.modalOptionActive,
                ]}
                onPress={() => {
                  switchBusiness(b.id);
                  setBusinessPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    currentBusiness?.id === b.id && styles.modalOptionTextActive,
                  ]}
                >
                  {b.name}
                </Text>
                {currentBusiness?.id === b.id && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mobile styles
  mobileScreenRoot: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F4F6FA',
  },
  mobileScrollView: {
    flex: 1,
  },
  mobileScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 90,
  },
  mobileHeaderBlock: {
    backgroundColor: '#1D4ED8',
    marginHorizontal: -20,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  mobileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  businessSwitcherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    flex: 1,
  },
  businessSwitcherText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  langBtnWhite: {
    width: 44,
    height: 44,
    minHeight: 44,
    minWidth: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnWhiteText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  todaySaleLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontFamily: fonts.medium,
    marginBottom: 4,
  },
  todaySaleValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  // Overlapping KPI Cards
  overlapCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: -16,
    marginBottom: 16,
  },
  overlapCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  overlapCardLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#475569',
    marginBottom: 4,
  },
  overlapCardValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  // Quick Action Tiles
  tilesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tileBox: {
    flex: 1,
    minHeight: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tileLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Sales Trend Chart (BiLU ERP Feature)
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartSub: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#1D4ED8',
    marginTop: 2,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#047857',
  },
  chartVisualArea: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chartColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 110,
    paddingTop: 10,
  },
  chartCol: {
    alignItems: 'center',
    width: 64,
  },
  colValText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#64748B',
    marginBottom: 6,
  },
  barFill: {
    width: 28,
    backgroundColor: '#CBD5E1',
    borderRadius: 6,
  },
  barFillPeak: {
    backgroundColor: '#1D4ED8',
  },
  barFillCurrent: {
    backgroundColor: '#7C3AED',
  },
  monthLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#64748B',
    marginTop: 6,
  },
  monthLabelActive: {
    color: '#0F172A',
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },

  // Cash In-Hand & Expenses Quick Row
  cashExpensesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  miniKpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  miniKpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  miniKpiLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  miniKpiVal: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Recent Transactions
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentSectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllLink: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  recentRowsList: {
    gap: 10,
  },
  txRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  txRowLeft: {
    flex: 1,
  },
  partyNameText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  invSubtitleText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#475569',
  },
  txAmountText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Stationary Floating Action Button (Mobile)
  floatingSaleBtnMobile: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    height: 52,
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  floatingSaleBtnDesktop: {
    position: 'absolute',
    right: 32,
    bottom: 32,
    height: 52,
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  floatingSaleText: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  // Desktop Specific Styles
  desktopRoot: {
    flex: 1,
    minHeight: '100%',
  },
  desktopScrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  desktopHeader: {
    marginBottom: 20,
  },
  desktopTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    padding: 18,
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
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  desktopQuickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  desktopActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  desktopActionText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  desktopSplit: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  tablePanel: {
    flex: 2.2,
  },
  lowStockSidePanel: {
    flex: 1,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  tableCard: {
    padding: 0,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txPartyName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  txInvoiceSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#475569',
  },
  td: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusPaidText: {
    color: '#15803D',
  },
  statusUnpaid: {
    backgroundColor: '#FEE2E2',
  },
  statusUnpaidText: {
    color: '#B91C1C',
  },
  emptyTableRow: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#475569',
  },
  lowStockCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  lowStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lowStockName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  lowStockSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#475569',
  },
  lowStockQty: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#B91C1C',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCloseBtn: {
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
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  modalOptionTextActive: {
    color: '#1D4ED8',
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },

  // Detail Modal
  detailCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  detailActionsRow: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 18,
  },
  detailWhatsAppBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#047857',
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailWhatsAppText: {
    color: '#047857',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  detailPrintBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPrintText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
});
