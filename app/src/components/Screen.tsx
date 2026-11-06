// app/src/components/Screen.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import AppHeader, { AppHeaderProps } from './AppHeader';

export interface ScreenProps {
  children: React.ReactNode;
  headerVariant?: 'full' | 'compact';
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  headerChildren?: React.ReactNode;
  scrollable?: boolean;
  noHeader?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
  noPadding?: boolean;
}

export default function Screen({
  children,
  headerVariant = 'compact',
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
  headerChildren,
  scrollable = true,
  noHeader = false,
  contentContainerStyle,
  style,
  keyboardAvoiding = true,
  noPadding = false,
}: ScreenProps) {
  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        !noPadding && styles.horizontalPadding,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, !noPadding && styles.horizontalPadding, style]}>
      {children}
    </View>
  );

  const body = (
    <View style={[styles.root, style]}>
      {!noHeader && (
        <AppHeader
          variant={headerVariant}
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          onBack={onBack}
          rightAction={rightAction}
        >
          {headerChildren}
        </AppHeader>
      )}
      <View style={styles.bodyArea}>{content}</View>
    </View>
  );

  if (keyboardAvoiding && Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardRoot}>
        {body}
      </KeyboardAvoidingView>
    );
  }

  return body;
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  bodyArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 40,
  },
  staticContent: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 24,
  },
  horizontalPadding: {
    paddingHorizontal: 20,
  },
});

