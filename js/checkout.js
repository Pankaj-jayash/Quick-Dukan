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
        
        // Location
        this.locationBtn = document.getElementById('getLocationBtn');
        this.locationText = document.getElementById('locationText');
        
        this.cartItems = [];
        this.storageKey = 'quick-dukan-user-info';
        this.locationStorageKey = 'quick-dukan-location';
        this.isLocationLoaded = false;
        
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
        
        // Location button
        if (this.locationBtn) {
            this.locationBtn.addEventListener('click', () => this.getLiveLocation());
        }
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.checkoutModal.classList.contains('hidden')) {
                this.close();
            }
        });
    }
    
    open(cartItems, totalPrice, totalItems) {
        if (!this.checkoutModal) return;
        
        this.cartItems = cartItems || [];
        
        if (this.checkoutItemCount) this.checkoutItemCount.textContent = `${totalItems} आइटम`;
        if (this.checkoutTotal) this.checkoutTotal.textContent = `₹${totalPrice}`;
        
        this.renderSummaryDetail();
        this.fillSavedData();
        
        this.checkoutModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            this.autoGetLocation();
        }, 500);
        
        const checkoutContent = this.checkoutModal.querySelector('.checkout-content');
        if (checkoutContent) {
            checkoutContent.scrollTop = 0;
        }
    }
    
    close() {
        if (!this.checkoutModal) return;
        
        const checkoutContent = this.checkoutModal.querySelector('.checkout-content');
        if (checkoutContent) {
            checkoutContent.style.animation = 'scaleOut 0.28s ease forwards';
            setTimeout(() => {
                this.checkoutModal.classList.add('hidden');
                document.body.style.overflow = '';
                checkoutContent.style.animation = '';
            }, 270);
        } else {
            this.checkoutModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    renderSummaryDetail() {
        if (!this.summaryDetail) return;
        
        this.summaryDetail.innerHTML = '';
        const lang = window.languageManager?.currentLang || 'hi';
        
        this.cartItems.forEach(item => {
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
            if (this.customerPhone && data.phone) {
                this.customerPhone.value = data.phone;
                this.validatePhone();
            }
            if (this.villageCity && data.villageCity) this.villageCity.value = data.villageCity;
            if (this.landmark && data.landmark) this.landmark.value = data.landmark;
            if (this.pincode && data.pincode) this.pincode.value = data.pincode;
            
            const savedLoc = localStorage.getItem(this.locationStorageKey);
            if (savedLoc) {
                const loc = JSON.parse(savedLoc);
                if (this.latitude) this.latitude.value = loc.lat || '';
                if (this.longitude) this.longitude.value = loc.lng || '';
                if (this.locationUrl) this.locationUrl.value = loc.url || '';
                
                if (this.locationBtn) {
                    this.locationBtn.innerHTML = '<span class="location-icon">✅</span> लोकेशन मिल गई';
                    this.locationBtn.style.background = '#25D366';
                }
                if (this.locationText) this.locationText.classList.remove('hidden');
                this.isLocationLoaded = true;
            }
        } catch (e) {}
    }
    
    saveUserInfo() {
        if (!this.saveInfo || !this.saveInfo.checked) return;
        
        const data = {
            name: this.customerName?.value?.trim() || '',
            phone: this.customerPhone?.value?.replace(/\D/g, '') || '',
            villageCity: this.villageCity?.value?.trim() || '',
            landmark: this.landmark?.value?.trim() || '',
            pincode: this.pincode?.value?.trim() || '',
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {}
    }
    
    autoGetLocation() {
        if (this.isLocationLoaded) return;
        
        const savedLoc = localStorage.getItem(this.locationStorageKey);
        if (savedLoc) {
            try {
                const loc = JSON.parse(savedLoc);
                if (loc.lat && loc.lng) {
                    this.applyLocation(loc.lat, loc.lng, loc.url);
                    return;
                }
            } catch (e) {}
        }
        
        if (!navigator.geolocation) return;
        
        if (this.locationBtn) {
            this.locationBtn.innerHTML = '<span class="location-icon">⏳</span> लोकेशन ले रहे हैं...';
            this.locationBtn.classList.add('loading');
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const url = `https://maps.google.com/?q=${lat},${lng}`;
                
                this.applyLocation(lat, lng, url);
                this.saveLocationToStorage(lat, lng, url);
                this.reverseGeocode(lat, lng);
            },
            (error) => {
                console.log('📍 Auto location failed');
                if (this.locationBtn) {
                    this.locationBtn.innerHTML = '<span class="location-icon">📍</span> लोकेशन लें';
                    this.locationBtn.classList.remove('loading');
                }
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
        );
    }
    
    getLiveLocation() {
        if (!navigator.geolocation) {
            alert('आपके ब्राउज़र में लोकेशन सपोर्ट नहीं है');
            return;
        }
        
        if (this.locationBtn) {
            this.locationBtn.innerHTML = '<span class="location-icon">⏳</span> लोकेशन ले रहे हैं...';
            this.locationBtn.classList.add('loading');
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const url = `https://maps.google.com/?q=${lat},${lng}`;
                
                this.applyLocation(lat, lng, url);
                this.saveLocationToStorage(lat, lng, url);
                this.reverseGeocode(lat, lng);
                this.showToast('✅ लोकेशन मिल गई!');
            },
            (error) => {
                if (this.locationBtn) {
                    this.locationBtn.innerHTML = '<span class="location-icon">📍</span> लोकेशन लें';
                    this.locationBtn.classList.remove('loading');
                }
                this.showToast('⚠️ लोकेशन नहीं मिली');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
    
    applyLocation(lat, lng, url) {
        if (this.latitude) this.latitude.value = lat;
        if (this.longitude) this.longitude.value = lng;
        if (this.locationUrl) this.locationUrl.value = url;
        
        if (this.locationBtn) {
            this.locationBtn.innerHTML = '<span class="location-icon">✅</span> लोकेशन मिल गई';
            this.locationBtn.style.background = '#25D366';
            this.locationBtn.classList.remove('loading');
        }
        
        if (this.locationText) this.locationText.classList.remove('hidden');
        this.isLocationLoaded = true;
    }
    
    saveLocationToStorage(lat, lng, url) {
        try {
            localStorage.setItem(this.locationStorageKey, JSON.stringify({ lat, lng, url }));
        } catch (e) {}
    }
    
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                { headers: { 'Accept-Language': 'hi' } }
            );
            
            if (!response.ok) return;
            
            const data = await response.json();
            
            if (data && data.address) {
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
                
                if (city && this.villageCity && !this.villageCity.value) {
                    this.villageCity.value = city;
                    this.villageCity.classList.add('valid');
                }
            }
        } catch (error) {
            console.log('Reverse geocoding skipped');
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
        } else if (phone.length >= 10) {
            this.customerPhone.classList.remove('valid');
            this.customerPhone.classList.add('error');
            if (this.phoneError) this.phoneError.classList.remove('hidden');
        }
    }
    
    submitOrder() {
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
        
        this.saveUserInfo();
        
        const orderData = {
            customer: {
                name: name,
                phone: '+91 ' + phone,
                villageCity: villageCity,
                landmark: this.landmark?.value?.trim() || '',
                pincode: this.pincode?.value?.trim() || '',
                notes: this.orderNotes?.value?.trim() || '',
            },
            items: this.cartItems,
            totals: {
                total: this.cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
                itemCount: this.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
            },
            location: {
                lat: this.latitude?.value || '',
                lng: this.longitude?.value || '',
                url: this.locationUrl?.value || '',
            }
        };
        
        if (window.whatsappManager) {
            window.whatsappManager.sendOrder(orderData);
        } else {
            const fallbackUrl = `https://wa.me/919719312956?text=${encodeURIComponent('नमस्ते! Quick Dukan ऑर्डर')}`;
            window.open(fallbackUrl, '_blank');
        }
        
        if (window.ordersManager) {
            const savedOrder = window.ordersManager.saveOrder({
                items: this.cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    unit: item.unit,
                    discount: item.discount || 0,
                    quantity: item.quantity || 1,
                })),
                total: orderData.totals.total,
                itemCount: orderData.totals.itemCount,
            });
            
            document.dispatchEvent(new CustomEvent('orderPlaced', {
                detail: { orderId: savedOrder?.id }
            }));
        }
        
        this.close();
        
        if (window.cartManager) {
            window.cartManager.cart = [];
            window.cartManager.saveCart();
            window.cartManager.updateBadge();
            if (!document.getElementById('cartModal').classList.contains('hidden')) {
                window.cartManager.closeCart();
            }
        }
        
        this.showToast('✅ ऑर्डर WhatsApp पर भेज दिया!');
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

document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
});