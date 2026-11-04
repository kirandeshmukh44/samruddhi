// app/src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors, spacing, fontSizes } from '../theme';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    // Mock: just go to login
    router.replace('/login' as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Create account</Text>
      <View style={styles.card}>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Mobile" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Button title="Register" onPress={submit} />
        <Pressable onPress={() => router.replace('/login' as any)} style={{ marginTop: spacing.lg }}>
          <Text style={styles.link}>Already have account? Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  brand: { fontSize: 30, fontWeight: '800', color: colors.primary, marginBottom: spacing.xl },
  card: { width: '100%', maxWidth: 420, backgroundColor: colors.white, padding: spacing.xl, borderRadius: 14 },
  link: { color: colors.primary, textAlign: 'center', fontWeight: '600' },
});
