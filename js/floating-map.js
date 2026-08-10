// ============================================
// FLOATING-MAP.JS - Live Tracking Map v4
// All Buttons | Bottom-Anchored | 3 Sizes
// ============================================

class FloatingMapManager {
    constructor() {
        this.container = null;
        this.mapElement = null;
        this.map = null;
        this.markers = {};
        this.routeLine = null;
        this.offlineBanner = null;
        
        this.shopLocation = {
            lat: 27.6667496,
            lng: 77.7124673,
            name: 'Quick Dukan'
        };
        
        this.isVisible = false;
        this.isCollapsed = false;
        this.currentLang = 'hi';
        this.activeOrder = null;
        
        // 3 Sizes — ALL bottom-anchored
        this.currentSize = 'normal';
        this.sizes = {
            compact: { w: 155, h: 135 },
            normal:  { w: 290, h: 210 },
            full:    { w: 360, h: 320 }
        };
        
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        this.initialSeconds = 0;
        this.startTimestamp = null;
        this.remainingSeconds = 0;
        this.totalSteps = 0;
        this.currentStep = 0;
        this.distance = 0;
        this.timerInterval = null;
        this.riderInterval = null;
        this.popupShown = false;
        
        this.MIN_TIMER_MINUTES = 10;
        this.MAX_TIMER_MINUTES = 45;
        this.SPEED_PER_KM = 5;
        this.RIDER_INTERVAL = 10000;
        this.TIMER_INTERVAL = 1000;
        this.MAX_ORDER_AGE = 60 * 60 * 1000;
        
        this.autoHideTimeout = null;
        this.init();
    }
    
    init() {
        this.detectLanguage();
        this.createContainer();
        this.createOfflineBanner();
        this.loadPosition();
        this.bindEvents();
        this.bindOnlineEvents();
        setInterval(() => this.checkActiveOrder(), 30000);
        console.log('🗺️ Map v4 Ready');
    }
    
    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }
    
    // ============================================
    // CREATE CONTAINER
    // ============================================
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'floating-map-container';
        this.container.id = 'floatingMapContainer';
        
        const hi = this.currentLang === 'hi';
        
        this.container.innerHTML = `
            <div class="floating-map-header" id="floatingMapHeader">
                <div class="floating-map-header-left">
                    <span class="pulse-dot"></span>
                    <span class="map-header-text">${hi ? '🛵 लाइव ट्रैकिंग' : '🛵 Live Tracking'}</span>
                </div>
                <div class="floating-map-actions">
                    <button class="floating-map-btn size-btn" data-size="compact" title="${hi ? 'छोटा' : 'Compact'}">S</button>
                    <button class="floating-map-btn size-btn active" data-size="normal" title="${hi ? 'मध्यम' : 'Normal'}">M</button>
                    <button class="floating-map-btn size-btn" data-size="full" title="${hi ? 'बड़ा' : 'Full'}">L</button>
                    <button class="floating-map-btn" id="btnCollapseMap" title="${hi ? 'छोटा करें' : 'Collapse'}">−</button>
                    <button class="floating-map-btn" id="btnCloseMap" title="${hi ? 'बंद करें' : 'Close'}">✕</button>
                </div>
            </div>
            <div class="floating-map-body" id="floatingMapBody"></div>
            <div class="floating-map-info">
                <div class="floating-map-info-row">
                    <span class="map-timer-wrap">⏱️ <span class="map-timer" id="mapTimer">--:--</span></span>
                    <span class="map-dist-wrap">📍 <span class="map-distance" id="mapDistance">-- km</span></span>
                </div>
                <div class="floating-map-actions-row">
                    <button class="floating-map-action-btn call-btn" id="btnCallShop">
                        📞 ${hi ? 'दुकान' : 'Call Shop'}
                    </button>
                    <button class="floating-map-action-btn view-btn" id="btnViewFullMap">
                        🗺️ ${hi ? 'पूरा मैप' : 'Full Map'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        this.mapElement = document.getElementById('floatingMapBody');
        this.applySize(this.currentSize);
        setTimeout(() => this.initMap(), 400);
    }
    
    createOfflineBanner() {
        this.offlineBanner = document.createElement('div');
        this.offlineBanner.className = 'map-offline-banner';
        this.offlineBanner.innerHTML = '⚠️ ऑफलाइन - टाइमर चल रहा है';
        this.offlineBanner.style.display = 'none';
        this.container.appendChild(this.offlineBanner);
    }
    
    bindOnlineEvents() {
        window.addEventListener('offline', () => {
            if (this.offlineBanner && this.isVisible) this.offlineBanner.style.display = 'flex';
        });
        window.addEventListener('online', () => {
            if (this.offlineBanner) this.offlineBanner.style.display = 'none';
            if (this.map && this.isVisible) setTimeout(() => this.map.invalidateSize(), 300);
        });
    }
    
    // ============================================
    // SIZE MANAGEMENT — ALL BOTTOM-RIGHT
    // ============================================
    applySize(size) {
        this.currentSize = size;
        
        // Remove old size classes
        this.container.classList.remove('size-compact', 'size-normal', 'size-full');
        // Add new
        this.container.classList.add('size-' + size);
        
        // Update active button
        this.container.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
        
        // Save preference
        try { localStorage.setItem('qd-map-size', size); } catch(e) {}
        
        // Refresh map
        setTimeout(() => {
            if (this.map) this.map.invalidateSize();
        }, 350);
    }
    
    // ============================================
    // INIT MAP
    // ============================================
    initMap() {
        if (!this.mapElement) return;
        if (typeof L === 'undefined') {
            if (!navigator.onLine) return;
            setTimeout(() => this.initMap(), 500);
            return;
        }
        
        if (this.map) { this.map.remove(); this.map = null; }
        
        this.map = L.map(this.mapElement, {
            center: [this.shopLocation.lat, this.shopLocation.lng],
            zoom: 14,
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            scrollWheelZoom: true
        });
        
        if (navigator.onLine) {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18
            }).addTo(this.map);
        }
        
        this.addShopMarker();
    }
    
    addShopMarker() {
        if (!this.map) return;
        const icon = L.divIcon({
            html: '<div style="font-size:26px;">🏪</div>',
            className: 'custom-marker',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });
        this.markers.shop = L.marker([this.shopLocation.lat, this.shopLocation.lng], { icon }).addTo(this.map);
    }
    
    addCustomerMarker(lat, lng) {
        if (!this.map) return;
        if (this.markers.customer) this.map.removeLayer(this.markers.customer);
        const icon = L.divIcon({
            html: '<div style="font-size:26px;">📍</div>',
            className: 'custom-marker',
            iconSize: [34, 34],
            iconAnchor: [17, 34]
        });
        this.markers.customer = L.marker([lat, lng], { icon }).addTo(this.map);
    }
    
    addRiderMarker(lat, lng) {
        if (!this.map) return;
        if (this.markers.rider) this.map.removeLayer(this.markers.rider);
        const icon = L.divIcon({
            html: '<div class="rider-marker">🛵</div>',
            className: 'custom-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        this.markers.rider = L.marker([lat, lng], { icon }).addTo(this.map);
    }
    
    addRouteLine() {
        if (!this.map || !this.activeOrder) return;
        if (this.routeLine) this.map.removeLayer(this.routeLine);
        const clat = this.activeOrder.tracking?.customerLocation?.lat || this.shopLocation.lat + 0.01;
        const clng = this.activeOrder.tracking?.customerLocation?.lng || this.shopLocation.lng + 0.01;
        this.routeLine = L.polyline(
            [[this.shopLocation.lat, this.shopLocation.lng], [clat, clng]],
            { color: '#2E7D32', weight: 3, opacity: 0.5, dashArray: '8, 8' }
        ).addTo(this.map);
        this.map.fitBounds(L.latLngBounds(
            [this.shopLocation.lat, this.shopLocation.lng], [clat, clng]
        ), { padding: [15, 15] });
    }
    
    calcDist(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2-lat1)*Math.PI/180;
        const dLng = (lng2-lng1)*Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
        return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    
    updateMapWithOrder(order) {
        this.activeOrder = order;
        if (!order.tracking?.customerLocation) return;
        const clat = order.tracking.customerLocation.lat;
        const clng = order.tracking.customerLocation.lng;
        this.addCustomerMarker(clat, clng);
        this.addRouteLine();
        this.distance = this.calcDist(this.shopLocation.lat, this.shopLocation.lng, clat, clng);
        let mins = Math.round(this.distance * this.SPEED_PER_KM);
        mins = Math.max(this.MIN_TIMER_MINUTES, Math.min(this.MAX_TIMER_MINUTES, mins));
        this.initialSeconds = mins * 60;
        this.remainingSeconds = this.initialSeconds;
        this.startTimestamp = Date.now();
        this.totalSteps = Math.ceil(this.remainingSeconds / (this.RIDER_INTERVAL/1000));
        this.currentStep = 0;
        this.popupShown = false;
        this.addRiderMarker(this.shopLocation.lat, this.shopLocation.lng);
        this.updateTimerDisplay();
        this.updateDistDisplay();
        this.startTimer();
        this.startRider();
    }
    
    startTimer() {
        this.stopTimer();
        this.startTimestamp = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTimestamp) / 1000);
            this.remainingSeconds = Math.max(0, this.initialSeconds - elapsed);
            this.updateTimerDisplay();
            if (this.remainingSeconds <= 0 && !this.popupShown) {
                this.popupShown = true;
                this.stopTimer();
                this.stopRider();
                this.showDeliveryPopup();
            }
        }, this.TIMER_INTERVAL);
    }
    
    stopTimer() { if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; } }
    
    updateTimerDisplay() {
        const el = document.getElementById('mapTimer');
        if (!el) return;
        if (this.remainingSeconds <= 0) { el.textContent = '00:00'; return; }
        const m = Math.floor(this.remainingSeconds / 60);
        const s = this.remainingSeconds % 60;
        el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    
    startRider() {
        this.stopRider();
        this.riderInterval = setInterval(() => {
            this.currentStep++;
            const p = Math.min(this.currentStep / this.totalSteps, 1);
            const clat = this.activeOrder?.tracking?.customerLocation?.lat || this.shopLocation.lat + 0.01;
            const clng = this.activeOrder?.tracking?.customerLocation?.lng || this.shopLocation.lng + 0.01;
            this.addRiderMarker(
                this.shopLocation.lat + (clat - this.shopLocation.lat) * p,
                this.shopLocation.lng + (clng - this.shopLocation.lng) * p
            );
            this.updateDistDisplay();
        }, this.RIDER_INTERVAL);
    }
    
    stopRider() { if (this.riderInterval) { clearInterval(this.riderInterval); this.riderInterval = null; } }
    
    updateDistDisplay() {
        const el = document.getElementById('mapDistance');
        if (!el) return;
        const p = this.totalSteps > 0 ? this.currentStep / this.totalSteps : 0;
        const rem = this.distance * (1 - p);
        el.textContent = rem < 0.05 ? 'पहुँच गया' : rem < 1 ? `${Math.round(rem*1000)} m` : `${rem.toFixed(1)} km`;
    }
    
    showDeliveryPopup() {
        if (window.orderPopupManager && this.activeOrder) {
            window.orderPopupManager.showDeliveryPopup(this.activeOrder);
        }
        this.autoHideTimeout = setTimeout(() => {
            this.hide();
            this.activeOrder = null;
        }, 3000);
    }
    
    checkActiveOrder() {
        if (!window.ordersManager) return;
        const orders = window.ordersManager.getOrders();
        const now = Date.now();
        const activeOrder = orders.find(o => {
            if (o.status !== 'confirmed' && o.status !== 'in_transit') return false;
            if (now - (o.timestamp || o.date || 0) > this.MAX_ORDER_AGE) {
                o.status = 'delivered';
                if (window.ordersManager.saveOrders) window.ordersManager.saveOrders();
                return false;
            }
            return true;
        });
        if (!activeOrder) {
            this.hide();
            this.stopTimer();
            this.stopRider();
            this.activeOrder = null;
            return;
        }
        if (this.timerInterval && this.activeOrder?.id === activeOrder.id) {
            if (!this.isVisible) this.show();
            return;
        }
        this.activeOrder = activeOrder;
        this.updateMapWithOrder(activeOrder);
        this.show();
    }
    
    show() {
        if (!this.container || this.isVisible) return;
        this.container.classList.add('visible');
        this.isVisible = true;
        setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 350);
    }
    
    hide() {
        if (!this.container) return;
        this.container.classList.remove('visible');
        this.isVisible = false;
    }
    
    // ============================================
    // EVENTS
    // ============================================
    bindEvents() {
        const header = document.getElementById('floatingMapHeader');
        if (!header) return;
        
        header.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.floating-map-btn')) return;
            this.isDragging = true;
            this.dragStartX = e.clientX - this.container.offsetLeft;
            this.dragStartY = e.clientY - this.container.offsetTop;
            this.container.style.transition = 'none';
        });
        
        document.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            this.container.style.left = (e.clientX - this.dragStartX) + 'px';
            this.container.style.top = (e.clientY - this.dragStartY) + 'px';
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
        });
        
        document.addEventListener('pointerup', () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.container.style.transition = '';
            this.savePosition();
            if (this.map) this.map.invalidateSize();
        });
        
        document.addEventListener('click', (e) => {
            const sizeBtn = e.target.closest('.size-btn');
            if (sizeBtn) {
                this.applySize(sizeBtn.dataset.size);
                return;
            }
            if (e.target.closest('#btnCollapseMap')) {
                this.container.classList.toggle('collapsed');
                this.isCollapsed = !this.isCollapsed;
                setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 350);
                return;
            }
            if (e.target.closest('#btnCloseMap')) {
                this.hide();
                return;
            }
            if (e.target.closest('#btnCallShop')) {
                window.open('tel:919719312956', '_blank');
                return;
            }
            if (e.target.closest('#btnViewFullMap')) {
                this.openFullMap();
                return;
            }
        });
        
        // Load saved size
        try {
            const saved = localStorage.getItem('qd-map-size');
            if (saved && this.sizes[saved]) {
                this.currentSize = saved;
                this.applySize(saved);
            }
        } catch(e) {}
    }
    
    savePosition() {
        try {
            localStorage.setItem('qd-map-pos', JSON.stringify({
                left: this.container.offsetLeft,
                top: this.container.offsetTop
            }));
        } catch(e) {}
    }
    
    loadPosition() {
        try {
            const saved = localStorage.getItem('qd-map-pos');
            if (saved) {
                const pos = JSON.parse(saved);
                this.container.style.left = pos.left + 'px';
                this.container.style.top = pos.top + 'px';
                this.container.style.right = 'auto';
                this.container.style.bottom = 'auto';
            }
        } catch(e) {}
    }
    
    openFullMap() {
        if (!this.activeOrder?.tracking?.customerLocation) return;
        const c = this.activeOrder.tracking.customerLocation;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${this.shopLocation.lat},${this.shopLocation.lng}&destination=${c.lat},${c.lng}&travelmode=driving`, '_blank');
    }
    
    destroy() {
        this.stopTimer();
        this.stopRider();
        if (this.autoHideTimeout) clearTimeout(this.autoHideTimeout);
        if (this.map) { this.map.remove(); this.map = null; }
        if (this.container) { this.container.remove(); this.container = null; }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { window.floatingMapManager = new FloatingMapManager(); }, 1000);
});