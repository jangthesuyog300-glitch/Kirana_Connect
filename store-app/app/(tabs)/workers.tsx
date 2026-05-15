import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { adminAPI } from '../../utils/api';

export default function WorkersScreen() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'store_owner';

  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const canAdd = useMemo(() => name.trim().length >= 2 && phone.replace(/[^0-9]/g, '').length >= 10, [name, phone]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.listWorkers();
      setWorkers(res.data.workers || []);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchWorkers();
  }, [isAdmin]);

  const handleAdd = async () => {
    try {
      const normalizedPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      const res = await adminAPI.addWorker({ name: name.trim(), phone: `+91${normalizedPhone}` });
      setName('');
      setPhone('');
      Alert.alert('Added', `${res.data.worker.name} added`);
      fetchWorkers();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to add worker');
    }
  };

  const handleRemove = async (workerId) => {
    Alert.alert('Remove worker?', 'They will no longer be able to login as staff.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminAPI.removeWorker(workerId);
            fetchWorkers();
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to remove worker');
          }
        },
      },
    ]);
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Workers</Text>
        <Text style={styles.sub}>Only store admin can manage workers.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.title}>Add Worker</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Worker name"
          style={styles.input}
        />
        <TextInput
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9+]/g, ''))}
          placeholder="Phone (10 digits)"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TouchableOpacity style={[styles.btn, !canAdd && styles.btnDisabled]} disabled={!canAdd} onPress={handleAdd}>
          <Text style={styles.btnText}>Add Worker</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.section}>Workers</Text>
        <TouchableOpacity onPress={fetchWorkers}>
          <Text style={styles.link}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.workerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{item.name || 'Worker'}</Text>
                <Text style={styles.workerMeta}>{item.phone} • {item.is_busy ? 'Busy' : 'Free'} • {item.is_active ? 'Active' : 'Removed'}</Text>
              </View>
              {item.is_active ? (
                <TouchableOpacity onPress={() => handleRemove(item.id)}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.sub}>No workers yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  formCard: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 10 },
  sub: { color: '#666', marginTop: 8, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, height: 48, marginTop: 10, backgroundColor: '#fff' },
  btn: { marginTop: 12, backgroundColor: '#ff6b6b', height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  section: { fontSize: 14, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  link: { color: '#ff6b6b', fontWeight: '700' },
  workerCard: { backgroundColor: '#fff', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  workerName: { fontSize: 16, fontWeight: '700', color: '#333' },
  workerMeta: { marginTop: 4, color: '#777', fontSize: 12 },
  remove: { color: '#e74c3c', fontWeight: '700', padding: 8 },
});

