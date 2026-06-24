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
import { useAuth, type RegisterData } from '@/context/AuthContext';

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.firstName.trim()) errors.firstName = 'El nombre es requerido.';
  if (!form.lastName.trim()) errors.lastName = 'El apellido es requerido.';

  if (!form.username.trim()) {
    errors.username = 'El usuario es requerido.';
  } else if (!/^[a-zA-Z0-9_]{3,50}$/.test(form.username)) {
    errors.username = 'Entre 3 y 50 caracteres alfanuméricos o guión bajo.';
  }

  if (!form.email.trim()) {
    errors.email = 'El correo es requerido.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingresa un correo válido.';
  }

  if (!form.password) {
    errors.password = 'La contraseña es requerida.';
  } else if (form.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña.';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof FormState) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    setApiError('');
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const payload: RegisterData = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      };
      await signUp(payload);
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    key: keyof FormState,
    props?: React.ComponentProps<typeof TextInput>
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[key] && styles.inputError]}
        value={form[key]}
        onChangeText={set(key)}
        {...props}
      />
      {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>

        <View style={styles.row}>
          {field('Nombre', 'firstName', { placeholder: 'Juan', autoCapitalize: 'words' })}
          {field('Apellido', 'lastName', { placeholder: 'Pérez', autoCapitalize: 'words' })}
        </View>

        {field('Nombre de usuario', 'username', {
          placeholder: 'juan_perez',
          autoCapitalize: 'none',
          autoComplete: 'username',
        })}

        {field('Correo electrónico', 'email', {
          placeholder: 'correo@ejemplo.com',
          autoCapitalize: 'none',
          keyboardType: 'email-address',
          autoComplete: 'email',
        })}

        {field('Contraseña', 'password', {
          placeholder: '••••••••',
          secureTextEntry: true,
          autoComplete: 'new-password',
        })}

        {field('Confirmar contraseña', 'confirmPassword', {
          placeholder: '••••••••',
          secureTextEntry: true,
          autoComplete: 'new-password',
        })}

        {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleRegister}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.linkRow}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.link}>Inicia sesión</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4, color: '#111' },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 4 },
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
    marginTop: 4,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkRow: { alignItems: 'center', marginTop: 4 },
  linkText: { color: '#555', fontSize: 14 },
  link: { color: '#2563eb', fontWeight: '600' },
});
