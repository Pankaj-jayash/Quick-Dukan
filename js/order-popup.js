// ============================================
// ORDER-POPUP.JS - Smart Order Status with Timer
// ============================================

class OrderPopupManager {
    constructor() {
        this.popupModal = null;
        this.currentOrder = null;
        this.popupStage = 'deliver'; // 'deliver' only (auto confirm)
        this.retryCount = 0;
        this.maxRetries = 3;
        this.timerInterval = null;
        this.popupTimeout = null;
        this.isPopupVisible = false;
        this.activeTimers = {}; // Track timers per order
        
        // Timings
        this.autoConfirmDelay = 35 * 1000;      // 35 seconds auto confirm
        this.deliveryDelay = 15 * 60 * 1000;    // 15 minutes for delivery
        this.retryDelayMin = 5 * 60 * 1000;     // 5 minutes retry
        this.retryDelayMax = 10 * 60 * 1000;    // 10 minutes retry
        
        this.storageKey = 'quick-dukan-popup-state';
        this.timerStorageKey = 'quick-dukan-order-timers';
        
        this.createPopupHTML();
        this.init();
        console.log('✅ Order Popup Manager Ready');
        console.log('⏱️ Auto Confirm: 35s | Delivery Check: 15min');
    }
    
    createPopupHTML() {
        const popup = document.createElement('div');
        popup.id = 'orderStatusPopup';
        popup.className = 'order-popup-modal hidden';
        popup.innerHTML = `
            <div class="order-popup-overlay"></div>
            <div class="order-popup-content">
                <div class="order-popup-icon" id="popupIcon">🚚</div>
                <h2 class="order-popup-title" id="popupTitle">डिलीवरी हुई क्या?</h2>
                <p class="order-popup-message" id="popupMessage">
                    क्या आपका ऑर्डर डिलीवर हो गया?
                </p>
                <div class="order-popup-order-detail" id="popupOrderDetail"></div>
                <div class="order-popup-buttons">
                    <button class="popup-btn popup-btn-yes" id="popupBtnYes">
                        <span>✅</span> हाँ, डिलीवर हो गया!
                    </button>
                    <button class="popup-btn popup-btn-no" id="popupBtnNo">
                        <span>❌</span> अभी नहीं आया
                    </button>
                </div>
                <p class="order-popup-retry" id="popupRetry"></p>
            </div>
        `;
        
        document.body.appendChild(popup);
        this.popupModal = popup;
        
        this.popupOverlay = popup.querySelector('.order-popup-overlay');
        this.popupContent = popup.querySelector('.order-popup-content');
        this.popupIcon = document.getElementById('popupIcon');
        this.popupTitle = document.getElementById('popupTitle');
        this.popupMessage = document.getElementById('popupMessage');
        this.popupOrderDetail = document.getElementById('popupOrderDetail');
        this.popupRetry = document.getElementById('popupRetry');
        this.btnYes = document.getElementById('popupBtnYes');
        this.btnNo = document.getElementById('popupBtnNo');
        
        this.btnYes.addEventListener('click', () => this.handleYes());
        this.btnNo.addEventListener('click', () => this.handleNo());
    }
    
    init() {
        // Check for pending orders on load
        setTimeout(() => {
            this.checkAllOrders();
        }, 2000);
        
        // Listen for new orders
        document.addEventListener('orderPlaced', (e) => {
            const orderId = e.detail?.orderId;
            if (orderId) {
                this.startOrderTracking(orderId);
            }
        });
        
        // Refresh orders display periodically
        setInterval(() => {
            this.updateOrdersDisplay();
        }, 5000);
    }
    
    /**
     * Start tracking a new order
     */
    startOrderTracking(orderId) {
        console.log('🆕 Tracking order:', orderId);
        
        // Step 1: Auto confirm after 35 seconds
        setTimeout(() => {
            this.autoConfirmOrder(orderId);
        }, this.autoConfirmDelay);
        
        // Save timer info
        this.saveTimerInfo(orderId, {
            orderTime: Date.now(),
            autoConfirmAt: Date.now() + this.autoConfirmDelay,
            deliveryCheckAt: Date.now() + this.autoConfirmDelay + this.deliveryDelay,
        });
        
        // Update display
        this.updateOrdersDisplay();
    }
    
    /**
     * Auto confirm order
     */
    autoConfirmOrder(orderId) {
        if (!window.ordersManager) return;
        
        const orders = window.ordersManager.getOrders();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) return;
        
        // Only if still pending
        if (order.status === 'pending') {
            window.ordersManager.updateOrderStatus(orderId, 'confirmed');
            console.log('✅ Auto confirmed:', orderId);
            
            // Show toast
            this.showToast('✅ ऑर्डर कन्फर्म हो गया!');
            
            // Update display
            this.updateOrdersDisplay();
            
            // Step 2: Schedule delivery popup after 15 minutes
            setTimeout(() => {
                this.checkAndShowDeliveryPopup(orderId);
            }, this.deliveryDelay);
        }
    }
    
    /**
     * Check and show delivery popup
     */
    checkAndShowDeliveryPopup(orderId) {
        if (!window.ordersManager) return;
        
        const orders = window.ordersManager.getOrders();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) return;
        
        // Only show if confirmed (not yet delivered)
        if (order.status === 'confirmed') {
            this.showPopup(order);
        }
    }
    
    /**
     * Check all orders on init
     */
    checkAllOrders() {
        if (!window.ordersManager) return;
        
        const orders = window.ordersManager.getOrders();
        const now = Date.now();
        
        orders.forEach(order => {
            if (order.status === 'pending') {
                // Check if auto-confirm time has passed
                const orderTime = new Date(order.date).getTime();
                const elapsed = now - orderTime;
                
                if (elapsed >= this.autoConfirmDelay) {
                    // Should have been confirmed
                    window.ordersManager.updateOrderStatus(order.id, 'confirmed');
                    
                    // Check delivery popup
                    if (elapsed >= this.autoConfirmDelay + this.deliveryDelay) {
                        this.showPopup(order);
                    } else {
                        // Schedule delivery popup
                        const remaining = (this.autoConfirmDelay + this.deliveryDelay) - elapsed;
                        setTimeout(() => {
                            this.checkAndShowDeliveryPopup(order.id);
                        }, remaining);
                    }
                } else {
                    // Schedule auto confirm
                    const remaining = this.autoConfirmDelay - elapsed;
                    setTimeout(() => {
                        this.autoConfirmOrder(order.id);
                    }, remaining);
                }
            } else if (order.status === 'confirmed') {
                // Check if delivery time has passed
                const orderTime = new Date(order.date).getTime();
                const elapsed = now - orderTime;
                
                if (elapsed >= this.autoConfirmDelay + this.deliveryDelay) {
                    this.showPopup(order);
                } else {
                    const remaining = (this.autoConfirmDelay + this.deliveryDelay) - elapsed;
                    setTimeout(() => {
                        this.checkAndShowDeliveryPopup(order.id);
                    }, remaining);
                }
            }
        });
        
        this.updateOrdersDisplay();
    }
    
    showPopup(order) {
        if (this.isPopupVisible) return;
        
        this.currentOrder = order;
        this.isPopupVisible = true;
        
        const popupState = this.getPopupState(order.id) || {};
        this.retryCount = popupState.deliverRetryCount || 0;
        
        // Update content
        this.popupIcon.textContent = '🚚';
        this.popupTitle.textContent = 'डिलीवरी हुई क्या?';
        this.popupMessage.textContent = `क्या ऑर्डर #${order.id.slice(-6)} डिलीवर हो गया?`;
        
        this.popupOrderDetail.innerHTML = `
            <div class="popup-order-info">
                <span>📦 ${order.itemCount} आइटम</span>
                <span>💰 ₹${order.total}</span>
            </div>
            <div class="popup-order-timer" style="margin-top:8px;font-size:12px;color:#888;">
                ⏱️ ऑर्डर समय: ${new Date(order.date).toLocaleTimeString('hi-IN')}
            </div>
        `;
        
        if (this.retryCount > 0) {
            this.popupRetry.textContent = `पूछने का प्रयास: ${this.retryCount}/${this.maxRetries}`;
            this.popupRetry.style.display = 'block';
        } else {
            this.popupRetry.style.display = 'none';
        }
        
        // Show with animation
        this.popupModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Vibration effect
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Save state
        this.savePopupState(order.id, { deliverPopupShown: true });
    }
    
    hidePopup() {
        this.popupContent.style.animation = 'popupSlideOut 0.3s ease forwards';
        setTimeout(() => {
            this.popupModal.classList.add('hidden');
            document.body.style.overflow = '';
            this.popupContent.style.animation = '';
            this.isPopupVisible = false;
            this.currentOrder = null;
        }, 280);
    }
    
    handleYes() {
        if (!this.currentOrder) return;
        
        // Mark as delivered
        window.ordersManager.updateOrderStatus(this.currentOrder.id, 'delivered');
        this.savePopupState(this.currentOrder.id, {
            deliverTime: Date.now(),
            delivered: true,
            deliverRetryCount: 0,
        });
        
        // Celebration effect
        this.celebrateDelivery();
        
        this.showToast('🎉 ऑर्डर डिलीवर हो गया! शुक्रिया!');
        this.retryCount = 0;
        
        setTimeout(() => {
            this.hidePopup();
            this.updateOrdersDisplay();
        }, 800);
    }
    
    handleNo() {
        if (!this.currentOrder) return;
        
        this.retryCount++;
        
        if (this.retryCount >= this.maxRetries) {
            this.savePopupState(this.currentOrder.id, {
                deliverRetryCount: this.retryCount,
                maxRetriesReached: true,
            });
            
            this.showToast('⚠️ बाद में चेक कर लीजिएगा');
            this.hidePopup();
            return;
        }
        
        // Save state
        this.savePopupState(this.currentOrder.id, {
            deliverRetryCount: this.retryCount,
        });
        
        // Hide popup
        this.hidePopup();
        
        // Random delay for next popup
        const randomDelay = this.retryDelayMin + Math.random() * (this.retryDelayMax - this.retryDelayMin);
        const minutes = Math.round(randomDelay / 60000);
        
        this.showToast(`⏰ ${minutes} मिनट बाद फिर पूछा जाएगा (${this.retryCount}/${this.maxRetries})`);
        
        setTimeout(() => {
            if (this.currentOrder) {
                const orders = window.ordersManager.getOrders();
                const order = orders.find(o => o.id === this.currentOrder.id);
                if (order && order.status === 'confirmed') {
                    this.showPopup(order);
                }
            }
        }, randomDelay);
    }
    
    celebrateDelivery() {
        // Create confetti effect
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    top: -10px;
                    left: ${Math.random() * 100}%;
                    z-index: 9999;
                    border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                    pointer-events: none;
                    animation: confettiFall ${1 + Math.random() * 2}s ease-in forwards;
                `;
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
    }
    
    saveTimerInfo(orderId, info) {
        try {
            const data = localStorage.getItem(this.timerStorageKey);
            const timers = data ? JSON.parse(data) : {};
            timers[orderId] = info;
            localStorage.setItem(this.timerStorageKey, JSON.stringify(timers));
        } catch (e) {}
    }
    
    getTimerInfo(orderId) {
        try {
            const data = localStorage.getItem(this.timerStorageKey);
            const timers = data ? JSON.parse(data) : {};
            return timers[orderId] || null;
        } catch (e) {
            return null;
        }
    }
    
    getPopupState(orderId) {
        try {
            const data = localStorage.getItem(this.storageKey);
            const states = data ? JSON.parse(data) : {};
            return states[orderId] || null;
        } catch (e) {
            return null;
        }
    }
    
    savePopupState(orderId, state) {
        try {
            const data = localStorage.getItem(this.storageKey);
            const states = data ? JSON.parse(data) : {};
            states[orderId] = { ...states[orderId], ...state };
            localStorage.setItem(this.storageKey, JSON.stringify(states));
        } catch (e) {}
    }
    
    /**
     * Update My Orders display with timer
     */
    updateOrdersDisplay() {
        if (!window.ordersManager) return;
        
        const ordersModal = document.getElementById('ordersModal');
        if (!ordersModal || ordersModal.classList.contains('hidden')) return;
        
        // Re-render to show updated status
        window.ordersManager.render();
        
        // Add timer displays
        this.addTimerDisplays();
    }
    
    /**
     * Add countdown timers to order cards
     */
    addTimerDisplays() {
        const orderCards = document.querySelectorAll('.order-card');
        
        orderCards.forEach(card => {
            const orderId = card.querySelector('.order-id')?.textContent?.replace('#', '');
            if (!orderId) return;
            
            // Remove existing timer
            const existingTimer = card.querySelector('.order-live-timer');
            if (existingTimer) existingTimer.remove();
            
            // Find order
            const orders = window.ordersManager.getOrders();
            const order = orders.find(o => o.id === orderId);
            if (!order) return;
            
            // Add timer based on status
            const timerEl = document.createElement('div');
            timerEl.className = 'order-live-timer';
            
            if (order.status === 'pending') {
                const orderTime = new Date(order.date).getTime();
                const confirmAt = orderTime + this.autoConfirmDelay;
                const remaining = confirmAt - Date.now();
                
                if (remaining > 0) {
                    timerEl.innerHTML = `
                        <span class="timer-icon">⏳</span>
                        <span class="timer-text">कन्फर्म होने में: <strong>${this.formatTime(remaining)}</strong></span>
                    `;
                    timerEl.style.cssText = 'background:#FFF3E0;color:#E65100;';
                } else {
                    timerEl.innerHTML = '<span>✅ कन्फर्म हो रहा है...</span>';
                    timerEl.style.cssText = 'background:#E8F5E9;color:#2E7D32;';
                }
            } else if (order.status === 'confirmed') {
                const orderTime = new Date(order.date).getTime();
                const deliverCheckAt = orderTime + this.autoConfirmDelay + this.deliveryDelay;
                const remaining = deliverCheckAt - Date.now();
                
                if (remaining > 0) {
                    timerEl.innerHTML = `
                        <span class="timer-icon">🚚</span>
                        <span class="timer-text">डिलीवरी चेक: <strong>${this.formatTime(remaining)}</strong></span>
                    `;
                    timerEl.style.cssText = 'background:#E3F2FD;color:#1565C0;';
                }
            } else if (order.status === 'delivered') {
                timerEl.innerHTML = '<span>🎉 डिलीवर हो गया!</span>';
                timerEl.style.cssText = 'background:#E8F5E9;color:#2E7D32;';
            }
            
            // Insert after order summary
            const summary = card.querySelector('.order-summary');
            if (summary) {
                summary.after(timerEl);
            }
        });
    }
    
    formatTime(ms) {
        if (ms <= 0) return 'अभी';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours} घंटा ${minutes % 60} मिनट`;
        } else if (minutes > 0) {
            return `${minutes} मिनट ${seconds % 60} सेकंड`;
        } else {
            return `${seconds} सेकंड`;
        }
    }
    
    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2500);
    }
}

// Add CSS
const popupStyles = document.createElement('style');
popupStyles.textContent = `
    .order-popup-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
    .order-popup-modal.hidden { display: none; }
    
    .order-popup-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    }
    
    .order-popup-content {
        position: relative;
        width: 100%;
        max-width: 380px;
        background: #fff;
        border-radius: 24px;
        padding: 30px 24px 24px;
        text-align: center;
        animation: popupBounceIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    
    @keyframes popupBounceIn {
        0% { opacity: 0; transform: scale(0.3) translateY(100px); }
        50% { transform: scale(1.05) translateY(-10px); }
        70% { transform: scale(0.95) translateY(5px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    
    @keyframes popupSlideOut {
        from { opacity: 1; transform: scale(1) translateY(0); }
        to { opacity: 0; transform: scale(0.5) translateY(50px); }
    }
    
    @keyframes confettiFall {
        to { top: 100vh; transform: rotate(720deg); opacity: 0; }
    }
    
    .order-popup-icon {
        font-size: 60px;
        display: block;
        margin-bottom: 12px;
    }
    
    .order-popup-title {
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 8px;
        color: #1a1a1a;
    }
    
    .order-popup-message {
        font-size: 14px;
        color: #666;
        margin: 0 0 16px;
    }
    
    .order-popup-order-detail {
        background: rgba(106, 27, 154, 0.06);
        border-radius: 12px;
        padding: 10px;
        margin-bottom: 20px;
    }
    
    .popup-order-info {
        display: flex;
        justify-content: space-around;
        font-weight: 600;
        color: #6A1B9A;
    }
    
    .order-popup-buttons {
        display: flex;
        gap: 12px;
    }
    
    .popup-btn {
        flex: 1;
        padding: 14px 16px;
        border: none;
        border-radius: 14px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    
    .popup-btn-yes {
        background: linear-gradient(135deg, #25D366, #128C7E);
        color: white;
        box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
    }
    
    .popup-btn-yes:hover { transform: translateY(-2px); }
    .popup-btn-yes:active { transform: scale(0.95); }
    
    .popup-btn-no {
        background: rgba(0,0,0,0.06);
        color: #666;
    }
    
    .popup-btn-no:hover { background: rgba(0,0,0,0.1); }
    .popup-btn-no:active { transform: scale(0.95); }
    
    .order-popup-retry {
        margin-top: 12px;
        font-size: 11px;
        color: #999;
        display: none;
    }
    
    /* Order Live Timer */
    .order-live-timer {
        margin: 8px 16px;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .order-live-timer .timer-icon {
        font-size: 16px;
    }
    
    .order-live-timer .timer-text strong {
        font-weight: 700;
    }
    
    /* Dark Mode */
    body.dark-mode .order-popup-content { background: #1f2b47; }
    body.dark-mode .order-popup-title { color: #e0e0e0; }
    body.dark-mode .order-popup-message { color: #aaa; }
    body.dark-mode .order-popup-order-detail { background: rgba(255,255,255,0.04); }
    body.dark-mode .popup-btn-no { background: rgba(255,255,255,0.08); color: #aaa; }
`;

document.head.appendChild(popupStyles);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.orderPopupManager = new OrderPopupManager();
    }, 500);
});