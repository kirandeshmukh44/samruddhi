// app/src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { setLanguage, supportedLanguages } from '../i18n';
import Card from '../components/Card';
import { colors, fonts } from '../theme';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from '../config';
import AppHeader from '../components/AppHeader';
import { useData } from '../context/DataContext';
import { formatDate } from '../lib/dates';
import { formatMoney } from '../lib/money';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, currentBusiness, businesses, switchBusiness, addBusiness, signOut } = useAuth();
  const { expenses, cashInHand, bankAccounts, addExpense, resetDemoData } = useData();

  const [enableGst, setEnableGst] = useState(true);
  const [autoRoundOff, setAutoRoundOff] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [printInvoiceFooter, setPrintInvoiceFooter] = useState(true);

  const handleResetDemoData = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will restore all default parties, items, invoices and payment records. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetDemoData();
            Alert.alert('Success', 'Demo data reset to factory defaults.');
          },
        },
      ]
    );
  };

  // Edit / Create Business Modal
  const [bizModalOpen, setBizModalOpen] = useState(false);
  const [bizName, setBizName] = useState(currentBusiness?.name || '');
  const [bizGstin, setBizGstin] = useState(currentBusiness?.gstin || '');
  const [bizAddress, setBizAddress] = useState(currentBusiness?.address || '');
  const [bizState, setBizState] = useState(currentBusiness?.state || 'Maharashtra');
  const [bizPhone, setBizPhone] = useState(currentBusiness?.phone || '');

  // Switch Business Modal
  const [switchModalOpen, setSwitchModalOpen] = useState(false);

  // Expenses State (BiLU ERP Feature)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [newExpCategory, setNewExpCategory] = useState<'Rent' | 'Electricity' | 'Salary' | 'Tea & Refreshments' | 'Other'>('Rent');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpNote, setNewExpNote] = useState('');
  const [newExpAccount, setNewExpAccount] = useState<'cash' | string>('cash');

  // Cash & Bank State
  const [cashBankModalOpen, setCashBankModalOpen] = useState(false);

  // Backup & Restore State
  const [backupSuccessModal, setBackupSuccessModal] = useState(false);
  const [cloudSyncActive, setCloudSyncActive] = useState(true);

  const onChangeLang = async (code: string) => {
    await setLanguage(code);
  };

  const handleAddExpense = async () => {
    const amtRupees = parseFloat(newExpAmount);
    if (isNaN(amtRupees) || amtRupees <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }
    await addExpense({
      business_id: currentBusiness?.id || 'b-1',
      category: newExpCategory,
      amount: Math.round(amtRupees * 100),
      date: new Date().toISOString().slice(0, 10),
      note: newExpNote || newExpCategory,
      account: newExpAccount,
    });
    setNewExpAmount('');
    setNewExpNote('');
    setExpenseModalOpen(false);
  };

  const handleCreateBusiness = async () => {
    if (!bizName) {
      alert('Enter business name');
      return;
    }
    await addBusiness({
      name: bizName,
      gstin: bizGstin,
      address: bizAddress,
      state: bizState,
      phone: bizPhone,
    });
    setBizModalOpen(false);
  };

  return (
    <View style={styles.root}>
      {/* Global Brand Header */}
      <AppHeader
        variant="compact"
        title="Settings & More"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Profile & Business Banner */}
      <Card style={styles.businessCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {(currentBusiness?.name || 'G').charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.businessInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.businessName}>{currentBusiness?.name || 'Gupta Traders'}</Text>
            <Pressable onPress={() => setSwitchModalOpen(true)} style={styles.switchPill}>
              <Text style={styles.switchPillText}>Switch</Text>
            </Pressable>
          </View>
          <Text style={styles.gstinText}>GSTIN: {currentBusiness?.gstin || '27ABCDE1234F1Z5'}</Text>
          <Text style={styles.phoneText}>
            {currentBusiness?.phone || '9876543210'} · {currentBusiness?.state || 'Maharashtra'}
          </Text>
        </View>

        <Pressable
          style={styles.editBizBtn}
          onPress={() => {
            setBizName(currentBusiness?.name || '');
            setBizGstin(currentBusiness?.gstin || '');
            setBizAddress(currentBusiness?.address || '');
            setBizState(currentBusiness?.state || 'Maharashtra');
            setBizPhone(currentBusiness?.phone || '');
            setBizModalOpen(true);
          }}
        >
          <Feather name="edit-3" size={18} color="#1D4ED8" />
        </Pressable>
      </Card>

      {/* Quick Menu Options */}
      <Text style={styles.sectionHeader}>Business & Accounting</Text>
      <Card style={styles.menuCard}>
        <Pressable
          style={styles.menuItem}
          onPress={() => router.push('/reports' as any)}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
            <Feather name="bar-chart-2" size={18} color="#1D4ED8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Reports & Ledger</Text>
            <Text style={styles.menuSub}>Sales, GST summaries, GSTR-1, Party statements</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={styles.menuItem}
          onPress={() => router.push('/payments' as any)}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="credit-card" size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Payment History</Text>
            <Text style={styles.menuSub}>Payment-In & Payment-Out records</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={styles.menuItem}
          onPress={() => router.push('/purchase' as any)}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Feather name="shopping-cart" size={18} color="#B91C1C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Purchase Bills</Text>
            <Text style={styles.menuSub}>Supplier invoices and inward inventory</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </Pressable>

        <View style={styles.divider} />

        {/* Expenses Tracker */}
        <Pressable
          style={styles.menuItem}
          onPress={() => setExpenseModalOpen(true)}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#EDE9FE' }]}>
            <Feather name="file-minus" size={18} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Expenses Tracker</Text>
            <Text style={styles.menuSub}>Shop rent, electricity, staff salary, tea & refreshments</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </Pressable>
      </Card>

      {/* Cash & Bank Management Section */}
      <Text style={styles.sectionHeader}>Cash & Bank</Text>
      <Card style={styles.menuCard}>
        <Pressable
          style={styles.menuItem}
          onPress={() => setCashBankModalOpen(true)}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#DCFCE7' }]}>
            <Feather name="briefcase" size={18} color="#15803D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Cash In-Hand</Text>
            <Text style={styles.menuSub}>Current store cash drawer: {formatMoney(cashInHand)}</Text>
          </View>
          <Text style={styles.menuValTag}>{formatMoney(cashInHand)}</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={styles.menuItem}
          onPress={() => setCashBankModalOpen(true)}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#E0F2FE' }]}>
            <Feather name="home" size={18} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Bank Accounts</Text>
            <Text style={styles.menuSub}>HDFC Bank, SBI Bank balances</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </Pressable>
      </Card>

      {/* Important Utilities & Data Protection */}
      <Text style={styles.sectionHeader}>{t('settings.dataBackup', 'Data, Backup & Sync')}</Text>
      <Card style={styles.menuCard}>
        <View style={styles.menuItem}>
          <View style={[styles.iconWrap, { backgroundColor: '#F1F5F9' }]}>
            <Feather name="database" size={18} color="#94A3B8" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.menuTitle, { color: '#64748B' }]}>{t('settings.dataBackup', 'Backup / Restore')}</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming soon</Text>
              </View>
            </View>
            <Text style={styles.menuSub}>Create instant encrypted backup to device storage</Text>
          </View>
          <Feather name="lock" size={16} color="#94A3B8" />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.switchTitle, { color: '#64748B' }]}>{t('settings.cloudSync', 'Multi-Device Cloud Sync')}</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming soon</Text>
              </View>
            </View>
            <Text style={styles.switchSub}>Sync real-time between Android, iPhone & Desktop</Text>
          </View>
          <Switch
            value={false}
            disabled={true}
            trackColor={{ false: '#E2E8F0', true: '#CBD5E1' }}
          />
        </View>

        <View style={styles.divider} />

        <Pressable
          style={styles.menuItem}
          onPress={handleResetDemoData}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Feather name="refresh-cw" size={18} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Reset Demo Data</Text>
            <Text style={styles.menuSub}>Restore default demo invoices, parties and inventory</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#DC2626" />
        </Pressable>
      </Card>

      {/* Language Section */}
      <Text style={styles.sectionHeader}>{t('common.language', 'Language (भाषा)')}</Text>
      <Card style={styles.langCard}>
        {supportedLanguages.map((l) => {
          const isSelected = i18n.language === l.code;
          return (
            <Pressable
              key={l.code}
              style={[styles.langRow, isSelected && styles.langRowSelected]}
              onPress={() => onChangeLang(l.code)}
            >
              <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
                {l.label}
              </Text>
              {isSelected ? (
                <Feather name="check-circle" size={18} color="#1D4ED8" />
              ) : (
                <Feather name="circle" size={18} color="#CBD5E1" />
              )}
            </Pressable>
          );
        })}
      </Card>

      {/* Preferences & Invoicing Settings */}
      <Text style={styles.sectionHeader}>{t('nav.settings', 'Invoice Preferences')}</Text>
      <Card style={styles.switchCard}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>{t('settings.enableGst', 'Enable GST Billing')}</Text>
            <Text style={styles.switchSub}>Apply CGST, SGST & IGST breakdown on bills</Text>
          </View>
          <Switch
            value={enableGst}
            onValueChange={setEnableGst}
            trackColor={{ false: '#CBD5E1', true: '#1D4ED8' }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>{t('settings.autoRoundOff', 'Auto Round-off to Nearest ₹')}</Text>
            <Text style={styles.switchSub}>Automatic half-up rounding for invoice total</Text>
          </View>
          <Switch
            value={autoRoundOff}
            onValueChange={setAutoRoundOff}
            trackColor={{ false: '#CBD5E1', true: '#1D4ED8' }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>{t('settings.whatsappReminders', 'WhatsApp Payment Reminders')}</Text>
            <Text style={styles.switchSub}>One-tap WhatsApp share on invoice creation</Text>
          </View>
          <Switch
            value={smsAlerts}
            onValueChange={setSmsAlerts}
            trackColor={{ false: '#CBD5E1', true: '#1D4ED8' }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Print 'Generated by BiLU ERP' Footer</Text>
            <Text style={styles.switchSub}>Display branding on printed and shared invoices</Text>
          </View>
          <Switch
            value={printInvoiceFooter}
            onValueChange={setPrintInvoiceFooter}
            trackColor={{ false: '#CBD5E1', true: '#1D4ED8' }}
          />
        </View>
      </Card>

      {/* About BiLU ERP Card */}
      <Text style={styles.sectionHeader}>About {APP_NAME}</Text>
      <Card style={styles.aboutCard}>
        <View style={styles.aboutWordmarkWrap}>
          <Image
            source={require('../../assets/images/bilu-wordmark.jpg')}
            style={styles.aboutWordmarkImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.aboutAppTitle}>
          {APP_NAME} <Text style={styles.aboutVersion}>v1.0.0</Text>
        </Text>
        <Text style={styles.aboutTagline}>{APP_TAGLINE}</Text>
        <View style={styles.aboutDivider} />
        <View style={styles.aboutCompanyRow}>
          <Feather name="shield" size={16} color="#1D4ED8" style={{ marginRight: 8 }} />
          <Text style={styles.aboutCompanyText}>
            Powered by <Text style={{ fontWeight: '700', color: '#0F172A' }}>{COMPANY_NAME}</Text>
          </Text>
        </View>
        <Text style={styles.aboutCopyright}>© 2026 {COMPANY_NAME}. All rights reserved.</Text>
      </Card>

      {/* Sign Out Button */}
      <Pressable
        style={styles.signOutBtn}
        onPress={() => {
          signOut();
          router.replace('/login' as any);
        }}
      >
        <Feather name="log-out" size={18} color="#B91C1C" style={{ marginRight: 8 }} />
        <Text style={styles.signOutText}>{t('settings.logout', 'Logout from BiLU ERP')}</Text>
      </Pressable>

      <Text style={styles.versionText}>{APP_NAME} v1.0.0 · Powered by {COMPANY_NAME}</Text>

      {/* Add / Edit Business Profile Modal */}
      {/* Business Profile Modal */}
      <Modal
        visible={bizModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBizModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Business Profile</Text>
              <Pressable
                onPress={() => setBizModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name *</Text>
              <TextInput
                value={bizName}
                onChangeText={setBizName}
                placeholder="e.g. Gupta Traders"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GSTIN</Text>
              <TextInput
                value={bizGstin}
                onChangeText={setBizGstin}
                placeholder="e.g. 27ABCDE1234F1Z5"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                value={bizPhone}
                onChangeText={setBizPhone}
                placeholder="10-digit phone"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                value={bizAddress}
                onChangeText={setBizAddress}
                placeholder="City, State"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setBizModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.modalSubmitBtn} onPress={handleCreateBusiness}>
                <Text style={styles.modalSubmitText}>Save Business</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Switch Business Modal */}
      <Modal
        visible={switchModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitchModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Switch Business</Text>
              <Pressable
                onPress={() => setSwitchModalOpen(false)}
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
                  styles.bizOption,
                  currentBusiness?.id === b.id && styles.bizOptionActive,
                ]}
                onPress={() => {
                  switchBusiness(b.id);
                  setSwitchModalOpen(false);
                }}
              >
                <View>
                  <Text
                    style={[
                      styles.bizOptionName,
                      currentBusiness?.id === b.id && styles.bizOptionNameActive,
                    ]}
                  >
                    {b.name}
                  </Text>
                  <Text style={styles.bizOptionSub}>{b.gstin || 'Unregistered'} · {b.state || 'Maharashtra'}</Text>
                </View>
                {currentBusiness?.id === b.id && (
                  <Feather name="check" size={18} color="#1D4ED8" />
                )}
              </Pressable>
            ))}

            <Pressable
              style={styles.addNewBizBtn}
              onPress={() => {
                setSwitchModalOpen(false);
                setBizName('');
                setBizGstin('');
                setBizAddress('');
                setBizPhone('');
                setBizModalOpen(true);
              }}
            >
              <Feather name="plus" size={16} color="#1D4ED8" style={{ marginRight: 6 }} />
              <Text style={styles.addNewBizText}>+ Add New Business</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Expenses Management Modal */}
      <Modal
        visible={expenseModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setExpenseModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 420, maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Expenses Tracker</Text>
              <Pressable
                onPress={() => setExpenseModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220, marginVertical: 10 }}>
              {expenses.map((exp) => (
                <View key={exp.id} style={styles.expenseItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseCatText}>{exp.category}</Text>
                    <Text style={styles.expenseNoteText}>{exp.note} · {formatDate(exp.date)}</Text>
                  </View>
                  <Text style={styles.expenseAmtText}>{formatMoney(exp.amount)}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.divider} />

            <Text style={[styles.inputLabel, { marginTop: 6 }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
              {(['Rent', 'Electricity', 'Salary', 'Tea & Refreshments', 'Other'] as const).map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.catChip,
                    newExpCategory === cat && styles.catChipActive,
                  ]}
                  onPress={() => setNewExpCategory(cat)}
                >
                  <Text style={[styles.catChipText, newExpCategory === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 6 }]}>Paid From</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
              <Pressable
                style={[styles.accountChip, newExpAccount === 'cash' && styles.accountChipActive]}
                onPress={() => setNewExpAccount('cash')}
              >
                <Text style={[styles.accountChipText, newExpAccount === 'cash' && styles.accountChipTextActive]}>
                  Cash in-Hand
                </Text>
              </Pressable>
              {bankAccounts.map((b) => (
                <Pressable
                  key={b.id}
                  style={[styles.accountChip, newExpAccount === b.id && styles.accountChipActive]}
                  onPress={() => setNewExpAccount(b.id)}
                >
                  <Text style={[styles.accountChipText, newExpAccount === b.id && styles.accountChipTextActive]}>
                    {b.bankName}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.expenseFormRow}>
              <TextInput
                value={newExpAmount}
                onChangeText={setNewExpAmount}
                placeholder="Amount (₹)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={newExpNote}
                onChangeText={setNewExpNote}
                placeholder="Note / remark (optional)"
                placeholderTextColor="#94A3B8"
                style={[styles.input, { flex: 1.5 }]}
              />
            </View>

            <Pressable
              style={styles.saveExpenseBtn}
              onPress={handleAddExpense}
            >
              <Text style={styles.saveExpenseBtnText}>Save Expense</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Cash & Bank Modal */}
      <Modal
        visible={cashBankModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCashBankModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 380 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Cash & Bank Balances</Text>
              <Pressable
                onPress={() => setCashBankModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.bankBalanceBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="briefcase" size={20} color="#047857" />
                <Text style={styles.bankBoxTitle}>Store Cash In-Hand</Text>
              </View>
              <Text style={styles.bankBoxAmount}>₹ {cashInHand.toLocaleString('en-IN')}.00</Text>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12, marginBottom: 8 }]}>Linked Bank Accounts</Text>
            {bankAccounts.map((b) => (
              <View key={b.id} style={styles.bankAccountRow}>
                <View>
                  <Text style={styles.bankAccountName}>{b.bankName}</Text>
                  <Text style={styles.bankAccountNo}>A/c {b.accountNo}</Text>
                </View>
                <Text style={styles.bankAccountBal}>₹ {b.balance.toLocaleString('en-IN')}.00</Text>
              </View>
            ))}

            <Pressable
              style={styles.closeFullBtn}
              onPress={() => setCashBankModalOpen(false)}
            >
              <Text style={styles.closeFullBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Backup Success Modal */}
      <Modal
        visible={backupSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setBackupSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360, alignItems: 'center' }]}>
            <View style={[styles.iconWrap, { backgroundColor: '#DCFCE7', width: 54, height: 54, borderRadius: 27, marginBottom: 12 }]}>
              <Feather name="check" size={26} color="#047857" />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 6 }]}>Backup Created Successfully!</Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
              All your invoices, stock items, customer ledger, and expenses have been encrypted and saved to your device.
            </Text>
            <Pressable
              style={[styles.closeFullBtn, { width: '100%' }]}
              onPress={() => setBackupSuccessModal(false)}
            >
              <Text style={styles.closeFullBtnText}>Got it</Text>
            </Pressable>
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
  content: {
    padding: 20,
    paddingBottom: 90,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#1D4ED8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  switchPillText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  gstinText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#1D4ED8',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  editBizBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
  },

  sectionHeader: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    padding: 0,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 62,
  },

  langCard: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  langRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  langLabel: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  langLabelSelected: {
    color: '#1D4ED8',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  switchCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },

  signOutBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signOutText: {
    color: '#B91C1C',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: fonts.regular,
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
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  inputGroup: {},
  inputLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
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
    color: '#64748B',
    fontSize: 14,
  },
  modalSubmitBtn: {
    height: 44,
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

  // Biz options
  bizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bizOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  bizOptionName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  bizOptionNameActive: {
    color: '#1D4ED8',
  },
  bizOptionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addNewBizBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addNewBizText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },

  menuValTag: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#047857',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  expenseItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  expenseCatText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  expenseNoteText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  expenseAmtText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#B91C1C',
  },
  expenseFormRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  saveExpenseBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveExpenseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  bankBalanceBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  bankBoxTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#047857',
  },
  bankBoxAmount: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#047857',
    marginTop: 6,
  },
  bankAccountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bankAccountName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  bankAccountNo: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  bankAccountBal: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0284C7',
  },
  closeFullBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  closeFullBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  comingSoonBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: '#B45309',
    fontWeight: '700',
  },
  aboutCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aboutWordmarkWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aboutWordmarkImg: {
    width: 220,
    height: 48,
  },
  aboutAppTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#0F172A',
  },
  aboutVersion: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#1D4ED8',
  },
  aboutTagline: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#64748B',
    marginTop: 2,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  aboutCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aboutCompanyText: {
    fontSize: 13,
    color: '#334155',
    fontFamily: fonts.medium,
  },
  aboutCopyright: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: fonts.regular,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },
  catChipText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: fonts.medium,
  },
  catChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  accountChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  accountChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },
  accountChipText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: fonts.medium,
  },
  accountChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
});
