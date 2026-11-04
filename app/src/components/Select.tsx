// app/src/components/Select.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radii, fontSizes, fonts, shadows } from '../theme';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export default function Select({ label, value, options, onChange, placeholder, style }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.field} onPress={() => setOpen(true)} accessibilityRole="combobox">
        <Text
          style={[styles.valueText, !selected && styles.placeholderText]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder || 'Select'}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Feather name="check" size={16} color={colors.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  field: {
    minHeight: 46,
    height: 46,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  valueText: {
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  placeholderText: {
    color: colors.muted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    maxHeight: '70%',
    padding: spacing.sm,
    ...shadows.card,
  },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  optionSelected: {
    backgroundColor: '#F0FDFA',
  },
  optionText: {
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
});
