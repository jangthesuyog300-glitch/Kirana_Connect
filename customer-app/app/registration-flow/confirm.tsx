import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegistrationStore } from '../../store/registrationStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConfirmScreen() {
  const router = useRouter();
  const { customerName, mobileNumber, location } = useRegistrationStore();

  const handleConfirmOrder = () => {
    // In a real app, this is where we'd submit to a backend.
    router.push('/registration-flow/success');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Confirmation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.illustrationContainer}>
          <View style={styles.circleBg}>
            <Ionicons name="document-text" size={48} color="#ff6b6b" />
          </View>
          <Text style={styles.pageTitle}>Review Your Details</Text>
          <Text style={styles.pageSubtitle}>Almost there! Please verify your information.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color="#ff6b6b" />
            <Text style={styles.cardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => router.push('/registration-flow')} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{customerName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile</Text>
            <Text style={styles.infoValue}>+91 {mobileNumber || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color="#ff6b6b" />
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <Text style={styles.addressText}>{location?.address || 'No address selected'}</Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmOrder}>
          <Text style={styles.primaryBtnText}>Confirm Order</Text>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 8 },
  scrollContent: { padding: 24 },
  illustrationContainer: { alignItems: 'center', marginBottom: 32 },
  circleBg: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#ffe5e5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: '#666' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8, flex: 1 },
  editBtn: { paddingVertical: 4, paddingHorizontal: 12, backgroundColor: '#f0f0f0', borderRadius: 12 },
  editBtnText: { fontSize: 12, color: '#666', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  addressText: { fontSize: 14, color: '#333', lineHeight: 22, fontWeight: '500' },
  footer: { padding: 24, paddingTop: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  primaryBtn: { 
    backgroundColor: '#ff6b6b', 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 8,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
