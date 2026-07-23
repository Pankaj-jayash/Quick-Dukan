
/* ═══════════════════════════════════════════ */
/* STORAGE HELPERS — localStorage wrapper     */
/* ═══════════════════════════════════════════ */

const Storage = {
    // Generic get/set with prefix
    set(key, value) {
        try {
            localStorage.setItem(`quickdukan_${key}`, JSON.stringify(value));
        } catch (e) {
            console.warn('localStorage full ya unavailable:', e);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`quickdukan_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('localStorage read error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(`quickdukan_${key}`);
        } catch (e) {
            console.warn('localStorage remove error:', e);
        }
    },
    
    // Cart specific
    getCart() {
        return this.get('cart', { items: [], totalItems: 0, totalAmount: 0 });
    },
    
    setCart(cart) {
        this.set('cart', cart);
    },
    
    clearCart() {
        this.remove('cart');
    },
    
    // Recently viewed
    getRecent() {
        return this.get('recent', []);
    },
    
    setRecent(recent) {
        this.set('recent', recent);
    },
    
    // Theme
    getTheme() {
        return this.get('theme', 'light');
    },
    
    setTheme(theme) {
        this.set('theme', theme);
    }
};
