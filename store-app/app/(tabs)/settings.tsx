import { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { storeMgmtAPI } from '../../utils/api';

export default function SettingsScreen() {
  const { storeData, setStoreData, logout } = useAuthStore();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(storeData?.is_open || false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(storeData?.delivery_enabled || false);

  const toggleStoreStatus = async () => {
    try {
      const newVal = !isOpen;
      setIsOpen(newVal);
      const res = await storeMgmtAPI.updateStore(storeData.id, { is_open: newVal });
      setStoreData(res.data.store);
    } catch (err) {
      setIsOpen(!isOpen);
      Alert.alert('Error', 'Failed to update store status');
    }
  };

  const toggleDelivery = async () => {
    try {
      const newVal = !deliveryEnabled;
      setDeliveryEnabled(newVal);
      const res = await storeMgmtAPI.updateStore(storeData.id, { delivery_enabled: newVal });
      setStoreData(res.data.store);
    } catch (err) {
      setDeliveryEnabled(!deliveryEnabled);
      Alert.alert('Error', 'Failed to update delivery settings');
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  if (!storeData) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Store Profile Profile */}
      <View style={styles.profileSection}>
        <View style={styles.storeIcon}>
          <Ionicons name="storefront" size={40} color="#ff6b6b" />
        </View>
        <Text style={styles.storeName}>{storeData.name}</Text>
        <Text style={styles.address}>{storeData.address}</Text>
      </View>

      <Text style={styles.sectionTitle}>Operations</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Ionicons name="power" size={24} color={isOpen ? "#2ecc71" : "#e74c3c"} />
            <Text style={styles.rowText}>Store Open/Closed</Text>
          </View>
          <Switch 
            value={isOpen} 
            onValueChange={toggleStoreStatus}
            trackColor={{ false: '#ddd', true: '#a8e6cf' }}
            thumbColor={isOpen ? '#2ecc71' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.rowInfo}>
            <Ionicons name="bicycle" size={24} color="#3498db" />
            <Text style={styles.rowText}>Accepting Deliveries</Text>
          </View>
          <Switch 
            value={deliveryEnabled} 
            onValueChange={toggleDelivery}
            trackColor={{ false: '#ddd', true: '#a8e6cf' }}
            thumbColor={deliveryEnabled ? '#3498db' : '#f4f3f4'}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row}>
          <View style={styles.rowInfo}>
            <Ionicons name="person-outline" size={24} color="#666" />
            <Text style={styles.rowText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.row}>
          <View style={styles.rowInfo}>
            <Ionicons name="call-outline" size={24} color="#666" />
            <Text style={styles.rowText}>Support Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleLogout}>
          <View style={styles.rowInfo}>
            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
            <Text style={[styles.rowText, { color: '#e74c3c' }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  profileSection: { backgroundColor: '#fff', padding: 30, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  storeIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffeaea', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  storeName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  address: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center', paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', marginHorizontal: 20, marginTop: 30, marginBottom: 10 },
  section: { backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee', marginLeft: 15 },
  rowInfo: { flexDirection: 'row', alignItems: 'center' },
  rowText: { fontSize: 16, color: '#333', marginLeft: 15 }
});
