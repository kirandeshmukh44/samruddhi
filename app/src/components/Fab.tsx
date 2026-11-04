// app/src/components/Fab.tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fontSizes, fonts, shadows } from '../theme';

interface FabProps {
  label: string;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
}

export default function Fab({ label, onPress, icon = 'plus' }: FabProps) {
  return (
    <Pressable style={styles.fab} onPress={onPress} accessibilityRole="button">
      {icon && <Feather name={icon} size={20} color={colors.text} style={{ marginRight: 6 }} />}
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.accent, // #F59E0B
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  text: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
});
