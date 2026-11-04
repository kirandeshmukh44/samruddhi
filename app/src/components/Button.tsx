// app/src/components/Button.tsx
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, radii, fontSizes, fonts } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({ title, onPress, variant = 'primary', disabled, style, textStyle, icon }: ButtonProps) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';

  const bg =
    isOutline || isGhost ? 'transparent' :
    isDanger ? colors.danger :
    isSecondary ? colors.accent :
    colors.primary;

  const color =
    isOutline ? colors.primary :
    isGhost ? colors.primary :
    isSecondary ? colors.text :
    colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: pressed || disabled ? 0.7 : 1 },
        isOutline && styles.outline,
        style,
      ]}
      accessibilityRole="button"
    >
      {icon}
      <Text style={[styles.text, { color }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  text: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
});
