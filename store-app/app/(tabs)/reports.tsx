import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { reportsAPI } from '../../utils/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios'; // We will use raw axios for file download

const API_URL = 'http://localhost:4000';

export default function ReportsScreen() {
  const { storeData, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    if (storeData?.id) {
      fetchReport();
    }
  }, [storeData, month]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getMonthly(storeData.id, month);
      setSummary(res.data.summary);
      setTopItems(res.data.top_items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const url = `${API_URL}/reports/export?store_id=${storeData.id}&month=${month}&format=${format}`;
      const fileUri = `${FileSystem.documentDirectory}report_${month}.${format}`;

      const { uri } = await FileSystem.downloadAsync(url, fileUri, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', `File downloaded to: ${uri}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to download report');
    }
  };

  if (loading && !summary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings & Reports</Text>
        <Text style={styles.month}>{new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
      </View>

      {summary && (
        <>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
                <Text style={styles.summaryValue}>₹{summary.total_revenue}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Orders</Text>
                <Text style={styles.summaryValue}>{summary.total_orders}</Text>
              </View>
            </View>
            
            <View style={styles.summaryRow}>
              <View style={[styles.summaryBox, { backgroundColor: '#fff5f5' }]}>
                <Text style={styles.summaryLabel}>Comm. (2%)</Text>
                <Text style={[styles.summaryValue, { color: '#e74c3c' }]}>- ₹{summary.total_commission}</Text>
              </View>
              <View style={[styles.summaryBox, { backgroundColor: '#e8f8f5' }]}>
                <Text style={styles.summaryLabel}>Net Earnings</Text>
                <Text style={[styles.summaryValue, { color: '#2ecc71' }]}>₹{summary.net_earnings}</Text>
              </View>
            </View>
          </View>

          <View style={styles.paymentSplit}>
            <Text style={styles.sectionTitle}>Payment Split</Text>
            <View style={styles.splitRow}>
              <View style={styles.splitBar}>
                <View style={[styles.splitFill, { flex: summary.online_revenue, backgroundColor: '#3498db' }]} />
                <View style={[styles.splitFill, { flex: summary.cash_revenue, backgroundColor: '#f1c40f' }]} />
              </View>
              <View style={styles.splitLegend}>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#3498db' }]} /><Text style={styles.legendText}>Online (₹{summary.online_revenue})</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#f1c40f' }]} /><Text style={styles.legendText}>Cash (₹{summary.cash_revenue})</Text></View>
              </View>
            </View>
          </View>

          <View style={styles.topItems}>
            <Text style={styles.sectionTitle}>Top Selling Items</Text>
            {topItems.map((item, idx) => (
              <View key={idx} style={styles.topItemRow}>
                <Text style={styles.topItemRank}>#{idx + 1}</Text>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.item_name}</Text>
                  <Text style={styles.topItemCategory}>{item.category}</Text>
                </View>
                <View style={styles.topItemStats}>
                  <Text style={styles.topItemRevenue}>₹{item.total_revenue}</Text>
                  <Text style={styles.topItemQty}>{item.total_qty} sold</Text>
                </View>
              </View>
            ))}
            {topItems.length === 0 && <Text style={styles.emptyText}>No sales data available yet.</Text>}
          </View>

          <View style={styles.exportSection}>
            <Text style={styles.sectionTitle}>Export Report</Text>
            <View style={styles.exportBtns}>
              <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('pdf')}>
                <Ionicons name="document-text" size={24} color="#e74c3c" />
                <Text style={styles.exportBtnText}>Download PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.exportBtn, { marginLeft: 10 }]} onPress={() => handleExport('csv')}>
                <Ionicons name="grid" size={24} color="#2ecc71" />
                <Text style={styles.exportBtnText}>Download CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  month: { fontSize: 16, color: '#ff6b6b', marginTop: 5, fontWeight: 'bold' },
  summaryContainer: { padding: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryBox: { flex: 0.48, backgroundColor: '#fff', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  summaryLabel: { fontSize: 13, color: '#666', marginBottom: 5 },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  paymentSplit: { backgroundColor: '#fff', padding: 20, marginTop: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  splitRow: { marginTop: 10 },
  splitBar: { height: 12, flexDirection: 'row', borderRadius: 6, overflow: 'hidden' },
  splitFill: { height: '100%' },
  splitLegend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 12, color: '#666' },
  topItems: { backgroundColor: '#fff', padding: 20, marginTop: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  topItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  topItemRank: { fontSize: 16, fontWeight: 'bold', color: '#ccc', width: 30 },
  topItemInfo: { flex: 1 },
  topItemName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  topItemCategory: { fontSize: 12, color: '#999' },
  topItemStats: { alignItems: 'flex-end' },
  topItemRevenue: { fontSize: 15, fontWeight: 'bold', color: '#2ecc71' },
  topItemQty: { fontSize: 12, color: '#666' },
  exportSection: { padding: 20, marginBottom: 30 },
  exportBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  exportBtn: { flex: 1, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  exportBtnText: { marginLeft: 10, fontWeight: 'bold', color: '#333' },
  emptyText: { color: '#999', fontStyle: 'italic' }
});
