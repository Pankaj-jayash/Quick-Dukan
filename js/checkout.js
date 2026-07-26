

// ============================================
// CHECKOUT.JS - Checkout Logic
// ============================================

class CheckoutManager {
    constructor() {
        this.checkoutModal = document.getElementById('checkoutModal');
        this.closeCheckoutBtn = document.getElementById('closeCheckout');
        this.confirmOrderBtn = document.getElementById('confirmOrderBtn');
        this.checkoutOverlay = this.checkoutModal ? this.checkoutModal.querySelector('.checkout-overlay') : null;
        
        // Form fields
        this.customerName = document.getElementById('customerName');
        this.customerPhone = document.getElementById('customerPhone');
        this.villageCity = document.getElementById('villageCity');
        this.landmark = document.getElementById('landmark');
        this.pincode = document.getElementById('pincode');
        this.orderNotes = document.getElementById('orderNotes');
        this.saveInfo = document.getElementById('saveInfo');
        this.latitude = document.getElementById('latitude');
        this.longitude = document.getElementById('longitude');
        this.locationUrl = document.getElementById('locationUrl');
        this.phoneError = document.getElementById('phoneError');
        
        // Summary
        this.checkoutItemCount = document.getElementById('checkoutItemCount');
        this.checkoutTotal = document.getElementById('checkoutTotal');
        this.summaryDetail = document.getElementById('summaryDetail');
        this.summaryToggle = document.getElementById('summaryToggle');
        
        this.cartItems = [];
        this.storageKey = 'quick-dukan-user-info';
        
        if (!this.checkoutModal) return;
        
        this.init();
        console.log('✅ Checkout Manager Initialized');
    }
    
    init() {
        // Close button
        if (this.closeCheckoutBtn) {
            const newBtn = this.closeCheckoutBtn.cloneNode(true);
            this.closeCheckoutBtn.parentNode.replaceChild(newBtn, this.closeCheckoutBtn);
            this.closeCheckoutBtn = newBtn;
            this.closeCheckoutBtn.addEventListener('click', () => this.close());
        }
        
        // Overlay
        if (this.checkoutOverlay) {
            const newOverlay = this.checkoutOverlay.cloneNode(true);
            this.checkoutOverlay.parentNode.replaceChild(newOverlay, this.checkoutOverlay);
            this.checkoutOverlay = newOverlay;
            this.checkoutOverlay.addEventListener('click', () => this.close());
        }
        
        // Confirm button
        if (this.confirmOrderBtn) {
            this.confirmOrderBtn.addEventListener('click', () => this.submitOrder());
        }
        
        // Phone validation
        if (this.customerPhone) {
            this.customerPhone.addEventListener('input', () => this.validatePhone());
        }
        
        // Summary toggle
        if (this.summaryToggle) {
            this.summaryToggle.addEventListener('click', () => this.toggleSummary());
        }
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }
    
    open(cartItems, totalPrice, totalItems) {
        if (!this.checkoutModal) return;
        
        this.cartItems = cartItems || [];
        
        // Fill summary
        if (this.checkoutItemCount) this.checkoutItemCount.textContent = `${totalItems} आइटम`;
        if (this.checkoutTotal) this.checkoutTotal.textContent = `₹${totalPrice}`;
        
        // Fill summary detail
        this.renderSummaryDetail();
        
        // Auto-fill saved data
        this.fillSavedData();
        
        // Show modal
        this.checkoutModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Trigger location auto-detect
        document.dispatchEvent(new CustomEvent('checkoutOpened'));
        
        // Try to apply saved location
        setTimeout(() => {
            if (window.locationManager) {
                window.locationManager.applySavedLocation();
            }
        }, 300);
    }
    
    close() {
        if (!this.checkoutModal) return;
        this.checkoutModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    renderSummaryDetail() {
        if (!this.summaryDetail) return;
        
        this.summaryDetail.innerHTML = '';
        
        this.cartItems.forEach(item => {
            const lang = window.languageManager?.currentLang || 'hi';
            const name = item.name ? (item.name[lang] || item.name.hi || item.name.en || '') : '';
            
            const row = document.createElement('div');
            row.className = 'summary-detail-item';
            row.innerHTML = `
                <span>${name} × ${item.quantity || 1}</span>
                <span>₹${(item.price || 0) * (item.quantity || 1)}</span>
            `;
            this.summaryDetail.appendChild(row);
        });
    }
    
    toggleSummary() {
        if (!this.summaryDetail) return;
        this.summaryDetail.classList.toggle('hidden');
        const arrow = this.summaryToggle.querySelector('.toggle-arrow');
        if (arrow) arrow.classList.toggle('open');
    }
    
    fillSavedData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;
            
            const data = JSON.parse(saved);
            
            if (this.customerName && data.name) this.customerName.value = data.name;
            if (this.customerPhone && data.phone) this.customerPhone.value = data.phone;
            if (this.villageCity && data.villageCity) this.villageCity.value = data.villageCity;
            if (this.landmark && data.landmark) this.landmark.value = data.landmark;
            if (this.pincode && data.pincode) this.pincode.value = data.pincode;
            if (this.latitude && data.lat) this.latitude.value = data.lat;
            if (this.longitude && data.lng) this.longitude.value = data.lng;
            if (this.locationUrl && data.locationUrl) this.locationUrl.value = data.locationUrl;
            
            // Auto-validate phone
            if (data.phone) this.validatePhone();
        } catch (e) {
            // ignore
        }
    }
    
    saveUserInfo() {
        if (!this.saveInfo || !this.saveInfo.checked) return;
        
        const data = {
            name: this.customerName?.value || '',
            phone: this.customerPhone?.value || '',
            villageCity: this.villageCity?.value || '',
            landmark: this.landmark?.value || '',
            pincode: this.pincode?.value || '',
            lat: this.latitude?.value || '',
            lng: this.longitude?.value || '',
            locationUrl: this.locationUrl?.value || '',
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            // ignore
        }
    }
    
    validatePhone() {
        if (!this.customerPhone) return;
        
        const phone = this.customerPhone.value.replace(/\D/g, '');
        
        if (phone.length === 0) {
            this.customerPhone.classList.remove('error', 'valid');
            if (this.phoneError) this.phoneError.classList.add('hidden');
            return;
        }
        
        if (phone.length === 10 && /^[6-9]/.test(phone)) {
            this.customerPhone.classList.remove('error');
            this.customerPhone.classList.add('valid');
            if (this.phoneError) this.phoneError.classList.add('hidden');
        } else {
            this.customerPhone.classList.remove('valid');
            this.customerPhone.classList.add('error');
            if (this.phoneError && phone.length >= 10) {
                this.phoneError.classList.remove('hidden');
            }
        }
    }
    
    submitOrder() {
        // Validate
        const name = this.customerName?.value?.trim();
        const phone = this.customerPhone?.value?.replace(/\D/g, '');
        const villageCity = this.villageCity?.value?.trim();
        
        if (!name) {
            this.showToast('⚠️ कृपया अपना नाम लिखें');
            this.customerName?.focus();
            return;
        }
        
        if (!phone || phone.length !== 10 || !/^[6-9]/.test(phone)) {
            this.showToast('⚠️ कृपया सही मोबाइल नंबर डालें');
            this.customerPhone?.focus();
            return;
        }
        
        if (!villageCity) {
            this.showToast('⚠️ कृपया गाँव/शहर का नाम लिखें');
            this.villageCity?.focus();
            return;
        }
        
        // Save info
        this.saveUserInfo();
        
        // Build WhatsApp message
        const message = this.buildWhatsAppMessage(name, phone);
        
        // Open WhatsApp
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        
        // Save order
        if (window.ordersManager) {
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
                total: this.cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
                itemCount: this.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
            });
        }
        
        // Close checkout
        this.close();
        
        // Clear cart
        if (window.cartManager) {
            window.cartManager.cart = [];
            window.cartManager.saveCart();
            window.cartManager.updateBadge();
            window.cartManager.closeCart();
        }
        
        this.showToast('✅ ऑर्डर WhatsApp पर भेज दिया!');
    }
    
    buildWhatsAppMessage(name, phone) {
        const lang = window.languageManager?.currentLang || 'hi';
        
        let msg = '🛒 *Quick Dukan - नया ऑर्डर*\n\n';
        msg += '━━━━━━━━━━━━━━━━\n\n';
        
        // Customer info
        msg += '👤 *ग्राहक की जानकारी*\n';
        msg += `   नाम: ${name}\n`;
        msg += `   फ़ोन: +91 ${phone}\n`;
        
        const villageCity = this.villageCity?.value?.trim();
        const landmark = this.landmark?.value?.trim();
        const pincode = this.pincode?.value?.trim();
        
        if (villageCity) msg += `   गाँव/शहर: ${villageCity}\n`;
        if (landmark) msg += `   आस-पास: ${landmark}\n`;
        if (pincode) msg += `   पिन कोड: ${pincode}\n`;
        
        msg += '\n━━━━━━━━━━━━━━━━\n\n';
        
        // Order items
        msg += '📦 *ऑर्डर डिटेल*\n\n';
        
        this.cartItems.forEach((item, i) => {
            const itemName = item.name ? (item.name[lang] || item.name.hi || item.name.en || '') : '';
            const unit = item.unit ? (item.unit[lang] || item.unit.hi || item.unit.en || '') : '';
            const price = item.price || 0;
            const qty = item.quantity || 1;
            
            msg += `${i + 1}. ${itemName}\n`;
            msg += `   ${unit} × ${qty} = ₹${price * qty}\n`;
        });
        
        const total = this.cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const itemCount = this.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        msg += '\n━━━━━━━━━━━━━━━━\n';
        msg += `📦 कुल आइटम: ${itemCount}\n`;
        msg += `💰 कुल राशि: ₹${total}\n`;
        
        if (total >= 500) {
            msg += '🚚 डिलीवरी: *फ्री!* 🎉\n';
        }
        
        msg += '\n━━━━━━━━━━━━━━━━\n\n';
        
        // Order notes
        const notes = this.orderNotes?.value?.trim();
        if (notes) {
            msg += `📝 *नोट:* ${notes}\n\n`;
        }
        
        // Location
        const lat = this.latitude?.value;
        const lng = this.longitude?.value;
        const locationUrl = this.locationUrl?.value;
        
        if (lat && lng && locationUrl) {
            msg += '📍 *लाइव लोकेशन:*\n';
            msg += `   ${locationUrl}\n\n`;
            msg += '   (मैप खोलने के लिए लिंक पर क्लिक करें)\n';
        }
        
        msg += '\n🙏 कृपया ऑर्डर कन्फर्म करें।';
        
        return msg;
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
});

