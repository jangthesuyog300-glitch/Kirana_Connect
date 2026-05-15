import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#ccc" />
        </View>
        <Text style={styles.name}>{user?.name || 'Customer'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="heart-outline" size={24} color="#333" style={styles.menuIcon} />
          <Text style={styles.menuText}>Favourite Stores</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="location-outline" size={24} color="#333" style={styles.menuIcon} />
          <Text style={styles.menuText}>Saved Addresses</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color="#333" style={styles.menuIcon} />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  phone: { fontSize: 16, color: '#666', marginTop: 5 },
  section: { backgroundColor: '#fff', marginTop: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  menuIcon: { marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginTop: 20, padding: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  logoutText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});
