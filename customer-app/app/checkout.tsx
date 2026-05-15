import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/cartStore';
import { ordersAPI } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutScreen() {
  const router = useRouter();
  const { storeId, items, getCartTotal, clearCart } = useCartStore();
  
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' | 'pickup'
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi'
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = getCartTotal();
  const deliveryFee = deliveryType === 'delivery' ? 20 : 0;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (deliveryType === 'delivery' && (!address || address.length < 10)) {
      Alert.alert('Address Required', 'Please enter a complete delivery address.');
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        store_id: storeId,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? address : null,
        payment_method: paymentMethod,
        notes: notes,
        items: items.map(i => ({
          item_id: i.item.id,
          quantity: i.quantity
        }))
      };

      const response = await ordersAPI.placeOrder(orderData);
      
      if (response.data.success) {
        clearCart();
        router.replace({
          pathname: '/confirmation',
          params: { 
            orderId: response.data.order.id,
            storeName: response.data.order.store_name || 'Ramesh General Store' // Fallback for demo
          }
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Your cart is empty.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Delivery Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fulfillment Method</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.optionCard, deliveryType === 'delivery' && styles.optionCardActive]}
              onPress={() => setDeliveryType('delivery')}
            >
              <Ionicons name="bicycle" size={24} color={deliveryType === 'delivery' ? '#ff6b6b' : '#666'} />
              <Text style={[styles.optionText, deliveryType === 'delivery' && styles.optionTextActive]}>Delivery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionCard, deliveryType === 'pickup' && styles.optionCardActive]}
              onPress={() => setDeliveryType('pickup')}
            >
              <Ionicons name="walk" size={24} color={deliveryType === 'pickup' ? '#ff6b6b' : '#666'} />
              <Text style={[styles.optionText, deliveryType === 'pickup' && styles.optionTextActive]}>Self Pickup</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address Input for Delivery */}
        {deliveryType === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter complete address..."
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        )}

        {/* Payment Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentList}>
            <TouchableOpacity 
              style={styles.paymentItem}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={styles.radio}>
                {paymentMethod === 'cash' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.paymentText}>Cash on {deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.paymentItem}
              onPress={() => setPaymentMethod('upi')}
            >
              <View style={styles.radio}>
                {paymentMethod === 'upi' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.paymentText}>Pay Online (UPI / Card)</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>FAST</Text></View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., Please ring the bell."
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Bill Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.billRow, styles.billTotalRow]}>
            <Text style={styles.billTotalLabel}>To Pay</Text>
            <Text style={styles.billTotalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Place Order Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeBtn, loading && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeBtnText}>Place Order • ₹{total.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 15, paddingBottom: 100 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  optionCard: { flex: 0.48, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 15, alignItems: 'center', backgroundColor: '#fafafa' },
  optionCardActive: { borderColor: '#ff6b6b', backgroundColor: '#fff5f5' },
  optionText: { marginTop: 10, fontSize: 14, color: '#666', fontWeight: '500' },
  optionTextActive: { color: '#ff6b6b', fontWeight: 'bold' },
  textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15 },
  paymentList: { },
  paymentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff6b6b' },
  paymentText: { fontSize: 15, color: '#333', flex: 1 },
  badge: { backgroundColor: '#e8f8f5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { color: '#1abc9c', fontSize: 10, fontWeight: 'bold' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, color: '#666' },
  billValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  billTotalRow: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 10, marginTop: 5 },
  billTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  billTotalValue: { fontSize: 16, fontWeight: 'bold', color: '#ff6b6b' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#eee' },
  placeBtn: { backgroundColor: '#ff6b6b', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  placeBtnDisabled: { backgroundColor: '#ffb3b3' },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#e74c3c' }
});
