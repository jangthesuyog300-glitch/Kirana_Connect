import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleVerify = async () => {
    if (otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await authAPI.verifyOTP(phone as string, otp, name || undefined);
      
      if (response.data.success) {
        setAuth(response.data.user, response.data.token);
        // GlobalStateProvider will fetch store data and redirect to register-store if needed
        router.replace('/(tabs)/dashboard');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Store Owner Login</Text>
        <Text style={styles.subtitle}>Enter the code sent to {phone}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP (1234 for dev)"
          keyboardType="number-pad"
          value={otp}
          onChangeText={(text) => {
            setOtp(text.replace(/[^0-9]/g, ''));
            setError('');
          }}
          maxLength={6}
        />

        <TextInput
          style={[styles.input, { marginTop: 15 }]}
          placeholder="Owner Name (Optional)"
          value={name}
          onChangeText={setName}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.button, (!otp || otp.length < 4 || loading) && styles.buttonDisabled]} 
          onPress={handleVerify}
          disabled={!otp || otp.length < 4 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify & Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 15, height: 56, fontSize: 18, color: '#333' },
  button: { backgroundColor: '#ff6b6b', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  buttonDisabled: { backgroundColor: '#ffb3b3' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#e74c3c', marginTop: 10, fontSize: 14 }
});
