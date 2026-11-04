// app/src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../theme';

export default function LoginScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { signInWithOtp, signInWithEmail } = useAuth();

  // Carousel Slide State (0 to 3)
  const [activeSlide, setActiveSlide] = useState(0);

  // Login Modal & Form State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'otp' | 'email'>('otp');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const setLang = (code: string) => {
    i18n.changeLanguage(code);
  };

  const handleDemoFill = () => {
    setPhone('9876543210');
    setOtp('123456');
    setError('');
    setOtpSent(true);
  };

  const handleGetOtp = () => {
    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setSending(true);
    setTimeout(() => {
      setOtpSent(true);
      setSending(false);
    }, 300);
  };

  const handleVerifyOtp = async () => {
    const ok = await signInWithOtp(phone, otp || '123456');
    if (ok) {
      setLoginModalOpen(false);
      router.replace('/');
    } else {
      setError('Invalid OTP (Mock code is 123456)');
    }
  };

  const handleEmailLogin = async () => {
    if (!email) {
      setError('Please enter email address');
      return;
    }
    const ok = await signInWithEmail(email, password || 'password');
    if (ok) {
      setLoginModalOpen(false);
      router.replace('/');
    } else {
      setError('Invalid email or password');
    }
  };

  const slides = [
    {
      id: 0,
      title: 'Everything You Want In One Dashboard',
      subtitle: 'विक्री, खरेदी, नफा आणि जीएसटीचा ताळेबंद एकाच शक्तिशाली डॅशबोर्डवर!',
      badge: 'All-in-one Hub',
    },
    {
      id: 1,
      title: 'Manage All Your Items At One Place',
      subtitle: 'दुकानातील सर्व साठा, बारकोडिंग आणि संपत आलेला माल (Low Stock) एका नजरेत.',
      badge: 'Smart Inventory',
    },
    {
      id: 2,
      title: 'Create Unlimited Invoices And Share Digitally',
      subtitle: 'अमर्यादित GST बिले बनवा आणि १-क्लिकमध्ये WhatsApp वर शेअर करा.',
      badge: 'WhatsApp Billing',
    },
    {
      id: 3,
      title: 'Send Reminders And Get Paid Faster',
      subtitle: 'ग्राहकांना उधारीचे WhatsApp मेसेज पाठवून वसुली ३ पट जलद करा.',
      badge: 'Payment Reminders',
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header: Brand Logo + Language Pill */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.mintBadge}>
            <Text style={styles.mintBadgeText}>स</Text>
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.brandNameMr}>समृद्धी</Text>
            <Text style={styles.brandNameEn}>SAMRUDDHI</Text>
          </View>
        </View>

        {/* 3-Language Switcher Pills */}
        <View style={styles.langPillsWrap}>
          {(['en', 'hi', 'mr'] as const).map((lang) => {
            const active = i18n.language === lang;
            const label = lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'मरा';
            return (
              <Pressable
                key={lang}
                style={[styles.langPill, active && styles.langPillActive]}
                onPress={() => setLang(lang)}
              >
                <Text style={[styles.langPillText, active && styles.langPillTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Main Feature Carousel Display */}
      <ScrollView
        contentContainerStyle={styles.carouselContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Visual Card for current active slide */}
        <View style={styles.visualCardArea}>
          {activeSlide === 0 && (
            /* Slide 1 Visual: Dashboard Mockup (Matching Vyapar Screenshot 2) */
            <View style={styles.visualCard}>
              <View style={styles.miniCardHeader}>
                <Text style={styles.miniCardTitle}>Dashboard Preview</Text>
                <View style={styles.miniTagLive}>
                  <Text style={styles.miniTagLiveText}>Live</Text>
                </View>
              </View>

              <View style={styles.kpiGrid}>
                <View style={[styles.kpiBox, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={styles.kpiBoxLabel}>Sale</Text>
                  <Text style={[styles.kpiBoxVal, { color: '#047857' }]}>₹ 12,000</Text>
                  <Text style={styles.kpiBoxTrend}>↑ +18.4%</Text>
                </View>
                <View style={[styles.kpiBox, { backgroundColor: '#F0FDFA' }]}>
                  <Text style={styles.kpiBoxLabel}>You'll Get</Text>
                  <Text style={[styles.kpiBoxVal, { color: '#0F766E' }]}>₹ 12,000</Text>
                  <Text style={styles.kpiBoxTrend}>To Collect</Text>
                </View>
                <View style={[styles.kpiBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.kpiBoxLabel}>Stock Value</Text>
                  <Text style={[styles.kpiBoxVal, { color: '#B45309' }]}>₹ 45,200</Text>
                  <Text style={styles.kpiBoxTrend}>In Hand</Text>
                </View>
                <View style={[styles.kpiBox, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={styles.kpiBoxLabel}>Expense</Text>
                  <Text style={[styles.kpiBoxVal, { color: '#B91C1C' }]}>₹ 3,250</Text>
                  <Text style={styles.kpiBoxTrend}>Monthly</Text>
                </View>
              </View>
            </View>
          )}

          {activeSlide === 1 && (
            /* Slide 2 Visual: Items & Stock Mockup (Matching Vyapar Screenshot 3) */
            <View style={styles.visualCard}>
              <View style={styles.itemMockRow}>
                <View style={styles.itemIconWrap}>
                  <Feather name="box" size={20} color="#0F766E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemMockName}>Basmati Rice 25kg</Text>
                  <Text style={styles.itemMockSub}>Stock: 50 bag · ₹ 1,200</Text>
                </View>
                <View style={styles.mockAddBtn}>
                  <Text style={styles.mockAddBtnText}>In stock</Text>
                </View>
              </View>

              <View style={styles.itemMockRow}>
                <View style={styles.itemIconWrap}>
                  <Feather name="box" size={20} color="#0F766E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemMockName}>Refined Oil 1L</Text>
                  <Text style={styles.itemMockSub}>Stock: 8 ltr · ₹ 180</Text>
                </View>
                <View style={[styles.mockAddBtn, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.mockAddBtnText, { color: '#92400E' }]}>Low stock</Text>
                </View>
              </View>

              <View style={styles.itemMockRow}>
                <View style={styles.itemIconWrap}>
                  <Feather name="box" size={20} color="#0F766E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemMockName}>Wheat Flour 10kg</Text>
                  <Text style={styles.itemMockSub}>Stock: 30 bag · ₹ 450</Text>
                </View>
                <View style={styles.mockAddBtn}>
                  <Text style={styles.mockAddBtnText}>In stock</Text>
                </View>
              </View>
            </View>
          )}

          {activeSlide === 2 && (
            /* Slide 3 Visual: GST Invoice & WhatsApp Sharing (Matching Vyapar Screenshot 4) */
            <View style={styles.visualCard}>
              <View style={styles.waShareBanner}>
                <Feather name="share-2" size={16} color="#047857" style={{ marginRight: 6 }} />
                <Text style={styles.waShareText}>Share in WhatsApp Instantly</Text>
              </View>

              <View style={styles.invoiceMockCard}>
                <View style={styles.invoiceMockHeader}>
                  <Text style={styles.invoiceMockNo}>TAX INVOICE #INV-001</Text>
                  <Text style={styles.invoiceMockDate}>Today</Text>
                </View>
                <View style={styles.invoiceMockDivider} />
                <View style={styles.invoiceMockRow}>
                  <Text style={styles.invoiceMockItem}>Sharma Retail (Customer)</Text>
                  <Text style={styles.invoiceMockAmt}>₹ 12,000.00</Text>
                </View>
                <View style={styles.invoiceMockRow}>
                  <Text style={styles.invoiceMockGst}>CGST (9%) + SGST (9%) Included</Text>
                  <Text style={styles.invoiceMockPaid}>Paid</Text>
                </View>
              </View>
            </View>
          )}

          {activeSlide === 3 && (
            /* Slide 4 Visual: Payment Reminders (Matching Vyapar Screenshot 5) */
            <View style={styles.visualCard}>
              <View style={styles.reminderMockRow}>
                <View style={styles.avatarMock}>
                  <Text style={styles.avatarMockText}>M</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderName}>Mahesh Patil (Customer)</Text>
                  <Text style={styles.reminderDue}>Due: ₹ 12,000.00</Text>
                </View>
                <View style={styles.remindBtnPill}>
                  <Feather name="bell" size={13} color="#92400E" style={{ marginRight: 4 }} />
                  <Text style={styles.remindBtnText}>REMIND</Text>
                </View>
              </View>

              <View style={styles.reminderMockRow}>
                <View style={styles.avatarMock}>
                  <Text style={styles.avatarMockText}>P</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderName}>Patel Wholesale</Text>
                  <Text style={styles.reminderDue}>Due: ₹ 5,433.00</Text>
                </View>
                <View style={styles.remindBtnPill}>
                  <Feather name="bell" size={13} color="#92400E" style={{ marginRight: 4 }} />
                  <Text style={styles.remindBtnText}>REMIND</Text>
                </View>
              </View>

              <View style={styles.reminderMockRow}>
                <View style={styles.avatarMock}>
                  <Text style={styles.avatarMockText}>S</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderName}>Sharma Stores</Text>
                  <Text style={styles.reminderDue}>Due: ₹ 9,000.00</Text>
                </View>
                <View style={styles.remindBtnPill}>
                  <Feather name="bell" size={13} color="#92400E" style={{ marginRight: 4 }} />
                  <Text style={styles.remindBtnText}>REMIND</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Slide Title & Subtitle */}
        <View style={styles.textSection}>
          <Text style={styles.slideTitle}>{slides[activeSlide].title}</Text>
          <Text style={styles.slideSubtitle}>{slides[activeSlide].subtitle}</Text>
        </View>

        {/* 4 Pagination Dots */}
        <View style={styles.dotsRow}>
          {slides.map((s, idx) => (
            <Pressable
              key={s.id}
              onPress={() => setActiveSlide(idx)}
              style={[
                styles.dot,
                activeSlide === idx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions (Vyapar Style) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.useFreeBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => {
            setLoginMode('otp');
            setLoginModalOpen(true);
          }}
          accessibilityRole="button"
        >
          <Text style={styles.useFreeBtnText}>Use Samruddhi For Free</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </Pressable>

        <View style={styles.bottomLinkRow}>
          <Text style={styles.bottomMuted}>Already have an account? </Text>
          <Pressable
            onPress={() => {
              setLoginMode('otp');
              setLoginModalOpen(true);
            }}
          >
            <Text style={styles.bottomLinkTeal}>Login / Switch</Text>
          </Pressable>
        </View>
      </View>

      {/* Modern 1-Tap Login & Quick Access Bottom Sheet Modal (Vyapar Parity) */}
      <Modal
        visible={loginModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLoginModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheetCard}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header: Logo + "Login to Samruddhi" */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetBrandRow}>
                <View style={styles.sheetLogoBadge}>
                  <Text style={styles.sheetLogoBadgeText}>स</Text>
                </View>
                <View>
                  <Text style={styles.sheetTitle}>Login to Samruddhi</Text>
                  <Text style={styles.sheetSub}>व्यवसायाची प्रगती, आता अधिक सोपी!</Text>
                </View>
              </View>

              <Pressable style={styles.closeBtn} onPress={() => setLoginModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.sheetDivider} />

            {loginMode === 'otp' ? (
              /* Mobile Number + OTP Form (Universal Login for all users) */
              <View style={styles.formContainer}>
                <View style={styles.labelWithDemoRow}>
                  <Text style={styles.inputLabel}>Mobile number</Text>
                  <Pressable
                    style={styles.demoFillChip}
                    onPress={handleDemoFill}
                  >
                    <Feather name="zap" size={12} color="#0F766E" />
                    <Text style={styles.demoFillChipText}>Use Demo: 9876543210</Text>
                  </Pressable>
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.prefixText}>+91</Text>
                  <TextInput
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      setError('');
                    }}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.textInput}
                  />
                </View>

                {otpSent && (
                  <View style={{ marginTop: 14 }}>
                    <View style={styles.labelWithDemoRow}>
                      <Text style={styles.inputLabel}>Enter OTP</Text>
                      <Text style={styles.otpHintText}>Mock OTP: 123456</Text>
                    </View>
                    <View style={styles.inputBox}>
                      <TextInput
                        value={otp}
                        onChangeText={(val) => {
                          setOtp(val);
                          setError('');
                        }}
                        placeholder="Enter 6-digit OTP (123456)"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={6}
                        style={styles.textInput}
                      />
                    </View>
                  </View>
                )}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.continueBtn,
                    (pressed || sending) && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={otpSent ? handleVerifyOtp : handleGetOtp}
                  disabled={sending}
                >
                  <Text style={styles.continueBtnText}>
                    {sending ? 'Please wait...' : otpSent ? 'Verify & Continue' : 'Get OTP'}
                  </Text>
                </Pressable>

                {otpSent && (
                  <Pressable
                    style={{ marginTop: 10, alignItems: 'center' }}
                    onPress={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                  >
                    <Text style={styles.changePhoneText}>Change mobile number</Text>
                  </Pressable>
                )}

                <View style={styles.switchModeRow}>
                  <Pressable onPress={() => setLoginMode('email')}>
                    <Text style={styles.switchModeText}>Login with Email & Password</Text>
                  </Pressable>
                </View>

                <Text style={styles.termsText}>
                  By continuing, you agree to Samruddhi Terms of Service and Privacy Policy.
                </Text>
              </View>
            ) : (
              /* Email + Password Form */
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@business.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                </View>

                <View style={{ marginTop: 14 }}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={styles.continueBtn}
                  onPress={handleEmailLogin}
                >
                  <Text style={styles.continueBtnText}>Login with Email</Text>
                </Pressable>

                <Pressable
                  style={{ marginTop: 14, alignItems: 'center' }}
                  onPress={() => setLoginMode('otp')}
                >
                  <Text style={styles.switchModeText}>← Back to Mobile OTP Login</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mintBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mintBadgeText: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#0F766E',
  },
  brandNameMr: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  brandNameEn: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F766E',
    letterSpacing: 0.8,
  },
  langPillsWrap: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    padding: 2,
    gap: 2,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langPillActive: {
    backgroundColor: '#0F766E',
  },
  langPillText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#475569',
  },
  langPillTextActive: {
    color: '#FFFFFF',
  },

  // Carousel
  carouselContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  visualCardArea: {
    width: '100%',
    maxWidth: 380,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  visualCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  // Slide 1 Mockup
  miniCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  miniCardTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  miniTagLive: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniTagLiveText: {
    color: '#15803D',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiBox: {
    width: '48%',
    padding: 10,
    borderRadius: 10,
  },
  kpiBoxLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  kpiBoxVal: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginTop: 2,
  },
  kpiBoxTrend: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  // Slide 2 Mockup
  itemMockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemMockName: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemMockSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  mockAddBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mockAddBtnText: {
    color: '#15803D',
    fontSize: 11,
    fontFamily: fonts.bold,
  },

  // Slide 3 Mockup
  waShareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  waShareText: {
    color: '#15803D',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  invoiceMockCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invoiceMockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceMockNo: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#0F172A',
  },
  invoiceMockDate: {
    fontSize: 11,
    color: '#64748B',
  },
  invoiceMockDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  invoiceMockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  invoiceMockItem: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: fonts.medium,
  },
  invoiceMockAmt: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#0F766E',
  },
  invoiceMockGst: {
    fontSize: 10,
    color: '#64748B',
  },
  invoiceMockPaid: {
    fontSize: 11,
    color: '#047857',
    fontFamily: fonts.bold,
  },

  // Slide 4 Mockup
  reminderMockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarMock: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarMockText: {
    color: '#0284C7',
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  reminderName: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#0F172A',
  },
  reminderDue: {
    fontSize: 11,
    color: '#B91C1C',
    fontFamily: fonts.medium,
  },
  remindBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  remindBtnText: {
    color: '#92400E',
    fontSize: 10,
    fontFamily: fonts.bold,
  },

  // Slide Texts
  textSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  slideTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 340,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#0F766E',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },

  // Bottom Actions
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  useFreeBtn: {
    width: '100%',
    maxWidth: 420,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0F766E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  useFreeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  bottomLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  bottomMuted: {
    fontSize: 13,
    color: '#64748B',
  },
  bottomLinkTeal: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#0F766E',
  },

  // Bottom Sheet Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sheetLogoBadgeText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0F766E',
    fontWeight: '800',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#0F172A',
  },
  sheetSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },

  labelWithDemoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  demoFillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  demoFillChipText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F766E',
  },
  otpHintText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#0F766E',
  },
  changePhoneText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#0F766E',
    textDecorationLine: 'underline',
  },
  continueBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
  },

  // Form
  formContainer: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  inputBox: {
    height: 46,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  prefixText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#0F172A',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    textAlign: 'center',
  },
  switchModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  switchModeText: {
    fontSize: 13,
    color: '#0F766E',
    fontFamily: fonts.medium,
  },
});
