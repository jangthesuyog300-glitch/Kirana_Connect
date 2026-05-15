import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderMgmtAPI, workerAPI } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { useAuthStore } from '../../store/authStore';

const safeUpper = (value, fallback = 'UNKNOWN') =>
  typeof value === 'string' && value.length > 0 ? value.toUpperCase() : fallback;

const safeOrderCode = (id) =>
  typeof id === 'string' && id.length > 0 ? id.split('-')[0].toUpperCase() : 'N/A';

export default function OrdersManagementScreen() {
  const { user } = useAuthStore();
  const isWorker = user?.role === 'worker';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [prepModalVisible, setPrepModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [prepTimeInput, setPrepTimeInput] = useState('15');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewOrder = (order) => {
      setOrders(prev => [order, ...prev]);
      // Sound alert for new orders (browser beep)
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
        oscillator.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
      } catch (e) {
        console.log('Audio alert failed', e);
      }

      Alert.alert(
        '🔔 New Order Received!',
        `From: ${order.customer_name || 'Customer'}\nTotal: ₹${order.total_amount}`,
        [{ text: 'Check Details', onPress: fetchOrders }]
      );
    };

    const handleStatusUpdate = (data) => {
      setOrders(prev => prev.map(o => o.id === data.order_id ? { ...o, status: data.status } : o));
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:status_update', handleStatusUpdate);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status_update', handleStatusUpdate);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      if (isWorker) {
        const res = await workerAPI.getOrders();
        setOrders(res.data.orders);
      } else {
        const res = await orderMgmtAPI.getOrders();
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, prepTime = null) => {
    try {
      if (isWorker) {
        await workerAPI.updateStatus(id, status, prepTime);
      } else {
        await orderMgmtAPI.updateStatus(id, status, prepTime);
      }
      fetchOrders();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update order');
    }
  };

  const acceptOrder = async (id, prepTime) => {
    try {
      if (isWorker) {
        await workerAPI.acceptOrder(id, prepTime);
      } else {
        await orderMgmtAPI.acceptOrder(id, prepTime);
      }
      fetchOrders();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleVerifyOTP = async () => {
    try {
      await orderMgmtAPI.verifyOTP(selectedOrder.id, otpInput);
      setOtpModalVisible(false);
      setOtpInput('');
      Alert.alert('Success', 'Order marked as successfully delivered.');
      fetchOrders();
    } catch (err) {
      Alert.alert('Invalid OTP', 'The entered OTP is incorrect.');
    }
  };

  const renderActionButtons = (order) => {
    if (order.status === 'placed') {
      return (
        <View style={styles.actionRow}>
          {!isWorker && (
            <TouchableOpacity 
              style={[styles.btn, styles.btnReject]}
              onPress={() => updateStatus(order.id, 'rejected')}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.btn, styles.btnAccept]}
            onPress={() => {
              setSelectedOrder(order);
              setPrepModalVisible(true);
            }}
          >
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (order.status === 'accepted') {
      return (
        <TouchableOpacity 
          style={[styles.btn, styles.btnPrimary, { marginTop: 10 }]}
          onPress={() => updateStatus(order.id, 'preparing', parseInt(prepTimeInput))}
        >
          <Text style={styles.btnText}>Start Preparing</Text>
        </TouchableOpacity>
      );
    }

    if (order.status === 'preparing') {
      return (
        <TouchableOpacity 
          style={[styles.btn, styles.btnSuccess, { marginTop: 10 }]}
          onPress={() => updateStatus(order.id, 'ready')}
        >
          <Text style={styles.btnText}>
            {order.delivery_type === 'pickup' ? 'Ready for Pickup' : 'Ready for Delivery'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (order.status === 'ready') {
      if (order.delivery_type === 'pickup') {
        return !isWorker ? (
          <TouchableOpacity 
            style={[styles.btn, styles.btnPrimary, { marginTop: 10 }]}
            onPress={() => {
              setSelectedOrder(order);
              setOtpModalVisible(true);
            }}
          >
            <Text style={styles.btnText}>Enter OTP to Complete Pickup</Text>
          </TouchableOpacity>
        ) : null;
      } else {
        return (
          <TouchableOpacity 
            style={[styles.btn, styles.btnPrimary, { marginTop: 10 }]}
            onPress={() => updateStatus(order.id, 'dispatched')}
          >
            <Text style={styles.btnText}>Mark as Dispatched</Text>
          </TouchableOpacity>
        );
      }
    }

    if (order.status === 'dispatched' && order.delivery_type === 'delivery') {
      return (
        <TouchableOpacity 
          style={[styles.btn, styles.btnSuccess, { marginTop: 10 }]}
          onPress={() => {
            setSelectedOrder(order);
            setOtpModalVisible(true);
          }}
        >
          <Text style={styles.btnText}>Enter OTP to Complete Delivery</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.header}>
        <View>
          <Text style={styles.customerName}>{item.customer_name || 'Customer'} • {item.customer_phone || 'N/A'}</Text>
          <Text style={styles.orderId}>Order #{safeOrderCode(item.id)}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{safeUpper(item.delivery_type, 'PICKUP')}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.amount}>₹{item.total_amount ?? 0}</Text>
        <Text style={styles.status}>{safeUpper(item.status, 'PLACED')}</Text>
      </View>
      
      {/* Items list */}
      <View style={styles.itemsList}>
        {item.items && item.items.map((oi, idx) => (
          <Text key={idx} style={styles.itemText}>
            • {oi.item_name} x {oi.unit === 'kg' ? `${(oi.quantity/1000).toFixed(1)}kg` : `${oi.quantity}${oi.unit}`}
          </Text>
        ))}
      </View>

      {renderActionButtons(item)}
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
          refreshing={loading}
          onRefresh={fetchOrders}
        />
      )}

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Verify {selectedOrder?.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'} OTP
            </Text>
            <Text style={styles.modalSubtitle}>Ask customer for 6-digit code</Text>
            
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={6}
              value={otpInput}
              onChangeText={(text) => setOtpInput(text.replace(/[^0-9]/g, ''))}
              placeholder="000000"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setOtpModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalVerify, otpInput.length !== 6 && { opacity: 0.5 }]} 
                onPress={handleVerifyOTP}
                disabled={otpInput.length !== 6}
              >
                <Text style={styles.verifyText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Prep Time Modal */}
      <Modal visible={prepModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Preparation Time</Text>
            <Text style={styles.modalSubtitle}>How long will it take?</Text>
            
            <View style={styles.prepOptions}>
              {['10', '20', '30', '45'].map(time => (
                <TouchableOpacity 
                  key={time}
                  style={[styles.prepPill, prepTimeInput === time && styles.prepPillActive]}
                  onPress={() => setPrepTimeInput(time)}
                >
                  <Text style={[styles.prepPillText, prepTimeInput === time && styles.prepPillTextActive]}>{time}m</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPrepModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalVerify} 
                onPress={() => {
                  acceptOrder(selectedOrder.id, parseInt(prepTimeInput));
                  setPrepModalVisible(false);
                }}
              >
                <Text style={styles.verifyText}>Confirm Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  list: { padding: 15 },
  orderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderId: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: { backgroundColor: '#e8f8f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#1abc9c', fontSize: 10, fontWeight: 'bold' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  status: { fontSize: 14, fontWeight: 'bold', color: '#ff6b6b' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnReject: { backgroundColor: '#f5f5f5', marginRight: 5 },
  btnAccept: { backgroundColor: '#ff6b6b', marginLeft: 5 },
  btnPrimary: { backgroundColor: '#3498db' },
  btnSuccess: { backgroundColor: '#2ecc71' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  otpInput: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, textAlign: 'center', fontSize: 24, letterSpacing: 5, marginBottom: 20 },
  modalActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalCancel: { flex: 1, padding: 15, alignItems: 'center' },
  cancelText: { color: '#666', fontSize: 16 },
  modalVerify: { flex: 1, backgroundColor: '#2ecc71', padding: 15, borderRadius: 8, alignItems: 'center' },
  verifyText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  itemsList: { marginTop: 10, paddingBottom: 10 },
  itemText: { fontSize: 13, color: '#666', marginBottom: 2 },
  prepOptions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 25 },
  prepPill: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0' },
  prepPillActive: { backgroundColor: '#ff6b6b' },
  prepPillText: { color: '#666', fontWeight: 'bold' },
  prepPillTextActive: { color: '#fff' },
});
