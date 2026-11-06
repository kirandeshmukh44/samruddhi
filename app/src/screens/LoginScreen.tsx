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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../theme';
import { setLanguage } from '../i18n';
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from '../config';

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { signInWithOtp, signInWithEmail } = useAuth();

  const [loginMode, setLoginMode] = useState<'otp' | 'email'>('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const setLang = async (code: string) => {
    await setLanguage(code);
  };

  const handleDemoFill = () => {
    setPhone('9876543210');
    setOtp('123456');
    setError('');
    setOtpSent(true);
  };

  const handleGetOtp = () => {
    if (!phone || phone.trim().length < 10) {
      setError(
        i18n.language === 'mr'
          ? 'कृपया वैध १०-अंकी मोबाईल नंबर टाका'
          : i18n.language === 'hi'
          ? 'कृपया वैध 10-अंकों का मोबाइल नंबर दर्ज करें'
          : 'Please enter a valid 10-digit mobile number'
      );
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
      router.replace('/');
    } else {
      setError(
        i18n.language === 'mr'
          ? 'अवैध OTP (डेमो कोड: 123456)'
          : i18n.language === 'hi'
          ? 'अमान्य OTP (डेमो कोड: 123456)'
          : 'Invalid OTP (Mock code is 123456)'
      );
    }
  };

  const handleEmailLogin = async () => {
    if (!email) {
      setError(i18n.language === 'mr' ? 'कृपया ईमेल पत्ता टाका' : 'Please enter email address');
      return;
    }
    const ok = await signInWithEmail(email, password || 'password');
    if (ok) {
      router.replace('/');
    } else {
      setError(i18n.language === 'mr' ? 'अवैध ईमेल किंवा पासवर्ड' : 'Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardRoot}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: Language Switcher */}
        <View style={styles.topBar}>
          <View />
          <View style={styles.langPillsWrap}>
            {(['en', 'hi', 'mr'] as const).map((lang) => {
              const active = i18n.language === lang;
              const label = lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'मरा';
              return (
                <Pressable
                  key={lang}
                  style={[styles.langPill, active && styles.langPillActive]}
                  onPress={() => setLang(lang)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.langPillText, active && styles.langPillTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Centered Hero: Badge (120x120), Title, Subtitle */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/images/bilu-badge.png')}
            style={styles.heroBadge}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Welcome to {APP_NAME}</Text>
          <Text style={styles.heroSubtitle}>{APP_TAGLINE}</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {loginMode === 'otp' ? (
            <View style={styles.form}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>{t('login.phoneLabel', 'Mobile Number')}</Text>
                <Pressable style={styles.demoChip} onPress={handleDemoFill}>
                  <Feather name="zap" size={12} color="#1D4ED8" />
                  <Text style={styles.demoChipText}>Demo: 9876543210</Text>
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
                  placeholder={t('login.phonePlaceholder', 'Enter 10-digit mobile number')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.textInput}
                />
              </View>

              {otpSent && (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>{t('login.otpLabel', 'Enter OTP')}</Text>
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
                  styles.primaryBtn,
                  (pressed || sending) && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
                onPress={otpSent ? handleVerifyOtp : handleGetOtp}
                disabled={sending}
              >
                <Text style={styles.primaryBtnText}>
                  {sending
                    ? t('common.loading', 'Please wait...')
                    : otpSent
                    ? t('login.verifyAndContinue', 'Verify & Continue')
                    : t('login.getOtp', 'Get OTP')}
                </Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </Pressable>

              {otpSent && (
                <Pressable
                  style={{ marginTop: 10, alignSelf: 'center' }}
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                >
                  <Text style={styles.linkText}>Change mobile number</Text>
                </Pressable>
              )}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={styles.secondaryBtn}
                onPress={() => {
                  setLoginMode('email');
                  setError('');
                }}
              >
                <Feather name="mail" size={16} color="#1D4ED8" style={{ marginRight: 8 }} />
                <Text style={styles.secondaryBtnText}>Login with Email & Password</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setError('');
                  }}
                  placeholder="admin@biluerp.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Password</Text>
              <View style={styles.inputBox}>
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setError('');
                  }}
                  placeholder="Enter password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  style={styles.textInput}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleEmailLogin}
              >
                <Text style={styles.primaryBtnText}>Login with Email</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </Pressable>

              <Pressable
                style={{ marginTop: 14, alignSelf: 'center' }}
                onPress={() => {
                  setLoginMode('otp');
                  setError('');
                }}
              >
                <Text style={styles.linkText}>← Back to Mobile OTP Login</Text>
              </Pressable>
            </View>
          )}

          {/* Quick Demo Fill One-Tap Action */}
          <Pressable
            style={styles.quickDemoBar}
            onPress={async () => {
              await signInWithOtp('9876543210', '123456');
              router.replace('/');
            }}
          >
            <Feather name="check-circle" size={16} color="#047857" />
            <Text style={styles.quickDemoText}>Instant 1-Click Demo Login (Sharma General Stores)</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Powered by {COMPANY_NAME}</Text>
          <Text style={styles.subFooterText}>
            {APP_NAME} v1.0.0 · GST Billing & Complete Inventory ERP
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  langPillsWrap: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langPillActive: {
    backgroundColor: '#1D4ED8',
  },
  langPillText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#475569',
  },
  langPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroBadge: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  form: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#334155',
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  demoChipText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  inputBox: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
  },
  prefixText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: '#0F172A',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  otpHintText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#1D4ED8',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    textAlign: 'center',
  },
  primaryBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontFamily: fonts.medium,
    textDecorationLine: 'underline',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fonts.medium,
  },
  quickDemoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  quickDemoText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#15803D',
    fontWeight: '600',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#475569',
    fontWeight: '600',
  },
  subFooterText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#94A3B8',
    marginTop: 4,
  },
});
