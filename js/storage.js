// ========== LOCAL STORAGE HELPERS ==========

const Storage = {
    PREFIX: 'quickdukan_',
    
    set(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Cart methods
    getCart() {
        return this.get('cart', { items: [], totalItems: 0, totalAmount: 0 });
    },
    
    setCart(cart) {
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return this.set('cart', cart);
    },
    
    clearCart() {
        return this.remove('cart');
    },
    
    // Recent products
    getRecent() {
        return this.get('recent', []);
    },
    
    setRecent(recent) {
        return this.set('recent', recent.slice(0, CONFIG.features.recentlyViewedLimit));
    },
    
    addToRecent(product) {
        let recent = this.getRecent();
        recent = recent.filter(item => item.id !== product.id);
        recent.unshift({
            id: product.id,
            name: product.name,
            weight: product.weight,
            price: product.price,
            mrp: product.mrp,
            image: product.image,
            category: product.category || ''
        });
        return this.setRecent(recent);
    },
    
    // Orders
    getOrders() {
        return this.get('orders', []);
    },
    
    addOrder(order) {
        const orders = this.getOrders();
        orders.unshift(order);
        return this.set('orders', orders);
    },
    
    // User details (checkout)
    getUserDetails() {
        return this.get('userDetails', { name: '', phone: '', city: '' });
    },
    
    setUserDetails(details) {
        return this.set('userDetails', details);
    },
    
    // Theme
    getTheme() {
        return this.get('theme', 'light');
    },
    
    setTheme(theme) {
        return this.set('theme', theme);
    },
    
    // Clear all
    clearAll() {
        const keys = ['cart', 'recent', 'orders', 'userDetails', 'theme'];
        keys.forEach(key => this.remove(key));
    }
};