// ============================================
// FLOATING-MAP.JS - Live Tracking Floating Map
// Quick Dukan - Leaflet + OpenStreetMap | Zomato-Style
// ============================================

class FloatingMapManager {
    constructor() {
        // DOM
        this.container = null;
        this.mapElement = null;
        this.map = null;
        this.markers = {};
        
        // Shop Location (Fixed)
        this.shopLocation = {
            lat: 27.6667496,
            lng: 77.7124673,
            name: 'Quick Dukan',
            icon: '🏪'
        };
        
        // State
        this.isVisible = false;
        this.isCollapsed = false;
        this.activeOrder = null;
        this.updateInterval = null;
        this.riderProgress = 0;
        this.currentLang = 'hi';
        
        // Settings
        this.UPDATE_INTERVAL = 30000; // 30 seconds
        this.RIDER_SPEED = 30; // km/h
        this.ETA_PER_KM = 5; // minutes per km
        
        this.init();
    }
    
    init() {
        this.detectLanguage();
        this.createContainer();
        this.bindEvents();
        
        // Check for active orders every 10 seconds
        setInterval(() => this.checkActiveOrder(), 10000);
        
        console.log('🗺️ Floating Map Manager Initialized');
        console.log('🏪 Shop:', this.shopLocation.name, `(${this.shopLocation.lat}, ${this.shopLocation.lng})`);
    }
    
    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }
    
    // ============================================
    // CREATE FLOATING MAP CONTAINER
    // ============================================
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'floating-map-container';
        this.container.id = 'floatingMapContainer';
        
        const isHindi = this.currentLang === 'hi';
        
        this.container.innerHTML = `
            <div class="floating-map-header" id="floatingMapHeader">
                <div class="floating-map-header-left">
                    <span class="pulse-dot"></span>
                    <span>${isHindi ? '🛵 लाइव ट्रैकिंग' : '🛵 Live Tracking'}</span>
                </div>
                <div class="floating-map-actions">
                    <button class="floating-map-btn" id="btnCollapseMap" title="${isHindi ? 'छोटा करें' : 'Collapse'}">−</button>
                    <button class="floating-map-btn" id="btnCloseMap" title="${isHindi ? 'बंद करें' : 'Close'}">✕</button>
                </div>
            </div>
            <div class="floating-map-body" id="floatingMapBody"></div>
            <div class="floating-map-info">
                <div class="floating-map-info-row">
                    <span>📍 <span class="distance" id="mapDistance">-- km</span></span>
                    <span>⏱️ <span class="eta" id="mapETA">-- min</span></span>
                </div>
                <div class="floating-map-actions-row">
                    <button class="floating-map-action-btn call-btn" id="btnCallShop">
                        📞 ${isHindi ? 'दुकान पर कॉल' : 'Call Shop'}
                    </button>
                    <button class="floating-map-action-btn view-btn" id="btnViewFullMap">
                        🗺️ ${isHindi ? 'पूरा मैप देखें' : 'View Full Map'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        this.mapElement = document.getElementById('floatingMapBody');
        
        // Initialize map
        this.initMap();
    }
    
    // ============================================
    // INITIALIZE LEAFLET MAP
    // ============================================
    initMap() {
        if (!this.mapElement) return;
        if (typeof L === 'undefined') {
            console.warn('⚠️ Leaflet not loaded yet, retrying...');
            setTimeout(() => this.initMap(), 500);
            return;
        }
        
        // Create map centered on shop
        this.map = L.map(this.mapElement, {
            center: [this.shopLocation.lat, this.shopLocation.lng],
            zoom: 14,
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            scrollWheelZoom: false,
            doubleClickZoom: true
        });
        
        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(this.map);
        
        // Add shop marker
        this.addShopMarker();
        
        console.log('🗺️ Map initialized');
    }
    
    // ============================================
    // ADD SHOP MARKER
    // ============================================
    addShopMarker() {
        if (!this.map) return;
        
        const shopIcon = L.divIcon({
            html: '<div style="font-size:28px;">🏪</div>',
            className: 'custom-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
        
        this.markers.shop = L.marker(
            [this.shopLocation.lat, this.shopLocation.lng],
            { icon: shopIcon }
        ).addTo(this.map);
        
        this.markers.shop.bindPopup(`<b>${this.shopLocation.name}</b><br>Your Shop`);
    }
    
    // ============================================
    // ADD CUSTOMER MARKER
    // ============================================
    addCustomerMarker(lat, lng) {
        if (!this.map) return;
        
        // Remove existing
        if (this.markers.customer) {
            this.map.removeLayer(this.markers.customer);
        }
        
        const customerIcon = L.divIcon({
            html: '<div style="font-size:28px;">📍</div>',
            className: 'custom-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 36]
        });
        
        this.markers.customer = L.marker(
            [lat, lng],
            { icon: customerIcon }
        ).addTo(this.map);
        
        this.markers.customer.bindPopup('<b>Customer</b><br>Delivery Location');
    }
    
    // ============================================
    // ADD/UPDATE RIDER MARKER
    // ============================================
    updateRiderMarker(progress) {
        if (!this.map) return;
        if (!this.activeOrder) return;
        
        const shopLat = this.shopLocation.lat;
        const shopLng = this.shopLocation.lng;
        const custLat = this.activeOrder.customerLat || shopLat + 0.01;
        const custLng = this.activeOrder.customerLng || shopLng + 0.01;
        
        // Calculate rider position
        const riderLat = shopLat + (custLat - shopLat) * progress;
        const riderLng = shopLng + (custLng - shopLng) * progress;
        
        // Remove existing
        if (this.markers.rider) {
            this.map.removeLayer(this.markers.rider);
        }
        
        const riderIcon = L.divIcon({
            html: '<div style="font-size:30px; animation: bounce 1s infinite;">🛵</div>',
            className: 'custom-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        
        this.markers.rider = L.marker(
            [riderLat, riderLng],
            { icon: riderIcon }
        ).addTo(this.map);
    }
    
    // ============================================
    // ADD ROUTE LINE
    // ============================================
    addRouteLine() {
        if (!this.map || !this.activeOrder) return;
        
        // Remove existing
        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
        }
        
        const shopLat = this.shopLocation.lat;
        const shopLng = this.shopLocation.lng;
        const custLat = this.activeOrder.customerLat || shopLat + 0.01;
        const custLng = this.activeOrder.customerLng || shopLng + 0.01;
        
        this.routeLine = L.polyline(
            [[shopLat, shopLng], [custLat, custLng]],
            {
                color: '#2E7D32',
                weight: 3,
                opacity: 0.6,
                dashArray: '10, 10'
            }
        ).addTo(this.map);
        
        // Fit bounds
        const bounds = L.latLngBounds(
            [shopLat, shopLng],
            [custLat, custLng]
        );
        this.map.fitBounds(bounds, { padding: [30, 30] });
    }
    
    // ============================================
    // CALCULATE DISTANCE
    // ============================================
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    toRad(deg) {
        return deg * (Math.PI / 180);
    }
    
    // ============================================
    // UPDATE MAP WITH ORDER
    // ============================================
    updateMapWithOrder(order) {
        this.activeOrder = order;
        
        if (!order.tracking?.customerLocation) return;
        
        const custLat = order.tracking.customerLocation.lat;
        const custLng = order.tracking.customerLocation.lng;
        
        // Add customer marker
        this.addCustomerMarker(custLat, custLng);
        
        // Add route line
        this.addRouteLine();
        
        // Calculate distance
        const distance = this.calculateDistance(
            this.shopLocation.lat, this.shopLocation.lng,
            custLat, custLng
        );
        
        // Update rider (simulate progress)
        this.riderProgress = Math.min(0.3 + Math.random() * 0.4, 0.9);
        this.updateRiderMarker(this.riderProgress);
        
        // Update info
        this.updateInfo(distance);
        
        // Start updates
        this.startUpdates();
    }
    
    // ============================================
    // UPDATE INFO BAR
    // ============================================
    updateInfo(distance) {
        const distanceEl = document.getElementById('mapDistance');
        const etaEl = document.getElementById('mapETA');
        
        if (distanceEl) {
            if (distance < 1) {
                distanceEl.textContent = `${Math.round(distance * 1000)} m`;
            } else {
                distanceEl.textContent = `${distance.toFixed(1)} km`;
            }
        }
        
        if (etaEl) {
            const eta = Math.round(distance * this.ETA_PER_KM);
            if (eta < 1) {
                etaEl.textContent = this.currentLang === 'hi' ? 'अभी पहुँच रहा' : 'Arriving now';
            } else {
                etaEl.textContent = this.currentLang === 'hi' 
                    ? `~${eta} मिनट` 
                    : `~${eta} min`;
            }
        }
    }
    
    // ============================================
    // START LIVE UPDATES
    // ============================================
    startUpdates() {
        this.stopUpdates();
        
        this.updateInterval = setInterval(() => {
            if (!this.activeOrder) return;
            
            // Simulate rider movement
            this.riderProgress = Math.min(this.riderProgress + 0.05, 0.95);
            this.updateRiderMarker(this.riderProgress);
            
            // Recalculate distance
            const custLat = this.activeOrder.tracking?.customerLocation?.lat;
            const custLng = this.activeOrder.tracking?.customerLocation?.lng;
            
            if (custLat && custLng) {
                const distance = this.calculateDistance(
                    this.shopLocation.lat, this.shopLocation.lng,
                    custLat, custLng
                );
                const remainingDistance = distance * (1 - this.riderProgress);
                this.updateInfo(remainingDistance);
            }
        }, this.UPDATE_INTERVAL);
    }
    
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    // ============================================
    // CHECK ACTIVE ORDER
    // ============================================
    checkActiveOrder() {
        if (!window.ordersManager) return;
        
        const orders = window.ordersManager.getOrders();
        const activeOrder = orders.find(o => 
            o.status === 'confirmed' || o.status === 'in_transit'
        );
        
        if (activeOrder) {
            // Save customer location from order if not already
            if (!activeOrder.tracking?.customerLocation && activeOrder.location) {
                activeOrder.tracking = activeOrder.tracking || {};
                activeOrder.tracking.customerLocation = {
                    lat: parseFloat(activeOrder.location.lat),
                    lng: parseFloat(activeOrder.location.lng)
                };
            }
            
            this.activeOrder = activeOrder;
            
            // Show if orders modal is closed
            const ordersModal = document.getElementById('ordersModal');
            if (ordersModal?.classList.contains('hidden')) {
                this.show();
                this.updateMapWithOrder(activeOrder);
            }
        } else {
            this.hide();
            this.stopUpdates();
        }
    }
    
    // ============================================
    // SHOW / HIDE
    // ============================================
    show() {
        if (!this.container) return;
        if (this.isVisible) return;
        
        this.container.classList.add('visible');
        this.isVisible = true;
        
        // Invalidate map size after showing
        setTimeout(() => {
            if (this.map) this.map.invalidateSize();
        }, 300);
        
        console.log('🗺️ Floating map shown');
    }
    
    hide() {
        if (!this.container) return;
        
        this.container.classList.remove('visible');
        this.isVisible = false;
        
        console.log('🗺️ Floating map hidden');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    toggleCollapse() {
        if (!this.container) return;
        this.container.classList.toggle('collapsed');
        this.isCollapsed = !this.isCollapsed;
        
        setTimeout(() => {
            if (this.map) this.map.invalidateSize();
        }, 300);
    }
    
    // ============================================
    // EVENTS
    // ============================================
    bindEvents() {
        // Orders modal open → hide floating map
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-nav="orders"]')) {
                setTimeout(() => this.hide(), 100);
            }
        });
        
        // Watch orders modal visibility
        const observer = new MutationObserver(() => {
            const ordersModal = document.getElementById('ordersModal');
            if (ordersModal && !ordersModal.classList.contains('hidden')) {
                this.hide();
            } else if (ordersModal && ordersModal.classList.contains('hidden')) {
                // Check if there's an active order
                setTimeout(() => this.checkActiveOrder(), 500);
            }
        });
        
        const ordersModal = document.getElementById('ordersModal');
        if (ordersModal) {
            observer.observe(ordersModal, { attributes: true, attributeFilter: ['class'] });
        }
        
        // Button events (delegated)
        document.addEventListener('click', (e) => {
            // Collapse button
            if (e.target.closest('#btnCollapseMap')) {
                this.toggleCollapse();
            }
            
            // Close button
            if (e.target.closest('#btnCloseMap')) {
                this.hide();
            }
            
            // Call shop
            if (e.target.closest('#btnCallShop')) {
                window.open('tel:919719312956', '_blank');
            }
            
            // View full map
            if (e.target.closest('#btnViewFullMap')) {
                this.openFullMap();
            }
        });
        
        // Language change
        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
            this.refreshLabels();
        });
    }
    
    openFullMap() {
        if (!this.activeOrder) return;
        
        const custLat = this.activeOrder.tracking?.customerLocation?.lat || this.shopLocation.lat + 0.01;
        const custLng = this.activeOrder.tracking?.customerLocation?.lng || this.shopLocation.lng + 0.01;
        
        // Open Google Maps with directions
        const url = `https://www.google.com/maps/dir/?api=1&origin=${this.shopLocation.lat},${this.shopLocation.lng}&destination=${custLat},${custLng}&travelmode=driving`;
        window.open(url, '_blank');
    }
    
    refreshLabels() {
        const isHindi = this.currentLang === 'hi';
        
        const headerSpan = document.querySelector('.floating-map-header-left span:last-child');
        if (headerSpan) {
            headerSpan.textContent = isHindi ? '🛵 लाइव ट्रैकिंग' : '🛵 Live Tracking';
        }
        
        const callBtn = document.getElementById('btnCallShop');
        if (callBtn) {
            callBtn.innerHTML = `📞 ${isHindi ? 'दुकान पर कॉल' : 'Call Shop'}`;
        }
        
        const viewBtn = document.getElementById('btnViewFullMap');
        if (viewBtn) {
            viewBtn.innerHTML = `🗺️ ${isHindi ? 'पूरा मैप देखें' : 'View Full Map'}`;
        }
    }
    
    // ============================================
    // INVALIDATE SIZE (After container resize)
    // ============================================
    invalidateSize() {
        if (this.map) {
            setTimeout(() => this.map.invalidateSize(), 200);
        }
    }
    
    // ============================================
    // DESTROY
    // ============================================
    destroy() {
        this.stopUpdates();
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.floatingMapManager = new FloatingMapManager();
    }, 1000);
});