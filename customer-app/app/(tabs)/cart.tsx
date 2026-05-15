import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../store/cartStore';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen() {
  const { items, storeId, updateQuantity, getCartTotal } = useCartStore();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity 
          style={styles.browseBtn} 
          onPress={() => router.push('/(tabs)/home')}
        >
          <Text style={styles.browseText}>Browse Stores</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item: cartItem }) => {
    const { item, quantity, totalPrice } = cartItem;
    
    return (
      <View style={styles.cartItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>
            {item.is_weight_based 
              ? `₹${item.price_per_kg}/kg` 
              : `₹${item.price_per_unit}/pc`}
          </Text>
        </View>
        
        <View style={styles.quantityControl}>
          <TouchableOpacity 
            style={styles.qtyBtn}
            onPress={() => {
              const step = item.is_weight_based ? (item.unit === 'g' ? 100 : 500) : 1;
              updateQuantity(item.id, quantity - step);
            }}
          >
            <Ionicons name="remove" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.qtyText}>
            {item.is_weight_based 
              ? (quantity >= 1000 ? `${(quantity/1000).toFixed(1)} kg` : `${quantity} g`)
              : `${quantity} pc`}
          </Text>
          
          <TouchableOpacity 
            style={styles.qtyBtn}
            onPress={() => {
              const step = item.is_weight_based ? (item.unit === 'g' ? 100 : 500) : 1;
              updateQuantity(item.id, quantity + step);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.totalPrice}>₹{totalPrice.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.item.id}
        contentContainerStyle={styles.list}
      />
      
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Item Total</Text>
          <Text style={styles.totalValue}>₹{getCartTotal().toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#666', marginTop: 15 },
  browseBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#ff6b6b', borderRadius: 8 },
  browseText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 15 },
  cartItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemPrice: { fontSize: 12, color: '#666', marginTop: 4 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ff6b6b', justifyContent: 'center', alignItems: 'center' },
  qtyText: { marginHorizontal: 10, fontSize: 14, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  totalPrice: { fontSize: 16, fontWeight: 'bold', color: '#333', width: 60, textAlign: 'right' },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 18, color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  checkoutBtn: { backgroundColor: '#ff6b6b', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
