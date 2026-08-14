// ============================================
// LOCATION.JS - Live GPS Manager v3
// Direct Live Location | No Cache | Fast Detection
// ============================================

class LocationManager {
    constructor() {
        // State
        this.isFound = false;
        this.isSearching = false;
        this.popupVisible = false;
        this.currentLang = 'hi';

        // Loop control - 🔥 FAST PROGRESSIVE RETRY
        this.retryInterval = null;
        this.retryDelays = [1500, 2000, 3000, 4000, 5000]; // Pehle fast, phir slow
        this.currentRetryAttempt = 0;
        this.maxAttempts = 15; // Max 15 attempts

        // GPS settings - 🔥 LIVE LOCATION ONLY
        this.gpsTimeout = 5000; // 5 seconds timeout
        this.highAccuracy = true;
        this.maximumAge = 0; // 🔥 NO CACHE - Sirf fresh location
        this.timeout = 5000;

        // Callbacks
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        this.onStateChangeCallback = null;

        // DOM refs
        this.indicatorElement = null;
        this.latitudeField = document.getElementById('latitude');
        this.longitudeField = document.getElementById('longitude');
        this.locationUrlField = document.getElementById('locationUrl');
        this.villageCityField = document.getElementById('villageCity');
        this.landmarkField = document.getElementById('landmark');

        // Auto-detect events
        this.bindAutoDetectEvents();

        console.log('📍 LocationManager v3 Initialized (Live Only)');
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

        // 🔥 Turant try karo
        this.tryGetLocation();

        // 🔥 Fast loop start karo
        this.startLoop();

        this.updateIndicator('searching');
    }

    stop() {
        this.stopLoop();
        this.hidePopup();
        this.isSearching = false;
        this.isFound = false;
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        this.clearLocationData();
        this.updateIndicator('off');
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

    // ============================================
    // 🔥 FAST LIVE GPS LOOP
    // ============================================

    startLoop() {
        this.stopLoop();

        this.retryInterval = setInterval(() => {
            if (this.isFound) {
                this.stopLoop();
                return;
            }

            // Max attempts check
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
        // 🔥 Progressive delay - pehle fast, baad mein slow
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

        // 🔥 LIVE LOCATION - maximumAge: 0 (no cache)
        navigator.geolocation.getCurrentPosition(
            (position) => this.onLocationSuccess(position),
            (error) => this.onLocationError(error),
            {
                enableHighAccuracy: true, // 🔥 High accuracy for live
                timeout: this.gpsTimeout,
                maximumAge: 0 // 🔥 SIRF FRESH LOCATION
            }
        );
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

        // Validate coordinates
        if ((lat === 0 && lng === 0) || !isFinite(lat) || !isFinite(lng)) {
            console.error('❌ Invalid coordinates');
            return;
        }

        // 🔥 Turant save
        this.saveLocationData(lat, lng, url);

        // 🔥 Turant state update
        this.isFound = true;
        this.isSearching = false;
        this.stopLoop();
        this.updateIndicator('found');
        this.hideGPSPopup();

        // 🔥 Turant callback - koi wait nahi
        if (this.onFoundCallback) {
            this.onFoundCallback({ lat, lng, accuracy, url });
        }

        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('found', { lat, lng, accuracy, url });
        }

        // 🔥 Reverse geocode background mein
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

        // 🔥 Permission denied - turant popup
        if (error.code === 1) {
            if (!this.popupVisible) {
                this.showGPSPopup();
            }
        }
        // 🔥 Position unavailable - 3 attempts baad popup
        else if (error.code === 2 && this.currentRetryAttempt >= 3) {
            if (!this.popupVisible) {
                this.showGPSPopup();
            }
        }
        // 🔥 Timeout - 2 attempts baad popup
        else if (error.code === 3 && this.currentRetryAttempt >= 2) {
            if (!this.popupVisible) {
                this.showGPSPopup();
            }
        }

        if (this.onErrorCallback) {
            this.onErrorCallback({ code: error.code, message: error.message, name: errorName });
        }

        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('error', { code: error.code, message: error.message });
        }
    }

    // ============================================
    // SAVE / CLEAR LOCATION DATA
    // ============================================

    saveLocationData(lat, lng, url) {
        if (this.latitudeField) this.latitudeField.value = lat.toFixed(6);
        if (this.longitudeField) this.longitudeField.value = lng.toFixed(6);
        if (this.locationUrlField) this.locationUrlField.value = url;

        // 🔥 Save to localStorage for order processing
        try {
            localStorage.setItem('quick-dukan-live-location', JSON.stringify({
                lat: lat.toFixed(6),
                lng: lng.toFixed(6),
                url: url,
                timestamp: Date.now(),
                isLive: true // 🔥 Mark as live
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
    // REVERSE GEOCODE - FAST & NON-BLOCKING
    // ============================================

    async reverseGeocode(lat, lng) {
        try {
            // 🔥 2 second timeout
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
                console.log(`🏘️ Auto-filled city: ${city}`);
            }

            const landmark = addr.road || addr.neighbourhood || addr.suburb || '';
            if (landmark && this.landmarkField && !this.landmarkField.value) {
                this.landmarkField.value = landmark;
                console.log(`🏠 Auto-filled landmark: ${landmark}`);
            }
        } catch (error) {
            console.log('📍 Reverse geocode skipped (non-critical)');
        }
    }

    // ============================================
    // GPS POPUP
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
        console.log('📡 GPS Popup shown');
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
    }

    bindPopupEvents(overlay) {
        overlay.querySelector('#gpsCloseBtn')?.addEventListener('click', () => {
            this.hideGPSPopup();
        });

        overlay.querySelector('#gpsSettingsBtn')?.addEventListener('click', () => {
            this.openGPSSettings();
        });

        overlay.querySelector('#gpsRetryBtn')?.addEventListener('click', () => {
            this.hideGPSPopup();
            this.isFound = false;
            this.isSearching = true;
            this.currentRetryAttempt = 0;
            this.updateIndicator('searching');
            this.tryGetLocation();
            this.startLoop();

            if (this.onStateChangeCallback) {
                this.onStateChangeCallback('retrying');
            }
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
    // AUTO-DETECT EVENTS - FAST
    // ============================================

    bindAutoDetectEvents() {
        // Tab visible hone par turant retry
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isSearching && !this.isFound) {
                console.log('👁 Tab visible — LIVE GPS retry...');
                setTimeout(() => this.tryGetLocation(), 300); // 🔥 300ms fast
            }
        });

        // Window focus par turant check
        window.addEventListener('focus', () => {
            if ((this.popupVisible || this.isSearching) && !this.isFound) {
                console.log('👁 Window focused — checking LIVE GPS...');
                setTimeout(() => {
                    this.hideGPSPopup();
                    this.isSearching = true;
                    this.updateIndicator('searching');
                    this.tryGetLocation();
                    this.startLoop();
                }, 500); // 🔥 500ms fast
            }
        });

        // Online hone par retry
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