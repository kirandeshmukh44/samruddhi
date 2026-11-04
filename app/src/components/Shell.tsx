// app/src/components/Shell.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii, fontSizes, fonts, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { setLanguage, supportedLanguages } from '../i18n';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: FeatherIconName;
}

const DESKTOP_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', icon: 'home' },
  { key: 'sale', label: 'Sale invoices', path: '/sale', icon: 'file-text' },
  { key: 'purchase', label: 'Purchase bills', path: '/purchase', icon: 'shopping-cart' },
  { key: 'parties', label: 'Parties', path: '/parties', icon: 'users' },
  { key: 'items', label: 'Items & stock', path: '/items', icon: 'package' },
  { key: 'payments', label: 'Payments', path: '/payments', icon: 'credit-card' },
  { key: 'reports', label: 'Reports', path: '/reports', icon: 'bar-chart-2' },
];

const SETTINGS_NAV_ITEM: NavItem = {
  key: 'settings',
  label: 'Settings',
  path: '/settings',
  icon: 'settings',
};

const MOBILE_TABS: NavItem[] = [
  { key: 'dashboard', label: 'Home', path: '/', icon: 'home' },
  { key: 'parties', label: 'Parties', path: '/parties', icon: 'users' },
  { key: 'items', label: 'Items', path: '/items', icon: 'package' },
  { key: 'more', label: 'More', path: '/settings', icon: 'more-horizontal' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { currentBusiness, businesses, switchBusiness, user } = useAuth();

  const [businessPickerVisible, setBusinessPickerVisible] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentBusinessName = currentBusiness?.name || 'Gupta Traders';

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const isTabActive = (item: NavItem) => {
    if (item.key === 'more') {
      return (
        pathname === '/settings' ||
        pathname === '/reports' ||
        pathname === '/payments' ||
        pathname === '/purchase'
      );
    }
    if (item.path === '/') return pathname === '/';
    return pathname.startsWith(item.path);
  };

  const handleLanguageChange = async (code: string) => {
    await setLanguage(code);
    setLangPickerVisible(false);
  };

  const currentLangLabel =
    i18n.language === 'hi'
      ? 'हिन्दी'
      : i18n.language === 'mr'
      ? 'मराठी'
      : 'English';

  const avatarInitial = (user?.name || currentBusinessName || 'G').charAt(0).toUpperCase();

  if (isWide) {
    return (
      <View style={styles.wideRoot}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          {/* Business switcher button */}
          <Pressable
            style={styles.businessSwitcher}
            onPress={() => setBusinessPickerVisible(true)}
            accessibilityRole="button"
          >
            <Text style={styles.businessSwitcherText} numberOfLines={1}>
              {currentBusinessName} ▾
            </Text>
          </Pressable>

          {/* Navigation Links */}
          <ScrollView
            style={styles.sidebarNavScroll}
            contentContainerStyle={styles.sidebarNavContent}
            showsVerticalScrollIndicator={false}
          >
            {DESKTOP_NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <Pressable
                  key={item.key}
                  onPress={() => router.push(item.path as any)}
                  style={[styles.sidebarItem, active && styles.sidebarItemActive]}
                  accessibilityRole="button"
                >
                  <Feather
                    name={item.icon}
                    size={20}
                    color={active ? colors.white : '#CBD5E1'}
                  />
                  <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Settings pinned to bottom */}
          <View style={styles.sidebarBottom}>
            <Pressable
              onPress={() => router.push(SETTINGS_NAV_ITEM.path as any)}
              style={[styles.sidebarItem, isActive(SETTINGS_NAV_ITEM.path) && styles.sidebarItemActive]}
              accessibilityRole="button"
            >
              <Feather
                name={SETTINGS_NAV_ITEM.icon}
                size={20}
                color={isActive(SETTINGS_NAV_ITEM.path) ? colors.white : '#CBD5E1'}
              />
              <Text
                style={[
                  styles.sidebarLabel,
                  isActive(SETTINGS_NAV_ITEM.path) && styles.sidebarLabelActive,
                ]}
              >
                {SETTINGS_NAV_ITEM.label}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Right Main Column */}
        <View style={styles.wideMainCol}>
          {/* Top Bar */}
          <View style={styles.desktopTopBar}>
            {/* Search Input (360px wide) */}
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color={colors.muted} style={{ marginRight: spacing.sm }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search invoices, parties, items"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
            </View>

            {/* Right: Language selector + Avatar */}
            <View style={styles.desktopTopRight}>
              <Pressable
                style={styles.langSelectorBtn}
                onPress={() => setLangPickerVisible(true)}
                accessibilityRole="button"
              >
                <Text style={styles.langSelectorText}>{currentLangLabel}</Text>
                <Feather name="chevron-down" size={16} color={colors.text} style={{ marginLeft: 6 }} />
              </Pressable>

              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              </View>
            </View>
          </View>

          {/* Main content area */}
          <View style={styles.wideContentArea}>
            {children}
          </View>
        </View>

        {/* Business Selector Modal */}
        <Modal
          visible={businessPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setBusinessPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Switch Business</Text>
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

        {/* Language Selector Modal */}
        <Modal
          visible={langPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLangPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Choose Language</Text>
                <Pressable
                  onPress={() => setLangPickerVisible(false)}
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
                  onPress={() => handleLanguageChange(l.code)}
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

  // Mobile Shell (< 900px)
  // Dynamic top padding to clear iPhone notch / Dynamic Island and Android status bar
  const topPadding = pathname === '/' ? 0 : Math.max(insets.top, 16);
  // Dynamic bottom padding to clear Android soft navigation buttons and iPhone home indicator
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View style={styles.mobileRoot}>
      {/* Content Area with safe top inset for non-dashboard pages */}
      <View style={[styles.mobileContentArea, { paddingTop: topPadding }]}>
        {children}
      </View>

      {/* Bottom Tab Bar with safe bottom inset */}
      <View
        style={[
          styles.mobileTabBar,
          {
            paddingBottom: bottomPadding,
            minHeight: 56 + bottomPadding,
          },
        ]}
      >
        {MOBILE_TABS.map((tab) => {
          const active = isTabActive(tab);
          return (
            <Pressable
              key={tab.key}
              onPress={() => router.push(tab.path as any)}
              style={styles.mobileTabItem}
              accessibilityRole="tab"
            >
              <Feather
                name={tab.icon}
                size={22}
                color={active ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.mobileTabLabel,
                  active ? styles.mobileTabLabelActive : styles.mobileTabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Desktop wide layout
  wideRoot: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    backgroundColor: colors.bg,
  },
  sidebar: {
    width: 240,
    backgroundColor: colors.sidebar, // #0B3B38
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  businessSwitcher: {
    minHeight: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  businessSwitcherText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  sidebarNavScroll: {
    flex: 1,
  },
  sidebarNavContent: {
    gap: 4,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  sidebarItemActive: {
    backgroundColor: colors.primary, // #0F766E
  },
  sidebarLabel: {
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
    color: '#CBD5E1',
  },
  sidebarLabelActive: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  sidebarBottom: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Desktop Main Column
  wideMainCol: {
    flex: 1,
    height: '100%',
    backgroundColor: colors.bg,
  },
  desktopTopBar: {
    minHeight: 64,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    width: 360,
    minHeight: 44,
    height: 44,
    backgroundColor: colors.bg,
    borderRadius: radii.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
    padding: 0,
    outlineStyle: 'none' as any,
  },
  desktopTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  langSelectorBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  langSelectorText: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  wideContentArea: {
    flex: 1,
    height: '100%',
    backgroundColor: colors.bg,
  },
  wideContentScroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  wideContentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 32,
  },

  // Mobile layout
  mobileRoot: {
    flex: 1,
    height: '100%',
    backgroundColor: colors.bg,
  },
  mobileContentArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  mobileTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    alignItems: 'center',
  },
  mobileTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 3,
  },
  mobileTabLabel: {
    fontSize: 12,
  },
  mobileTabLabelActive: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  mobileTabLabelInactive: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontWeight: '400',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  modalOptionActive: {
    backgroundColor: '#F0FDFA',
  },
  modalOptionText: {
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  modalOptionTextActive: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
});
