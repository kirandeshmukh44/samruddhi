// app/src/screens/CreateBusinessScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES } from '../data/states';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { colors, spacing, fontSizes } from '../theme';

export default function CreateBusinessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { addBusiness } = useAuth();
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState(INDIAN_STATES[0]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const submit = async () => {
    if (!name) return;
    await addBusiness({ name, gstin, state, address, phone });
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your business</Text>
      <View style={styles.card}>
        <Input label="Business name" value={name} onChangeText={setName} />
        <Input label="GSTIN" value={gstin} onChangeText={setGstin} />
        <Select label="State" value={state} options={INDIAN_STATES.map((s) => ({ label: s, value: s }))} onChange={setState} />
        <Input label="Address" value={address} onChangeText={setAddress} multiline />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button title="Create business" onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: fontSizes.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  card: { width: '100%', maxWidth: 520, backgroundColor: colors.white, padding: spacing.xl, borderRadius: 14 },
});
