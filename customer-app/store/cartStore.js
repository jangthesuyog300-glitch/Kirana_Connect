import { create } from 'zustand';
import { Alert } from 'react-native';

export const useCartStore = create((set, get) => ({
  storeId: null,
  items: [], // { item, quantity, totalPrice }
  
  addItem: (item, storeId, quantity, unitPrice) => {
    const currentStoreId = get().storeId;
    
    // Enforce single store cart
    if (currentStoreId && currentStoreId !== storeId) {
      Alert.alert(
        "Different Store",
        "Your cart contains items from another store. Clear cart to continue?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Clear Cart", 
            style: "destructive", 
            onPress: () => {
              get().clearCart();
              get().addItem(item, storeId, quantity, unitPrice);
            }
          }
        ]
      );
      return false; // Did not add
    }

    set((state) => {
      const existingItemIndex = state.items.findIndex(i => i.item.id === item.id);
      let newItems = [...state.items];
      
      const totalPrice = item.is_weight_based 
        ? (item.price_per_kg / 1000) * quantity 
        : item.price_per_unit * quantity;

      if (existingItemIndex >= 0) {
        // Update existing
        const newQty = newItems[existingItemIndex].quantity + quantity;
        const newTotal = item.is_weight_based 
          ? (item.price_per_kg / 1000) * newQty 
          : item.price_per_unit * newQty;
          
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newQty,
          totalPrice: newTotal
        };
      } else {
        // Add new
        newItems.push({
          item,
          quantity,
          totalPrice
        });
      }

      return {
        storeId,
        items: newItems
      };
    });
    return true; // Added successfully
  },
  
  removeItem: (itemId) => set((state) => {
    const newItems = state.items.filter(i => i.item.id !== itemId);
    return {
      items: newItems,
      storeId: newItems.length === 0 ? null : state.storeId
    };
  }),
  
  updateQuantity: (itemId, newQuantity) => set((state) => {
    if (newQuantity <= 0) {
      get().removeItem(itemId);
      return state;
    }
    
    const newItems = state.items.map(i => {
      if (i.item.id === itemId) {
        const item = i.item;
        const totalPrice = item.is_weight_based 
          ? (item.price_per_kg / 1000) * newQuantity 
          : item.price_per_unit * newQuantity;
        return { ...i, quantity: newQuantity, totalPrice };
      }
      return i;
    });
    
    return { items: newItems };
  }),
  
  clearCart: () => set({ storeId: null, items: [] }),
  
  getCartTotal: () => {
    return get().items.reduce((sum, current) => sum + current.totalPrice, 0);
  }
}));
