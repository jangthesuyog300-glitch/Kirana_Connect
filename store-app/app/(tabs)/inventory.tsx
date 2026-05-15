import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator, Alert, Modal, TextInput, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI, catalogAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function InventoryScreen() {
  const { storeData } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Flow state
  const [modalVisible, setModalVisible] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogResults, setCatalogResults] = useState([]);
  const [searchingCatalog, setSearchingCatalog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    category: 'Grocery Staples',
    price: '',
    stock: '',
    unit: 'piece',
    is_weight_based: false
  });

  useEffect(() => {
    if (storeData?.id) fetchInventory();
  }, [storeData]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryAPI.getItems(storeData.id);
      setItems(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCatalogSearch = async (text) => {
    setCatalogSearch(text);
    if (text.length < 2) {
      setCatalogResults([]);
      return;
    }
    try {
      setSearchingCatalog(true);
      const res = await catalogAPI.search(text);
      setCatalogResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingCatalog(false);
    }
  };

  const selectCatalogProduct = (product) => {
    setSelectedProduct(product);
    setIsCustom(false);
    setForm({
      name: product.name,
      category: product.category,
      price: '',
      stock: '',
      unit: product.default_unit || 'piece',
      is_weight_based: product.default_unit === 'kg'
    });
  };

  const startCustomProduct = () => {
    setIsCustom(true);
    setSelectedProduct(null);
    setForm({
      name: catalogSearch,
      category: 'Grocery Staples',
      price: '',
      stock: '',
      unit: 'piece',
      is_weight_based: false
    });
  };

  const handleSaveItem = async () => {
    if (!form.price || !form.stock || (isCustom && !form.name)) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const payload = {
        store_id: storeData.id,
        product_id: selectedProduct?.id || null,
        name: isCustom ? form.name : null,
        category: isCustom ? form.category : null,
        price_per_unit: parseFloat(form.price),
        stock_qty: parseFloat(form.stock),
        is_available: true,
        is_custom: isCustom,
        unit: form.unit,
        is_weight_based: form.is_weight_based
      };

      await inventoryAPI.createItem(payload);
      setModalVisible(false);
      resetAddFlow();
      fetchInventory();
      Alert.alert('Success', 'Item added to your inventory');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add item');
    }
  };

  const resetAddFlow = () => {
    setCatalogSearch('');
    setCatalogResults([]);
    setSelectedProduct(null);
    setIsCustom(false);
    setForm({ name: '', category: 'Grocery Staples', price: '', stock: '', unit: 'piece', is_weight_based: false });
  };

  const toggleAvailability = async (item) => {
    try {
      const newStatus = !item.is_available;
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newStatus } : i));
      await inventoryAPI.updateItem(item.id, { is_available: newStatus });
    } catch (err) {
      Alert.alert('Error', 'Failed to update item availability');
      fetchInventory();
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.tagRow}>
          <View style={styles.categoryTag}><Text style={styles.tagText}>{item.category}</Text></View>
          {item.is_custom && <View style={[styles.categoryTag, { backgroundColor: '#e1f5fe' }]}><Text style={[styles.tagText, { color: '#039be5' }]}>Custom</Text></View>}
        </View>
        <Text style={styles.itemPrice}>₹{item.price_per_unit || item.price_per_kg} / {item.unit}</Text>
        <Text style={styles.stockText}>Stock: {item.stock_qty} {item.unit}</Text>
      </View>
      
      <View style={styles.controls}>
        <Switch 
          value={item.is_available} 
          onValueChange={() => toggleAvailability(item)}
          trackColor={{ false: '#eee', true: '#ff6b6b' }}
        />
        <Text style={[styles.statusText, { color: item.is_available ? '#2ecc71' : '#999' }]}>
          {item.is_available ? 'Live' : 'Hidden'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search your items..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff6b6b" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchInventory}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          }
        />
      )}

      {/* Add Item Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalFull}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetAddFlow(); }}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{selectedProduct || isCustom ? 'Item Details' : 'Add to Inventory'}</Text>
            {(selectedProduct || isCustom) ? (
              <TouchableOpacity onPress={handleSaveItem}>
                <Text style={styles.saveBtnText}>Add</Text>
              </TouchableOpacity>
            ) : <View style={{ width: 40 }} />}
          </View>

          {!selectedProduct && !isCustom ? (
            <View style={styles.modalBody}>
              <View style={styles.catalogSearchBox}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput 
                  style={styles.catalogInput} 
                  placeholder="Search Master Catalog (Milk, Bread...)" 
                  value={catalogSearch}
                  onChangeText={handleCatalogSearch}
                  autoFocus
                />
              </View>

              {searchingCatalog ? (
                <ActivityIndicator color="#ff6b6b" style={{ marginTop: 20 }} />
              ) : (
                <ScrollView style={styles.catalogList}>
                  {catalogResults.map(p => (
                    <TouchableOpacity key={p.id} style={styles.catalogItem} onPress={() => selectCatalogProduct(p)}>
                      <Image source={{ uri: p.default_image }} style={styles.catalogImg} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.catalogName}>{p.name}</Text>
                        <Text style={styles.catalogCat}>{p.category}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                  
                  {catalogSearch.length >= 2 && (
                    <TouchableOpacity style={styles.customAddRow} onPress={startCustomProduct}>
                      <View style={styles.customIcon}><Ionicons name="add" size={24} color="#ff6b6b" /></View>
                      <Text style={styles.customAddText}>Add "{catalogSearch}" as custom product</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}
            </View>
          ) : (
            <ScrollView style={styles.modalBody}>
              <View style={styles.selectedProductCard}>
                <Image 
                  source={{ uri: selectedProduct?.default_image || 'https://via.placeholder.com/150' }} 
                  style={styles.formImg} 
                />
                <Text style={styles.formName}>{form.name}</Text>
                <Text style={styles.formCat}>{form.category}</Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Selling Price (₹)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 250" 
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={t => setForm({...form, price: t})}
                />

                <Text style={styles.label}>Available Stock ({form.unit})</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 50" 
                  keyboardType="numeric"
                  value={form.stock}
                  onChangeText={t => setForm({...form, stock: t})}
                />

                {isCustom && (
                  <>
                    <Text style={styles.label}>Product Name</Text>
                    <TextInput 
                      style={styles.input} 
                      value={form.name}
                      onChangeText={t => setForm({...form, name: t})}
                    />
                    <Text style={styles.label}>Unit</Text>
                    <View style={styles.unitRow}>
                      {['piece', 'kg', 'pack', 'bottle'].map(u => (
                        <TouchableOpacity 
                          key={u} 
                          style={[styles.unitChip, form.unit === u && styles.unitChipActive]}
                          onPress={() => setForm({...form, unit: u, is_weight_based: u === 'kg'})}
                        >
                          <Text style={[styles.unitChipText, form.unit === u && styles.unitChipTextActive]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ff6b6b', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#ff6b6b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f3f5', marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 12, marginBottom: 15 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  list: { padding: 20 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  itemImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f8f9fa' },
  itemInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  itemName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  tagRow: { flexDirection: 'row', marginTop: 4 },
  categoryTag: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 6 },
  tagText: { fontSize: 10, color: '#666', fontWeight: '600' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#ff6b6b', marginTop: 6 },
  stockText: { fontSize: 12, color: '#999', marginTop: 2 },
  controls: { alignItems: 'center', justifyContent: 'center', paddingLeft: 10 },
  statusText: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },
  modalFull: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderColor: '#f1f3f5' },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700' },
  saveBtnText: { color: '#ff6b6b', fontSize: 16, fontWeight: '700' },
  modalBody: { flex: 1, padding: 20 },
  catalogSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f3f5', paddingHorizontal: 15, borderRadius: 12, marginBottom: 20 },
  catalogInput: { flex: 1, height: 50, fontSize: 16, marginLeft: 10 },
  catalogList: { flex: 1 },
  catalogItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f3f5' },
  catalogImg: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#f8f9fa', marginRight: 15 },
  catalogName: { fontSize: 16, fontWeight: '600' },
  catalogCat: { fontSize: 12, color: '#999' },
  customAddRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 15, backgroundColor: '#fff5f5', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ff6b6b' },
  customIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  customAddText: { color: '#ff6b6b', fontWeight: '600' },
  selectedProductCard: { alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa', borderRadius: 20, marginBottom: 25 },
  formImg: { width: 120, height: 120, borderRadius: 20, marginBottom: 15 },
  formName: { fontSize: 20, fontWeight: '800' },
  formCat: { fontSize: 14, color: '#666' },
  form: { paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '700', color: '#444', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f1f3f5', borderRadius: 12, padding: 15, fontSize: 16 },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  unitChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f3f5', marginRight: 10, marginBottom: 10 },
  unitChipActive: { backgroundColor: '#ff6b6b' },
  unitChipText: { color: '#666', fontWeight: '600' },
  unitChipTextActive: { color: '#fff' },
});


