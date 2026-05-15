import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { storeMgmtAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function RegisterStoreScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  
  const { setStoreData } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocating(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied. You can enter coordinates manually.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to get current location.');
    } finally {
      setLocating(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !address || !location) {
      Alert.alert('Error', 'Please fill in name, address and set location.');
      return;
    }

    try {
      setLoading(true);
      const res = await storeMgmtAPI.createStore({
        name,
        description,
        address,
        phone,
        lat: location.lat,
        lng: location.lng
      });

      if (res.data.success) {
        setStoreData(res.data.store);
        Alert.alert('Success', 'Store registered successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/dashboard') }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to register store.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Register Your Store</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Store Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ramesh General Store"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell customers about your store..."
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Full Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Street, Area, Landmark, City..."
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Store Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Store Location (GPS) *</Text>
          <View style={styles.locationContainer}>
            {locating ? (
              <ActivityIndicator color="#ff6b6b" />
            ) : location ? (
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color="#2ecc71" />
                <Text style={styles.locationText}>
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </Text>
              </View>
            ) : (
              <Text style={styles.locationPending}>Location not set</Text>
            )}
            <TouchableOpacity style={styles.locationBtn} onPress={getCurrentLocation}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.locationBtnText}>Update</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Make sure you are at your store location when registering.</Text>

          <TouchableOpacity 
            style={[styles.submitBtn, (loading || locating) && styles.submitBtnDisabled]} 
            onPress={handleRegister}
            disabled={loading || locating}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Create Store</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingBottom: 40 },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginTop: 5 },
  locationInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: 8, fontSize: 14, color: '#333' },
  locationPending: { flex: 1, fontSize: 14, color: '#999', fontStyle: 'italic' },
  locationBtn: { backgroundColor: '#3498db', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  locationBtnText: { color: '#fff', marginLeft: 4, fontWeight: 'bold', fontSize: 12 },
  hint: { fontSize: 12, color: '#999', marginTop: 8, fontStyle: 'italic' },
  submitBtn: { backgroundColor: '#ff6b6b', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  submitBtnDisabled: { backgroundColor: '#ffb3b3' },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
