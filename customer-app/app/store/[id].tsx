import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Modal, TextInput, SafeAreaView,
  ScrollView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storesAPI, itemsAPI } from '../../utils/api';
import { useCartStore } from '../../store/cartStore';

const PAGE_SIZE = 6;

// --- Skeleton Card ---
function SkeletonCard() {
  return (
    <View style={styles.itemCard}>
      <View style={[styles.itemImageContainer, { backgroundColor: '#e8e8e8' }]} />
      <View style={{ marginTop: 8, gap: 6 }}>
        <View style={{ height: 14, backgroundColor: '#e8e8e8', borderRadius: 4, width: '80%' }} />
        <View style={{ height: 14, backgroundColor: '#e8e8e8', borderRadius: 4, width: '50%' }} />
        <View style={{ height: 32, backgroundColor: '#ffe0e0', borderRadius: 6, marginTop: 4 }} />
      </View>
    </View>
  );
}

// --- Store Info Sheet ---
function StoreInfoSheet({ store, visible, onClose }) {
  if (!store) return null;
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={onClose} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Store Details</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {store.image_url ? (
              <Image source={{ uri: store.image_url }} style={styles.storeHeroImage} />
            ) : (
              <View style={[styles.storeHeroImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="storefront-outline" size={60} color="#ccc" />
              </View>
            )}
            <View style={styles.storeMeta}>
              <Text style={styles.storeNameLg}>{store.name}</Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#f39c12" />
                <Text style={styles.ratingText}> {store.rating}</Text>
                <Text style={styles.ratingCount}> ({store.total_ratings} ratings)</Text>
              </View>

              <View style={styles.ownerRow}>
                <Image
                  source={{ uri: store.owner_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100' }}
                  style={styles.ownerThumb}
                />
                <View>
                  <Text style={styles.managedBy}>MANAGED BY</Text>
                  <Text style={styles.ownerName}>{store.owner_name || 'Store Owner'}</Text>
                </View>
              </View>

              {store.description ? (
                <Text style={styles.storeDesc}>{store.description}</Text>
              ) : null}

              <InfoRow icon="location" color="#ff6b6b" label="Address" value={store.address} />
              <InfoRow icon="call" color="#3498db" label="Contact" value={store.phone} />
              <InfoRow
                icon="time"
                color="#9b59b6"
                label="Timings"
                value={`${store.opening_time || '–'} – ${store.closing_time || '–'}`}
              />
              <InfoRow
                icon={store.is_open ? 'checkmark-circle' : 'close-circle'}
                color={store.is_open ? '#2ecc71' : '#e74c3c'}
                label="Status"
                value={store.is_open ? 'Open Now' : 'Closed'}
                valueColor={store.is_open ? '#2ecc71' : '#e74c3c'}
              />
              <InfoRow
                icon="bicycle"
                color="#2ecc71"
                label="Delivery"
                value={
                  store.delivery_enabled
                    ? `Available (up to ${store.delivery_radius} km)`
                    : 'Pickup only'
                }
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ icon, color, label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value || '–'}</Text>
      </View>
    </View>
  );
}

// --- Main Screen ---
export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [storeInfoVisible, setStoreInfoVisible] = useState(false);

  const { addItem, updateQuantity, items: cartItems } = useCartStore();

  useEffect(() => {
    fetchInitial();
  }, [id]);

  // Reset and re-fetch when category or search changes
  useEffect(() => {
    if (store) {
      resetAndFetch();
    }
  }, [activeCategory, searchQuery]);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const lat = 12.9716;
      const lng = 77.5946;
      const [storeRes, catRes] = await Promise.all([
        storesAPI.getById(id, lat, lng),
        itemsAPI.getCategories(),
      ]);
      setStore(storeRes.data.store);
      setCategories(['All', ...catRes.data.categories]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // fetch first page of items
    await loadItems('All', '', 0, true);
  };

  const resetAndFetch = () => {
    setItems([]);
    setCurrentOffset(0);
    setHasMore(true);
    loadItems(activeCategory, searchQuery, 0, true);
  };

  const loadItems = async (category, search, offset, isRefresh = false) => {
    try {
      if (isRefresh) setLoading(true);
      else setIsLoadingMore(true);

      const catParam = category === 'All' ? '' : category;
      const response = await itemsAPI.getStoreItems(id, catParam, PAGE_SIZE, offset);
      let newItems = response.data.items || [];

      // Client-side search filter (since mock backend may not support search param)
      if (search.trim()) {
        const q = search.toLowerCase();
        newItems = newItems.filter(
          (i) =>
            (i.name || '').toLowerCase().includes(q) ||
            (i.category || '').toLowerCase().includes(q)
        );
      }

      if (newItems.length < PAGE_SIZE) setHasMore(false);
      else setHasMore(true);

      if (isRefresh) {
        setItems(newItems);
      } else {
        setItems((prev) => [...prev, ...newItems]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isRefresh) setLoading(false);
      else setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || isLoadingMore || loading) return;
    const next = currentOffset + PAGE_SIZE;
    setCurrentOffset(next);
    loadItems(activeCategory, searchQuery, next, false);
  };

  const toggleFavourite = async () => {
    try {
      const res = await storesAPI.toggleFavourite(id);
      setStore((s) => ({ ...s, is_favourite: res.data.is_favourite }));
    } catch (err) {
      console.error(err);
    }
  };

  // --- Renders ---
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.pill, activeCategory === item && styles.pillActive]}
      onPress={() => setActiveCategory(item)}
    >
      <Text style={[styles.pillText, activeCategory === item && styles.pillTextActive]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const cartItem = cartItems.find((c) => c.item.id === item.id);
    const qtyInCart = cartItem ? cartItem.quantity : 0;
    const displayPrice = item.is_weight_based
      ? `₹${item.price_per_kg}/kg`
      : `₹${item.price_per_unit}/pc`;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemImageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Ionicons name="basket-outline" size={32} color="#ccc" />
            </View>
          )}
          {!item.is_available && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockBadge}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.itemPrice}>{displayPrice}</Text>

          {!item.is_available ? (
            <View style={[styles.addBtn, styles.unavailableBtn]}>
              <Text style={styles.unavailableBtnText}>Unavailable</Text>
            </View>
          ) : qtyInCart > 0 ? (
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtnTouch}
                onPress={() => {
                  const step = item.is_weight_based ? (item.unit === 'g' ? 100 : 500) : 1;
                  updateQuantity(item.id, qtyInCart - step);
                }}
              >
                <Ionicons name="remove" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>
                {item.is_weight_based
                  ? qtyInCart >= 1000
                    ? `${(qtyInCart / 1000).toFixed(1)}kg`
                    : `${qtyInCart}g`
                  : qtyInCart}
              </Text>
              <TouchableOpacity
                style={styles.qtyBtnTouch}
                onPress={() => {
                  const step = item.is_weight_based ? (item.unit === 'g' ? 100 : 500) : 1;
                  updateQuantity(item.id, qtyInCart + step);
                }}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                const initialQty = item.is_weight_based ? (item.unit === 'g' ? 100 : 500) : 1;
                const unitPrice = item.is_weight_based ? item.price_per_kg : item.price_per_unit;
                addItem(item, id, initialQty, unitPrice);
              }}
            >
              <Ionicons name="add" size={14} color="#ff6b6b" />
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const totalCartQty = cartItems.reduce((a, c) => a + c.quantity, 0);
  const totalCartPrice = cartItems.reduce((a, c) => a + c.totalPrice, 0);

  const skeletonData = Array.from({ length: 6 }, (_, i) => ({ id: `sk-${i}` }));

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.storeInfoBtn} onPress={() => setStoreInfoVisible(true)}>
            <Ionicons name="information-circle-outline" size={18} color="#ff6b6b" />
            <Text style={styles.storeInfoLabel}>Store Info</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {store ? store.name : 'Loading...'}
        </Text>

        <TouchableOpacity style={styles.iconBtn} onPress={toggleFavourite} disabled={!store}>
          <Ionicons
            name={store?.is_favourite ? 'heart' : 'heart-outline'}
            size={22}
            color={store?.is_favourite ? '#e74c3c' : '#aaa'}
          />
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#aaa" style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 10 }}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Categories ── */}
      <View style={styles.categoryBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
        />
      </View>

      {/* ── Products Grid ── */}
      {loading ? (
        <FlatList
          data={skeletonData}
          renderItem={() => <SkeletonCard />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          contentContainerStyle={[styles.grid, { paddingBottom: cartItems.length > 0 ? 110 : 30 }]}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ padding: 16 }}>
                <ActivityIndicator size="small" color="#ff6b6b" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}

      {/* ── Floating Cart ── */}
      {cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => router.push('/(tabs)/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartBadgeWrap}>
            <Text style={styles.cartBadgeText}>{totalCartQty}</Text>
          </View>
          <Text style={styles.floatingCartLabel}>View Cart</Text>
          <Text style={styles.floatingCartPrice}>₹{totalCartPrice.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {/* ── Store Info Modal ── */}
      <StoreInfoSheet
        store={store}
        visible={storeInfoVisible}
        onClose={() => setStoreInfoVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 12 : 6, paddingBottom: 12,
    borderBottomWidth: 1, borderColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#222', marginHorizontal: 4 },
  storeInfoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff0f0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#ffd0d0',
  },
  storeInfoLabel: { fontSize: 12, fontWeight: '600', color: '#ff6b6b' },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 14, marginTop: 12, marginBottom: 2,
    borderRadius: 12, borderWidth: 1, borderColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  searchInput: { flex: 1, height: 42, paddingHorizontal: 10, fontSize: 14, color: '#333' },

  // Category bar
  categoryBar: { backgroundColor: 'transparent', marginTop: 6 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#fff', marginHorizontal: 4,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  pillActive: { backgroundColor: '#333', borderColor: '#333' },
  pillText: { fontSize: 13, color: '#555', fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '700' },

  // Grid
  grid: { paddingHorizontal: 10, paddingTop: 10 },
  row: { justifyContent: 'space-between' },

  // Item Card
  itemCard: {
    width: '48.5%', backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 12, padding: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  itemImageContainer: {
    width: '100%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#f8f8f8', marginBottom: 8,
  },
  itemImage: { width: '100%', height: '100%' },
  itemImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)', justifyContent: 'center', alignItems: 'center',
  },
  outOfStockBadge: {
    backgroundColor: '#e74c3c', color: '#fff', fontSize: 11, fontWeight: '700',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden',
  },
  itemInfo: { gap: 3 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#333', height: 36, lineHeight: 18 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#e74c3c' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
    borderWidth: 1.5, borderColor: '#ff6b6b', borderRadius: 8, paddingVertical: 7, marginTop: 4,
  },
  addBtnText: { color: '#ff6b6b', fontWeight: '800', fontSize: 12 },
  unavailableBtn: { borderColor: '#ddd', backgroundColor: '#f8f8f8' },
  unavailableBtnText: { color: '#bbb', fontSize: 12, fontWeight: '600' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ff6b6b', borderRadius: 8, paddingHorizontal: 4, height: 34, marginTop: 4,
  },
  qtyBtnTouch: { padding: 6 },
  qtyText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: '#ccc', fontSize: 15, fontWeight: '500' },

  // Floating Cart
  floatingCart: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: '#ff6b6b', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#ff6b6b', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  cartBadgeWrap: {
    backgroundColor: '#fff', width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: '#ff6b6b', fontWeight: '800', fontSize: 12 },
  floatingCartLabel: { color: '#fff', fontWeight: '700', fontSize: 16, flex: 1, marginLeft: 10 },
  floatingCartPrice: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Modal / Bottom Sheet
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  overlayDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '88%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f0f0f0',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#222' },

  // Store Detail (inside modal)
  storeHeroImage: { width: '100%', height: 190, resizeMode: 'cover' },
  storeMeta: { padding: 20, gap: 14 },
  storeNameLg: { fontSize: 22, fontWeight: '800', color: '#222' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 15, fontWeight: '700', color: '#f39c12' },
  ratingCount: { fontSize: 13, color: '#999' },
  ownerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fafafa', padding: 14, borderRadius: 12,
  },
  ownerThumb: { width: 48, height: 48, borderRadius: 24 },
  managedBy: { fontSize: 10, color: '#aaa', letterSpacing: 0.8, marginBottom: 2 },
  ownerName: { fontSize: 15, fontWeight: '700', color: '#333' },
  storeDesc: { fontSize: 14, color: '#666', lineHeight: 21 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#aaa', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '600', paddingRight: 20 },
});
