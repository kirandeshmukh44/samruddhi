// app/src/components/Input.tsx
import React from 'react';
import { TextInput, StyleSheet, View, Text, ViewStyle, TextStyle, KeyboardTypeOptions } from 'react-native';
import { colors, spacing, radii, fontSizes, fonts } from '../theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  editable?: boolean;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  style,
  inputStyle,
  prefix,
  suffix,
  editable = true,
}: InputProps) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.container, multiline && styles.multilineContainer]}>
        {prefix}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
          style={[styles.input, inputStyle]}
        />
        {suffix}
      </View>
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
  container: {
    minHeight: 46,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.input,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  multilineContainer: {
    height: 'auto',
    minHeight: 80,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
    padding: 0,
    minHeight: 44,
  },
});
