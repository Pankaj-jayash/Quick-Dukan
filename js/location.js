// ============================================
// LOCATION.JS - Quick Dukan
// Perfect Auto-Detect | Smooth UX | Always Fresh
// ============================================

class LocationManager {
    constructor() {
        // DOM Elements
        this.getLocationBtn = document.getElementById('getLocationBtn');
        this.locationText = document.getElementById('locationText');
        this.latitude = document.getElementById('latitude');
        this.longitude = document.getElementById('longitude');
        this.locationUrl = document.getElementById('locationUrl');
        this.villageCity = document.getElementById('villageCity');
        this.landmark = document.getElementById('landmark');
        
        // State
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 5;              // ✅ Balanced
        this.watchId = null;
        this.lastLocation = null;
        this.gpsPopupVisible = false;
        this.detectionActive = false;
        this.lastAutoStartTime = 0;
        this.locationResolved = false;    // ✅ Track if location already found
        this.permissionState = 'prompt';  // prompt | granted | denied
        
        // Timers
        this.toastTimer = null;
        this.retryTimer = null;
        this.liveTrackTimer = null;
        this.popupAutoCloseTimer = null;
        
        // Settings
        this.AUTO_START_DEBOUNCE = 5000;  // 5 sec
        this.POPUP_AUTO_CLOSE = 0;        // ✅ Never auto-close
        this.LIVE_TRACK_MAX_DURATION = 5 * 60 * 1000; // 5 min
        this.MIN_ACCURACY = 80;           // meters
        
        if (!this.getLocationBtn) return;
        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    init() {
        // Manual button (fallback)
        this.getLocationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.getLocation(false);
        });

        // ✅ Checkout open → AUTO START
        document.addEventListener('checkoutOpened', () => {
            setTimeout(() => this.autoStart(), 400);
        });

        // ✅ Checkout close → RESET
        document.addEventListener('checkoutClosed', () => {
            this.resetAll();
        });

        // ✅ Watch for modal visibility changes
        this.observeCheckoutModal();
        
        // ✅ Permission change → auto react
        this.watchPermissionChanges();
        
        // ✅ User returns to tab → retry if needed
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.detectionActive && !this.locationResolved) {
                console.log('👁 Tab visible — checking location...');
                setTimeout(() => this.getLocation(true), 800);
            }
        });
        
        // ✅ Window focus → retry (user may have turned ON GPS)
        window.addEventListener('focus', () => {
            if (this.detectionActive && !this.locationResolved && this.gpsPopupVisible) {
                console.log('👁 Window focused — GPS may be ON now...');
                setTimeout(() => {
                    this.hideGPSPopup();
                    this.retryCount = 0;
                    this.getLocation(true);
                }, 1500);
            }
        });
    }

    observeCheckoutModal() {
        const modal = document.getElementById('checkoutModal');
        if (!modal) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isHidden = modal.classList.contains('hidden');
                    if (!isHidden && !this.detectionActive) {
                        setTimeout(() => this.autoStart(), 400);
                    } else if (isHidden && this.detectionActive) {
                        this.resetAll();
                    }
                }
            });
        });
        
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
        this.modalObserver = observer;
    }

    // ============================================
    // LANGUAGE SYSTEM
    // ============================================
    getLang() {
        return localStorage.getItem('quickDukanLang') || CONFIG?.defaultLanguage || 'hi';
    }

    t(key) {
        const lang = this.getLang();
        const texts = {
            hi: {
                detecting: '📍 आपकी लोकेशन ली जा रही है...',
                found: '✅ लोकेशन मिल गई!',
                foundDetail: 'आपका ऑर्डर जल्द ही आपके घर पहुँचेगा! 🚀',
                liveOn: '🟢 लाइव लोकेशन एक्टिव',
                gpsOffTitle: '📡 GPS बंद है',
                gpsOffMessage: 'आपका सामान सही-सलामत आपके घर तक पहुँचाने के लिए हमें आपकी सटीक लोकेशन चाहिए। कृपया GPS चालू करें। 🙏',
                gpsInstruction: '📱 ऊपर से नीचे स्वाइप करें → 📍 Location icon दबाएं',
                gpsOnDone: '✅ GPS चालू कर दिया! लोकेशन लें',
                permissionTitle: '📍 लोकेशन की अनुमति',
                permissionMessage: 'डिलीवरी के लिए आपकी लोकेशन ज़रूरी है। "Allow" करें।',
                permissionButton: '📍 Allow करें',
                retryBtn: '🔄 फिर से कोशिश करें',
                closeBtn: '✕',
                skipBtn: 'बाद में, खुद भर दूँगा',
                manualHint: '✍️ अपना गाँव/शहर/इलाका लिखें',
                accuracyHigh: '🎯 बहुत सटीक',
                accuracyMedium: '📍 ठीक-ठाक',
                accuracyLow: '🌍 कम सटीक — जाँच लें',
                oldLocation: '⚠️ पुरानी लोकेशन मिली, नई ले रहे हैं...',
                refreshingLocation: '🔄 बेहतर लोकेशन ले रहे हैं...',
            },
            en: {
                detecting: '📍 Getting your location...',
                found: '✅ Location found!',
                foundDetail: 'Your order will reach your doorstep soon! 🚀',
                liveOn: '🟢 Live Location Active',
                gpsOffTitle: '📡 GPS is OFF',
                gpsOffMessage: 'We need your exact location to deliver your order safely to your home. Please turn ON GPS. 🙏',
                gpsInstruction: '📱 Swipe down from top → Tap 📍 Location icon',
                gpsOnDone: "✅ I've turned ON GPS! Get Location",
                permissionTitle: '📍 Location Permission',
                permissionMessage: 'We need your location for delivery. Please tap "Allow".',
                permissionButton: '📍 Allow',
                retryBtn: '🔄 Try Again',
                closeBtn: '✕',
                skipBtn: 'Skip, I\'ll type it',
                manualHint: '✍️ Enter your city/village/area',
                accuracyHigh: '🎯 Very Accurate',
                accuracyMedium: '📍 Good',
                accuracyLow: '🌍 Low Accuracy — Verify',
                oldLocation: '⚠️ Old location found, getting fresh...',
                refreshingLocation: '🔄 Getting better location...',
            }
        };
        return texts[lang]?.[key] || texts['hi'][key] || key;
    }

    // ============================================
    // AUTO START
    // ============================================
    autoStart() {
        // ✅ Debounce
        if (Date.now() - this.lastAutoStartTime < this.AUTO_START_DEBOUNCE) {
            console.log('⏭️ Too soon for auto-start');
            return;
        }
        
        // ✅ Already resolved? Skip
        if (this.locationResolved) {
            console.log('✅ Location already resolved, using existing');
            return;
        }
        
        console.log('🚀 AUTO START: Location detection');
        this.lastAutoStartTime = Date.now();
        this.detectionActive = true;
        this.retryCount = 0;
        this.gpsPopupVisible = false;
        
        // Clear any existing popup
        this.hideGPSPopup();
        
        // Start fresh detection
        this.showToast(this.t('detecting'), 'info');
        this.getLocation(true);
    }

    // ============================================
    // GET LOCATION
    // ============================================
    getLocation(silent = true) {
        if (this.isLoading) {
            console.log('⏳ Already requesting location...');
            return;
        }

        if (!navigator.geolocation) {
            this.showGPSPopup('gpsOff');
            return;
        }

        this.isLoading = true;

        if (!silent && this.getLocationBtn) {
            this.getLocationBtn.innerHTML = '⏳ ' + this.t('detecting');
            this.getLocationBtn.style.background = '#FF9800';
            this.getLocationBtn.style.color = '#FFF';
        }

        console.log(`📍 Requesting position... (attempt ${this.retryCount + 1}/${this.maxRetries})`);

        // ✅ Progressive timeout
        const timeout = this.retryCount <= 1 ? 10000 :
                        this.retryCount <= 3 ? 15000 : 20000;

        navigator.geolocation.getCurrentPosition(
            (position) => this.onSuccess(position, silent),
            (error) => this.onError(error, silent),
            {
                enableHighAccuracy: true,
                timeout: timeout,
                maximumAge: 0  // ✅ ALWAYS FRESH — no cache
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
        const timestamp = position.timestamp;
        const ageMs = Date.now() - timestamp;

        console.log('✅ LOCATION:', {
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            accuracy: `${Math.round(accuracy)}m`,
            age: `${(ageMs / 1000).toFixed(1)}s`
        });

        // ❌ Invalid coordinates
        if ((lat === 0 && lng === 0) || !isFinite(lat) || !isFinite(lng)) {
            console.error('❌ Invalid coordinates');
            this.isLoading = false;
            this.scheduleRetry();
            return;
        }

        // ⚠️ Cached/old location — retry for fresh
        if (ageMs > 30000 && this.retryCount < 3) {
            console.warn('⚠️ Cached location — retrying for fresh...');
            if (!silent) this.showToast(this.t('oldLocation'), 'warning');
            this.isLoading = false;
            this.retryCount++;
            setTimeout(() => this.getLocation(silent), 1500);
            return;
        }

        // ⚠️ Low accuracy — try for better
        if (accuracy > this.MIN_ACCURACY && this.retryCount < 3) {
            console.warn(`⚠️ Low accuracy (${Math.round(accuracy)}m) — retrying...`);
            if (!silent) this.showToast(this.t('refreshingLocation'), 'info');
            this.isLoading = false;
            this.retryCount++;
            setTimeout(() => this.getLocation(silent), 2000);
            return;
        }

        // ✅ SUCCESS!
        const data = { lat, lng, accuracy, timestamp: Date.now() };
        this.lastLocation = data;
        this.locationResolved = true;

        // Apply to form
        this.applyLocationToForm(data);
        
        // Reverse geocode
        this.reverseGeocode(lat, lng);
        
        // Save
        this.saveLocation(data);
        
        // Start live tracking
        this.startLiveTracking();
        
        // Hide popup
        this.hideGPSPopup();
        
        // Update UI
        this.updateUIOnSuccess(accuracy);
        
        this.isLoading = false;
        this.retryCount = 0;
        this.gpsPopupVisible = false;

        if (!silent) {
            this.showToast(`${this.t('found')} ${this.t('foundDetail')}`, 'success');
        }
    }

    applyLocationToForm(data) {
        if (this.latitude) this.latitude.value = data.lat.toFixed(6);
        if (this.longitude) this.longitude.value = data.lng.toFixed(6);
        if (this.locationUrl) this.locationUrl.value = 
            `https://maps.google.com/?q=${data.lat},${data.lng}`;
    }

    updateUIOnSuccess(accuracy) {
        // Button
        if (this.getLocationBtn) {
            this.getLocationBtn.innerHTML = '✅ ' + this.t('found');
            this.getLocationBtn.style.background = '#4CAF50';
            this.getLocationBtn.style.color = '#FFF';
            
            // Reset button style after 5 sec
            setTimeout(() => {
                if (this.getLocationBtn && this.locationResolved) {
                    this.getLocationBtn.style.background = '';
                    this.getLocationBtn.style.color = '';
                    this.getLocationBtn.innerHTML = '📍 ' + this.t('found');
                }
            }, 5000);
        }
        
        // Status text
        if (this.locationText) {
            this.locationText.classList.remove('hidden');
            
            let accLabel;
            if (accuracy <= 20) accLabel = this.t('accuracyHigh');
            else if (accuracy <= 50) accLabel = this.t('accuracyMedium');
            else accLabel = this.t('accuracyLow');
            
            this.locationText.innerHTML = `
                <span style="color:#4CAF50">🟢</span> ${this.t('liveOn')}
                <br><small>${accLabel} (~${Math.round(accuracy)}m)</small>
            `;
        }
    }

    // ============================================
    // ERROR
    // ============================================
    onError(error, silent) {
        console.error('❌ Location error:', error.message, '(code:', error.code, ')');
        this.isLoading = false;

        if (error.code === 1) {
            // PERMISSION_DENIED
            this.permissionState = 'denied';
            
            if (this.retryCount < 2) {
                // Temporary — auto retry
                this.retryCount++;
                console.log(`🔄 Permission temp deny — retry ${this.retryCount} in 6s`);
                this.scheduleRetry(6000);
            } else if (!this.gpsPopupVisible) {
                // Show permission popup
                this.showGPSPopup('permission');
                this.gpsPopupVisible = true;
            } else {
                // Already showed popup — manual fallback
                this.showManualFallback();
            }
        } else {
            // POSITION_UNAVAILABLE (2) or TIMEOUT (3) = GPS OFF
            if (!this.gpsPopupVisible && this.retryCount >= 1) {
                this.showGPSPopup('gpsOff');
                this.gpsPopupVisible = true;
            }
            
            // Auto retry
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                const delay = this.retryCount <= 2 ? 3000 :
                              this.retryCount <= 4 ? 6000 : 10000;
                this.scheduleRetry(delay);
            } else {
                this.showManualFallback();
            }
        }
    }

    scheduleRetry(delay = 3000) {
        clearTimeout(this.retryTimer);
        console.log(`🔄 Scheduling retry in ${delay}ms`);
        this.retryTimer = setTimeout(() => this.getLocation(true), delay);
    }

    // ============================================
    // GPS POPUP
    // ============================================
    showGPSPopup(type) {
        // Remove existing
        this.hideGPSPopup();
        
        const isGPSOff = type === 'gpsOff';
        
        const overlay = document.createElement('div');
        overlay.id = 'gpsPopup';
        overlay.className = 'gps-popup-overlay';
        
        overlay.innerHTML = `
            <div class="gps-popup-card">
                <!-- Close Button -->
                <button class="gps-close-btn" id="gpsCloseBtn" aria-label="Close">
                    ${this.t('closeBtn')}
                </button>
                
                <!-- Icon -->
                <div class="gps-popup-icon">${isGPSOff ? '📡' : '📍'}</div>
                
                <!-- Title -->
                <h2 class="gps-popup-title">
                    ${isGPSOff ? this.t('gpsOffTitle') : this.t('permissionTitle')}
                </h2>
                
                <!-- Message -->
                <p class="gps-popup-message">
                    ${isGPSOff ? this.t('gpsOffMessage') : this.t('permissionMessage')}
                </p>
                
                ${isGPSOff ? `
                    <!-- GPS Instruction -->
                    <div class="gps-instruction-box">
                        <p>${this.t('gpsInstruction')}</p>
                    </div>
                    
                    <!-- Animated Waves -->
                    <div class="gps-waves">
                        <span>📡</span><span>📡</span><span>📡</span>
                    </div>
                ` : ''}
                
                <!-- Primary Button -->
                <button class="gps-primary-btn" id="gpsPrimaryBtn">
                    ${isGPSOff ? this.t('gpsOnDone') : this.t('permissionButton')}
                </button>
                
                <!-- Retry Button -->
                <button class="gps-retry-btn" id="gpsRetryBtn">
                    ${this.t('retryBtn')}
                </button>
                
                <!-- Skip Button -->
                <button class="gps-skip-btn" id="gpsSkipBtn">
                    ${this.t('skipBtn')}
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // ✅ Close button
        overlay.querySelector('#gpsCloseBtn').addEventListener('click', () => {
            this.hideGPSPopup();
            this.gpsPopupVisible = false;
            this.showManualFallback();
        });
        
        // ✅ Primary button — "GPS ON kar diya"
        overlay.querySelector('#gpsPrimaryBtn').addEventListener('click', () => {
            this.hideGPSPopup();
            this.gpsPopupVisible = false;
            this.retryCount = 0;
            this.showToast(this.t('detecting'), 'info');
            
            // Wait for GPS to initialize
            setTimeout(() => this.getLocation(false), 2000);
        });
        
        // ✅ Retry button
        overlay.querySelector('#gpsRetryBtn').addEventListener('click', () => {
            this.hideGPSPopup();
            this.gpsPopupVisible = false;
            this.retryCount = 0;
            this.showToast(this.t('detecting'), 'info');
            this.getLocation(false);
        });
        
        // ✅ Skip button
        overlay.querySelector('#gpsSkipBtn').addEventListener('click', () => {
            this.hideGPSPopup();
            this.gpsPopupVisible = false;
            this.showManualFallback();
        });
        
        // ✅ Click outside to close? NO — user must interact
        // overlay.addEventListener('click', (e) => {
        //     if (e.target === overlay) this.hideGPSPopup();
        // });
        
        // ✅ Auto-close? NO — wait for user action
        // clearTimeout(this.popupAutoCloseTimer);
        // this.popupAutoCloseTimer = setTimeout(() => this.hideGPSPopup(), 60000);
    }

    hideGPSPopup() {
        const popup = document.getElementById('gpsPopup');
        if (popup) {
            popup.classList.remove('visible');
            setTimeout(() => {
                if (popup.parentNode) popup.remove();
            }, 300);
        }
        this.gpsPopupVisible = false;
        clearTimeout(this.popupAutoCloseTimer);
    }

    // ============================================
    // LIVE TRACKING
    // ============================================
    startLiveTracking() {
        this.stopLiveTracking();
        
        if (!navigator.geolocation) return;
        
        console.log('🟢 Live tracking started (max 5 min)');
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const accuracy = position.coords.accuracy;
                
                if (this.lastLocation && accuracy < this.lastLocation.accuracy) {
                    console.log('📍 Better accuracy:', Math.round(accuracy), 'm');
                    
                    const data = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy,
                        timestamp: Date.now()
                    };
                    
                    this.lastLocation = data;
                    this.applyLocationToForm(data);
                    this.saveLocation(data);
                    
                    // Update accuracy display
                    if (this.locationText) {
                        this.locationText.innerHTML = `
                            <span style="color:#4CAF50">🟢</span> ${this.t('liveOn')}
                            <br><small>${this.t('accuracyHigh')} (~${Math.round(accuracy)}m)</small>
                        `;
                    }
                }
            },
            (error) => {
                console.log('📍 Live tracking update:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );
        
        // ✅ Stop live tracking after 5 min (battery save)
        clearTimeout(this.liveTrackTimer);
        this.liveTrackTimer = setTimeout(() => {
            this.stopLiveTracking();
            console.log('🔴 Live tracking stopped — timeout');
        }, this.LIVE_TRACK_MAX_DURATION);
    }

    stopLiveTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            console.log('🔴 Live tracking stopped');
        }
    }

    // ============================================
    // PERMISSION WATCHER
    // ============================================
    async watchPermissionChanges() {
        if (!navigator.permissions) return;
        
        try {
            const perm = await navigator.permissions.query({ name: 'geolocation' });
            this.permissionState = perm.state;
            
            perm.addEventListener('change', () => {
                console.log('📍 Permission:', perm.state);
                this.permissionState = perm.state;
                
                if (perm.state === 'granted') {
                    // ✅ GRANTED! Auto-detect immediately
                    console.log('✅ Permission GRANTED — auto detecting!');
                    this.hideGPSPopup();
                    this.retryCount = 0;
                    setTimeout(() => this.getLocation(true), 600);
                } else if (perm.state === 'denied') {
                    console.log('❌ Permission DENIED');
                }
            });
        } catch (e) {
            console.log('Permission API not available');
        }
    }

    // ============================================
    // MANUAL FALLBACK
    // ============================================
    showManualFallback() {
        console.log('✍️ Showing manual fallback');
        
        if (this.villageCity) {
            this.villageCity.placeholder = this.t('manualHint');
            this.villageCity.style.borderColor = '#FF9800';
            this.villageCity.style.borderWidth = '2px';
            this.villageCity.focus();
            
            setTimeout(() => {
                if (this.villageCity) {
                    this.villageCity.style.borderColor = '';
                    this.villageCity.style.borderWidth = '';
                }
            }, 5000);
        }
        
        if (this.locationText) {
            this.locationText.classList.remove('hidden');
            this.locationText.innerHTML = '✍️ Manual entry';
        }
        
        if (this.getLocationBtn) {
            this.getLocationBtn.innerHTML = '📍 ' + this.t('retryBtn');
            this.getLocationBtn.style.background = '';
            this.getLocationBtn.style.color = '';
        }
        
        this.detectionActive = false;
        this.gpsPopupVisible = false;
    }

    // ============================================
    // RESET
    // ============================================
    resetAll() {
        console.log('🔄 Resetting location manager...');
        
        this.detectionActive = false;
        this.locationResolved = false;
        this.retryCount = 0;
        this.isLoading = false;
        this.gpsPopupVisible = false;
        this.lastLocation = null;
        
        this.stopLiveTracking();
        this.hideGPSPopup();
        
        clearTimeout(this.retryTimer);
        clearTimeout(this.liveTrackTimer);
        clearTimeout(this.popupAutoCloseTimer);
        
        // Reset UI
        if (this.getLocationBtn) {
            this.getLocationBtn.innerHTML = '📍 ' + this.t('detecting');
            this.getLocationBtn.style.background = '';
            this.getLocationBtn.style.color = '';
        }
        
        if (this.locationText) {
            this.locationText.classList.add('hidden');
        }
        
        // Clear form fields
        if (this.latitude) this.latitude.value = '';
        if (this.longitude) this.longitude.value = '';
        if (this.locationUrl) this.locationUrl.value = '';
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
            const city = addr.village || addr.town || addr.city || 
                         addr.county || addr.state_district || '';
            
            if (city && this.villageCity && !this.villageCity.value) {
                this.villageCity.value = city;
                this.villageCity.style.background = '#E8F5E9';
                this.villageCity.style.transition = 'background 0.4s ease';
                setTimeout(() => {
                    if (this.villageCity) this.villageCity.style.background = '';
                }, 2500);
            }
            
            const landmark = addr.road || addr.neighbourhood || addr.suburb || '';
            if (landmark && this.landmark && !this.landmark.value) {
                this.landmark.value = landmark;
            }
        } catch (e) {
            console.log('📍 Reverse geocode failed, manual entry OK');
        }
    }

    // ============================================
    // STORAGE
    // ============================================
    saveLocation(data) {
        try {
            localStorage.setItem('quick-dukan-location', JSON.stringify({
                ...data,
                savedAt: Date.now()
            }));
        } catch (e) {}
    }

    getSavedLocation() {
        try {
            const raw = localStorage.getItem('quick-dukan-location');
            if (!raw) return null;
            
            const data = JSON.parse(raw);
            const age = Date.now() - data.savedAt;
            
            // ❌ Don't use if older than 5 minutes
            if (age > 5 * 60 * 1000) {
                localStorage.removeItem('quick-dukan-location');
                return null;
            }
            
            return data;
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
        
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            if (toast) {
                toast.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => {
                    if (toast) toast.classList.add('hidden');
                }, 300);
            }
        }, 3000);
    }

    // ============================================
    // CLEANUP
    // ============================================
    destroy() {
        this.resetAll();
        
        if (this.modalObserver) {
            this.modalObserver.disconnect();
        }
        
        clearTimeout(this.toastTimer);
        clearTimeout(this.retryTimer);
        clearTimeout(this.liveTrackTimer);
        clearTimeout(this.popupAutoCloseTimer);
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