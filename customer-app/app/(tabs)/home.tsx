import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { storesAPI } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchNearbyStores();
  }, []);

  const fetchNearbyStores = async () => {
    try {
      setLoading(true);
      setLocationError('');
      
      let lat = 12.9716;
      let lng = 77.5946;

      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          lat = location.coords.latitude || lat;
          lng = location.coords.longitude || lng;
          setCurrentLocation({ lat, lng });
        }
      } catch (locErr) {
        // Use default Bangalore coords if location unavailable
        console.log('Location unavailable, using default Bangalore coords');
      }

      // Radius set to 5km as per requirement
      const response = await storesAPI.getNearby(lat, lng, 5);
      setStores(response.data.stores);
    } catch (error) {
      console.error(error);
      setLocationError('Failed to fetch stores. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const openDirections = (store) => {
    const { lat, lng } = store.location || { lat: 12.9716, lng: 77.5946 };
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const renderStore = ({ item }) => (
    <TouchableOpacity 
      style={styles.storeCard}
      onPress={() => router.push(`/store/${item.id}`)}
    >
      <View style={styles.storeImageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.storeImage} />
        ) : (
          <View style={styles.storeImagePlaceholder}>
            <Ionicons name="storefront-outline" size={40} color="#999" />
          </View>
        )}
        {!item.is_open && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>CLOSED</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.favoriteBtn}
          onPress={(e) => {
            e.stopPropagation();
            setFavorites(prev => 
              prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
            );
          }}
        >
          <Ionicons 
            name={favorites.includes(item.id) ? "heart" : "heart-outline"} 
            size={20} 
            color={favorites.includes(item.id) ? "#ff6b6b" : "#fff"} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.storeInfo}>
        <View style={styles.headerRow}>
          <Text style={styles.storeName}>{item.name}</Text>
          {item.category && <Text style={styles.categoryBadge}>{item.category}</Text>}
        </View>
        
        <Text style={styles.storeAddress} numberOfLines={1}>{item.address}</Text>
        
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.badgeText}>{item.distance_km.toFixed(1)} km</Text>
          </View>
          
          <View style={styles.badge}>
            <Ionicons name="star" size={14} color="#f39c12" />
            <Text style={styles.badgeText}>{item.rating} ({item.total_ratings})</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.deliveryInfo}>
            {item.delivery_enabled ? (
              <Text style={styles.deliveryText}>✓ Delivery</Text>
            ) : (
              <Text style={styles.pickupText}>Pickup</Text>
            )}
          </View>

          <TouchableOpacity 
            style={styles.directionsBtn}
            onPress={(e) => {
              e.stopPropagation();
              openDirections(item);
            }}
          >
            <Ionicons name="navigate-outline" size={14} color="#3498db" />
            <Text style={styles.directionsText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.locationBanner}>
        <Ionicons name="location" size={18} color="#ff6b6b" />
        <Text style={styles.locationText}>
          {currentLocation ? `Showing stores within 5km of you` : `Showing stores in Bangalore (5km)`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>Finding top stores near you...</Text>
        </View>
      ) : locationError ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={48} color="#999" />
          <Text style={styles.errorText}>{locationError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNearbyStores}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stores}
          renderItem={renderStore}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.errorText}>No stores found within 5km</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchNearbyStores}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#666' },
  errorText: { color: '#e74c3c', textAlign: 'center', marginTop: 10, fontSize: 16 },
  retryBtn: { marginTop: 20, padding: 10, backgroundColor: '#ff6b6b', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { padding: 15 },
  locationBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 10, 
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  locationText: { marginLeft: 8, color: '#444', fontSize: 13, fontWeight: '500' },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  storeImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  storeImage: { width: '100%', height: '100%' },
  storeImagePlaceholder: {
    width: '100%', height: '100%', backgroundColor: '#eee',
    justifyContent: 'center', alignItems: 'center',
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  closedText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  storeInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  storeName: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  categoryBadge: { 
    fontSize: 10, 
    color: '#ff6b6b', 
    backgroundColor: '#fff0f0', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 5,
    fontWeight: '600'
  },
  storeAddress: { fontSize: 13, color: '#666', marginTop: 4 },
  badges: { flexDirection: 'row', marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  badgeText: { fontSize: 12, color: '#666', marginLeft: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  deliveryInfo: { },
  deliveryText: { fontSize: 12, color: '#2ecc71', fontWeight: '500' },
  pickupText: { fontSize: 12, color: '#e67e22', fontWeight: '500' },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  directionsText: { fontSize: 12, color: '#3498db', marginLeft: 4, fontWeight: '500' },
  favoriteBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.3)', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
});
