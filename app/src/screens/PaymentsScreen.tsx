// app/src/screens/PaymentsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { listPayments, recordPayment } from '../services/invoices';
import { listParties } from '../services/parties';
import { Payment, Party } from '../types';
import { formatMoney, toPaise } from '../lib/money';
import Card from '../components/Card';
import { colors, fonts } from '../theme';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import { useData } from '../context/DataContext';
import { formatDate } from '../lib/dates';

export default function PaymentsScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || 'b-1';
  const { payments, parties, recordPayment } = useData();

  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all');

  // Record Payment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [mode, setMode] = useState<'cash' | 'upi' | 'bank' | 'card'>('cash');
  const [note, setNote] = useState('');

  const filteredPayments = payments.filter((p) => {
    const matchesBiz = p.business_id === businessId;
    if (!matchesBiz) return false;
    if (activeTab === 'in') return p.direction === 'in';
    if (activeTab === 'out') return p.direction === 'out';
    return true;
  });

  const totalIn = payments
    .filter((p) => p.business_id === businessId && p.direction === 'in')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOut = payments
    .filter((p) => p.business_id === businessId && p.direction === 'out')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleRecordPayment = async () => {
    if (!amountRupees || !selectedPartyId) return;
    const amountPaise = toPaise(parseFloat(amountRupees) || 0);

    const party = parties.find((pt) => pt.id === selectedPartyId);

    await recordPayment({
      business_id: businessId,
      party_id: selectedPartyId,
      party_name: party?.name,
      amount: amountPaise,
      mode,
      direction,
      date: new Date().toISOString().slice(0, 10),
      note: note || (direction === 'in' ? 'Payment received' : 'Payment paid out'),
    });

    setAmountRupees('');
    setNote('');
    setModalOpen(false);
  };

  return (
    <View style={styles.root}>
      {/* Global Brand Header */}
      <AppHeader
        variant="compact"
        title={t('payments.title', 'Payments')}
        subtitle={`${t('common.in', 'Money In')} (${t('payments.received', 'Received')}) & ${t('common.out', 'Money Out')} (${t('payments.paid', 'Paid')})`}
        rightAction={
          <Pressable
            style={styles.recordBtn}
            onPress={() => setModalOpen(true)}
            accessibilityRole="button"
          >
            <Feather name="plus-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.recordBtnText}>Record Payment</Text>
          </Pressable>
        }
      />

      {/* Summary KPI Cards: Total In vs Total Out */}
      <View style={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <View style={styles.kpiIconWrapIn}>
            <Feather name="arrow-down-left" size={20} color="#047857" />
          </View>
          <View>
            <Text style={styles.kpiLabel}>{t('payments.received', 'Total Received')}</Text>
            <Text style={[styles.kpiValue, { color: '#047857' }]}>{formatMoney(totalIn)}</Text>
          </View>
        </Card>

        <Card style={styles.kpiCard}>
          <View style={styles.kpiIconWrapOut}>
            <Feather name="arrow-up-right" size={20} color="#B91C1C" />
          </View>
          <View>
            <Text style={styles.kpiLabel}>{t('payments.paid', 'Total Paid')}</Text>
            <Text style={[styles.kpiValue, { color: '#B91C1C' }]}>{formatMoney(totalOut)}</Text>
          </View>
        </Card>
      </View>

      {/* Filter Tabs: All, Money In, Money Out */}
      <View style={styles.filterPillsRow}>
        <Pressable
          style={[styles.filterPill, activeTab === 'all' && styles.filterPillActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.filterPillText, activeTab === 'all' && styles.filterPillTextActive]}>
            All Transactions ({payments.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterPill, activeTab === 'in' && styles.filterPillActive]}
          onPress={() => setActiveTab('in')}
        >
          <Text style={[styles.filterPillText, activeTab === 'in' && styles.filterPillTextActive]}>
            Money In (Received)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterPill, activeTab === 'out' && styles.filterPillActive]}
          onPress={() => setActiveTab('out')}
        >
          <Text style={[styles.filterPillText, activeTab === 'out' && styles.filterPillTextActive]}>
            Money Out (Paid)
          </Text>
        </Pressable>
      </View>

      {/* Payment Records: Desktop Table vs Mobile Cards */}
      {isDesktop ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Card style={[styles.tableCard, { minWidth: 680 }]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2.5 }]}>PARTY NAME</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>DATE</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>PAYMENT MODE</Text>
              <Text style={[styles.th, { flex: 2 }]}>NOTE / REF</Text>
              <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>AMOUNT (₹)</Text>
            </View>

            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => {
                const party = parties.find((pt) => pt.id === p.party_id);
                const isIn = p.direction === 'in';
                return (
                  <View key={p.id} style={styles.tableRow}>
                    <View style={{ flex: 2.5 }}>
                      <Text style={styles.tdBold}>{party?.name || 'Cash Customer'}</Text>
                      <Text style={styles.tdSub}>{isIn ? 'From Customer' : 'To Supplier'}</Text>
                    </View>
                    <Text style={[styles.td, { flex: 1.5 }]}>{formatDate(p.date)}</Text>
                    <View style={{ flex: 1.5 }}>
                      <View style={styles.modeBadge}>
                        <Text style={styles.modeBadgeText}>{p.mode.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.tdSub, { flex: 2 }]} numberOfLines={1}>
                      {p.note || '-'}
                    </Text>
                    <Text
                      style={[
                        styles.tdBold,
                        { flex: 2, textAlign: 'right', color: isIn ? '#047857' : '#B91C1C' },
                      ]}
                    >
                      {isIn ? '+ ' : '- '}
                      {formatMoney(p.amount)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No payment entries recorded yet</Text>
              </View>
            )}
          </Card>
        </ScrollView>
      ) : (
        <View style={styles.mobileCardsList}>
          {filteredPayments.length > 0 ? (
            filteredPayments.map((p) => {
              const party = parties.find((pt) => pt.id === p.party_id);
              const isIn = p.direction === 'in';
              return (
                <Card key={p.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardLeft}>
                    <View
                      style={[
                        styles.mobileIconWrap,
                        { backgroundColor: isIn ? '#DCFCE7' : '#FEE2E2' },
                      ]}
                    >
                      <Feather
                        name={isIn ? 'arrow-down-left' : 'arrow-up-right'}
                        size={18}
                        color={isIn ? '#047857' : '#B91C1C'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mobilePartyName}>{party?.name || 'Cash Customer'}</Text>
                      <Text style={styles.mobileDateSub}>
                        {formatDate(p.date)} · {p.mode.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.mobileAmount,
                        { color: isIn ? '#047857' : '#B91C1C' },
                      ]}
                    >
                      {isIn ? '+ ' : '- '}
                      {formatMoney(p.amount)}
                    </Text>
                    <Text style={styles.mobileDirectionBadge}>
                      {isIn ? 'RECEIVED' : 'PAID OUT'}
                    </Text>
                  </View>
                </Card>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No payment entries recorded yet</Text>
            </View>
          )}
        </View>
      )}

      {/* Record Payment Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Record New Payment</Text>
              <Pressable
                onPress={() => setModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            {/* Direction Toggle: Payment In (Received) vs Payment Out (Paid) */}
            <View style={styles.directionToggleRow}>
              <Pressable
                style={[
                  styles.directionBtn,
                  direction === 'in' && styles.directionBtnInActive,
                ]}
                onPress={() => setDirection('in')}
              >
                <Feather
                  name="arrow-down-left"
                  size={16}
                  color={direction === 'in' ? '#FFFFFF' : '#047857'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.directionBtnText,
                    direction === 'in' && styles.directionBtnTextActive,
                  ]}
                >
                  Payment-In (Received)
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.directionBtn,
                  direction === 'out' && styles.directionBtnOutActive,
                ]}
                onPress={() => setDirection('out')}
              >
                <Feather
                  name="arrow-up-right"
                  size={16}
                  color={direction === 'out' ? '#FFFFFF' : '#B91C1C'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.directionBtnText,
                    direction === 'out' && styles.directionBtnTextActive,
                  ]}
                >
                  Payment-Out (Paid)
                </Text>
              </Pressable>
            </View>

            {/* Select Party */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>
                {direction === 'in' ? 'Received From (Customer)' : 'Paid To (Supplier)'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.partyPickerScroll}
              >
                {parties.map((pt) => (
                  <Pressable
                    key={pt.id}
                    style={[
                      styles.partyChip,
                      selectedPartyId === pt.id && styles.partyChipSelected,
                    ]}
                    onPress={() => setSelectedPartyId(pt.id)}
                  >
                    <Text
                      style={[
                        styles.partyChipText,
                        selectedPartyId === pt.id && styles.partyChipTextSelected,
                      ]}
                    >
                      {pt.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Amount (₹) */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Amount (₹)</Text>
              <TextInput
                value={amountRupees}
                onChangeText={setAmountRupees}
                placeholder="0.00"
                keyboardType="numeric"
                style={styles.modalInput}
              />
            </View>

            {/* Payment Mode */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Payment Mode</Text>
              <View style={styles.modesRow}>
                {(['cash', 'upi', 'bank', 'card'] as const).map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.modeChip, mode === m && styles.modeChipSelected]}
                    onPress={() => setMode(m)}
                  >
                    <Text
                      style={[
                        styles.modeChipText,
                        mode === m && styles.modeChipTextSelected,
                      ]}
                    >
                      {m.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Note / Description */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Note / Transaction Ref (Optional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Paid via PhonePe / Inv-001 clear"
                style={styles.modalInput}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: direction === 'in' ? '#047857' : '#B91C1C' },
                ]}
                onPress={handleRecordPayment}
              >
                <Text style={styles.modalSaveText}>
                  Save {direction === 'in' ? 'Payment-In' : 'Payment-Out'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  h1Title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  recordBtn: {
    height: 44,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },

  kpiRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  kpiIconWrapIn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconWrapOut: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#64748B',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  filterPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterPillActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  // Desktop Table
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
  tdBold: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  tdSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
  },
  td: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  modeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  modeBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#475569',
  },

  // Mobile Cards
  mobileCardsList: {
    gap: 10,
  },
  mobileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  mobileCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mobileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobilePartyName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  mobileDateSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  mobileAmount: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  mobileDirectionBadge: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#64748B',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalHeading: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  directionToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  directionBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionBtnInActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  directionBtnOutActive: {
    backgroundColor: '#B91C1C',
    borderColor: '#B91C1C',
  },
  directionBtnText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  directionBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalField: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  partyPickerScroll: {
    flexDirection: 'row',
  },
  partyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  partyChipSelected: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  partyChipText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  partyChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipSelected: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  modeChipText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  modeChipTextSelected: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  modalSaveBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
