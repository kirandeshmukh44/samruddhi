// app/src/components/TopBar.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, fontSizes } from '../theme';

interface TopBarProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onMenu?: () => void;
}

export default function TopBar({ title, subtitle, right, onMenu }: TopBarProps) {
  return (
    <View style={styles.bar}>
      {onMenu ? (
        <Pressable onPress={onMenu} style={styles.menu}>
          <Text style={{ fontSize: fontSizes.xl }}>☰</Text>
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menu: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.text },
  sub: { fontSize: fontSizes.sm, color: colors.muted },
});
