// ============================================
// ORDER-POPUP.JS - Order Popups Logic
// Quick Dukan - Success | Cancel | Delivery | Map
// ============================================

class OrderPopupManager {
    constructor() {
        this.currentLang = 'hi';
        this.activePopup = null;
        this.deliveryRetryInterval = null;
        
        this.init();
        console.log('✅ Order Popup Manager Initialized');
    }
    
    init() {
        this.detectLanguage();
        
        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
        });
    }
    
    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }
    
    getMsg(key) {
        const messages = {
            hi: {
                // Success Popup
                successTitle: '🎉 ऑर्डर तैयार है!',
                successMessage: 'आपका ऑर्डर पैक हो गया है। क्या हम इसे आपके पास भेजें?',
                confirmBtn: '✅ हाँ, लाएं!',
                cancelBtn: '❌ रद्द करें',
                
                // Cancel Popup
                cancelTitle: '😔 ऑर्डर रद्द करें',
                cancelMessage: 'कृपया बताएं कि आप ऑर्डर क्यों रद्द करना चाहते हैं?',
                cancelPlaceholder: 'कारण लिखें...',
                sendReasonBtn: '📤 कारण भेजें',
                skipBtn: 'बिना कारण छोड़ें',
                
                // Delivery Popup
                deliveryTitle: '🚚 डिलीवरी कन्फर्मेशन',
                deliveryMessage: 'क्या आपका ऑर्डर आ गया?',
                yesBtn: '✅ हाँ, आ गया!',
                noBtn: '❌ नहीं आया',
                retryMessage: 'हम 5 मिनट बाद फिर पूछेंगे।',
                
                // Toast
                confirmed: '✅ ऑर्डर कन्फर्म हो गया!',
                cancelled: '❌ ऑर्डर रद्द कर दिया',
                delivered: '🎉 ऑर्डर डिलीवर हो गया!',
                reasonSent: '📤 कारण भेज दिया गया',
                
                // Map
                mapOpened: '🗺️ लाइव ट्रैकिंग मैप खुल गया!',
            },
            en: {
                successTitle: '🎉 Order Ready!',
                successMessage: 'Your order is packed. Shall we send it to you?',
                confirmBtn: '✅ Yes, Send it!',
                cancelBtn: '❌ Cancel Order',
                
                cancelTitle: '😔 Cancel Order',
                cancelMessage: 'Please tell us why you want to cancel?',
                cancelPlaceholder: 'Write reason...',
                sendReasonBtn: '📤 Send Reason',
                skipBtn: 'Skip without reason',
                
                deliveryTitle: '🚚 Delivery Confirmation',
                deliveryMessage: 'Has your order arrived?',
                yesBtn: '✅ Yes, Arrived!',
                noBtn: '❌ Not Yet',
                retryMessage: 'We will check again in 5 minutes.',
                
                confirmed: '✅ Order Confirmed!',
                cancelled: '❌ Order Cancelled',
                delivered: '🎉 Order Delivered!',
                reasonSent: '📤 Reason sent',
                
                mapOpened: '🗺️ Live tracking map opened!',
            }
        };
        
        return messages[this.currentLang]?.[key] || messages.hi[key] || key;
    }
    
    // ============================================
    // POPUP 1: SUCCESS (Confirm/Cancel)
    // ============================================
    showSuccessPopup(orderData) {
        this.hidePopup();
        
        const overlay = document.createElement('div');
        overlay.className = 'order-popup-overlay';
        overlay.id = 'orderSuccessPopup';
        
        const isHindi = this.currentLang === 'hi';
        
        overlay.innerHTML = `
            <div class="order-popup-card">
                <div class="popup-icon">🛵</div>
                <h2 class="popup-title">${this.getMsg('successTitle')}</h2>
                <p class="popup-message">${this.getMsg('successMessage')}</p>
                <div class="popup-order-info">
                    <span>📦 ${orderData.itemCount || 0} ${isHindi ? 'आइटम' : 'items'}</span>
                    <span>💰 ₹${orderData.total || 0}</span>
                    <span>⏱️ ${orderData.deliveryTime || (isHindi ? 'अभी' : 'Now')}</span>
                </div>
                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-confirm" id="btnConfirmOrder">
                        ${this.getMsg('confirmBtn')}
                    </button>
                    <button class="popup-btn popup-btn-cancel" id="btnCancelOrder">
                        ${this.getMsg('cancelBtn')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // Events
        overlay.querySelector('#btnConfirmOrder').addEventListener('click', () => {
            this.confirmOrder(orderData);
            this.hidePopup();
        });
        
        overlay.querySelector('#btnCancelOrder').addEventListener('click', () => {
            this.hidePopup();
            setTimeout(() => this.showCancelReasonPopup(orderData), 300);
        });
        
        this.activePopup = 'success';
    }
    
    // ============================================
    // 🔥 CONFIRM ORDER — UPDATE STATUS + SHOW MAP
    // ============================================
    confirmOrder(orderData) {
        // Update order status to confirmed
        if (window.ordersManager) {
            const orders = window.ordersManager.getOrders();
            const order = orders[0]; // Latest order
            
            if (order) {
                // Update status to confirmed
                window.ordersManager.updateOrderStatus(order.id, 'confirmed');
                
                // 🔥 SHOW FLOATING MAP AFTER CONFIRM
                setTimeout(() => {
                    if (window.floatingMapManager) {
                        // Get fresh order data with customer location
                        const updatedOrder = window.ordersManager.getOrderById(order.id);
                        if (updatedOrder && updatedOrder.tracking?.customerLocation) {
                            // Show and update the floating map
                            window.floatingMapManager.show();
                            window.floatingMapManager.updateMapWithOrder(updatedOrder);
                            
                            // Show toast
                            this.showToast(this.getMsg('mapOpened'));
                        } else {
                            console.warn('⚠️ No customer location found for tracking');
                            this.showToast(this.getMsg('confirmed'));
                        }
                    } else {
                        this.showToast(this.getMsg('confirmed'));
                    }
                }, 600);
            }
        }
    }
    
    // ============================================
    // POPUP 2: CANCEL REASON
    // ============================================
    showCancelReasonPopup(orderData) {
        this.hidePopup();
        
        const overlay = document.createElement('div');
        overlay.className = 'order-popup-overlay';
        overlay.id = 'orderCancelPopup';
        
        overlay.innerHTML = `
            <div class="order-popup-card">
                <div class="popup-icon">😔</div>
                <h2 class="popup-title">${this.getMsg('cancelTitle')}</h2>
                <p class="popup-message">${this.getMsg('cancelMessage')}</p>
                <textarea class="cancel-reason-textarea" id="cancelReasonInput" 
                          rows="3" placeholder="${this.getMsg('cancelPlaceholder')}"></textarea>
                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-send" id="btnSendReason">
                        ${this.getMsg('sendReasonBtn')}
                    </button>
                    <button class="popup-btn-skip" id="btnSkipCancel">
                        ${this.getMsg('skipBtn')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // Events
        overlay.querySelector('#btnSendReason').addEventListener('click', () => {
            const reason = document.getElementById('cancelReasonInput')?.value?.trim();
            this.cancelOrder(orderData, reason || 'कोई कारण नहीं');
            this.hidePopup();
        });
        
        overlay.querySelector('#btnSkipCancel').addEventListener('click', () => {
            this.cancelOrder(orderData, 'कोई कारण नहीं');
            this.hidePopup();
        });
        
        // Focus textarea
        setTimeout(() => {
            document.getElementById('cancelReasonInput')?.focus();
        }, 500);
        
        this.activePopup = 'cancel';
    }
    
    cancelOrder(orderData, reason) {
        if (window.ordersManager) {
            const orders = window.ordersManager.getOrders();
            const order = orders[0];
            
            if (order) {
                window.ordersManager.updateOrderStatus(order.id, 'cancelled');
                window.ordersManager.addCancelReason(order.id, reason);
                
                // Send WhatsApp message
                this.sendCancelWhatsApp(orderData, reason);
            }
        }
        
        this.showToast(this.getMsg('cancelled'));
    }
    
    sendCancelWhatsApp(orderData, reason) {
        const isHindi = this.currentLang === 'hi';
        
        let message = isHindi
            ? '❌ *Quick Dukan - ऑर्डर रद्द*\n\n'
            : '❌ *Quick Dukan - Order Cancelled*\n\n';
        
        message += isHindi ? 'कारण: ' : 'Reason: ';
        message += reason + '\n\n';
        
        message += isHindi
            ? `📦 ऑर्डर: ${orderData.itemCount} आइटम | 💰 ₹${orderData.total}\n`
            : `📦 Order: ${orderData.itemCount} items | 💰 ₹${orderData.total}\n`;
        
        message += isHindi ? '\n🙏 धन्यवाद!' : '\n🙏 Thank you!';
        
        const phoneNumber = window.CONFIG?.whatsappNumber || '919719312956';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        this.showToast(this.getMsg('reasonSent'));
    }
    
    // ============================================
    // POPUP 3: DELIVERY CONFIRMATION
    // ============================================
    showDeliveryPopup(order) {
        this.hidePopup();
        
        const overlay = document.createElement('div');
        overlay.className = 'order-popup-overlay';
        overlay.id = 'orderDeliveryPopup';
        
        const isHindi = this.currentLang === 'hi';
        
        overlay.innerHTML = `
            <div class="order-popup-card">
                <div class="popup-icon">🚚</div>
                <h2 class="popup-title">${this.getMsg('deliveryTitle')}</h2>
                <p class="popup-message">${this.getMsg('deliveryMessage')}</p>
                <div class="popup-order-info">
                    <span>📦 #${order.id}</span>
                    <span>💰 ₹${order.total}</span>
                    <span>⏱️ ${order.deliveryTime || ''}</span>
                </div>
                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-yes" id="btnDeliveryYes">
                        ${this.getMsg('yesBtn')}
                    </button>
                    <button class="popup-btn popup-btn-no" id="btnDeliveryNo">
                        ${this.getMsg('noBtn')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // Events
        overlay.querySelector('#btnDeliveryYes').addEventListener('click', () => {
            this.confirmDelivery(order);
            this.hidePopup();
        });
        
        overlay.querySelector('#btnDeliveryNo').addEventListener('click', () => {
            this.retryDelivery(order);
            this.hidePopup();
        });
        
        this.activePopup = 'delivery';
    }
    
    confirmDelivery(order) {
        if (window.ordersManager) {
            window.ordersManager.updateOrderStatus(order.id, 'delivered');
        }
        
        this.showToast(this.getMsg('delivered'));
    }
    
    retryDelivery(order) {
        if (window.ordersManager) {
            window.ordersManager.updateOrderStatus(order.id, 'in_transit');
        }
        
        this.showToast(this.getMsg('retryMessage'));
        
        setTimeout(() => {
            const updatedOrder = window.ordersManager?.getOrderById(order.id);
            if (updatedOrder && updatedOrder.status !== 'delivered') {
                this.showDeliveryPopup(updatedOrder);
            }
        }, 300000);
    }
    
    // ============================================
    // HIDE POPUP
    // ============================================
    hidePopup() {
        const popups = document.querySelectorAll('.order-popup-overlay');
        popups.forEach(popup => {
            popup.classList.remove('visible');
            setTimeout(() => {
                if (popup.parentNode) popup.remove();
            }, 300);
        });
        
        const otherModals = document.getElementById('checkoutModal');
        if (!otherModals || otherModals.classList.contains('hidden')) {
            document.body.style.overflow = '';
        }
        
        this.activePopup = null;
    }
    
    // ============================================
    // TOAST
    // ============================================
    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = msg;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';
        
        setTimeout(() => {
            if (toast) {
                toast.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => {
                    if (toast) toast.classList.add('hidden');
                }, 300);
            }
        }, 2500);
    }
    
    // ============================================
    // DESTROY
    // ============================================
    destroy() {
        this.hidePopup();
        if (this.deliveryRetryInterval) {
            clearInterval(this.deliveryRetryInterval);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.orderPopupManager = new OrderPopupManager();
});