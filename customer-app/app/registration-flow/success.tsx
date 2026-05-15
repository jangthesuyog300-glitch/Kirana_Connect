import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegistrationStore } from '../../store/registrationStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuccessScreen() {
  const router = useRouter();
  const { customerName, mobileNumber, clearRegistration } = useRegistrationStore();

  const scaleValue = new Animated.Value(0);
  const opacityValue = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleGoHome = () => {
    clearRegistration();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleValue }] }]}>
          <Ionicons name="checkmark-circle" size={100} color="#4cd137" />
        </Animated.View>
        
        <Animated.Text style={[styles.title, { opacity: opacityValue }]}>
          Order Confirmed Successfully
        </Animated.Text>
        
        <Animated.View style={[styles.detailsCard, { opacity: opacityValue }]}>
          <Text style={styles.detailsTitle}>Order Details</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{customerName || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mobile Number:</Text>
            <Text style={styles.value}>+91 {mobileNumber || 'N/A'}</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleGoHome}>
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconContainer: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 40 },
  detailsCard: { 
    width: '100%', 
    backgroundColor: '#f9f9f9', 
    borderRadius: 16, 
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee'
  },
  detailsTitle: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 15, color: '#888' },
  value: { fontSize: 15, color: '#333', fontWeight: 'bold' },
  footer: { padding: 24, paddingBottom: 32 },
  primaryBtn: { 
    backgroundColor: '#333', 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
