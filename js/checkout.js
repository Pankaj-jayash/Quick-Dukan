// ============================================
// CHECKOUT.JS - Premium Checkout Logic (Final)
// Quick Dukan - Uses LocationManager | Multilingual | Location Fix
// ============================================

class CheckoutManager {
    constructor() {
        // DOM Elements
        this.checkoutModal = document.getElementById('checkoutModal');
        this.closeCheckoutBtn = document.getElementById('closeCheckout');
        this.confirmOrderBtn = document.getElementById('confirmOrderBtn');
        this.checkoutOverlay = this.checkoutModal?.querySelector('.checkout-overlay') || null;
        
        // Form fields
        this.customerName = document.getElementById('customerName');
        this.customerPhone = document.getElementById('customerPhone');
        this.villageCity = document.getElementById('villageCity');
        this.landmark = document.getElementById('landmark');
        this.pincode = document.getElementById('pincode');
        this.saveInfo = document.getElementById('saveInfo');
        
        // Cart total display
        this.checkoutItemCount = document.getElementById('checkoutItemCount');
        this.checkoutTotal = document.getElementById('checkoutTotal');
        
        // Delivery time
        this.deliveryTimeRadios = document.querySelectorAll('input[name="deliveryTime"]');
        this.manualTimeInput = document.getElementById('manualTime');
        
        // Confetti
        this.confettiContainer = document.getElementById('checkoutConfetti');
        
        // Data
        this.cartItems = [];
        this.cartTotal = 0;
        this.cartItemCount = 0;
        this.currentLang = 'hi';
        this.storageKey = 'quick-dukan-user-info';
        
        // 🔥 LOCATION MANAGER (from location.js)
        this.location = null;
        
        if (!this.checkoutModal) return;
        this.init();
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    init() {
        this.bindEvents();
        this.detectLanguage();
        this.initLocation();
        console.log('✅ Checkout Manager Initialized');
    }
    
    initLocation() {
        // Wait for LocationManager to be ready
        const checkLocation = setInterval(() => {
            if (window.locationManager) {
                clearInterval(checkLocation);
                this.location = window.locationManager;
                
                // Set indicator element
                const indicator = document.getElementById('locationIndicator');
                if (indicator) {
                    this.location.setIndicator(indicator);
                }
                
                console.log('📍 LocationManager linked to CheckoutManager');
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkLocation), 5000);
    }
    
    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
        if (this.location) {
            this.location.setLanguage(this.currentLang);
        }
    }
    
    getMsg(section, key) {
        const messages = {
            header: {
                hi: { title: 'ऑर्डर कन्फर्म करें', subtitle: 'डिलीवरी जानकारी भरें' },
                en: { title: 'Confirm Order', subtitle: 'Fill delivery details' }
            },
            cartTotal: {
                hi: { items: '{count} आइटम', total: 'कुल' },
                en: { items: '{count} items', total: 'Total' }
            },
            form: {
                hi: {
                    namePlaceholder: '👤  पूरा नाम लिखें...',
                    phonePlaceholder: '📱  मोबाइल नंबर',
                    villagePlaceholder: '🏘️  गाँव या शहर',
                    landmarkPlaceholder: '🏠  आस-पास की जगह (वैकल्पिक)',
                    pincodePlaceholder: '📮  पिन कोड (वैकल्पिक)',
                    deliveryTime: '⏱️  डिलीवरी समय',
                    now: 'अभी (30-45 मिनट)',
                    evening1: 'शाम 5-7 बजे',
                    evening2: 'शाम 7-9 बजे',
                    manual: 'अपना समय...',
                    saveInfo: 'जानकारी सेव करें'
                },
                en: {
                    namePlaceholder: '👤  Enter full name...',
                    phonePlaceholder: '📱  Mobile number',
                    villagePlaceholder: '🏘️  Village or City',
                    landmarkPlaceholder: '🏠  Nearby place (optional)',
                    pincodePlaceholder: '📮  Pincode (optional)',
                    deliveryTime: '⏱️  Delivery Time',
                    now: 'Now (30-45 min)',
                    evening1: 'Evening 5-7 PM',
                    evening2: 'Evening 7-9 PM',
                    manual: 'Custom time...',
                    saveInfo: 'Save information'
                }
            },
            button: {
                hi: {
                    waiting: '⏳ लोकेशन का इंतज़ार...',
                    gpsoff: '🔒 कृपया GPS चालू करें',
                    ready: '💬 WhatsApp पर भेजें →',
                    sending: '⏳ भेज रहे हैं...'
                },
                en: {
                    waiting: '⏳ Waiting for location...',
                    gpsoff: '🔒 Please turn ON GPS',
                    ready: '💬 Send on WhatsApp →',
                    sending: '⏳ Sending...'
                }
            },
            toast: {
                hi: {
                    orderSent: '✅ ऑर्डर WhatsApp पर भेज दिया!',
                    nameRequired: '⚠️ कृपया नाम लिखें',
                    phoneRequired: '⚠️ सही मोबाइल नंबर डालें',
                    cityRequired: '⚠️ गाँव/शहर लिखें',
                    gpsRequired: '⚠️ कृपया GPS चालू करें और लोकेशन लें'
                },
                en: {
                    orderSent: '✅ Order sent on WhatsApp!',
                    nameRequired: '⚠️ Please enter name',
                    phoneRequired: '⚠️ Enter valid mobile number',
                    cityRequired: '⚠️ Enter village/city',
                    gpsRequired: '⚠️ Please turn ON GPS and get location'
                }
            }
        };
        
        return messages[section]?.[this.currentLang]?.[key] || 
               messages[section]?.en?.[key] || 
               `[${key}]`;
    }
    
    // ============================================
    // EVENT BINDING
    // ============================================
    bindEvents() {
        // Close button
        this.closeCheckoutBtn?.addEventListener('click', () => this.close());
        
        // Overlay
        this.checkoutOverlay?.addEventListener('click', () => this.close());
        
        // Confirm button
        this.confirmOrderBtn?.addEventListener('click', () => this.handleOrderButton());
        
        // Phone validation
        this.customerPhone?.addEventListener('input', () => this.validatePhone());
        
        // Delivery time radios
        this.deliveryTimeRadios?.forEach(radio => {
            radio.addEventListener('change', () => this.updateTimeSelection());
        });
        
        // Manual time input
        this.manualTimeInput?.addEventListener('input', () => {
            this.deliveryTimeRadios?.forEach(r => r.checked = false);
            this.updateTimeSelection();
        });
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.checkoutModal.classList.contains('hidden')) {
                this.close();
            }
        });
        
        // Language change
        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
            this.updateAllLabels();
        });
    }
    
    updateTimeSelection() {
        document.querySelectorAll('.time-radio-label').forEach(label => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                label.classList.add('selected');
            } else {
                label.classList.remove('selected');
            }
        });
    }
    
    // ============================================
    // OPEN / CLOSE
    // ============================================
    open(cartItems, totalPrice, totalItems) {
        if (!this.checkoutModal) return;
        
        this.cartItems = cartItems || [];
        this.cartTotal = totalPrice || 0;
        this.cartItemCount = totalItems || 0;
        
        // Update cart total display
        this.updateCartTotal();
        
        // Update all labels
        this.updateAllLabels();
        
        // Auto-fill saved data
        this.fillSavedData();
        
        // Reset time selection
        this.resetTimeSelection();
        
        // Show modal
        this.checkoutModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Set button state: WAITING
        this.setButtonState('waiting');
        
        // 🔥 START LOCATION via LocationManager
        if (this.location) {
            this.location.setLanguage(this.currentLang);
            this.location.start(
                (data) => this.onLocationFound(data),
                (error) => this.onLocationError(error)
            );
        }
    }
    
    close() {
        if (!this.checkoutModal) return;
        
        // 🔥 STOP LOCATION via LocationManager
        if (this.location) {
            this.location.stop();
        }
        
        // Clear form
        this.clearForm();
        
        this.checkoutModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    clearForm() {
        if (this.customerName) this.customerName.value = '';
        if (this.customerPhone) this.customerPhone.value = '';
        if (this.villageCity) this.villageCity.value = '';
        if (this.landmark) this.landmark.value = '';
        if (this.pincode) this.pincode.value = '';
        if (this.manualTimeInput) this.manualTimeInput.value = '';
        
        this.deliveryTimeRadios?.forEach(r => r.checked = false);
        document.querySelectorAll('.time-radio-label').forEach(l => l.classList.remove('selected'));
        document.querySelectorAll('.form-input').forEach(el => {
            el.classList.remove('error', 'valid');
        });
    }
    
    resetTimeSelection() {
        const nowRadio = document.querySelector('input[value="अभी"]') || 
                         document.querySelector('input[value="Now"]');
        if (nowRadio) nowRadio.checked = true;
        if (this.manualTimeInput) this.manualTimeInput.value = '';
        this.updateTimeSelection();
    }
    
    // ============================================
    // LOCATION CALLBACKS (from LocationManager)
    // ============================================
    
    onLocationFound(data) {
        console.log('📍 Location found!', data);
        this.setButtonState('ready');
    }
    
    onLocationError(error) {
        console.log('📍 Location error:', error);
        this.setButtonState('gpsoff');
    }
    
    // ============================================
    // CART TOTAL
    // ============================================
    updateCartTotal() {
        if (this.checkoutItemCount) {
            this.checkoutItemCount.textContent = this.getMsg('cartTotal', 'items').replace('{count}', this.cartItemCount);
        }
        if (this.checkoutTotal) {
            this.checkoutTotal.textContent = `₹${this.cartTotal}`;
        }
    }
    
    // ============================================
    // UPDATE ALL LABELS
    // ============================================
    updateAllLabels() {
        // Header
        const title = document.getElementById('checkoutTitle');
        const subtitle = document.querySelector('.checkout-subtitle');
        if (title) title.textContent = this.getMsg('header', 'title');
        if (subtitle) subtitle.textContent = this.getMsg('header', 'subtitle');
        
        // Cart total
        this.updateCartTotal();
        
        // Form placeholders
        if (this.customerName) this.customerName.placeholder = this.getMsg('form', 'namePlaceholder');
        if (this.customerPhone) this.customerPhone.placeholder = this.getMsg('form', 'phonePlaceholder');
        if (this.villageCity) this.villageCity.placeholder = this.getMsg('form', 'villagePlaceholder');
        if (this.landmark) this.landmark.placeholder = this.getMsg('form', 'landmarkPlaceholder');
        if (this.pincode) this.pincode.placeholder = this.getMsg('form', 'pincodePlaceholder');
        
        // Delivery time
        const timeLabel = document.querySelector('.delivery-time-label span:last-child');
        if (timeLabel) timeLabel.textContent = this.getMsg('form', 'deliveryTime');
        
        const nowLabel = document.querySelector('label[for="timeNow"] span:last-child');
        const eve1Label = document.querySelector('label[for="timeEve1"] span:last-child');
        const eve2Label = document.querySelector('label[for="timeEve2"] span:last-child');
        if (nowLabel) nowLabel.textContent = this.getMsg('form', 'now');
        if (eve1Label) eve1Label.textContent = this.getMsg('form', 'evening1');
        if (eve2Label) eve2Label.textContent = this.getMsg('form', 'evening2');
        
        if (this.manualTimeInput) this.manualTimeInput.placeholder = this.getMsg('form', 'manual');
        
        // Save checkbox
        const saveText = document.querySelector('.checkbox-label span:last-child');
        if (saveText) saveText.textContent = this.getMsg('form', 'saveInfo');
        
        // Button
        if (this.location?.isReady()) {
            this.setButtonState('ready');
        } else if (this.location?.isSearching) {
            this.setButtonState('waiting');
        } else {
            this.setButtonState('gpsoff');
        }
    }
    
    // ============================================
    // BUTTON STATES
    // ============================================
    setButtonState(state) {
        if (!this.confirmOrderBtn) return;
        
        this.confirmOrderBtn.classList.remove('state-waiting', 'state-gpsoff', 'state-ready', 'state-sending');
        
        const existingSpinner = this.confirmOrderBtn.querySelector('.btn-spinner');
        if (existingSpinner) existingSpinner.remove();
        
        const btnText = this.confirmOrderBtn.querySelector('span:last-child');
        const whatsappIcon = this.confirmOrderBtn.querySelector('.whatsapp-icon');
        
        switch (state) {
            case 'waiting':
                this.confirmOrderBtn.classList.add('state-waiting');
                this.confirmOrderBtn.disabled = true;
                if (btnText) btnText.textContent = this.getMsg('button', 'waiting');
                this.confirmOrderBtn.insertAdjacentHTML('afterbegin', '<span class="btn-spinner"></span>');
                if (whatsappIcon) whatsappIcon.style.display = 'none';
                break;
                
            case 'gpsoff':
                this.confirmOrderBtn.classList.add('state-gpsoff');
                this.confirmOrderBtn.disabled = false;
                if (btnText) btnText.textContent = this.getMsg('button', 'gpsoff');
                if (whatsappIcon) whatsappIcon.style.display = 'none';
                break;
                
            case 'ready':
                this.confirmOrderBtn.classList.add('state-ready');
                this.confirmOrderBtn.disabled = false;
                if (btnText) btnText.textContent = this.getMsg('button', 'ready');
                if (whatsappIcon) whatsappIcon.style.display = 'inline';
                break;
                
            case 'sending':
                this.confirmOrderBtn.classList.add('state-sending');
                this.confirmOrderBtn.disabled = true;
                if (btnText) btnText.textContent = this.getMsg('button', 'sending');
                this.confirmOrderBtn.insertAdjacentHTML('afterbegin', '<span class="btn-spinner"></span>');
                if (whatsappIcon) whatsappIcon.style.display = 'none';
                break;
        }
    }
    
    handleOrderButton() {
        // 🔥 If GPS off state → show GPS popup via LocationManager
        if (this.confirmOrderBtn.classList.contains('state-gpsoff')) {
            if (this.location) {
                this.location.showPopup();
            }
            return;
        }
        
        if (this.confirmOrderBtn.classList.contains('state-ready')) {
            this.submitOrder();
            return;
        }
    }
    
    // ============================================
    // VALIDATION
    // ============================================
    validatePhone() {
        if (!this.customerPhone) return;
        
        const phone = this.customerPhone.value.replace(/\D/g, '');
        
        if (phone.length === 0) {
            this.customerPhone.classList.remove('error', 'valid');
            return;
        }
        
        if (phone.length === 10 && /^[6-9]/.test(phone)) {
            this.customerPhone.classList.remove('error');
            this.customerPhone.classList.add('valid');
        } else {
            this.customerPhone.classList.remove('valid');
            this.customerPhone.classList.add('error');
        }
    }
    
    // ============================================
    // 🔥 SUBMIT ORDER — FIXED LOCATION
    // ============================================
    submitOrder() {
        const name = this.customerName?.value?.trim();
        const phone = this.customerPhone?.value?.replace(/\D/g, '');
        const villageCity = this.villageCity?.value?.trim();
        
        // Validate Name
        if (!name || name.length < 2) {
            this.showToast(this.getMsg('toast', 'nameRequired'));
            this.customerName?.classList.add('error');
            this.customerName?.focus();
            return;
        }
        this.customerName?.classList.remove('error');
        
        // Validate Phone
        if (!phone || phone.length !== 10 || !/^[6-9]/.test(phone)) {
            this.showToast(this.getMsg('toast', 'phoneRequired'));
            this.customerPhone?.classList.add('error');
            this.customerPhone?.focus();
            return;
        }
        this.customerPhone?.classList.remove('error');
        
        // Validate Village/City
        if (!villageCity || villageCity.length < 2) {
            this.showToast(this.getMsg('toast', 'cityRequired'));
            this.villageCity?.classList.add('error');
            this.villageCity?.focus();
            return;
        }
        this.villageCity?.classList.remove('error');
        
        // 🔥 FIX: Get location DIRECTLY from hidden fields
        const lat = document.getElementById('latitude')?.value;
        const lng = document.getElementById('longitude')?.value;
        const locationUrl = document.getElementById('locationUrl')?.value;
        
        console.log('📍 Direct Location Check:', { lat, lng, locationUrl });
        
        // 🔥 Build location data
        let locationData = { lat: '', lng: '', url: '' };
        
        if (lat && lng && parseFloat(lat) !== 0 && parseFloat(lng) !== 0) {
            // Use hidden field values directly
            locationData = {
                lat: lat,
                lng: lng,
                url: locationUrl || `https://maps.google.com/?q=${lat},${lng}`
            };
            console.log('✅ Location from hidden fields:', locationData);
        } else if (this.location && this.location.isReady()) {
            // Fallback to location manager
            locationData = this.location.getData();
            console.log('✅ Location from manager:', locationData);
        }
        
        // 🔥 FINAL VALIDATION: Ensure we have coordinates
        if (!locationData.lat || !locationData.lng || 
            parseFloat(locationData.lat) === 0 || parseFloat(locationData.lng) === 0) {
            console.error('❌ Invalid coordinates:', locationData);
            this.showToast(this.getMsg('toast', 'gpsRequired'));
            if (this.location) {
                this.location.showPopup();
            }
            return;
        }
        
        // ALL VALID - SEND
        this.setButtonState('sending');
        
        // Save user info
        this.saveUserInfo();
        
        // Get delivery time
        const deliveryTime = this.getSelectedDeliveryTime();
        
        // Build order data
        const orderData = {
            customer: {
                name: name,
                phone: '+91 ' + phone,
                villageCity: villageCity,
                landmark: this.landmark?.value?.trim() || '',
                pincode: this.pincode?.value?.trim() || '',
                deliveryTime: deliveryTime,
            },
            items: this.cartItems,
            totals: {
                total: this.cartTotal,
                itemCount: this.cartItemCount,
            },
            location: locationData,
        };
        
        console.log('📦 Final Order Data:', JSON.stringify(orderData, null, 2));
        
        // Send via WhatsApp
        if (window.whatsappManager?.sendOrder) {
            window.whatsappManager.sendOrder(orderData);
        } else {
            this.sendDirectWhatsApp(orderData);
        }
        
        // 🔥 Save to order history WITH location
        if (window.ordersManager?.saveOrder) {
            window.ordersManager.saveOrder({
                items: this.cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    unit: item.unit,
                    discount: item.discount || 0,
                    quantity: item.quantity || 1,
                })),
                total: this.cartTotal,
                itemCount: this.cartItemCount,
                deliveryTime: deliveryTime,
                location: locationData,
            });
        }
        
        // Success animation
        this.triggerConfetti();
        
        // 🔥 SHOW SUCCESS POPUP
        setTimeout(() => {
            if (window.orderPopupManager) {
                window.orderPopupManager.showSuccessPopup({
                    itemCount: this.cartItemCount,
                    total: this.cartTotal,
                    deliveryTime: deliveryTime,
                });
            }
        }, 1500);
        
        // Close after delay
        setTimeout(() => {
            this.close();
            
            // Clear cart
            if (window.cartManager) {
                window.cartManager.cart = [];
                window.cartManager.saveCart();
                window.cartManager.updateBadge();
                if (!document.getElementById('cartModal')?.classList.contains('hidden')) {
                    window.cartManager.closeCart();
                }
            }
            
            this.showToast(this.getMsg('toast', 'orderSent'));
        }, 2000);
    }
    
    getSelectedDeliveryTime() {
        const checkedRadio = document.querySelector('input[name="deliveryTime"]:checked');
        if (checkedRadio) return checkedRadio.value;
        
        const manualTime = this.manualTimeInput?.value?.trim();
        if (manualTime) return manualTime;
        
        return this.currentLang === 'hi' ? 'अभी' : 'Now';
    }
    
    sendDirectWhatsApp(orderData) {
        const isHindi = this.currentLang === 'hi';
        
        let message = isHindi
            ? '🛒 *Quick Dukan - नया ऑर्डर*\n\n━━━━━━━━━━━━━━━━\n\n'
            : '🛒 *Quick Dukan - New Order*\n\n━━━━━━━━━━━━━━━━\n\n';
        
        orderData.items.forEach((item, index) => {
            const name = typeof item.name === 'object' 
                ? (item.name[this.currentLang] || item.name.hi || item.name.en) 
                : item.name;
            const unit = typeof item.unit === 'object' 
                ? (item.unit[this.currentLang] || item.unit.hi || item.unit.en) 
                : (item.unit || '');
            message += `${index + 1}. *${name}*\n   ${unit} × ${item.quantity || 1} = ₹${(item.price || 0) * (item.quantity || 1)}\n`;
        });
        
        message += '\n━━━━━━━━━━━━━━━━\n';
        message += isHindi
            ? `📦 कुल: ${orderData.totals.itemCount} आइटम | 💰 कुल राशि: ₹${orderData.totals.total}\n\n`
            : `📦 Total: ${orderData.totals.itemCount} items | 💰 Total: ₹${orderData.totals.total}\n\n`;
        
        message += isHindi ? '👤 *ग्राहक जानकारी:*\n' : '👤 *Customer Info:*\n';
        message += `${orderData.customer.name}\n`;
        message += `${orderData.customer.phone}\n`;
        message += `${orderData.customer.villageCity}`;
        if (orderData.customer.landmark) message += `, ${orderData.customer.landmark}`;
        message += '\n';
        if (orderData.customer.deliveryTime) {
            message += isHindi 
                ? `⏱️ डिलीवरी: ${orderData.customer.deliveryTime}\n` 
                : `⏱️ Delivery: ${orderData.customer.deliveryTime}\n`;
        }
        if (orderData.location.url) {
            message += `\n📍 ${orderData.location.url}\n`;
        }
        message += isHindi ? '\n🙏 कृपया ऑर्डर कन्फर्म करें।' : '\n🙏 Please confirm the order.';
        
        const whatsappNumber = window.CONFIG?.whatsappNumber || '919719312956';
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
    
    // ============================================
    // SAVE / LOAD USER INFO
    // ============================================
    saveUserInfo() {
        if (!this.saveInfo?.checked) return;
        
        const data = {
            name: this.customerName?.value || '',
            phone: this.customerPhone?.value || '',
            villageCity: this.villageCity?.value || '',
            landmark: this.landmark?.value || '',
            pincode: this.pincode?.value || '',
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {}
    }
    
    fillSavedData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;
            
            const data = JSON.parse(saved);
            
            if (this.customerName && data.name) this.customerName.value = data.name;
            if (this.customerPhone && data.phone) {
                this.customerPhone.value = data.phone;
                this.validatePhone();
            }
            if (this.villageCity && data.villageCity) this.villageCity.value = data.villageCity;
            if (this.landmark && data.landmark) this.landmark.value = data.landmark;
            if (this.pincode && data.pincode) this.pincode.value = data.pincode;
        } catch (e) {}
    }
    
    // ============================================
    // EFFECTS
    // ============================================
    triggerConfetti() {
        if (!this.confettiContainer) return;
        
        const colors = ['#FF9933', '#138808', '#FFD700', '#FF4444', '#25D366', '#FF6D00'];
        
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            piece.style.animationDuration = (Math.random() * 1 + 1) + 's';
            this.confettiContainer.appendChild(piece);
            setTimeout(() => piece.remove(), 2000);
        }
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
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2500);
    }
    
    // ============================================
    // DESTROY
    // ============================================
    destroy() {
        if (this.location) {
            this.location.stop();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
});