// app/src/components/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, fontSizes } from '../theme';

type Tone = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';

const toneColor: Record<Tone, string> = {
  success: colors.success,
  danger: colors.danger,
  warning: colors.accent,
  neutral: colors.muted,
  primary: colors.primary,
};

export default function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.badge, { backgroundColor: toneColor[tone] + '22' }]}>
      <Text style={[styles.text, { color: toneColor[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill },
  text: { fontSize: fontSizes.xs, fontWeight: '600' },
});
