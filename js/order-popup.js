// ============================================
// ORDER-POPUP.JS - Order Popups Logic
// Quick Dukan - Map Only on Confirm | Unclosable Delivery
// ============================================

class OrderPopupManager {
    constructor() {
        this.currentLang = 'hi';
        this.activePopup = null;
        this.deliveryRetryInterval = null;
        this.unansweredPopup = null;
        
        this.init();
        console.log('✅ Order Popup Manager Initialized');
    }
    
    init() {
        this.detectLanguage();
        
        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
        });
        
        // PWA Reopen — check for unanswered popup
        window.addEventListener('pageshow', () => {
            setTimeout(() => this.checkUnansweredPopup(), 500);
        });
        
        // Visibility change — when user returns to tab
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.unansweredPopup) {
                setTimeout(() => {
                    this.showStoredPopup();
                }, 500);
            }
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
                retryMessage: '⏱️ समय बढ़ा दिया गया, जल्द ही पहुँचेगा!',
                
                // Toast
                confirmed: '✅ ऑर्डर कन्फर्म हो गया!',
                cancelled: '❌ ऑर्डर रद्द कर दिया',
                delivered: '🎉 ऑर्डर डिलीवर हो गया!',
                reasonSent: '📤 कारण भेज दिया गया',
                mapOpened: '🗺️ लाइव ट्रैकिंग शुरू!',
                orderComplete: '🎉 आपका ऑर्डर पूरा हुआ! धन्यवाद!',
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
                retryMessage: '⏱️ Time extended, arriving soon!',
                
                confirmed: '✅ Order Confirmed!',
                cancelled: '❌ Order Cancelled',
                delivered: '🎉 Order Delivered!',
                reasonSent: '📤 Reason sent',
                mapOpened: '🗺️ Live tracking started!',
                orderComplete: '🎉 Your order is complete! Thank you!',
            }
        };
        
        return messages[this.currentLang]?.[key] || messages.hi[key] || key;
    }
    
    // ============================================
    // CHECK UNANSWERED POPUP (PWA Reopen)
    // ============================================
    checkUnansweredPopup() {
        if (!window.ordersManager) return;
        
        const orders = window.ordersManager.getOrders();
        const activeOrder = orders.find(o => o.status === 'confirmed' || o.status === 'in_transit');
        
        if (activeOrder && this.unansweredPopup) {
            console.log('🔄 PWA reopened — showing stored popup');
            this.showStoredPopup();
        }
    }
    
    showStoredPopup() {
        if (!this.unansweredPopup) return;
        
        const { type, order } = this.unansweredPopup;
        
        if (type === 'delivery' && order) {
            this.showDeliveryPopup(order);
        }
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
                    <button class="popup-btn popup-btn-confirm" id="btnConfirmOrder" type="button">
                        ${this.getMsg('confirmBtn')}
                    </button>
                    <button class="popup-btn popup-btn-cancel" id="btnCancelOrder" type="button">
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
        
        // 🔥 Use onclick for reliable button clicks
        const btnConfirm = overlay.querySelector('#btnConfirmOrder');
        const btnCancel = overlay.querySelector('#btnCancelOrder');
        
        btnConfirm.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.confirmOrder(orderData);
            this.hidePopup();
        };
        
        btnCancel.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hidePopup();
            setTimeout(() => this.showCancelReasonPopup(orderData), 300);
        };
        
        this.activePopup = 'success';
    }
    
    // ============================================
    // 🔥 CONFIRM ORDER — ONLY HERE MAP OPENS
    // ============================================
    confirmOrder(orderData) {
        if (window.ordersManager) {
            const orders = window.ordersManager.getOrders();
            const order = orders[0];
            
            if (order) {
                // Update status to confirmed (this calls startTracking in orders.js)
                // BUT we removed the map call from startTracking
                window.ordersManager.updateOrderStatus(order.id, 'confirmed');
                
                // 🔥 MAP SIRF YAHIN SE OPEN HOGA — Confirm button press ke baad
                setTimeout(() => {
                    if (window.floatingMapManager) {
                        const updatedOrder = window.ordersManager.getOrderById(order.id);
                        if (updatedOrder && updatedOrder.tracking?.customerLocation) {
                            window.floatingMapManager.show();
                            window.floatingMapManager.updateMapWithOrder(updatedOrder);
                            this.showToast(this.getMsg('mapOpened'));
                        } else {
                            console.warn('⚠️ No customer location found for tracking');
                            this.showToast(this.getMsg('confirmed'));
                        }
                    } else {
                        this.showToast(this.getMsg('confirmed'));
                    }
                }, 800);
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
                    <button class="popup-btn popup-btn-send" id="btnSendReason" type="button">
                        ${this.getMsg('sendReasonBtn')}
                    </button>
                    <button class="popup-btn-skip" id="btnSkipCancel" type="button">
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
        
        // Use onclick
        const btnSend = overlay.querySelector('#btnSendReason');
        const btnSkip = overlay.querySelector('#btnSkipCancel');
        
        btnSend.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const reason = document.getElementById('cancelReasonInput')?.value?.trim();
            this.cancelOrder(orderData, reason || 'कोई कारण नहीं');
            this.hidePopup();
        };
        
        btnSkip.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.cancelOrder(orderData, 'कोई कारण नहीं');
            this.hidePopup();
        };
        
        setTimeout(() => {
            document.getElementById('cancelReasonInput')?.focus();
        }, 500);
        
        this.activePopup = 'cancel';
    }
    
    // ============================================
    // 🔥 CANCEL ORDER — MAP NAHI KHULEGA
    // ============================================
    cancelOrder(orderData, reason) {
        if (window.ordersManager) {
            const orders = window.ordersManager.getOrders();
            const order = orders[0];
            
            if (order) {
                window.ordersManager.updateOrderStatus(order.id, 'cancelled');
                window.ordersManager.addCancelReason(order.id, reason);
                this.sendCancelWhatsApp(orderData, reason);
            }
        }
        
        // 🔥 MAP HIDE — Cancel pe map nahi khulega
        if (window.floatingMapManager) {
            window.floatingMapManager.hide();
            window.floatingMapManager.stopTimer();
            window.floatingMapManager.stopRiderUpdates();
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
    // POPUP 3: DELIVERY CONFIRMATION (UNCLOSABLE)
    // ============================================
    showDeliveryPopup(order) {
        this.hidePopup();
        
        // Store for PWA reopen
        this.unansweredPopup = { type: 'delivery', order: order };
        
        const overlay = document.createElement('div');
        overlay.className = 'order-popup-overlay';
        overlay.id = 'orderDeliveryPopup';
        
        // BLOCK overlay click (cannot close by tapping outside)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                e.stopPropagation();
                e.preventDefault();
            }
        });
        
        const isHindi = this.currentLang === 'hi';
        
        overlay.innerHTML = `
            <div class="order-popup-card" style="pointer-events:auto;">
                <div class="popup-icon">🚚</div>
                <h2 class="popup-title">${this.getMsg('deliveryTitle')}</h2>
                <p class="popup-message">${this.getMsg('deliveryMessage')}</p>
                <div class="popup-order-info">
                    <span>📦 #${order.id}</span>
                    <span>💰 ₹${order.total}</span>
                    <span>⏱️ ${order.deliveryTime || ''}</span>
                </div>
                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-yes" id="btnDeliveryYes" type="button">
                        ${this.getMsg('yesBtn')}
                    </button>
                    <button class="popup-btn popup-btn-no" id="btnDeliveryNo" type="button">
                        ${this.getMsg('noBtn')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        // Prevent escape key from closing
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        document.addEventListener('keydown', escapeHandler, true);
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // 🔥 Use onclick for BOTH buttons - RELIABLE
        const btnYes = overlay.querySelector('#btnDeliveryYes');
        const btnNo = overlay.querySelector('#btnDeliveryNo');
        
        btnYes.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener('keydown', escapeHandler, true);
            this.confirmDelivery(order);
            this.hidePopup();
        };
        
        btnNo.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener('keydown', escapeHandler, true);
            this.retryDelivery(order);
            this.hidePopup();
        };
        
        this.activePopup = 'delivery';
    }
    
    // ============================================
    // 🔥 CONFIRM DELIVERY — MAP HIDE
    // ============================================
    confirmDelivery(order) {
        // Clear unanswered popup
        this.unansweredPopup = null;
        
        if (window.ordersManager) {
            window.ordersManager.updateOrderStatus(order.id, 'delivered');
        }
        
        // 🔥 Hide floating map on delivery
        if (window.floatingMapManager) {
            window.floatingMapManager.hide();
            window.floatingMapManager.stopTimer();
            window.floatingMapManager.stopRiderUpdates();
        }
        
        this.showToast(this.getMsg('orderComplete'));
    }
    
    // ============================================
    // 🔥 RETRY DELIVERY — ADD EXTRA TIME
    // ============================================
    retryDelivery(order) {
        // Clear unanswered popup (will be set again when timer ends)
        this.unansweredPopup = null;
        
        if (window.ordersManager) {
            window.ordersManager.updateOrderStatus(order.id, 'in_transit');
        }
        
        // 🔥 ADD EXTRA TIME TO TIMER
        if (window.floatingMapManager) {
            window.floatingMapManager.addExtraTime();
            window.floatingMapManager.show();
        }
        
        this.showToast(this.getMsg('retryMessage'));
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
        this.unansweredPopup = null;
        if (this.deliveryRetryInterval) {
            clearInterval(this.deliveryRetryInterval);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.orderPopupManager = new OrderPopupManager();
});