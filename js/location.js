// ============================================
// LOCATION.JS - Fully Automatic Location
// No Click Needed | Emotional GPS Message
// ============================================

class LocationManager {
    constructor() {
        this.getLocationBtn = document.getElementById('getLocationBtn');
        this.locationText = document.getElementById('locationText');
        this.latitude = document.getElementById('latitude');
        this.longitude = document.getElementById('longitude');
        this.locationUrl = document.getElementById('locationUrl');
        this.villageCity = document.getElementById('villageCity');
        this.landmark = document.getElementById('landmark');
        
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 10;
        this.watchId = null;
        this.lastLocation = null;
        this.gpsPopupShown = false;
        this.detectionStarted = false;
        
        if (!this.getLocationBtn) return;
        this.init();
    }

    init() {
        // ✅ Button bhi rakh lo — fallback ke liye
        this.getLocationBtn.addEventListener('click', () => {
            this.getLocation(false);
        });

        // ✅ Checkout open hote hi — AUTO START
        document.addEventListener('checkoutOpened', () => {
            setTimeout(() => {
                this.autoStart();
            }, 500);
        });
        
        // ✅ Page load pe bhi check — agar checkout visible hai
        this.observer = new MutationObserver(() => {
            const checkoutModal = document.getElementById('checkoutModal');
            if (checkoutModal && !checkoutModal.classList.contains('hidden')) {
                this.autoStart();
            }
        });
        
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            this.observer.observe(checkoutModal, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
        }
        
        // ✅ Permission change — auto detect
        this.watchPermission();
    }

    // ============================================
    // AUTO START — No Click Needed
    // ============================================
    autoStart() {
        if (this.detectionStarted) return;
        
        console.log('🚀 AUTO START: Location detection...');
        this.detectionStarted = true;
        this.retryCount = 0;
        this.gpsPopupShown = false;
        
        // Hide any existing popups
        this.hideGPSPopup();
        
        // Start detection immediately
        this.getLocation(true);
    }

    // ============================================
    // LANGUAGE
    // ============================================
    getLang() {
        return localStorage.getItem('quickDukanLang') || CONFIG?.defaultLanguage || 'hi';
    }

    t(key) {
        const lang = this.getLang();
        const texts = {
            hi: {
                // Auto detect messages
                autoDetecting: '📍 आपकी लोकेशन अपने आप ली जा रही है...',
                locationFound: '✅ लोकेशन मिल गई! आपका ऑर्डर जल्दी पहुँचेगा!',
                
                // GPS OFF — Emotional message
                gpsOffTitle: '📡 आपका GPS बंद है!',
                gpsOffMessage: 'आपका सामान आपके घर तक सही-सलामत पहुँचे, इसके लिए हमें आपकी सही लोकेशन चाहिए। कृपया GPS चालू करें। 🙏',
                gpsOffInstruction: 'फोन की स्क्रीन ऊपर से नीचे खींचें → 📍 Location/GPS पर टैप करें → चालू करें',
                gpsOnButton: '✅ GPS चालू कर दिया, लोकेशन लें',
                gpsSkipButton: 'बाद में, खुद भर दूँगा',
                gpsRetryButton: '🔄 फिर से कोशिश करें',
                
                // Permission
                permissionTitle: '📍 लोकेशन की अनुमति दें',
                permissionMessage: 'आपके ऑर्डर की डिलीवरी के लिए लोकेशन ज़रूरी है। कृपया "Allow" करें।',
                permissionButton: '📍 Allow करें',
                
                // Status
                highAccuracy: '🎯 बिल्कुल सटीक लोकेशन',
                mediumAccuracy: '📍 अच्छी लोकेशन',
                lowAccuracy: '🌍 लोकेशन ठीक है',
                liveTracking: '🟢 लाइव लोकेशन चालू',
                
                // Manual fallback
                manualHint: '✍️ अपना गाँव/शहर/इलाका लिखें',
                fillManually: 'खुद भरें',
            },
            en: {
                // Auto detect messages
                autoDetecting: '📍 Detecting your location automatically...',
                locationFound: '✅ Location found! Your order will arrive fast!',
                
                // GPS OFF — Emotional message
                gpsOffTitle: '📡 Your GPS is OFF!',
                gpsOffMessage: 'To deliver your order safely to your doorstep, we need your exact location. Please turn ON GPS. 🙏',
                gpsOffInstruction: 'Swipe down from top → Tap 📍 Location/GPS → Turn ON',
                gpsOnButton: "✅ I've turned ON GPS, get my location",
                gpsSkipButton: 'Skip for now, I\'ll type it',
                gpsRetryButton: '🔄 Try Again',
                
                // Permission
                permissionTitle: '📍 Allow Location Access',
                permissionMessage: 'We need your location for fast & accurate delivery. Please tap "Allow".',
                permissionButton: '📍 Allow Location',
                
                // Status
                highAccuracy: '🎯 Highly Accurate',
                mediumAccuracy: '📍 Good Accuracy',
                lowAccuracy: '🌍 Fair Accuracy',
                liveTracking: '🟢 Live Tracking ON',
                
                // Manual fallback
                manualHint: '✍️ Enter your city/village/area',
                fillManually: 'Type manually',
            }
        };
        return texts[lang]?.[key] || texts['hi'][key] || key;
    }

    // ============================================
    // GET LOCATION (Auto)
    // ============================================
    getLocation(silent = true) {
        if (!navigator.geolocation) {
            this.showGPSPopup('gpsOff');
            return;
        }

        this.isLoading = true;
        
        if (!silent) {
            this.showToast(this.t('autoDetecting'), 'info');
        }

        console.log(`📍 Auto-detect attempt ${this.retryCount + 1}/${this.maxRetries}...`);

        navigator.geolocation.getCurrentPosition(
            (position) => this.onSuccess(position, silent),
            (error) => this.onError(error, silent),
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0  // Fresh only
            }
        );
    }

    // ============================================
    // SUCCESS
    // ============================================
    onSuccess(position, silent) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log('✅ LOCATION FOUND:', {
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            accuracy: `${Math.round(accuracy)}m`
        });

        // Invalid check
        if (lat === 0 && lng === 0) {
            this.retry();
            return;
        }

        // ✅ Save
        const data = { lat, lng, accuracy, timestamp: Date.now() };
        this.lastLocation = data;
        
        // Apply to form
        if (this.latitude) this.latitude.value = lat.toFixed(6);
        if (this.longitude) this.longitude.value = lng.toFixed(6);
        if (this.locationUrl) this.locationUrl.value = `https://maps.google.com/?q=${lat},${lng}`;
        
        // Update UI
        if (this.getLocationBtn) {
            this.getLocationBtn.innerHTML = '✅ ' + this.t('locationFound');
            this.getLocationBtn.style.background = '#4CAF50';
            this.getLocationBtn.style.color = '#FFF';
        }
        
        if (this.locationText) {
            this.locationText.classList.remove('hidden');
            let accLabel = this.t('highAccuracy');
            if (accuracy > 30) accLabel = this.t('mediumAccuracy');
            if (accuracy > 80) accLabel = this.t('lowAccuracy');
            
            this.locationText.innerHTML = `
                <span style="color:#4CAF50">🟢</span> ${this.t('liveTracking')}
                <br><small>${accLabel} (~${Math.round(accuracy)}m)</small>
            `;
        }
        
        // Reverse geocode
        this.reverseGeocode(lat, lng);
        
        // Save to storage
        this.saveLocation(data);
        
        // Start live tracking
        this.startLiveTracking();
        
        // Hide GPS popup
        this.hideGPSPopup();
        
        this.isLoading = false;
        this.retryCount = 0;
        
        if (!silent) {
            this.showToast(this.t('locationFound'), 'success');
        }
    }

    // ============================================
    // ERROR
    // ============================================
    onError(error, silent) {
        console.error('❌ Location error:', error.message, '(code:', error.code, ')');
        this.isLoading = false;

        switch (error.code) {
            case 1: // PERMISSION_DENIED
                if (this.retryCount < 3) {
                    // Temporary deny — auto retry
                    this.retryCount++;
                    console.log(`🔄 Permission denied — retry ${this.retryCount} in 5s`);
                    setTimeout(() => this.getLocation(true), 5000);
                } else if (this.retryCount < 6) {
                    // Show permission popup
                    this.showGPSPopup('permission');
                    this.retryCount++;
                } else {
                    // Permanent — show manual fallback
                    this.showManualFallback();
                }
                break;
                
            case 2: // POSITION_UNAVAILABLE (GPS OFF)
            case 3: // TIMEOUT (GPS OFF)
                if (!this.gpsPopupShown) {
                    // ✅ Show emotional GPS message
                    this.showGPSPopup('gpsOff');
                    this.gpsPopupShown = true;
                }
                
                // Auto retry
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    const delay = this.retryCount <= 3 ? 3000 :
                                  this.retryCount <= 6 ? 5000 : 8000;
                    
                    console.log(`🔄 Auto retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`);
                    setTimeout(() => this.getLocation(true), delay);
                } else {
                    this.showManualFallback();
                }
                break;
        }
    }

    retry() {
        this.retryCount++;
        if (this.retryCount < this.maxRetries) {
            setTimeout(() => {
                this.isLoading = false;
                this.getLocation(true);
            }, 2000);
        }
    }

    // ============================================
    // GPS POPUP — Emotional Message
    // ============================================
    showGPSPopup(type) {
        this.hideGPSPopup();
        
        const popup = document.createElement('div');
        popup.id = 'gpsPopup';
        popup.className = 'gps-popup-overlay';
        
        const isGPSOff = type === 'gpsOff';
        const isPermission = type === 'permission';
        
        popup.innerHTML = `
            <div class="gps-popup-card">
                <div class="gps-popup-icon">${isGPSOff ? '📡' : '📍'}</div>
                
                <h2 class="gps-popup-title">
                    ${isGPSOff ? this.t('gpsOffTitle') : this.t('permissionTitle')}
                </h2>
                
                <p class="gps-popup-message">
                    ${isGPSOff ? this.t('gpsOffMessage') : this.t('permissionMessage')}
                </p>
                
                ${isGPSOff ? `
                    <div class="gps-instruction-box">
                        <p>${this.t('gpsOffInstruction')}</p>
                    </div>
                    
                    <div class="gps-waves">
                        <span>📡</span><span>📡</span><span>📡</span>
                    </div>
                ` : ''}
                
                <button class="gps-primary-btn" id="gpsPrimaryBtn">
                    ${isGPSOff ? this.t('gpsOnButton') : this.t('permissionButton')}
                </button>
                
                <button class="gps-retry-btn-auto" id="gpsRetryBtnAuto">
                    ${this.t('gpsRetryButton')}
                </button>
                
                <button class="gps-skip-btn" id="gpsSkipBtn">
                    ${this.t('gpsSkipButton')}
                </button>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Animate in
        requestAnimationFrame(() => {
            popup.classList.add('visible');
        });
        
        // Button Handlers
        document.getElementById('gpsPrimaryBtn')?.addEventListener('click', () => {
            this.hideGPSPopup();
            this.gpsPopupShown = false;
            this.retryCount = 0;
            
            // Wait for user to turn ON GPS then retry
            setTimeout(() => {
                this.showToast(this.t('autoDetecting'), 'info');
                this.getLocation(true);
            }, 2000);
        });
        
        document.getElementById('gpsRetryBtnAuto')?.addEventListener('click', () => {
            this.hideGPSPopup();
            this.gpsPopupShown = false;
            this.retryCount = 0;
            this.showToast(this.t('autoDetecting'), 'info');
            this.getLocation(true);
        });
        
        document.getElementById('gpsSkipBtn')?.addEventListener('click', () => {
            this.hideGPSPopup();
            this.showManualFallback();
        });
        
        // ✅ Auto-dismiss after 60 seconds & retry
        setTimeout(() => {
            if (document.getElementById('gpsPopup')) {
                this.hideGPSPopup();
                this.getLocation(true);
            }
        }, 60000);
    }

    hideGPSPopup() {
        const popup = document.getElementById('gpsPopup');
        if (popup) {
            popup.classList.remove('visible');
            setTimeout(() => popup.remove(), 300);
        }
    }

    // ============================================
    // MANUAL FALLBACK
    // ============================================
    showManualFallback() {
        this.hideGPSPopup();
        
        if (this.villageCity) {
            this.villageCity.placeholder = this.t('manualHint');
            this.villageCity.style.borderColor = '#FF9800';
            this.villageCity.style.borderWidth = '2px';
            this.villageCity.focus();
            
            setTimeout(() => {
                this.villageCity.style.borderColor = '';
                this.villageCity.style.borderWidth = '';
            }, 5000);
        }
        
        if (this.locationText) {
            this.locationText.classList.remove('hidden');
            this.locationText.innerHTML = `<span style="color:#FF9800">✍️</span> ${this.t('fillManually')}`;
        }
        
        if (this.getLocationBtn) {
            this.getLocationBtn.innerHTML = '📍 ' + this.t('gpsRetryButton');
            this.getLocationBtn.style.background = '';
            this.getLocationBtn.style.color = '';
        }
    }

    // ============================================
    // LIVE TRACKING
    // ============================================
    startLiveTracking() {
        this.stopLiveTracking();
        
        if (!navigator.geolocation) return;
        
        console.log('🟢 Live tracking started');
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const accuracy = position.coords.accuracy;
                
                if (this.lastLocation && accuracy < this.lastLocation.accuracy) {
                    console.log('📍 Better accuracy found:', Math.round(accuracy), 'm');
                    
                    const data = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy,
                        timestamp: Date.now()
                    };
                    
                    this.lastLocation = data;
                    if (this.latitude) this.latitude.value = data.lat.toFixed(6);
                    if (this.longitude) this.longitude.value = data.lng.toFixed(6);
                    this.saveLocation(data);
                }
            },
            () => {},
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
        }
    }

    // ============================================
    // PERMISSION WATCH
    // ============================================
    async watchPermission() {
        if (!navigator.permissions) return;
        
        try {
            const perm = await navigator.permissions.query({ name: 'geolocation' });
            
            perm.addEventListener('change', () => {
                console.log('📍 Permission changed:', perm.state);
                
                if (perm.state === 'granted') {
                    // ✅ User allowed — auto detect immediately!
                    console.log('✅ Permission GRANTED — auto detecting...');
                    this.hideGPSPopup();
                    this.gpsPopupShown = false;
                    this.retryCount = 0;
                    this.detectionStarted = false;
                    setTimeout(() => this.autoStart(), 500);
                }
            });
        } catch (e) {}
    }

    // ============================================
    // REVERSE GEOCODING
    // ============================================
    async reverseGeocode(lat, lng) {
        try {
            const lang = this.getLang();
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=${lang}`,
                { headers: { 'User-Agent': 'QuickDukan/1.0' } }
            );
            
            if (!res.ok) return;
            const data = await res.json();
            if (!data?.address) return;

            const addr = data.address;
            const city = addr.village || addr.town || addr.city || addr.county || addr.state_district || '';
            
            if (city && this.villageCity && !this.villageCity.value) {
                this.villageCity.value = city;
                this.villageCity.style.background = '#E8F5E9';
                this.villageCity.style.transition = 'background 0.3s';
                setTimeout(() => this.villageCity.style.background = '', 2000);
            }
            
            const landmark = addr.road || addr.neighbourhood || addr.suburb || '';
            if (landmark && this.landmark && !this.landmark.value) {
                this.landmark.value = landmark;
            }
        } catch (e) {}
    }

    // ============================================
    // STORAGE
    // ============================================
    saveLocation(data) {
        try {
            localStorage.setItem('quick-dukan-location', JSON.stringify(data));
        } catch (e) {}
    }

    // ============================================
    // TOAST
    // ============================================
    showToast(msg, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        const colors = { success: '#4CAF50', error: '#F44336', warning: '#FF9800', info: '#2196F3' };
        
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
        this.hideGPSPopup();
        this.observer?.disconnect();
        clearTimeout(this.toastTimeout);
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.locationManager = new LocationManager();
});

window.addEventListener('beforeunload', () => {
    window.locationManager?.destroy();
});