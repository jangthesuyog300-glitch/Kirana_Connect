import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ordersAPI } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { useAuthStore } from '../../store/authStore';

const safeUpper = (value, fallback = 'UNKNOWN') =>
  typeof value === 'string' && value.length > 0 ? value.toUpperCase() : fallback;

const safeOrderCode = (id) =>
  typeof id === 'string' && id.length > 0 ? id.split('-')[0].toUpperCase() : 'N/A';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    orders.forEach(o => socket.emit('join_order', o.id));

    const handleStatusUpdate = (data) => {
      setOrders(prevOrders =>
        prevOrders.map(o => o.id === data.order_id ? { ...o, status: data.status, prep_time_minutes: data.prep_time_minutes } : o)
      );
      if (data.status === 'ready') {
        Alert.alert(
          '🛍️ Order Ready!',
          'Your order is ready. If pickup, show your OTP to collect.',
          [{ text: 'OK' }]
        );
      }
      if (data.status === 'collected' || data.status === 'delivered') {
        Alert.alert('✅ Order Delivered', 'Your order has been successfully delivered.');
      }
    };

    const handleAccepted = (data) => {
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === data.order_id
            ? {
                ...o,
                status: 'accepted',
                prep_time_minutes: data.prep_time_minutes,
                otp_code: data.otp_code,
                otp_expiry: data.otp_expiry,
                accepted_by_name: data.accepted_by_name,
                accepted_by_phone: data.accepted_by_phone,
              }
            : o
        )
      );
      Alert.alert('✅ Order Accepted', 'Show this OTP at the store to collect your order.');
    };

    socket.on('order:status_update', handleStatusUpdate);
    socket.on('order:accepted', handleAccepted);

    return () => {
      socket.off('order:status_update', handleStatusUpdate);
      socket.off('order:accepted', handleAccepted);
    };
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersAPI.getMyOrders();
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'placed': return '#3498db';
      case 'accepted': return '#9b59b6';
      case 'preparing': return '#e67e22';
      case 'ready': return '#f1c40f';
      case 'dispatched': return '#34495e';
      case 'delivered': 
      case 'collected': return '#2ecc71';
      case 'rejected':
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{item.store_name}</Text>
          <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
        <Text style={styles.orderTotal}>₹{item.total_amount}</Text>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.orderId}>Order #{safeOrderCode(item.id)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{safeUpper(item.status, 'PLACED')}</Text>
        </View>
      </View>

      {item.accepted_by_name && ['accepted', 'preparing', 'ready', 'dispatched'].includes(item.status) && (
        <Text style={styles.acceptedBy}>
          Accepted by: {item.accepted_by_name}{item.accepted_by_phone ? ` (${item.accepted_by_phone})` : ''}
        </Text>
      )}
      
      {/* Status Timeline */}
      <View style={styles.timelineContainer}>
        {(item.delivery_type === 'pickup' 
          ? ['placed', 'accepted', 'preparing', 'ready', 'collected']
          : ['placed', 'accepted', 'preparing', 'dispatched', 'delivered']
        ).map((step, idx) => {
          const statusOrder = item.delivery_type === 'pickup' 
            ? ['placed', 'accepted', 'preparing', 'ready', 'collected']
            : ['placed', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered'];
          const isCompleted = statusOrder.indexOf(item.status) >= statusOrder.indexOf(step);
          const isCurrent = item.status === step;
          
          return (
            <View key={step} style={styles.timelineStep}>
              <View style={[styles.timelineDot, isCompleted && styles.dotCompleted, isCurrent && styles.dotCurrent]} />
              <Text style={[styles.timelineLabel, isCompleted && styles.labelCompleted]}>{step.charAt(0).toUpperCase() + step.slice(1)}</Text>
              {idx < 4 && <View style={[styles.timelineLine, isCompleted && styles.lineCompleted]} />}
            </View>
          );
        })}
      </View>

      {['accepted', 'preparing', 'ready', 'dispatched'].includes(item.status) && item.otp_code && (
        <View style={styles.otpContainer}>
          <Text style={styles.otpLabel}>{item.delivery_type === 'pickup' ? 'Pickup OTP:' : 'Delivery OTP:'}</Text>
          <Text style={styles.otpValue}>{item.otp_code}</Text>
          <Text style={styles.otpHint}>
            {item.delivery_type === 'pickup' 
              ? 'Share this OTP with store owner at pickup'
              : 'Share this OTP with delivery agent'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ff6b6b" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No orders placed yet</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchOrders}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  list: { padding: 15 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 10, marginBottom: 10 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderDate: { fontSize: 12, color: '#999', marginTop: 4 },
  orderTotal: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 13, color: '#666' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  acceptedBy: { marginTop: 8, fontSize: 12, color: '#555' },
  otpContainer: { marginTop: 15, backgroundColor: '#e8f8f5', padding: 10, borderRadius: 8, alignItems: 'center' },
  otpLabel: { fontSize: 14, color: '#1abc9c', marginRight: 10 },
  otpValue: { fontSize: 18, fontWeight: 'bold' , color: '#1abc9c', letterSpacing: 2 },
  otpHint: { marginTop: 6, fontSize: 12, color: '#16a085' },
  itemsList: { marginTop: 10, borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 10, marginBottom: 15 },
  itemText: { fontSize: 13, color: '#666', marginBottom: 2 },
  timelineContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 5, borderTopWidth: 1, borderColor: '#eee' },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ddd', marginBottom: 8, zIndex: 1 },
  dotCompleted: { backgroundColor: '#2ecc71' },
  dotCurrent: { backgroundColor: '#ff6b6b', transform: [{ scale: 1.3 }] },
  timelineLabel: { fontSize: 9, color: '#999', fontWeight: '500' },
  labelCompleted: { color: '#333', fontWeight: 'bold' },
  timelineLine: { position: 'absolute', top: 5, left: '60%', width: '80%', height: 2, backgroundColor: '#eee', zIndex: 0 },
  lineCompleted: { backgroundColor: '#2ecc71' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 15 }
});
