// ============================================
// LOCATION.JS - Complete v6
// All Functions Connected | Production Ready
// ============================================

class LocationManager {
    constructor() {
        // State
        this.isFound = false;
        this.isSearching = false;
        this.popupVisible = false;
        this.currentLang = 'hi';

        // Loop control
        this.retryInterval = null;
        this.retryDelays = [1500, 2000, 3000, 4000, 5000];
        this.currentRetryAttempt = 0;
        this.maxAttempts = 15;

        // GPS settings
        this.gpsTimeout = 5000;
        this.highAccuracy = true;
        this.maximumAge = 0;
        this.minAccuracy = 50;

        // Callbacks
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        this.onStateChangeCallback = null;
        this.onPopupShowCallback = null;
        this.onPopupHideCallback = null;

        // DOM refs
        this.indicatorElement = null;
        this.latitudeField = document.getElementById('latitude');
        this.longitudeField = document.getElementById('longitude');
        this.locationUrlField = document.getElementById('locationUrl');
        this.villageCityField = document.getElementById('villageCity');
        this.landmarkField = document.getElementById('landmark');

        // Location watch
        this.watchId = null;
        this.bestPosition = null;

        // 🔥 Auto-bind checkout events
        this.bindCheckoutEvents();

        this.bindAutoDetectEvents();
        console.log('📍 LocationManager v6 Initialized (Fully Connected)');
    }

    // ============================================
    // 🔥 CHECKOUT INTEGRATION - NEW
    // ============================================
    bindCheckoutEvents() {
        // Checkout button/click handlers
        document.addEventListener('click', (e) => {
            // Checkout button clicked
            if (e.target.closest('[data-action="checkout"]') || 
                e.target.closest('#checkoutBtn') ||
                e.target.closest('.checkout-btn')) {
                this.handleCheckoutStart();
            }
            
            // Place order button
            if (e.target.closest('#placeOrderBtn') || 
                e.target.closest('[data-action="place-order"]')) {
                this.handlePlaceOrder(e);
            }
        });

        // Form submit
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'checkoutForm' || 
                e.target.classList.contains('checkout-form')) {
                this.handleFormSubmit(e);
            }
        });
    }

    handleCheckoutStart() {
        console.log('🛒 Checkout started - starting location...');
        
        if (!this.isReady()) {
            this.start(
                (location) => {
                    console.log('✅ Location ready for checkout');
                    this.enablePlaceOrderButton();
                },
                (error) => {
                    console.log('❌ Location error during checkout');
                }
            );
        }
    }

    handlePlaceOrder(e) {
        if (!this.isReady()) {
            e.preventDefault();
            console.log('❌ Location not ready - showing popup');
            this.showPopup();
            return false;
        }
        
        // Location ready - order proceed karo
        console.log('✅ Location ready - placing order');
        return true;
    }

    handleFormSubmit(e) {
        if (!this.isReady()) {
            e.preventDefault();
            console.log('❌ Form submit blocked - location not ready');
            this.showPopup();
            return false;
        }
        
        // Location add karo form mein
        const location = this.getData();
        
        if (!this.latitudeField) {
            const latInput = document.createElement('input');
            latInput.type = 'hidden';
            latInput.id = 'latitude';
            latInput.value = location.lat;
            e.target.appendChild(latInput);
        }
        
        if (!this.longitudeField) {
            const lngInput = document.createElement('input');
            lngInput.type = 'hidden';
            lngInput.id = 'longitude';
            lngInput.value = location.lng;
            e.target.appendChild(lngInput);
        }
        
        console.log('✅ Location added to form');
        return true;
    }

    enablePlaceOrderButton() {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.classList.add('ready');
            placeOrderBtn.style.opacity = '1';
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================

    start(onFound, onError) {
        console.log('📍 Starting LIVE GPS detection...');

        this.onFoundCallback = onFound || null;
        this.onErrorCallback = onError || null;
        this.isSearching = true;
        this.isFound = false;
        this.currentRetryAttempt = 0;

        this.tryGetLocation();
        this.startLoop();
        
        // 🔥 Start watching for better accuracy
        setTimeout(() => this.startWatching(), 2000);
        
        this.updateIndicator('searching');
        
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('searching');
        }
    }

    stop() {
        this.stopLoop();
        this.stopWatching();
        this.hidePopup();
        this.isSearching = false;
        this.isFound = false;
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        this.clearLocationData();
        this.updateIndicator('off');
        
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('stopped');
        }
    }

    isReady() {
        return this.isFound && 
               this.latitudeField?.value && 
               this.longitudeField?.value;
    }

    getData() {
        return {
            lat: this.latitudeField?.value || '',
            lng: this.longitudeField?.value || '',
            url: this.locationUrlField?.value || '',
            accuracy: this.getAccuracy(),
            isHighAccuracy: this.isHighAccuracy()
        };
    }

    showPopup() {
        this.showGPSPopup();
    }

    hidePopup() {
        this.hideGPSPopup();
    }

    openSettings() {
        this.openGPSSettings();
    }

    setIndicator(element) {
        this.indicatorElement = element;
    }

    setLanguage(lang) {
        this.currentLang = lang;
        this.updateIndicator(this.isSearching ? 'searching' : (this.isFound ? 'found' : 'off'));
    }

    updateIndicator(state) {
        if (!this.indicatorElement) return;

        const messages = {
            searching: {
                hi: '⏳ लाइव लोकेशन ले रहे हैं...',
                en: '⏳ Getting live location...'
            },
            found: {
                hi: '✅ लाइव लोकेशन मिल गई',
                en: '✅ Live location found'
            },
            off: {
                hi: '📡 GPS बंद है',
                en: '📡 GPS is OFF'
            }
        };

        const msg = messages[state]?.[this.currentLang] || messages[state]?.hi || '';
        const dotClass = state === 'searching' ? 'searching' : (state === 'found' ? 'found' : 'off');

        this.indicatorElement.innerHTML = `<span class="location-dot ${dotClass}"></span> ${msg}`;
        this.indicatorElement.className = `location-indicator ${state}`;
    }

    onStateChange(callback) {
        this.onStateChangeCallback = callback;
    }

    onPopupShow(callback) {
        this.onPopupShowCallback = callback;
    }

    onPopupHide(callback) {
        this.onPopupHideCallback = callback;
    }

    retry() {
        console.log('🔄 Manual retry...');
        this.hidePopup();
        this.isFound = false;
        this.isSearching = true;
        this.currentRetryAttempt = 0;
        this.bestPosition = null;
        this.updateIndicator('searching');
        this.tryGetLocation();
        this.startLoop();
        this.startWatching();
    }

    getAccuracy() {
        return this.bestPosition?.accuracy || null;
    }

    isHighAccuracy() {
        return this.bestPosition && this.bestPosition.accuracy <= this.minAccuracy;
    }

    // ============================================
    // FAST LIVE GPS LOOP
    // ============================================

    startLoop() {
        this.stopLoop();

        this.retryInterval = setInterval(() => {
            if (this.isFound) {
                this.stopLoop();
                return;
            }

            if (this.currentRetryAttempt >= this.maxAttempts) {
                console.log('❌ Max attempts reached');
                this.stopLoop();
                return;
            }

            this.tryGetLocation();
        }, this.getRetryDelay());

        console.log('🔄 Fast GPS loop started');
    }

    getRetryDelay() {
        const index = Math.min(this.currentRetryAttempt, this.retryDelays.length - 1);
        const delay = this.retryDelays[index];
        this.currentRetryAttempt++;
        return delay;
    }

    stopLoop() {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
        }
    }

    tryGetLocation() {
        if (this.isFound) return;

        if (!navigator.geolocation) {
            console.error('❌ Geolocation not supported');
            this.showGPSPopup();
            return;
        }

        console.log(`📍 LIVE GPS attempt #${this.currentRetryAttempt + 1}`);

        navigator.geolocation.getCurrentPosition(
            (position) => this.onLocationSuccess(position),
            (error) => this.onLocationError(error),
            {
                enableHighAccuracy: true,
                timeout: this.gpsTimeout,
                maximumAge: 0
            }
        );
    }

    startWatching() {
        if (!navigator.geolocation || this.watchId || this.isFound) return;

        console.log('👁 Starting continuous location watch...');

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.onWatchPosition(position),
            (error) => this.onLocationError(error),
            {
                enableHighAccuracy: true,
                timeout: this.gpsTimeout,
                maximumAge: 0
            }
        );
    }

    stopWatching() {
        if (this.watchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            console.log('👁 Stopped location watch');
        }
    }

    // ============================================
    // SUCCESS / ERROR HANDLERS
    // ============================================

    onLocationSuccess(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const url = `https://maps.google.com/?q=${lat},${lng}`;

        console.log(`✅ LIVE GPS SUCCESS: ${lat.toFixed(6)}, ${lng.toFixed(6)} (${Math.round(accuracy)}m)`);

        if ((lat === 0 && lng === 0) || !isFinite(lat) || !isFinite(lng)) {
            console.error('❌ Invalid coordinates');
            return;
        }

        // Save best position
        if (!this.bestPosition || accuracy < this.bestPosition.accuracy) {
            this.bestPosition = { lat, lng, accuracy, url, timestamp: Date.now() };
        }

        // Accuracy check
        if (accuracy > this.minAccuracy && !this.isFound) {
            console.log(`⚠️ Low accuracy (${Math.round(accuracy)}m) - watching for better...`);
            this.startWatching();
            return;
        }

        this.finalizeLocation(lat, lng, accuracy, url);
    }

    onWatchPosition(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log(`👁 Watch: ${lat.toFixed(6)}, ${lng.toFixed(6)} (${Math.round(accuracy)}m)`);

        if (!this.bestPosition || accuracy < this.bestPosition.accuracy) {
            this.bestPosition = { 
                lat, lng, accuracy, 
                url: `https://maps.google.com/?q=${lat},${lng}`,
                timestamp: Date.now() 
            };
        }

        if (accuracy <= this.minAccuracy && !this.isFound) {
            const url = `https://maps.google.com/?q=${lat},${lng}`;
            this.finalizeLocation(lat, lng, accuracy, url);
        }
    }

    finalizeLocation(lat, lng, accuracy, url) {
        this.saveLocationData(lat, lng, url);
        this.isFound = true;
        this.isSearching = false;
        this.stopLoop();
        this.stopWatching();
        this.updateIndicator('found');
        this.hideGPSPopup();

        if (this.onFoundCallback) {
            this.onFoundCallback({ 
                lat, lng, accuracy, url,
                isHighAccuracy: this.isHighAccuracy()
            });
        }

        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('found', { lat, lng, accuracy, url });
        }

        setTimeout(() => this.reverseGeocode(lat, lng), 100);
    }

    onLocationError(error) {
        const errorMessages = {
            1: 'PERMISSION_DENIED',
            2: 'POSITION_UNAVAILABLE',
            3: 'TIMEOUT'
        };

        const errorName = errorMessages[error.code] || 'UNKNOWN';
        console.log(`❌ GPS Error: ${errorName}`);

        if (!this.popupVisible && !this.isFound) {
            console.log('🚨 Showing GPS popup immediately');
            this.showGPSPopup();
        }

        if (this.onErrorCallback) {
            this.onErrorCallback({ 
                code: error.code, 
                message: error.message, 
                name: errorName 
            });
        }

        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('error', { 
                code: error.code, 
                message: error.message 
            });
        }
    }

    // ============================================
    // SAVE / CLEAR LOCATION DATA
    // ============================================

    saveLocationData(lat, lng, url) {
        if (this.latitudeField) {
            this.latitudeField.value = lat.toFixed(6);
            this.latitudeField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (this.longitudeField) {
            this.longitudeField.value = lng.toFixed(6);
            this.longitudeField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (this.locationUrlField) {
            this.locationUrlField.value = url;
        }

        try {
            localStorage.setItem('quick-dukan-live-location', JSON.stringify({
                lat: lat.toFixed(6),
                lng: lng.toFixed(6),
                url: url,
                timestamp: Date.now(),
                isLive: true
            }));
        } catch (e) {}
    }

    clearLocationData() {
        if (this.latitudeField) this.latitudeField.value = '';
        if (this.longitudeField) this.longitudeField.value = '';
        if (this.locationUrlField) this.locationUrlField.value = '';

        try {
            localStorage.removeItem('quick-dukan-live-location');
        } catch (e) {}
    }

    // ============================================
    // REVERSE GEOCODE
    // ============================================

    async reverseGeocode(lat, lng) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=${this.currentLang}`,
                { 
                    headers: { 'User-Agent': 'QuickDukan/1.0' },
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) return;

            const data = await response.json();
            if (!data?.address) return;

            const addr = data.address;
            const city = addr.village || addr.town || addr.city || 
                         addr.county || addr.state_district || '';

            if (city && this.villageCityField && !this.villageCityField.value) {
                this.villageCityField.value = city;
                this.villageCityField.classList.add('valid');
                this.villageCityField.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(`🏘️ Auto-filled city: ${city}`);
            }

            const landmark = addr.road || addr.neighbourhood || addr.suburb || '';
            if (landmark && this.landmarkField && !this.landmarkField.value) {
                this.landmarkField.value = landmark;
                this.landmarkField.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(`🏠 Auto-filled landmark: ${landmark}`);
            }
        } catch (error) {
            console.log('📍 Reverse geocode skipped (non-critical)');
        }
    }

    // ============================================
    // GPS POPUP - TURANT SHOW
    // ============================================

    showGPSPopup() {
        if (this.popupVisible) return;

        this.hideGPSPopup();

        const messages = this.getGPSPopupMessages();

        const overlay = document.createElement('div');
        overlay.id = 'gpsPopup';
        overlay.className = 'gps-popup-overlay';

        overlay.innerHTML = `
            <div class="gps-popup-card">
                <button class="gps-close-btn" id="gpsCloseBtn">✕</button>
                
                <div class="gps-popup-icon">📡</div>
                
                <h2 class="gps-popup-title">${messages.title}</h2>
                
                <p class="gps-popup-message">${messages.message}</p>
                
                <div class="gps-instruction-box">
                    <p>${messages.instruction}</p>
                </div>
                
                <div class="gps-waves">
                    <span>📡</span>
                    <span>📡</span>
                    <span>📡</span>
                </div>
                
                <button class="gps-primary-btn" id="gpsSettingsBtn">
                    ${messages.openSettings}
                </button>
                
                <button class="gps-retry-btn" id="gpsRetryBtn">
                    ${messages.retry}
                </button>
                
                <button class="gps-skip-btn" id="gpsSkipBtn" style="display:block;width:100%;padding:10px;background:transparent;color:#999;border:none;font-size:12px;cursor:pointer;margin-top:4px;">
                    ${messages.skip}
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        this.bindPopupEvents(overlay);
        this.popupVisible = true;
        
        if (this.onPopupShowCallback) {
            this.onPopupShowCallback();
        }
        
        console.log('📡 GPS Popup shown INSTANTLY');
    }

    hideGPSPopup() {
        const popup = document.getElementById('gpsPopup');
        if (popup) {
            popup.classList.remove('visible');
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.remove();
                }
                const checkoutModal = document.getElementById('checkoutModal');
                if (checkoutModal && checkoutModal.classList.contains('hidden')) {
                    document.body.style.overflow = '';
                }
            }, 300);
        }
        this.popupVisible = false;
        
        if (this.onPopupHideCallback) {
            this.onPopupHideCallback();
        }
    }

    bindPopupEvents(overlay) {
        overlay.querySelector('#gpsCloseBtn')?.addEventListener('click', () => {
            this.hideGPSPopup();
        });

        overlay.querySelector('#gpsSettingsBtn')?.addEventListener('click', () => {
            this.openGPSSettings();
        });

        overlay.querySelector('#gpsRetryBtn')?.addEventListener('click', () => {
            this.retry();
        });

        overlay.querySelector('#gpsSkipBtn')?.addEventListener('click', () => {
            this.hideGPSPopup();
        });
    }

    openGPSSettings() {
        console.log('⚙️ Opening GPS settings...');

        if (navigator.userAgent.match(/Android/i)) {
            try {
                window.location.href = 'intent://com.android.settings/#Intent;scheme=android-app;end';
            } catch (e) {}
        }

        setTimeout(() => {
            try {
                window.open('app-settings:', '_blank');
            } catch (e) {
                alert(this.currentLang === 'hi' 
                    ? 'कृपया Settings में जाकर Location ON करें' 
                    : 'Please go to Settings and turn ON Location');
            }
        }, 500);
    }

    getGPSPopupMessages() {
        const messages = {
            hi: {
                title: '📡 GPS बंद है!',
                message: 'आपका सामान सही-सलामत पहुँचाने के लिए हमें आपकी लाइव लोकेशन चाहिए। कृपया GPS चालू करें। 🙏',
                instruction: '📱 ऊपर से स्वाइप करें → ⚙️ Settings खोलें → 📍 Location ON करें',
                openSettings: '⚙️ GPS SETTING खोलें',
                retry: '🔄 फिर से कोशिश करें',
                skip: '✕ बाद में'
            },
            en: {
                title: '📡 GPS is OFF!',
                message: 'We need your live location to deliver your order safely. Please turn ON GPS. 🙏',
                instruction: '📱 Swipe down → ⚙️ Open Settings → 📍 Turn Location ON',
                openSettings: '⚙️ Open GPS Settings',
                retry: '🔄 Try Again',
                skip: '✕ Skip'
            }
        };

        return messages[this.currentLang] || messages.hi;
    }

    // ============================================
    // AUTO-DETECT EVENTS
    // ============================================

    bindAutoDetectEvents() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isSearching && !this.isFound) {
                console.log('👁 Tab visible — LIVE GPS retry...');
                setTimeout(() => this.tryGetLocation(), 300);
            }
        });

        window.addEventListener('focus', () => {
            if ((this.popupVisible || this.isSearching) && !this.isFound) {
                console.log('👁 Window focused — checking LIVE GPS...');
                setTimeout(() => {
                    this.hideGPSPopup();
                    this.isSearching = true;
                    this.updateIndicator('searching');
                    this.tryGetLocation();
                    this.startLoop();
                    this.startWatching();
                }, 500);
            }
        });

        window.addEventListener('online', () => {
            if (this.isSearching && !this.isFound) {
                console.log('🌐 Online — retrying LIVE GPS...');
                setTimeout(() => this.tryGetLocation(), 500);
            }
        });
    }

    // ============================================
    // DESTROY
    // ============================================

    destroy() {
        this.stop();
        this.hideGPSPopup();
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        this.onStateChangeCallback = null;
        this.onPopupShowCallback = null;
        this.onPopupHideCallback = null;
        console.log('📍 LocationManager destroyed');
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.locationManager = new LocationManager();
});

window.addEventListener('beforeunload', () => {
    if (window.locationManager) {
        window.locationManager.destroy();
    }
});

// 🔥 Global helper functions
window.getLocation = function() {
    return window.locationManager?.getData() || null;
};

window.isLocationReady = function() {
    return window.locationManager?.isReady() || false;
};

window.retryLocation = function() {
    if (window.locationManager) {
        window.locationManager.retry();
    }
};

window.startLocationDetection = function(onFound, onError) {
    if (window.locationManager) {
        window.locationManager.start(onFound, onError);
    }
};

window.stopLocationDetection = function() {
    if (window.locationManager) {
        window.locationManager.stop();
    }
};

window.getLocationAccuracy = function() {
    return window.locationManager?.getAccuracy() || null;
};

window.isHighAccuracyLocation = function() {
    return window.locationManager?.isHighAccuracy() || false;
};