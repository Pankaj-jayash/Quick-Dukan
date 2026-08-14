// ============================================
// LOCATION.JS - Live GPS Manager v5
// Instant Popup | All Features | Production Ready
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

        // Callbacks
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        this.onStateChangeCallback = null;
        this.onPopupShowCallback = null; // 🔥 NEW
        this.onPopupHideCallback = null; // 🔥 NEW

        // DOM refs
        this.indicatorElement = null;
        this.latitudeField = document.getElementById('latitude');
        this.longitudeField = document.getElementById('longitude');
        this.locationUrlField = document.getElementById('locationUrl');
        this.villageCityField = document.getElementById('villageCity');
        this.landmarkField = document.getElementById('landmark');

        // 🔥 NEW: Location watch ID
        this.watchId = null;
        
        // 🔥 NEW: Accuracy check
        this.minAccuracy = 50; // 50 meters minimum accuracy
        this.bestPosition = null;

        // Auto-detect events
        this.bindAutoDetectEvents();

        console.log('📍 LocationManager v5 Initialized (Complete)');
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
        this.updateIndicator('searching');
        
        // 🔥 State change callback
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('searching');
        }
    }

    stop() {
        this.stopLoop();
        this.stopWatching(); // 🔥 NEW
        this.hidePopup();
        this.isSearching = false;
        this.isFound = false;
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        this.clearLocationData();
        this.updateIndicator('off');
        
        // 🔥 State change callback
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
            accuracy: this.bestPosition?.accuracy || null, // 🔥 NEW
            timestamp: this.bestPosition?.timestamp || null // 🔥 NEW
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

    // 🔥 NEW: Popup callbacks
    onPopupShow(callback) {
        this.onPopupShowCallback = callback;
    }

    onPopupHide(callback) {
        this.onPopupHideCallback = callback;
    }

    // 🔥 NEW: Manual retry
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
    }

    // 🔥 NEW: Get accuracy
    getAccuracy() {
        return this.bestPosition?.accuracy || null;
    }

    // 🔥 NEW: Check if high accuracy
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

    // 🔥 NEW: Continuous watch for better accuracy
    startWatching() {
        if (!navigator.geolocation || this.watchId) return;

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

        // 🔥 Accuracy check
        if (accuracy > this.minAccuracy) {
            console.log(`⚠️ Low accuracy (${Math.round(accuracy)}m) - trying for better...`);
            
            // Save best position
            if (!this.bestPosition || accuracy < this.bestPosition.accuracy) {
                this.bestPosition = { lat, lng, accuracy, url, timestamp: Date.now() };
            }
            
            // Start watching for better accuracy
            this.startWatching();
            return;
        }

        this.saveLocationData(lat, lng, url);
        this.isFound = true;
        this.isSearching = false;
        this.stopLoop();
        this.stopWatching();
        this.updateIndicator('found');
        this.hideGPSPopup();

        if (this.onFoundCallback) {
            this.onFoundCallback({ lat, lng, accuracy, url });
        }

        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('found', { lat, lng, accuracy, url });
        }

        setTimeout(() => this.reverseGeocode(lat, lng), 100);
    }

    onWatchPosition(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log(`👁 Watch position: ${lat.toFixed(6)}, ${lng.toFixed(6)} (${Math.round(accuracy)}m)`);

        // Update best position if better
        if (!this.bestPosition || accuracy < this.bestPosition.accuracy) {
            this.bestPosition = { 
                lat, lng, accuracy, 
                url: `https://maps.google.com/?q=${lat},${lng}`,
                timestamp: Date.now() 
            };
        }

        // If accuracy good enough, finalize
        if (accuracy <= this.minAccuracy) {
            const url = `https://maps.google.com/?q=${lat},${lng}`;
            this.saveLocationData(lat, lng, url);
            this.isFound = true;
            this.isSearching = false;
            this.stopLoop();
            this.stopWatching();
            this.updateIndicator('found');
            this.hideGPSPopup();

            if (this.onFoundCallback) {
                this.onFoundCallback({ lat, lng, accuracy, url });
            }

            setTimeout(() => this.reverseGeocode(lat, lng), 100);
        }
    }

    onLocationError(error) {
        const errorMessages = {
            1: 'PERMISSION_DENIED',
            2: 'POSITION_UNAVAILABLE',
            3: 'TIMEOUT'
        };

        const errorName = errorMessages[error.code] || 'UNKNOWN';
        console.log(`❌ GPS Error: ${errorName}`);

        // 🔥 TURANT POPUP - Kisi bhi error par
        if (!this.popupVisible && !this.isFound) {
            console.log('🚨 Showing GPS popup immediately');
            this.showGPSPopup();
        }

        // Error callback
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
        if (this.latitudeField) this.latitudeField.value = lat.toFixed(6);
        if (this.longitudeField) this.longitudeField.value = lng.toFixed(6);
        if (this.locationUrlField) this.locationUrlField.value = url;

        // 🔥 Trigger input events for form validation
        if (this.latitudeField) {
            this.latitudeField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (this.longitudeField) {
            this.longitudeField.dispatchEvent(new Event('input', { bubbles: true }));
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
                
                // 🔥 Trigger input event
                this.villageCityField.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(`🏘️ Auto-filled city: ${city}`);
            }

            const landmark = addr.road || addr.neighbourhood || addr.suburb || '';
            if (landmark && this.landmarkField && !this.landmarkField.value) {
                this.landmarkField.value = landmark;
                
                // 🔥 Trigger input event
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
        
        // 🔥 Popup show callback
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
        
        // 🔥 Popup hide callback
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

// 🔥 NEW: Global helper functions
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