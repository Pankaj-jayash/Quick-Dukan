// ============================================
// ORDERS.JS - My Orders Logic (FIXED)
// ============================================

class OrdersManager {
    constructor() {
        this.ordersModal = document.getElementById('ordersModal');
        this.ordersList = document.getElementById('ordersList');
        this.emptyOrders = document.getElementById('emptyOrders');
        this.closeOrdersBtn = document.getElementById('closeOrders');
        this.ordersOverlay = null;
        this.filterBtns = document.querySelectorAll('.order-filter-btn');
        this.activeFilter = 'all';
        this.storageKey = 'quick-dukan-orders';
        this.expandedOrder = null;
        
        // Check if modal exists
        if (!this.ordersModal) {
            console.error('❌ Orders Modal not found in DOM! Check if id="ordersModal" exists in HTML');
            return;
        }
        
        this.ordersOverlay = this.ordersModal.querySelector('.orders-overlay');
        
        this.init();
        console.log('✅ Orders Manager Initialized');
    }
    
    init() {
        // Close button
        if (this.closeOrdersBtn) {
            this.closeOrdersBtn.addEventListener('click', () => this.close());
        } else {
            console.warn('⚠️ Close button #closeOrders not found');
        }
        
        // Overlay click
        if (this.ordersOverlay) {
            this.ordersOverlay.addEventListener('click', () => this.close());
        }
        
        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn);
            });
        });
        
        // Start shopping button
        const startBtn = document.querySelector('.start-shopping-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.close();
                const allProducts = document.getElementById('allProductsSection');
                if (allProducts) {
                    allProducts.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        // DIRECT EVENT LISTENER for orders button in bottom nav
        document.addEventListener('click', (e) => {
            const ordersBtn = e.target.closest('[data-nav="orders"]');
            if (ordersBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📋 Orders button clicked via direct listener');
                this.open();
                return;
            }
        });
        
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }
    
    // Get all orders from localStorage
    getOrders() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading orders:', e);
            return [];
        }
    }
    
    // Save a new order
    saveOrder(orderData) {
        const orders = this.getOrders();
        orders.unshift({
            id: 'ORD-' + Date.now().toString(36).toUpperCase(),
            date: new Date().toISOString(),
            status: 'pending',
            items: orderData.items || [],
            total: orderData.total || 0,
            itemCount: orderData.itemCount || 0,
            timeline: [
                { label: 'भेजा गया', time: new Date().toISOString(), completed: true },
                { label: 'कन्फर्म', time: null, completed: false },
                { label: 'डिलीवर्ड', time: null, completed: false },
            ],
        });
        localStorage.setItem(this.storageKey, JSON.stringify(orders));
        console.log('✅ Order saved:', orders[0].id);
return newOrder;
    }
    
    // Filter orders
    getFilteredOrders() {
        const orders = this.getOrders();
        if (this.activeFilter === 'all') return orders;
        return orders.filter(o => o.status === this.activeFilter);
    }
    
    setFilter(btn) {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.getAttribute('data-filter');
        this.render();
    }
    
    open() {
        if (!this.ordersModal) {
            console.error('❌ Cannot open - ordersModal is null');
            return;
        }
        
        console.log('📋 Opening orders modal...');
        this.render();
        this.ordersModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        if (!this.ordersModal) return;
        this.ordersModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.expandedOrder = null;
    }
    
    render() {
        if (!this.ordersList) {
            console.error('❌ ordersList element not found');
            return;
        }
        
        const orders = this.getFilteredOrders();
        this.ordersList.innerHTML = '';
        
        if (orders.length === 0) {
            if (this.emptyOrders) this.emptyOrders.classList.remove('hidden');
            return;
        }
        
        if (this.emptyOrders) this.emptyOrders.classList.add('hidden');
        
        orders.forEach(order => {
            const card = this.createOrderCard(order);
            this.ordersList.appendChild(card);
        });
    }
    
    createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'order-card fade-in';
        
        const date = new Date(order.date);
        const dateStr = date.toLocaleDateString('hi-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        const statusLabels = {
            pending: '⏳ पेंडिंग',
            confirmed: '✅ कन्फर्म',
            delivered: '🚚 डिलीवर्ड'
        };
        
        const previewItems = order.items.slice(0, 4);
        const moreCount = order.items.length - 4;
        
        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <div class="order-id">#${order.id}</div>
                    <div class="order-date">${dateStr}</div>
                </div>
                <span class="order-status ${order.status}">${statusLabels[order.status] || '⏳ पेंडिंग'}</span>
            </div>
            
            <div class="order-items-preview">
                ${previewItems.map(item => `
                    <img src="${item.image || 'https://via.placeholder.com/40'}" 
                         alt="${item.name?.hi || ''}" 
                         class="order-item-thumb"
                         onerror="this.src='https://via.placeholder.com/40?text=📦'">
                `).join('')}
                ${moreCount > 0 ? `<span class="order-item-more">+${moreCount}</span>` : ''}
            </div>
            
            <div class="order-summary">
                <span class="order-total">₹${order.total}</span>
                <span class="order-item-count">${order.itemCount} आइटम</span>
            </div>
            
            <div class="order-timeline">
                ${order.timeline.map((step, i) => `
                    ${i > 0 ? `<div class="timeline-line ${step.completed ? 'completed' : ''}"></div>` : ''}
                    <div class="timeline-step ${step.completed ? 'completed' : ''} ${!step.completed && (i === 0 || order.timeline[i-1].completed) ? 'active' : ''}">
                        <div class="timeline-dot"></div>
                        <span>${step.label}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-actions">
                <button class="order-action-btn reorder-btn" data-order-id="${order.id}">
                    🔄 दोबारा ऑर्डर
                </button>
                <button class="order-action-btn view-detail-btn" data-order-id="${order.id}">
                    📋 डिटेल
                </button>
            </div>
            
            <div class="order-detail hidden" id="detail-${order.id}">
                ${order.items.map(item => `
                    <div class="order-detail-item">
                        <span>${item.name?.hi || item.name?.en || 'प्रोडक्ट'} × ${item.quantity || 1}</span>
                        <span>₹${(item.price || 0) * (item.quantity || 1)}</span>
                    </div>
                `).join('')}
                <div class="order-detail-item">
                    <span>कुल</span>
                    <span>₹${order.total}</span>
                </div>
            </div>
        `;
        
        // Event Listeners
        card.querySelector('.reorder-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.reorder(order);
        });
        
        card.querySelector('.view-detail-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDetail(order.id);
        });
        
        return card;
    }
    
    toggleDetail(orderId) {
        const detail = document.getElementById(`detail-${orderId}`);
        if (!detail) return;
        
        if (this.expandedOrder === orderId) {
            detail.classList.add('hidden');
            this.expandedOrder = null;
        } else {
            if (this.expandedOrder) {
                const prev = document.getElementById(`detail-${this.expandedOrder}`);
                if (prev) prev.classList.add('hidden');
            }
            detail.classList.remove('hidden');
            this.expandedOrder = orderId;
        }
    }
    
    reorder(order) {
        if (!window.cartManager) {
            console.error('❌ Cart manager not available');
            return;
        }
        
        // Clear current cart
        window.cartManager.cart = [];
        
        // Add all items from order
        order.items.forEach(item => {
            window.cartManager.cart.push({
                id: item.id || ('RE-' + Date.now().toString(36)),
                name: item.name,
                price: item.price,
                image: item.image,
                unit: item.unit,
                discount: item.discount || 0,
                quantity: item.quantity || 1,
            });
        });
        
        window.cartManager.saveCart();
        window.cartManager.updateBadge();
        
        // Close orders and open cart
        this.close();
        setTimeout(() => {
            if (window.cartManager) window.cartManager.openCart();
        }, 300);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a tiny bit to ensure DOM is fully ready
    setTimeout(() => {
        window.ordersManager = new OrdersManager();
    }, 100);
});