// app/src/components/AppHeader.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { fonts, colors } from '../theme';
import { setLanguage, supportedLanguages } from '../i18n';

export interface AppHeaderProps {
  variant?: 'full' | 'compact';
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
}

export default function AppHeader({
  variant = 'compact',
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
  children,
}: AppHeaderProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { currentBusiness, businesses, switchBusiness } = useAuth();

  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);

  const businessName = currentBusiness?.name || 'Gupta Traders';

  const cycleLang = async () => {
    const next = i18n.language === 'en' ? 'hi' : i18n.language === 'hi' ? 'mr' : 'en';
    await setLanguage(next);
  };

  const currentLangLabel =
    i18n.language === 'hi' ? 'हिं' : i18n.language === 'mr' ? 'मरा' : 'EN';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // On desktop (>=900px), sidebar top has wordmark and top bar has search/switcher/avatar
  // If desktop page has title/action, render desktop title bar
  if (isDesktop) {
    if (!title && !children) return null;
    return (
      <View style={styles.desktopTitleRow}>
        <View style={styles.desktopTitleLeft}>
          {showBack && (
            <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
              <Feather name="arrow-left" size={22} color="#0F172A" />
            </Pressable>
          )}
          <View>
            {title ? <Text style={styles.desktopTitleText} numberOfLines={1}>{title}</Text> : null}
            {subtitle ? <Text style={styles.desktopSubtitleText}>{subtitle}</Text> : null}
          </View>
        </View>
        {rightAction ? <View style={styles.actionWrap}>{rightAction}</View> : null}
        {children}
      </View>
    );
  }

  // Mobile (< 900px): Blue (#1D4ED8) band extending behind status bar
  return (
    <View style={styles.mobileHeaderWrapper}>
      <StatusBar style="light" />

      {/* Blue Top Band */}
      <View
        style={[
          styles.blueBand,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + 4,
            paddingBottom: variant === 'full' ? 20 : 12,
          },
        ]}
      >
        {/* Top Row: B-Mark (44x44 white rounded box) + Business switcher chip + 44x44 white language button */}
        <View style={styles.topRow}>
          {/* B-mark Logo in 44x44 white rounded box */}
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>

          {/* Business Switcher Chip with glassmorphism & micro-interaction */}
          <Pressable
            style={({ pressed }) => [
              styles.businessChip,
              pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => setBusinessModalOpen(true)}
            accessibilityRole="button"
          >
            <Text style={styles.businessChipText} numberOfLines={1}>
              {businessName}
            </Text>
            <Feather name="chevron-down" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </Pressable>

          {/* 44x44 White Language Button with micro-interaction */}
          <Pressable
            style={({ pressed }) => [
              styles.langBtn,
              pressed && { opacity: 0.88, transform: [{ scale: 0.95 }] },
            ]}
            onPress={cycleLang}
            onLongPress={() => setLangModalOpen(true)}
            accessibilityRole="button"
          >
            <Text style={styles.langBtnText}>{currentLangLabel}</Text>
          </Pressable>
        </View>

        {/* If variant="full", render full-band content (e.g. Today's sale block) */}
        {variant === 'full' && children ? (
          <View style={styles.fullVariantContent}>{children}</View>
        ) : null}
      </View>

      {/* If variant="compact" and has title or actions: Title row on #F4F6FA */}
      {variant === 'compact' && (title || rightAction) ? (
        <View style={styles.titleRow}>
          <View style={styles.titleLeftGroup}>
            {showBack && (
              <Pressable
                onPress={handleBack}
                style={styles.backBtn}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Feather name="arrow-left" size={22} color="#0F172A" />
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.mobileTitleText} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.mobileSubtitleText} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>

          {rightAction ? <View style={styles.actionWrap}>{rightAction}</View> : null}
        </View>
      ) : null}

      {/* Business Switcher Modal Sheet */}
      <Modal
        visible={businessModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBusinessModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('common.switchBusiness', 'Switch Business')}</Text>
              <Pressable
                onPress={() => setBusinessModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 260 }}>
              {businesses.map((biz) => {
                const selected = biz.id === currentBusiness?.id;
                return (
                  <Pressable
                    key={biz.id}
                    style={[styles.modalOption, selected && styles.modalOptionActive]}
                    onPress={async () => {
                      await switchBusiness(biz.id);
                      setBusinessModalOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalOptionText, selected && styles.modalOptionTextActive]}>
                        {biz.name}
                      </Text>
                      {biz.gstin ? (
                        <Text style={styles.modalOptionSub}>GSTIN: {biz.gstin}</Text>
                      ) : null}
                    </View>
                    {selected ? <Feather name="check" size={18} color="#1D4ED8" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Switcher Modal */}
      <Modal
        visible={langModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('common.language', 'Choose Language')}</Text>
              <Pressable
                onPress={() => setLangModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            {supportedLanguages.map((l) => (
              <Pressable
                key={l.code}
                style={[
                  styles.modalOption,
                  i18n.language === l.code && styles.modalOptionActive,
                ]}
                onPress={async () => {
                  await setLanguage(l.code);
                  setLangModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    i18n.language === l.code && styles.modalOptionTextActive,
                  ]}
                >
                  {l.label}
                </Text>
                {i18n.language === l.code && (
                  <Feather name="check" size={18} color="#1D4ED8" />
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
  mobileHeaderWrapper: {
    width: '100%',
    zIndex: 100,
    backgroundColor: '#1D4ED8',
  },
  blueBand: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    padding: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  logoImg: {
    width: 32,
    height: 32,
  },
  businessChip: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 8,
  },
  businessChipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  langBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  langBtnText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  fullVariantContent: {
    marginTop: 14,
  },
  titleRow: {
    backgroundColor: '#F4F6FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleLeftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
  },
  mobileTitleText: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  mobileSubtitleText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  actionWrap: {
    flexShrink: 0,
  },
  desktopTitleRow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  desktopTitleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopPageTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#0F172A',
  },
  desktopTitleText: {
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#0F172A',
  },
  desktopSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  desktopBackBtn: {
    padding: 8,
    marginRight: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: '#334155',
  },
  modalOptionTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  modalOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
