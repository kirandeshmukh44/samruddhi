// app/src/screens/PartiesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { listParties, createParty } from '../services/parties';
import { Party } from '../types';
import { formatMoney } from '../lib/money';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

export default function PartiesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useAuth();

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [search, setSearch] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Form fields
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newState, setNewState] = useState('Maharashtra');
  const [newOpeningBalance, setNewOpeningBalance] = useState('0');

  const businessId = currentBusiness?.id || 'b-1';
  const businessName = currentBusiness?.name || 'Gupta Traders';

  useEffect(() => {
    listParties(businessId).then(setParties);
  }, [businessId]);

  const filteredParties = parties.filter((p) => {
    const matchesTab =
      activeTab === 'customers' ? p.type === 'customer' : p.type === 'supplier';
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search));
    return matchesTab && matchesSearch;
  });

  const totalBalancePaise = filteredParties.reduce((sum, p) => {
    return sum + (p.opening_balance > 0 ? p.opening_balance : 0);
  }, 0);

  const handleAddParty = async () => {
    if (!newName) return;
    const balRupees = parseFloat(newOpeningBalance) || 0;
    const created = await createParty({
      business_id: businessId,
      name: newName,
      phone: newPhone,
      gstin: newGstin || undefined,
      state: newState,
      type: activeTab === 'customers' ? 'customer' : 'supplier',
      opening_balance: Math.round(balRupees * 100),
    });
    setParties((prev) => [...prev, created]);
    setNewName('');
    setNewPhone('');
    setNewGstin('');
    setNewOpeningBalance('0');
    setAddModalOpen(false);
  };

  const handleSendReminder = (party: Party) => {
    const balRs = (Math.abs(party.opening_balance) / 100).toFixed(2);
    const text = `Namaste ${party.name},\nThis is a gentle payment reminder from ${businessName}.\nYour pending balance is Rs. ${balRs}.\nKindly arrange to clear the dues.\nThank you!`;
    const cleanPhone = party.phone ? party.phone.replace(/\D/g, '') : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.screenRoot}>
      {/* White header with dynamic safe area inset for iPhone Dynamic Island and notch */}
      <View style={[styles.whiteHeader, { paddingTop: Math.max(insets.top, 16) + 12 }]}>
        <Text style={styles.h1Title}>{t('parties.title', 'Parties')}</Text>

        {/* Search field */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#475569" style={{ marginRight: 10 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('parties.searchPlaceholder', 'Search party by name or mobile')}
            placeholderTextColor="#475569"
            style={styles.searchInput}
          />
        </View>

        {/* Two equal tabs: Customers & Suppliers */}
        <View style={styles.tabRow}>
          <Pressable
            style={({ pressed }) => [
              styles.tabBtn,
              activeTab === 'customers' ? styles.tabBtnActive : styles.tabBtnOutlined,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => setActiveTab('customers')}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'customers' ? styles.tabBtnTextActive : styles.tabBtnTextOutlined,
              ]}
            >
              {t('parties.customers', 'Customers')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tabBtn,
              activeTab === 'suppliers' ? styles.tabBtnActive : styles.tabBtnOutlined,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => setActiveTab('suppliers')}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'suppliers' ? styles.tabBtnTextActive : styles.tabBtnTextOutlined,
              ]}
            >
              {t('parties.suppliers', 'Suppliers')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Line "[N] parties" and "Total to collect/pay" */}
        <View style={styles.infoLine}>
          <Text style={styles.countText}>
            [{filteredParties.length}] {t('parties.title', 'parties')}
          </Text>
          <Text style={styles.totalCollectLabel}>
            {activeTab === 'customers' ? `${t('dashboard.toCollect', 'To collect')}: ` : `${t('dashboard.toPay', 'To pay')}: `}
            <Text style={[styles.totalCollectAmount, activeTab === 'suppliers' && { color: '#B91C1C' }]}>
              {formatMoney(totalBalancePaise)}
            </Text>
          </Text>
        </View>

        {/* Desktop View: Table protected with horizontal scroll */}
        {isDesktop ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Card style={[styles.tableCard, { minWidth: 680 }]}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 3 }]}>{t('common.name', 'PARTY NAME')}</Text>
                <Text style={[styles.th, { flex: 2 }]}>{t('common.phone', 'PHONE')}</Text>
                <Text style={[styles.th, { flex: 2 }]}>{t('common.gstin', 'GSTIN')}</Text>
                <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>{t('common.amount', 'BALANCE')}</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>{t('common.actions', 'ACTION')}</Text>
              </View>

              {filteredParties.length > 0 ? (
                filteredParties.map((party) => {
                  const bal = party.opening_balance;
                  const isToCollect = bal > 0;
                  const isToPay = bal < 0;
                  const isSettled = bal === 0;

                  const statusColor = isToCollect
                    ? '#047857'
                    : isToPay
                    ? '#B91C1C'
                    : '#475569';

                  return (
                    <Pressable
                      key={party.id}
                      style={({ pressed }) => [
                        styles.tableRow,
                        pressed && { backgroundColor: '#F8FAFC' },
                      ]}
                      onPress={() => setSelectedParty(party)}
                    >
                      <View style={{ flex: 3 }}>
                        <Text style={styles.tdBold}>{party.name}</Text>
                        <Text style={styles.tdSub}>{party.state || 'Maharashtra'}</Text>
                      </View>
                      <Text style={[styles.td, { flex: 2 }]}>{party.phone || '-'}</Text>
                      <Text style={[styles.td, { flex: 2 }]}>{party.gstin || '-'}</Text>
                      <Text style={[styles.tdBold, { flex: 2, textAlign: 'right', color: statusColor }]}>
                        {isSettled ? '₹ 0.00' : formatMoney(Math.abs(bal))}
                      </Text>
                      <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                        <View style={styles.quickActionBtn}>
                          <Text style={styles.quickActionText}>{t('common.viewAll', 'Ledger')}</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyTable}>
                  <Text style={styles.emptyTableText}>{t('parties.noParties', 'No parties found in this category')}</Text>
                </View>
              )}
            </Card>
          </ScrollView>
        ) : (
          /* Mobile View: White row cards with animated press feedback */
          <View style={styles.cardsList}>
            {filteredParties.length > 0 ? (
              filteredParties.map((party) => {
                const bal = party.opening_balance;
                const isToCollect = bal > 0;
                const isToPay = bal < 0;
                const isSettled = bal === 0;

                const amountColor = isToCollect
                  ? '#047857'
                  : isToPay
                  ? '#B91C1C'
                  : '#475569';

                const caption = isToCollect
                  ? t('common.toCollect', 'To collect')
                  : isToPay
                  ? t('common.toPay', 'To pay')
                  : t('common.done', 'Settled');

                return (
                  <Pressable
                    key={party.id}
                    onPress={() => setSelectedParty(party)}
                    style={({ pressed }) => [
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Card style={styles.partyCard}>
                      <View style={styles.partyCardLeft}>
                        <Text style={styles.partyName}>{party.name}</Text>
                        <Text style={styles.partyPhone}>{party.phone || 'No phone'}</Text>
                      </View>

                      <View style={styles.partyCardRight}>
                        <Text style={[styles.partyAmount, { color: amountColor }]}>
                          {isSettled ? '₹ 0.00' : formatMoney(Math.abs(bal))}
                        </Text>
                        <Text style={[styles.partyCaption, { color: amountColor }]}>
                          {caption}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyTableText}>{t('parties.noParties', 'No parties yet')}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Stationary Floating Action Button: Amber #F59E0B */}
      <Pressable
        style={({ pressed }) => [
          styles.floatingAddBtn,
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}
        onPress={() => setAddModalOpen(true)}
        accessibilityRole="button"
      >
        <Feather name="plus" size={20} color="#0F172A" style={{ marginRight: 6 }} />
        <Text style={styles.floatingAddText}>
          {activeTab === 'customers' ? t('parties.addCustomer', '+ Add Customer') : t('parties.addSupplier', '+ Add Supplier')}
        </Text>
      </Pressable>

      {/* Party Ledger & Details Modal */}
      <Modal
        visible={!!selectedParty}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedParty(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.partyDetailCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partyModalTitle}>{selectedParty?.name}</Text>
                <Text style={styles.partyModalSub}>
                  {selectedParty?.type === 'customer' ? 'Customer' : 'Supplier'} · {selectedParty?.state || 'Maharashtra'}
                </Text>
              </View>
              <Pressable
                style={styles.closeModalBtn}
                onPress={() => setSelectedParty(null)}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.partyInfoRow}>
              <Text style={styles.detailLabel}>Mobile</Text>
              <Text style={styles.detailValue}>{selectedParty?.phone || 'Not provided'}</Text>
            </View>

            <View style={styles.partyInfoRow}>
              <Text style={styles.detailLabel}>GSTIN</Text>
              <Text style={styles.detailValue}>{selectedParty?.gstin || 'Unregistered'}</Text>
            </View>

            <View style={styles.balanceHighlightBox}>
              <Text style={styles.balanceBoxLabel}>Net Outstanding Balance</Text>
              <Text style={[styles.balanceBoxValue, { color: selectedParty && selectedParty.opening_balance > 0 ? '#047857' : '#B91C1C' }]}>
                {selectedParty ? formatMoney(Math.abs(selectedParty.opening_balance)) : '₹ 0.00'}
              </Text>
              <Text style={styles.balanceBoxStatus}>
                {selectedParty && selectedParty.opening_balance > 0
                  ? 'To collect from customer'
                  : selectedParty && selectedParty.opening_balance < 0
                  ? 'To pay to supplier'
                  : 'All dues settled'}
              </Text>
            </View>

            {/* Vertically stacked full-width action buttons: Prevents any icon/text clipping */}
            <View style={styles.partyModalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.reminderBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => selectedParty && handleSendReminder(selectedParty)}
              >
                <Feather name="message-circle" size={18} color="#047857" style={{ marginRight: 8 }} />
                <Text style={styles.reminderBtnText}>Send WhatsApp Reminder</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.newInvoiceBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => {
                  setSelectedParty(null);
                  router.push(selectedParty?.type === 'customer' ? '/sale' as any : '/purchase' as any);
                }}
              >
                <Feather name="file-text" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.newInvoiceBtnText}>+ Create New Bill</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Party Modal */}
      <Modal
        visible={addModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                Add New {activeTab === 'customers' ? 'Customer' : 'Supplier'}
              </Text>
              <Pressable
                onPress={() => setAddModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Party / Business Name *</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Sharma Grocery Stores"
                placeholderTextColor="#94A3B8"
                style={styles.modalTextInput}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Phone Number</Text>
              <TextInput
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Enter 10-digit mobile"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                style={styles.modalTextInput}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>GSTIN (Optional)</Text>
              <TextInput
                value={newGstin}
                onChangeText={setNewGstin}
                placeholder="e.g. 27ABCDE1234F1Z5"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                style={styles.modalTextInput}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Opening Balance (₹)</Text>
              <TextInput
                value={newOpeningBalance}
                onChangeText={setNewOpeningBalance}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                style={styles.modalTextInput}
              />
            </View>

            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setAddModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.modalSubmitBtn} onPress={handleAddParty}>
                <Text style={styles.modalSubmitText}>Save Party</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F4F6FA',
  },
  whiteHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 14,
  },
  h1Title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchBox: {
    height: 44,
    minHeight: 44,
    backgroundColor: '#F4F6FA',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#1D4ED8',
  },
  tabBtnOutlined: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tabBtnText: {
    fontSize: 15,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  tabBtnTextOutlined: {
    color: '#0F172A',
    fontFamily: fonts.medium,
    fontWeight: '500',
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  totalCollectLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  totalCollectAmount: {
    color: '#047857',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  // Cards List (Mobile)
  cardsList: {
    gap: 10,
  },
  partyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  partyCardLeft: {
    flex: 1,
  },
  partyName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  partyPhone: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
  },
  partyCardRight: {
    alignItems: 'flex-end',
  },
  partyAmount: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  partyCaption: {
    fontSize: 12,
    fontFamily: fonts.regular,
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
    paddingVertical: 14,
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
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#475569',
  },
  quickActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  quickActionText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  emptyTable: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTableText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: fonts.regular,
  },

  // Stationary Floating Button
  floatingAddBtn: {
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
  floatingAddText: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  partyDetailCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  partyModalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  partyModalSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 4,
    borderRadius: 8,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  partyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.regular,
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  balanceHighlightBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  balanceBoxLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.medium,
    marginBottom: 4,
  },
  balanceBoxValue: {
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  balanceBoxStatus: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  // Vertically stacked full-width action buttons: completely fixes overflow / cut-off
  partyModalActions: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  reminderBtn: {
    width: '100%',
    height: 48,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#047857',
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reminderBtnText: {
    color: '#047857',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  newInvoiceBtn: {
    width: '100%',
    height: 48,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  newInvoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },

  // Add Party Modal
  addModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalInputGroup: {},
  modalLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#475569',
    marginBottom: 4,
  },
  modalTextInput: {
    height: 44,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    height: 44,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  modalSubmitBtn: {
    height: 44,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});
