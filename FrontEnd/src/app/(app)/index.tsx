import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
  };

  if (!user) return null;

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.memberSince}>Miembro desde {user.memberSince}</Text>

        <View style={styles.card}>
          <InfoRow label="Correo" value={user.email} />
          <InfoRow label="Usuario" value={user.username} />
          <InfoRow label="Nombre" value={user.firstName} />
          <InfoRow label="Apellido" value={user.lastName} />
          <InfoRow
            label="Foto de perfil"
            value={user.profilePhotoLocked ? 'Bloqueada' : user.profilePhotoUrl ?? 'Sin foto'}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          onPress={handleLogout}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.logoutText}>Cerrar sesión</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { flex: 1, alignItems: 'center', padding: 24, gap: 10 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 4,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '700', color: '#111' },
  username: { fontSize: 15, color: '#2563eb' },
  memberSince: { fontSize: 13, color: '#888', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#111', fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  logoutButton: {
    marginTop: 16,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  pressed: { opacity: 0.8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
