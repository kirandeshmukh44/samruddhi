// app/src/components/Modal.tsx
import React from 'react';
import { Modal as RNModal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radii, fontSizes } from '../theme';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function AppModal({ visible, onClose, title, children }: AppModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={{ color: colors.muted, fontSize: fontSizes.lg }}>✕</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.text },
  close: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
});
