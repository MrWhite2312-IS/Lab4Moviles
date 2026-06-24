import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

function validate(email: string, password: string) {
  const errors: Record<string, string> = {};
  if (!email.trim()) errors.email = 'El correo es requerido.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Ingresa un correo válido.';
  if (!password) errors.password = 'La contraseña es requerida.';
  return errors;
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const fieldErrors = validate(email, password);
    setErrors(fieldErrors);
    setApiError('');
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Iniciar sesión</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleLogin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        <Link href="/(auth)/register" asChild>
          <Pressable style={styles.linkRow}>
            <Text style={styles.linkText}>¿No tienes cuenta? <Text style={styles.link}>Regístrate</Text></Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8, color: '#111' },
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  inputError: { borderColor: '#e53e3e' },
  errorText: { fontSize: 12, color: '#e53e3e' },
  apiError: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#e53e3e',
    borderRadius: 8,
    padding: 10,
    color: '#c53030',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkRow: { alignItems: 'center', marginTop: 4 },
  linkText: { color: '#555', fontSize: 14 },
  link: { color: '#2563eb', fontWeight: '600' },
});
