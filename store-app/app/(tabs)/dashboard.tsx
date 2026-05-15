import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { reportsAPI, orderMgmtAPI } from '../../utils/api';
import { getSocket } from '../../utils/socket';

const safeUpper = (value, fallback = 'UNKNOWN') =>
  typeof value === 'string' && value.length > 0 ? value.toUpperCase() : fallback;

const safeOrderCode = (id) =>
  typeof id === 'string' && id.length > 0 ? id.split('-')[0].toUpperCase() : 'N/A';

export default function DashboardScreen() {
  const { storeData } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (storeData?.id) {
      fetchDashboardData();
    }
  }, [storeData]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('order:new', () => {
        fetchDashboardData();
      });
      socket.on('order:status_update', () => {
        fetchDashboardData();
      });
    }
    return () => {
      if (socket) {
        socket.off('order:new');
        socket.off('order:status_update');
      }
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const [reportRes, orderRes] = await Promise.all([
        reportsAPI.getMonthly(storeData.id, currentMonth),
        orderMgmtAPI.getOrders()
      ]);
      
      setSummary(reportRes.data.summary);
      setTopItems(reportRes.data.top_items || []);
      setRecentOrders(orderRes.data.orders.slice(0, 5)); // Last 5 orders
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!storeData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>No store registered yet.</Text>
        <TouchableOpacity 
          style={styles.registerBtn} 
          onPress={() => router.push('/auth/register-store')}
        >
          <Text style={styles.registerBtnText}>Register Your Store</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.storeName}>{storeData.name}</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.dot, { backgroundColor: storeData.is_open ? '#2ecc71' : '#e74c3c' }]} />
          <Text style={styles.statusText}>{storeData.is_open ? 'Open' : 'Closed'}</Text>
        </View>
      </View>

      {/* Summary Cards */}
      <Text style={styles.sectionTitle}>This Month</Text>
      {loading ? (
        <ActivityIndicator color="#ff6b6b" />
      ) : summary ? (
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Ionicons name="cash-outline" size={24} color="#ff6b6b" />
            <Text style={styles.cardValue}>₹{summary.total_revenue}</Text>
            <Text style={styles.cardLabel}>Revenue</Text>
          </View>
          <View style={styles.card}>
            <Ionicons name="receipt-outline" size={24} color="#3498db" />
            <Text style={styles.cardValue}>{summary.total_orders}</Text>
            <Text style={styles.cardLabel}>Orders</Text>
          </View>
          <View style={styles.card}>
            <Ionicons name="wallet-outline" size={24} color="#2ecc71" />
            <Text style={styles.cardValue}>₹{summary.net_earnings}</Text>
            <Text style={styles.cardLabel}>Earnings</Text>
          </View>
        </View>
      ) : null}

      {/* Top Items */}
      {topItems.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topItemsScroll}>
            {topItems.map((item, idx) => (
              <View key={idx} style={styles.topItemCard}>
                <View style={styles.topItemRank}>
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                </View>
                <Text style={styles.topItemName} numberOfLines={1}>{item.item_name}</Text>
                <Text style={styles.topItemQty}>{item.total_qty} units sold</Text>
                <Text style={styles.topItemRevenue}>₹{item.total_revenue}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Orders */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {recentOrders.map(order => (
        <TouchableOpacity 
          key={order.id} 
          style={styles.orderItem}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>Order #{safeOrderCode(order.id)}</Text>
            <Text style={styles.orderTime}>{new Date(order.created_at).toLocaleTimeString()}</Text>
          </View>
          <View style={styles.orderTotal}>
            <Text style={styles.amount}>₹{order.total_amount}</Text>
            <Text style={[styles.status, order.status === 'placed' && { color: '#e74c3c', fontWeight: 'bold' }]}>
              {safeUpper(order.status, 'PLACED')}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {recentOrders.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  header: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  storeName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 15, justifyContent: 'space-between' },
  card: { flex: 1, backgroundColor: '#fff', marginHorizontal: 5, padding: 15, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardValue: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10 },
  cardLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  seeAll: { color: '#ff6b6b', fontWeight: 'bold' },
  orderItem: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10, padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  orderTime: { fontSize: 12, color: '#999', marginTop: 4 },
  orderTotal: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  status: { fontSize: 10, color: '#666', marginTop: 4 },
  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#999' },
  topItemsScroll: { paddingHorizontal: 15, paddingBottom: 10 },
  topItemCard: { backgroundColor: '#fff', width: 140, padding: 15, borderRadius: 12, marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  topItemRank: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff5f5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  rankText: { fontSize: 10, fontWeight: 'bold', color: '#ff6b6b' },
  topItemName: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 10 },
  topItemQty: { fontSize: 12, color: '#666', marginTop: 4 },
  topItemRevenue: { fontSize: 13, fontWeight: 'bold', color: '#2ecc71', marginTop: 8 },
  registerBtn: {
    marginTop: 20,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  registerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
