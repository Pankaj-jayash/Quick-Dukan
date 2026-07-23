// ========== CART LOGIC ==========

const Cart = {
    // Add product to cart
    add(product, quantity = 1) {
        const cart = Storage.getCart();
        const existingItem = cart.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                id: product.id,
                name: product.name,
                weight: product.weight,
                price: product.price,
                mrp: product.mrp || product.price,
                image: product.image,
                quantity: quantity,
                selected: true
            });
        }
        
        Storage.setCart(cart);
        UI.updateCartBadge();
        UI.showCartToast(product, quantity);
        
        return cart;
    },
    
    // Remove product from cart
    remove(productId) {
        const cart = Storage.getCart();
        cart.items = cart.items.filter(item => item.id !== productId);
        Storage.setCart(cart);
        UI.updateCartBadge();
        return cart;
    },
    
    // Update quantity
    updateQuantity(productId, newQuantity) {
        const cart = Storage.getCart();
        
        if (newQuantity <= 0) {
            return this.remove(productId);
        }
        
        const item = cart.items.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
        }
        
        Storage.setCart(cart);
        UI.updateCartBadge();
        return cart;
    },
    
    // Toggle item selection
    toggleSelect(productId) {
        const cart = Storage.getCart();
        const item = cart.items.find(item => item.id === productId);
        if (item) {
            item.selected = !item.selected;
        }
        Storage.setCart(cart);
        return cart;
    },
    
    // Select all
    selectAll() {
        const cart = Storage.getCart();
        cart.items.forEach(item => item.selected = true);
        Storage.setCart(cart);
        return cart;
    },
    
    // Deselect all
    deselectAll() {
        const cart = Storage.getCart();
        cart.items.forEach(item => item.selected = false);
        Storage.setCart(cart);
        return cart;
    },
    
    // Get cart
    get() {
        return Storage.getCart();
    },
    
    // Get selected items
    getSelected() {
        const cart = this.get();
        return cart.items.filter(item => item.selected);
    },
    
    // Get selected count
    getSelectedCount() {
        return this.getSelected().reduce((sum, item) => sum + item.quantity, 0);
    },
    
    // Get selected total
    getSelectedTotal() {
        return this.getSelected().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    
    // Clear cart
    clear() {
        Storage.clearCart();
        UI.updateCartBadge();
    },
    
    // Clear only purchased items
    clearPurchased(purchasedIds) {
        const cart = Storage.getCart();
        cart.items = cart.items.filter(item => !purchasedIds.includes(item.id));
        Storage.setCart(cart);
        UI.updateCartBadge();
        return cart;
    },
    
    // Get item count
    getCount() {
        const cart = this.get();
        return cart.totalItems || 0;
    }
};