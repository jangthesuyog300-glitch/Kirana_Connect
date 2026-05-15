import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRegistrationStore } from '../../store/registrationStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  const router = useRouter();
  const setLocation = useRegistrationStore((state) => state.setLocation);
  
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090, // Default to New Delhi
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [address, setAddress] = useState('Fetching address...');
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to pin your delivery address.');
        setLoading(false);
        setAddress('Location permission denied. Please select manually.');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(newRegion);
        await fetchAddress(newRegion.latitude, newRegion.longitude);
      } catch (error) {
        console.error('Error getting location', error);
        setAddress('Could not fetch current location.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      setAddressLoading(true);
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocode.length > 0) {
        const addr = geocode[0];
        const formattedAddress = [addr.name, addr.street, addr.subregion, addr.city, addr.region, addr.postalCode]
          .filter(Boolean)
          .join(', ');
        setAddress(formattedAddress || 'Unknown location');
      } else {
        setAddress('Address not found');
      }
    } catch (error) {
      console.error(error);
      setAddress('Error fetching address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    fetchAddress(newRegion.latitude, newRegion.longitude);
  };

  const handleConfirmLocation = () => {
    if (!address || address === 'Fetching address...' || address === 'Error fetching address') {
      Alert.alert('Hold on', 'Please wait until we fetch your address.');
      return;
    }
    setLocation({
      latitude: region.latitude,
      longitude: region.longitude,
      address,
    });
    router.push('/registration-flow/confirm');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Delivery Location</Text>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6b6b" />
            <Text style={styles.loadingText}>Finding your location...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'web' ? undefined : PROVIDER_GOOGLE}
            initialRegion={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation={true}
          />
        )}
        
        {/* Center Map Pin Overlay */}
        {!loading && (
          <View style={styles.markerFixed}>
            <Ionicons name="location" size={40} color="#ff6b6b" />
          </View>
        )}
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.addressContainer}>
          <View style={styles.addressIconBox}>
            <Ionicons name="navigate" size={20} color="#fff" />
          </View>
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressLabel}>Selected Address</Text>
            {addressLoading ? (
               <ActivityIndicator size="small" color="#ff6b6b" style={styles.addressLoader} />
            ) : (
               <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryBtn, addressLoading && styles.btnDisabled]} 
          onPress={handleConfirmLocation}
          disabled={addressLoading}
        >
          <Text style={styles.primaryBtnText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    zIndex: 10
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 8 },
  mapContainer: { flex: 1, position: 'relative' },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  markerFixed: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -20,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  bottomCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee'
  },
  addressIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  addressTextContainer: { flex: 1 },
  addressLabel: { fontSize: 12, color: '#888', fontWeight: '500', marginBottom: 4 },
  addressText: { fontSize: 15, color: '#333', fontWeight: '600', lineHeight: 20 },
  addressLoader: { alignSelf: 'flex-start', marginTop: 4 },
  primaryBtn: { 
    backgroundColor: '#ff6b6b', 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
