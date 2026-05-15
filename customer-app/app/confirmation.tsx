import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { orderId, storeName } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={60} color="#fff" />
        </View>
        
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>Your order #{orderId?.slice(0, 8).toUpperCase()} has been sent to {storeName || 'the store'}.</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={20} color="#666" />
            <Text style={styles.infoText}>The store will accept your order shortly.</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="notifications-outline" size={20} color="#666" />
            <Text style={styles.infoText}>We'll notify you when it's ready for pickup.</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.trackBtn}
          onPress={() => router.replace('/(tabs)/orders')}
        >
          <Text style={styles.trackBtnText}>Track Order Status</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={styles.homeBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 20 },
  content: { alignItems: 'center' },
  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2ecc71', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  infoCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 20, width: '100%', marginBottom: 40 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { marginLeft: 15, fontSize: 14, color: '#444', flex: 1 },
  trackBtn: { backgroundColor: '#ff6b6b', width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  trackBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  homeBtn: { width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  homeBtnText: { color: '#666', fontSize: 16, fontWeight: '500' },
});
