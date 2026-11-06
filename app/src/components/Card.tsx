// app/src/components/Card.tsx
// Upgraded with premium translucent Glassmorphism styling and smooth ambient shadows.

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { colors, radii, shadows, glass } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'glass' | 'solid' | 'glow' | 'accent';
}

export default function Card({ children, style, variant = 'glass' }: CardProps) {
  const variantStyle =
    variant === 'solid'
      ? styles.cardSolid
      : variant === 'glow'
      ? styles.cardGlow
      : variant === 'accent'
      ? styles.cardAccent
      : styles.cardGlass;

  return (
    <View style={[styles.base, variantStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  cardGlass: {
    backgroundColor: glass.cardBg,
    borderWidth: 1,
    borderColor: glass.cardBorder,
    ...shadows.glassCard,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  cardSolid: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardGlow: {
    backgroundColor: glass.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    ...shadows.royalGlow,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  cardAccent: {
    backgroundColor: glass.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(29, 78, 216, 0.30)',
    ...shadows.glassCard,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
});
