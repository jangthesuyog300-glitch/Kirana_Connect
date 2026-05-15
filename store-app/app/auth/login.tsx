import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI } from '../../utils/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const normalizedPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      if (normalizedPhone.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
      const formattedPhone = `+91${normalizedPhone}`;
      await authAPI.sendOTP(formattedPhone);
      
      router.push({ pathname: '/auth/otp', params: { phone: formattedPhone } });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
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
        <Text style={styles.title}>Welcome to Kirana Connect</Text>
        <Text style={styles.subtitle}>Enter your phone number to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '');
              // Supports paste like +919999000001 by retaining the last 10 digits.
              const localNumber = digits.length > 10 ? digits.slice(-10) : digits;
              setPhone(localNumber);
              setError('');
            }}
            maxLength={10}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.button, (!phone || phone.length < 10 || loading) && styles.buttonDisabled]} 
          onPress={handleSendOTP}
          disabled={!phone || phone.length < 10 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
    marginBottom: 20,
  },
  prefix: {
    fontSize: 18,
    color: '#333',
    marginRight: 10,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#333',
  },
  button: {
    backgroundColor: '#ff6b6b',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ffb3b3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 10,
    fontSize: 14,
  }
});
