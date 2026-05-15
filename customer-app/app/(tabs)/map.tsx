import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { storesAPI } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await storesAPI.getNearby(12.9716, 77.5946, 10);
      setStores(response.data.stores);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Simulated Map Background */}
      <View style={styles.mapMock}>
        <View style={styles.gridLineV} />
        <View style={[styles.gridLineV, { left: '40%' }]} />
        <View style={[styles.gridLineV, { left: '70%' }]} />
        <View style={styles.gridLineH} />
        <View style={[styles.gridLineH, { top: '30%' }]} />
        <View style={[styles.gridLineH, { top: '60%' }]} />
        
        {/* Simulated Store Markers */}
        {stores.map((store, index) => {
          // Deterministic random positions based on ID
          const seed = store.id.length * (index + 1);
          const top = `${(seed * 13) % 70 + 10}%`;
          const left = `${(seed * 7) % 80 + 5}%`;
          
          return (
            <TouchableOpacity 
              key={store.id}
              style={[styles.markerContainer, { top, left }]}
              onPress={() => setSelectedStore(store)}
            >
              <View style={[styles.marker, selectedStore?.id === store.id && styles.markerActive]}>
                <Ionicons name="storefront" size={20} color="#fff" />
              </View>
              <View style={styles.markerPointer} />
            </TouchableOpacity>
          );
        })}

        {/* User Location Marker */}
        <View style={styles.userMarker}>
          <View style={styles.userMarkerInner} />
        </View>
      </View>

      {/* Selected Store Card Overlay */}
      {selectedStore && (
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.closeBtn} 
            onPress={() => setSelectedStore(null)}
          >
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.storeCard}
            onPress={() => router.push(`/store/${selectedStore.id}`)}
          >
            <Image source={{ uri: selectedStore.image_url || 'https://via.placeholder.com/100' }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{selectedStore.name}</Text>
              <Text style={styles.cardAddress} numberOfLines={1}>{selectedStore.address}</Text>
              <View style={styles.cardStats}>
                <Ionicons name="star" size={14} color="#f1c40f" />
                <Text style={styles.cardStatText}>{selectedStore.rating} • {selectedStore.distance_km.toFixed(1)} km away</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>
      )}

      {/* Map Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={fetchStores}>
          <Ionicons name="refresh" size={20} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/home')}>
          <Ionicons name="list" size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e5e5e5' },
  mapMock: { flex: 1, backgroundColor: '#f0f0f0', position: 'relative' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, left: '15%', width: 2, backgroundColor: '#ddd' },
  gridLineH: { position: 'absolute', left: 0, right: 0, top: '15%', height: 2, backgroundColor: '#ddd' },
  markerContainer: { position: 'absolute', alignItems: 'center' },
  marker: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ff6b6b', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  markerActive: { backgroundColor: '#333', transform: [{ scale: 1.2 }] },
  markerPointer: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#ff6b6b', marginTop: -2 },
  userMarker: { position: 'absolute', top: '50%', left: '50%', width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(52, 152, 219, 0.2)', justifyContent: 'center', alignItems: 'center' },
  userMarkerInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#3498db', borderWidth: 2, borderColor: '#fff' },
  overlay: { position: 'absolute', bottom: 30, left: 15, right: 15 },
  closeBtn: { alignSelf: 'flex-end', marginBottom: -10, zIndex: 1, marginRight: -10 },
  storeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
  cardImage: { width: 60, height: 60, borderRadius: 8 },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardAddress: { fontSize: 12, color: '#666', marginTop: 2 },
  cardStats: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  cardStatText: { fontSize: 11, color: '#888', marginLeft: 4 },
  actions: { position: 'absolute', top: 50, right: 15, gap: 10 },
  actionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
});
