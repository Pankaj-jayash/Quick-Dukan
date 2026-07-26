// ============================================
// LOCATION.JS - Live Location Auto-Fill
// ============================================

class LocationManager {
    constructor() {
        this.getLocationBtn = document.getElementById('getLocationBtn');
        this.locationText = document.getElementById('locationText');
        this.latitude = document.getElementById('latitude');
        this.longitude = document.getElementById('longitude');
        this.locationUrl = document.getElementById('locationUrl');
        this.villageCity = document.getElementById('villageCity');
        this.isLoading = false;

        if (!this.getLocationBtn) return;

        this.init();
    }

    init() {
        this.getLocationBtn.addEventListener('click', () => {
            this.getLocation();
        });

        // Auto-detect on checkout open
        document.addEventListener('checkoutOpened', () => {
            setTimeout(() => {
                this.getLocation(true); // Silent mode
            }, 500);
        });
    }

    getLocation(silent = false) {
        if (this.isLoading) return;

        if (!navigator.geolocation) {
            alert('आपके ब्राउज़र में लोकेशन सपोर्ट नहीं है');
            return;
        }

        this.isLoading = true;

        if (this.getLocationBtn) {
            this.getLocationBtn.classList.add('loading');
            this.getLocationBtn.innerHTML = '<span class="location-icon">⏳</span> लोकेशन ले रहे हैं...';
        }

        if (!silent) {
            this.showToast('📍 लोकेशन ली जा रही है...');
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.onLocationSuccess(position, silent);
            },
            (error) => {
                this.onLocationError(error, silent);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    onLocationSuccess(position, silent) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log('📍 Location:', lat, lng);

        // Save coordinates
        if (this.latitude) this.latitude.value = lat;
        if (this.longitude) this.longitude.value = lng;

        // Create Google Maps URL
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        if (this.locationUrl) this.locationUrl.value = mapsUrl;

        // Show success
        if (this.getLocationBtn) {
            this.getLocationBtn.classList.remove('loading');
            this.getLocationBtn.innerHTML = '<span class="location-icon">✅</span> लोकेशन मिल गई';
            this.getLocationBtn.style.background = '#25D366';
        }

        if (this.locationText) {
            this.locationText.classList.remove('hidden');
        }

        // Try to reverse geocode (get address from coordinates)
        this.reverseGeocode(lat, lng);

        this.isLoading = false;

        if (!silent) {
            this.showToast('✅ लोकेशन मिल गई!');
        }

        // Save location
        this.saveLocation({ lat, lng, url: mapsUrl });
    }

    onLocationError(error, silent) {
        console.error('Location error:', error);

        this.isLoading = false;

        if (this.getLocationBtn) {
            this.getLocationBtn.classList.remove('loading');
            this.getLocationBtn.innerHTML = '<span class="location-icon">📍</span> लोकेशन लें';
        }

        let msg = 'लोकेशन नहीं मिल पाई';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                msg = '⚠️ लोकेशन की परमिशन नहीं मिली। कृपया ब्राउज़र सेटिंग में जाकर लोकेशन ऑन करें।';
                break;
            case error.POSITION_UNAVAILABLE:
                msg = '⚠️ लोकेशन उपलब्ध नहीं है।';
                break;
            case error.TIMEOUT:
                msg = '⚠️ लोकेशन लेने में बहुत समय लग गया।';
                break;
        }

        if (!silent) {
            alert(msg);
        } else {
            console.log(msg);
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            // Using OpenStreetMap Nominatim (free, no API key needed)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                { headers: { 'Accept-Language': 'hi' } }
            );

            if (!response.ok) return;

            const data = await response.json();

            if (data && data.address) {
                const addr = data.address;

                // Extract village/city
                const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';

                if (city && this.villageCity && !this.villageCity.value) {
                    this.villageCity.value = city;
                    this.villageCity.classList.add('valid');
                }
            }
        } catch (error) {
            console.log('Reverse geocoding failed, user can type manually');
        }
    }

    saveLocation(location) {
        try {
            localStorage.setItem('quick-dukan-location', JSON.stringify(location));
        } catch (e) {
            // ignore
        }
    }

    getSavedLocation() {
        try {
            const data = localStorage.getItem('quick-dukan-location');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    applySavedLocation() {
        const saved = this.getSavedLocation();
        if (!saved) return;

        if (this.latitude) this.latitude.value = saved.lat || '';
        if (this.longitude) this.longitude.value = saved.lng || '';
        if (this.locationUrl) this.locationUrl.value = saved.url || '';

        if (this.getLocationBtn) {
            this.getLocationBtn.innerHTML = '<span class="location-icon">✅</span> लोकेशन मिल गई';
            this.getLocationBtn.style.background = '#25D366';
        }

        if (this.locationText) {
            this.locationText.classList.remove('hidden');
        }
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
        }, 2000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.locationManager = new LocationManager();
});
