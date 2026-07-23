var Cart = {
    getCart: function() {
        var cart = localStorage.getItem('quickdukan_cart');
        return cart ? JSON.parse(cart) : { items: [], totalItems: 0, totalAmount: 0 };
    },
    saveCart: function(cart) {
        localStorage.setItem('quickdukan_cart', JSON.stringify(cart));
    },
    addItem: function(product, quantity) {
        quantity = quantity || 1;
        var cart = this.getCart();
        var existing = cart.items.find(function(item) { return item.id === product.id; });
        if (existing) { existing.quantity += quantity; }
        else { cart.items.push({ id: product.id, name: product.name, price: product.price, icon: product.icon, weight: product.weight, quantity: quantity }); }
        this.updateTotals(cart);
        this.saveCart(cart);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: cart } }));
        return cart;
    },
    removeItem: function(productId) {
        var cart = this.getCart();
        cart.items = cart.items.filter(function(item) { return item.id !== productId; });
        this.updateTotals(cart); this.saveCart(cart);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: cart } }));
        return cart;
    },
    updateQuantity: function(productId, quantity) {
        var cart = this.getCart();
        var item = cart.items.find(function(item) { return item.id === productId; });
        if (item) {
            if (quantity <= 0) return this.removeItem(productId);
            item.quantity = quantity;
            this.updateTotals(cart); this.saveCart(cart);
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: cart } }));
        }
        return cart;
    },
    updateTotals: function(cart) {
        cart.totalItems = cart.items.reduce(function(sum, item) { return sum + item.quantity; }, 0);
        cart.totalAmount = cart.items.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);
    },
    clearCart: function() {
        var empty = { items: [], totalItems: 0, totalAmount: 0 };
        this.saveCart(empty);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: empty } }));
        return empty;
    }
};