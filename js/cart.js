const Cart = {
    getCart() {
        const cart = localStorage.getItem('quickdukan_cart');
        return cart ? JSON.parse(cart) : { items: [], totalItems: 0, totalAmount: 0 };
    },
    saveCart(cart) { localStorage.setItem('quickdukan_cart', JSON.stringify(cart)); },
    addItem(product, quantity = 1) {
        const cart = this.getCart();
        const existingIndex = cart.items.findIndex(item => item.id === product.id);
        if (existingIndex > -1) cart.items[existingIndex].quantity += quantity;
        else cart.items.push({ id: product.id, name: product.name, price: product.price, image: product.image || '📦', weight: product.weight || '', quantity: quantity });
        this.updateTotals(cart);
        this.saveCart(cart);
        this.dispatchUpdate(cart);
        return cart;
    },
    removeItem(productId) {
        const cart = this.getCart();
        cart.items = cart.items.filter(item => item.id !== productId);
        this.updateTotals(cart); this.saveCart(cart); this.dispatchUpdate(cart);
        return cart;
    },
    updateQuantity(productId, quantity) {
        const cart = this.getCart();
        const item = cart.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) return this.removeItem(productId);
            item.quantity = quantity;
            this.updateTotals(cart); this.saveCart(cart); this.dispatchUpdate(cart);
        }
        return cart;
    },
    updateTotals(cart) {
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    clearCart() {
        const emptyCart = { items: [], totalItems: 0, totalAmount: 0 };
        this.saveCart(emptyCart); this.dispatchUpdate(emptyCart);
        return emptyCart;
    },
    dispatchUpdate(cart) { window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: cart } })); },
    getCount() { return this.getCart().totalItems; }
};
console.log('✅ Quick Dukan — Cart Manager Loaded');