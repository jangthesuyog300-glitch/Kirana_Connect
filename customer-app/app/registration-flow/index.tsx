import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegistrationStore } from '../../store/registrationStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegistrationScreen() {
  const router = useRouter();
  const setCustomerDetails = useRegistrationStore((state) => state.setCustomerDetails);
  
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [errors, setErrors] = useState({ name: '', mobile: '' });

  const validateAndProceed = () => {
    let isValid = true;
    let newErrors = { name: '', mobile: '' };

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
      isValid = false;
    } else if (name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
      isValid = false;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
      isValid = false;
    } else if (!mobileRegex.test(mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setCustomerDetails(name.trim(), mobile.trim());
      router.push('/registration-flow/map');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to Kirana!</Text>
            <Text style={styles.welcomeSubtitle}>Please enter your details to register and get your daily groceries delivered.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputContainer, errors.name ? styles.inputError : null]}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({...errors, name: ''});
                  }}
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={[styles.inputContainer, errors.mobile ? styles.inputError : null]}>
                <Text style={styles.prefix}>+91</Text>
                <View style={styles.divider} />
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  keyboardType="numeric"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(text) => {
                    setMobile(text.replace(/[^0-9]/g, ''));
                    if (errors.mobile) setErrors({...errors, mobile: ''});
                  }}
                />
              </View>
              {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
            </View>
          </View>

        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={validateAndProceed}>
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 16 },
  welcomeSection: { marginBottom: 32 },
  welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 16, color: '#666', lineHeight: 24 },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#333' },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    height: 56,
    backgroundColor: '#f9f9f9'
  },
  inputError: { borderColor: '#ff4757', backgroundColor: '#fff5f6' },
  inputIcon: { marginRight: 12 },
  prefix: { fontSize: 16, fontWeight: '600', color: '#333' },
  divider: { width: 1, height: 24, backgroundColor: '#e0e0e0', marginHorizontal: 12 },
  input: { flex: 1, fontSize: 16, color: '#333', height: '100%' },
  errorText: { color: '#ff4757', fontSize: 12, marginTop: 4 },
  footer: { padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
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
