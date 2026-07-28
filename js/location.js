// ============================================
// LOCATION.JS - Aggressive Smart Location
// Live Tracking + Force GPS + Auto Permission
// ============================================

class LocationManager {
    constructor() {
        this.getLocationBtn = document.getElementById('getLocationBtn');
        this.locationStatus = document.getElementById('locationStatus');
        this.locationText = document.getElementById('locationText');
        this.latitude = document.getElementById('latitude');
        this.longitude = document.getElementById('longitude');
        this.locationUrl = document.getElementById('locationUrl');
        this.villageCity = document.getElementById('villageCity');
        this.landmark = document.getElementById('landmark');
        
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 9;            // ✅ Aggressive: 9 retries
        this.permissionDeniedCount = 0;
        this.watchId = null;            // ✅ Live tracking ID
        this.gpsReminderInterval = null;
        this.lastDetectedLocation = null;
        
        // Settings
        this.MIN_ACCURACY_METERS = 50;   // ✅ Better accuracy
        this.PERMISSION_RETRY_DELAY = 10000; // 10 sec for permission
        this.GPS_REMINDER_INTERVAL = 15000;  // 15 sec GPS reminder
        
        if (!this.getLocationBtn) return;
        this.init();
    }

    init() {
        // Manual button
        this.getLocationBtn.addEventListener('click', () => {
            this.getLocation(false);
        });

        // ✅ Auto-detect on checkout open
        document.addEventListener('checkoutOpened', () => {
            setTimeout(() => {
                this.startLocationDetection();
            }, 300);
        });

        // ✅ Auto-detect on page load (if checkout visible)
        if (document.getElementById('checkoutModal')?.classList.contains('visible')) {
            setTimeout(() => this.startLocationDetection(), 500);
        }
        
        // ✅ Listen for permission changes
        this.watchPermissionChanges();
    }

    // ============================================
    // LANGUAGE
    // ============================================
    getLang() {
        return localStorage.getItem('quickDukanLang') || CONFIG?.defaultLanguage || 'hi';
    }

    t(key, replacements = {}) {
        const lang = this.getLang();
        const texts = {
            hi: {
                getting: '📍 आपकी लोकेशन ले रहे हैं...',
                gotLocation: '✅ सटीक लोकेशन मिल गई!',
                liveLocation: '🟢 लाइव लोकेशन ट्रैकिंग चालू',
                failed: '❌ लोकेशन नहीं मिली',
                permissionDenied: '⚠️ आपने लोकेशन ब्लॉक कर दी है!',
                permissionPermanent: '🚫 लोकेशन स्थायी रूप से ब्लॉक है। कृपया ब्राउज़र सेटिंग में जाकर अनब्लॉक करें।',
                gpsOff: '📡 आपका GPS बंद है!',
                gpsOffDetail: 'कृपया अपने फोन का GPS चालू करें ताकि हम आपकी सही लोकेशन ले सकें।',
                gpsOnInstruction: '👇 नीचे खींचें → Location/GPS आइकन दबाएं → चालू करें',
                allowLocation: '📍 कृपया "Allow" दबाएं ताकि हम आपकी लोकेशन ले सकें!',
                allowLocationDetail: 'हमें आपकी सही डिलीवरी लोकेशन चाहिए।',
                retryMsg: '🔄 पुनः प्रयास {count}/{max}...',
                manualHint: '✍️ या खुद अपना गाँव/शहर लिखें',
                btnGet: '📍 लोकेशन लें',
                btnGetting: '⏳ ले रहे...',
                btnGot: '✅ मिल गई!',
                btnFailed: '⚠️ फिर से',
                highAccuracy: '🎯 हाई एक्यूरेसी GPS',
                mediumAccuracy: '📍 मीडियम एक्यूरेसी',
                lowAccuracy: '🌍 लो एक्यूरेसी — कृपया जाँच लें',
            },
            en: {
                getting: '📍 Getting your location...',
                gotLocation: '✅ Exact location found!',
                liveLocation: '🟢 Live location tracking ON',
                failed: '❌ Could not get location',
                permissionDenied: '⚠️ You blocked location!',
                permissionPermanent: '🚫 Location permanently blocked. Please unblock in browser settings.',
                gpsOff: '📡 Your GPS is OFF!',
                gpsOffDetail: 'Please turn ON your phone GPS so we can get your exact location.',
                gpsOnInstruction: '👇 Swipe down → Press Location/GPS icon → Turn ON',
                allowLocation: '📍 Please press "Allow" so we can get your location!',
                allowLocationDetail: 'We need your exact delivery location.',
                retryMsg: '🔄 Retry {count}/{max}...',
                manualHint: '✍️ Or type your city/village manually',
                btnGet: '📍 Get Location',
                btnGetting: '⏳ Getting...',
                btnGot: '✅ Got it!',
                btnFailed: '⚠️ Retry',
                highAccuracy: '🎯 High Accuracy GPS',
                mediumAccuracy: '📍 Medium Accuracy',
                lowAccuracy: '🌍 Low Accuracy — Please verify',
            }
        };
        
        let msg = texts[lang]?.[key] || texts['hi'][key] || key;
        Object.keys(replacements).forEach(k => {
            msg = msg.replace(`{${k}}`, replacements[k]);
        });
        return msg;
    }

    // ============================================
    // START DETECTION
    // ============================================
    startLocationDetection() {
        console.log('📍 Starting auto location detection...');
        this.retryCount = 0;
        this.permissionDeniedCount = 0;
        
        // Clear any existing watch
        this.stopLiveTracking();
        
        // Start fresh detection
        this.getLocation(true);
    }

    // ============================================
    // GET LOCATION
    // ============================================
    getLocation(silent = false) {
        if (this.isLoading && this.retryCount > 0) {
            console.log('⏳ Already loading...');
            return;
        }

        if (!navigator.geolocation) {
            this.showGPSOffMessage();
            return;
        }

        this.isLoading = true;
        
        if (!silent) {
            this.setButtonLoading(true);
            this.showToast(this.t('getting'), 'info');
        }

        console.log(`📍 Requesting position... (attempt ${this.retryCount + 1})`);
        
        // ✅ First: Quick check with cached position
        navigator.geolocation.getCurrentPosition(
            (position) => this.onLocationSuccess(position, silent),
            (error) => this.onLocationError(error, silent),
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0 // Fresh only
            }
        );
    }

    // ============================================
    // SUCCESS
    // ============================================
    onLocationSuccess(position, silent) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const timestamp = position.timestamp;

        console.log('📍 GOT LOCATION:', {
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            accuracy: `${Math.round(accuracy)}m`,
            age: `${((Date.now() - timestamp) / 1000).toFixed(1)}s`
        });

        // ❌ Invalid
        if (lat === 0 && lng === 0) {
            this.retryLocation('Invalid coordinates');
            return;
        }

        // ⚠️ Low accuracy — but still use if best available
        if (accuracy > this.MIN_ACCURACY_METERS && this.retryCount < 3) {
            console.warn(`⚠️ Low accuracy: ${Math.round(accuracy)}m, retrying for better...`);
            this.retryLocation('Low accuracy, retrying');
            return;
        }

        // ✅ SUCCESS!
        const data = { lat, lng, accuracy, timestamp: Date.now() };
        this.lastDetectedLocation = data;
        
        this.applyLocationData(data);
        this.saveLocation(data);
        this.reverseGeocode(lat, lng);
        
        // ✅ Start live tracking
        this.startLiveTracking();
        
        // ✅ Hide GPS reminder
        this.hideGPSReminder();
        
        this.isLoading = false;
        this.retryCount = 0;
        this.permissionDeniedCount = 0;
        
        // Accuracy label
        let accLabel = this.t('highAccuracy');
        if (accuracy > 20) accLabel = this.t('mediumAccuracy');
        if (accuracy > 50) accLabel = this.t('lowAccuracy');
        
        if (!silent) {
            this.showToast(`${this.t('gotLocation')} (${accLabel})`, 'success');
        }
    }

    retryLocation(reason) {
        console.log(`🔄 Retry: ${reason}`);
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
            const delay = this.retryCount <= 3 ? 1000 : 
                          this.retryCount <= 6 ? 2000 : 3000;
            
            setTimeout(() => {
                this.isLoading = false;
                this.getLocation(true);
            }, delay);
        } else {
            // Use last known good location if available
            if (this.lastDetectedLocation) {
                console.log('⚠️ Using last known location');
                this.applyLocationData(this.lastDetectedLocation);
            } else {
                this.showManualInput();
            }
            this.isLoading = false;
        }
    }

    applyLocationData(data) {
        if (this.latitude) this.latitude.value = data.lat.toFixed(6);
        if (this.longitude) this.longitude.value = data.lng.toFixed(6);
        if (this.locationUrl) this.locationUrl.value = 
            `https://maps.google.com/?q=${data.lat},${data.lng}`;
        
        this.setButtonSuccess();
        
        if (this.locationText) {
            this.locationText.classList.remove('hidden');
            this.locationText.innerHTML = `
                <span style="color:#4CAF50">🟢</span> ${this.t('liveLocation')}
                <br><small>Accuracy: ~${Math.round(data.accuracy)}m</small>
            `;
        }
    }

    // ============================================
    // LIVE TRACKING
    // ============================================
    startLiveTracking() {
        this.stopLiveTracking();
        
        if (!navigator.geolocation) return;
        
        console.log('🟢 Starting live location tracking...');
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                // Only update if accuracy improved
                if (this.lastDetectedLocation && 
                    accuracy < this.lastDetectedLocation.accuracy) {
                    console.log('📍 Live update — better accuracy:', Math.round(accuracy), 'm');
                    
                    const data = { lat, lng, accuracy, timestamp: Date.now() };
                    this.lastDetectedLocation = data;
                    this.applyLocationData(data);
                    this.saveLocation(data);
                }
            },
            (error) => {
                console.log('📍 Live tracking error:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );
    }

    stopLiveTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            console.log('🔴 Live tracking stopped');
        }
    }

    // ============================================
    // ERROR HANDLER
    // ============================================
    onLocationError(error, silent) {
        console.error('📍 Error:', error.message, '(code:', error.code, ')');
        this.isLoading = false;

        switch (error.code) {
            case 1: // PERMISSION_DENIED
                this.handlePermissionDenied(silent);
                break;
                
            case 2: // POSITION_UNAVAILABLE
                this.handleGPSOff(silent);
                break;
                
            case 3: // TIMEOUT
                this.handleTimeout(silent);
                break;
        }
    }

    // ============================================
    // PERMISSION DENIED
    // ============================================
    handlePermissionDenied(silent) {
        this.permissionDeniedCount++;
        console.log(`🚫 Permission denied (${this.permissionDeniedCount} times)`);
        
        if (this.permissionDeniedCount === 1) {
            // First time — show allow request
            this.showAllowLocationPopup();
        } else if (this.permissionDeniedCount <= 5) {
            // Temporary deny — retry after delay
            this.showToast(this.t('permissionDenied'), 'warning');
            
            setTimeout(() => {
                console.log('🔄 Retrying after permission deny...');
                this.retryCount++;
                this.getLocation(true);
            }, this.PERMISSION_RETRY_DELAY);
        } else {
            // Permanent block
            this.showPermanentBlockMessage();
            this.showManualInput();
            this.setButtonFailed();
        }
    }

    // ============================================
    // GPS OFF
    // ============================================
    handleGPSOff(silent) {
        console.log('📡 GPS appears to be OFF');
        
        // Show animated GPS reminder
        this.showGPSOffMessage();
        
        // Retry
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = [2000, 3000, 5000, 8000, 10000][this.retryCount - 1] || 10000;
            
            console.log(`🔄 Retry after GPS check (${this.retryCount}/${this.maxRetries}) in ${delay}ms`);
            
            setTimeout(() => {
                this.getLocation(true);
            }, delay);
        } else {
            this.showManualInput();
            this.setButtonFailed();
        }
    }

    handleTimeout(silent) {
        console.log('⏱️ Location request timed out');
        
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = [1000, 2000, 3000, 5000, 8000][this.retryCount - 1] || 5000;
            
            setTimeout(() => {
                this.getLocation(true);
            }, delay);
        } else {
            this.showManualInput();
            this.setButtonFailed();
        }
    }

    // ============================================
    // PERMISSION WATCHER
    // ============================================
    async watchPermissionChanges() {
        if (!navigator.permissions) return;
        
        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            
            permission.addEventListener('change', () => {
                console.log('📍 Permission state changed:', permission.state);
                
                if (permission.state === 'granted') {
                    // ✅ User allowed! Get location immediately
                    console.log('✅ Permission GRANTED — getting location!');
                    this.hideGPSReminder();
                    this.hideAllowPopup();
                    this.permissionDeniedCount = 0;
                    this.retryCount = 0;
                    setTimeout(() => this.getLocation(true), 500);
                } else if (permission.state === 'denied') {
                    this.permissionDeniedCount = 99; // Permanent
                    this.handlePermissionDenied(true);
                }
            });
        } catch (e) {
            console.log('Permission API not supported');
        }
    }

    // ============================================
    // UI POPUPS
    // ============================================

    // 📡 GPS OFF Message
    showGPSOffMessage() {
        // Remove existing
        this.hideGPSReminder();
        
        const reminder = document.createElement('div');
        reminder.id = 'gpsReminder';
        reminder.className = 'gps-reminder-popup';
        reminder.innerHTML = `
            <div class="gps-reminder-content">
                <div class="gps-reminder-icon">📡</div>
                <h3>${this.t('gpsOff')}</h3>
                <p>${this.t('gpsOffDetail')}</p>
                <p class="gps-instruction">${this.t('gpsOnInstruction')}</p>
                <div class="gps-animation">
                    <span>📡</span>
                    <span>📡</span>
                    <span>📡</span>
                </div>
                <button class="gps-retry-btn" id="gpsRetryBtn">
                    🔄 ${this.t('btnGet')}
                </button>
                <button class="gps-skip-btn" id="gpsSkipBtn">
                    ${this.t('manualHint')}
                </button>
            </div>
        `;
        
        document.body.appendChild(reminder);
        
        // Animate in
        setTimeout(() => reminder.classList.add('visible'), 100);
        
        // Button handlers
        document.getElementById('gpsRetryBtn')?.addEventListener('click', () => {
            this.hideGPSReminder();
            this.retryCount = 0;
            this.getLocation(false);
        });
        
        document.getElementById('gpsSkipBtn')?.addEventListener('click', () => {
            this.hideGPSReminder();
            this.showManualInput();
        });
        
        // Auto-remove after 30 seconds
        setTimeout(() => this.hideGPSReminder(), 30000);
    }

    hideGPSReminder() {
        const reminder = document.getElementById('gpsReminder');
        if (reminder) {
            reminder.classList.remove('visible');
            setTimeout(() => reminder.remove(), 300);
        }
    }

    // 📍 Allow Location Popup
    showAllowLocationPopup() {
        this.hideAllowPopup();
        
        const popup = document.createElement('div');
        popup.id = 'allowLocationPopup';
        popup.className = 'allow-location-popup';
        popup.innerHTML = `
            <div class="allow-location-content">
                <div class="allow-location-icon">📍</div>
                <h3>${this.t('allowLocation')}</h3>
                <p>${this.t('allowLocationDetail')}</p>
                <div class="allow-animation">
                    <span class="pulse-dot"></span>
                </div>
                <button class="allow-retry-btn" id="allowRetryBtn">
                    🔄 ${this.t('btnGet')}
                </button>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('visible'), 100);
        
        document.getElementById('allowRetryBtn')?.addEventListener('click', () => {
            this.hideAllowPopup();
            this.retryCount = 0;
            this.getLocation(false);
        });
    }

    hideAllowPopup() {
        const popup = document.getElementById('allowLocationPopup');
        if (popup) {
            popup.classList.remove('visible');
            setTimeout(() => popup.remove(), 300);
        }
    }

    // 🚫 Permanent Block
    showPermanentBlockMessage() {
        this.showToast(this.t('permissionPermanent'), 'error');
        this.showManualInput();
    }

    // ============================================
    // UI HELPERS
    // ============================================
    setButtonLoading(loading) {
        if (!this.getLocationBtn) return;
        if (loading) {
            this.getLocationBtn.classList.add('loading');
            this.getLocationBtn.innerHTML = `⏳ ${this.t('btnGetting')}`;
            this.getLocationBtn.style.background = '#FF9800';
            this.getLocationBtn.style.color = '#FFF';
        }
    }

    setButtonSuccess() {
        if (!this.getLocationBtn) return;
        this.getLocationBtn.classList.remove('loading');
        this.getLocationBtn.innerHTML = `✅ ${this.t('btnGot')}`;
        this.getLocationBtn.style.background = '#4CAF50';
        this.getLocationBtn.style.color = '#FFF';
        
        setTimeout(() => {
            if (this.getLocationBtn) {
                this.getLocationBtn.style.background = '';
                this.getLocationBtn.style.color = '';
            }
        }, 5000);
    }

    setButtonFailed() {
        if (!this.getLocationBtn) return;
        this.getLocationBtn.classList.remove('loading');
        this.getLocationBtn.innerHTML = `⚠️ ${this.t('btnFailed')}`;
        this.getLocationBtn.style.background = '#FF5722';
        this.getLocationBtn.style.color = '#FFF';
    }

    showManualInput() {
        if (this.villageCity) {
            this.villageCity.placeholder = this.t('manualHint');
            this.villageCity.style.borderColor = '#FF9800';
            this.villageCity.focus();
            setTimeout(() => {
                this.villageCity.style.borderColor = '';
            }, 3000);
        }
    }

    // ============================================
    // REVERSE GEOCODING
    // ============================================
    async reverseGeocode(lat, lng) {
        try {
            const lang = this.getLang();
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=${lang}`,
                { headers: { 'User-Agent': 'QuickDukan/1.0' } }
            );

            if (!response.ok) return;
            const data = await response.json();
            if (!data?.address) return;

            const addr = data.address;
            const locationName = 
                addr.village || addr.town || addr.city || 
                addr.county || addr.state_district || '';

            if (locationName && this.villageCity && !this.villageCity.value) {
                this.villageCity.value = locationName;
                this.villageCity.classList.add('auto-filled');
                this.villageCity.style.background = '#E8F5E9';
                setTimeout(() => {
                    this.villageCity.style.background = '';
                }, 2000);
            }

            const landmark = addr.road || addr.neighbourhood || addr.suburb || '';
            if (landmark && this.landmark && !this.landmark.value) {
                this.landmark.value = landmark;
            }
        } catch (e) {
            console.log('📍 Reverse geocode failed');
        }
    }

    // ============================================
    // STORAGE
    // ============================================
    saveLocation(location) {
        try {
            localStorage.setItem('quick-dukan-location', JSON.stringify(location));
        } catch (e) {}
    }

    getSavedLocation() {
        try {
            const data = localStorage.getItem('quick-dukan-location');
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }

    // ============================================
    // TOAST
    // ============================================
    showToast(msg, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };

        toast.textContent = msg;
        toast.style.background = colors[type] || colors.info;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';

        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    }

    // ============================================
    // CLEANUP
    // ============================================
    destroy() {
        this.stopLiveTracking();
        this.hideGPSReminder();
        this.hideAllowPopup();
        clearTimeout(this.toastTimeout);
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.locationManager = new LocationManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.locationManager) {
        window.locationManager.destroy();
    }
});