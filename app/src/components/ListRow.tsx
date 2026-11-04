// app/src/components/ListRow.tsx
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSizes } from '../theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

export default function ListRow({ title, subtitle, right, onPress }: ListRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.md, color: colors.text, fontWeight: '500' },
  sub: { fontSize: fontSizes.sm, color: colors.muted, marginTop: 2 },
});
