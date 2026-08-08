// ============================================
// FLOATING-MAP.JS - Live Tracking Floating Map
// Quick Dukan - Timer Continue | Draggable | Bike Animation
// ============================================

class FloatingMapManager {
    constructor() {
        // DOM
        this.container = null;
        this.mapElement = null;
        this.map = null;
        this.markers = {};
        this.routeLine = null;
        
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
        this.currentLang = 'hi';
        
        // Dragging
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartLeft = 0;
        this.dragStartTop = 0;
        
        // Resizing
        this.isResizing = false;
        this.resizeStartX = 0;
        this.resizeStartY = 0;
        this.resizeStartWidth = 0;
        this.resizeStartHeight = 0;
        
        // Timer
        this.remainingSeconds = 0;
        this.totalSteps = 0;
        this.currentStep = 0;
        this.distance = 0;
        this.timerInterval = null;
        this.riderInterval = null;
        this.popupShownForCurrentTimer = false;
        this.noCount = 0;
        
        // Timer Settings
        this.MIN_TIMER_MINUTES = 10;   // Minimum 10 minutes
        this.MAX_TIMER_MINUTES = 45;   // Maximum 45 minutes
        this.SPEED_PER_KM = 5;         // 5 minutes per km
        this.RIDER_UPDATE_INTERVAL = 10000; // 10 seconds
        this.TIMER_UPDATE_INTERVAL = 1000;  // 1 second
        
        this.init();
    }
    
    init() {
        this.detectLanguage();
        this.createContainer();
        this.loadPosition();
        this.bindEvents();
        
        // Check for active orders every 15 seconds
        setInterval(() => this.checkActiveOrder(), 15000);
        
        console.log('🗺️ Floating Map Manager Initialized');
        console.log('🏪 Shop:', this.shopLocation.name, `(${this.shopLocation.lat}, ${this.shopLocation.lng})`);
        console.log('⏱️ Timer: MIN=' + this.MIN_TIMER_MINUTES + 'min | MAX=' + this.MAX_TIMER_MINUTES + 'min | Speed=' + this.SPEED_PER_KM + 'min/km');
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
                    <span>⏱️ <span class="timer" id="mapTimer">--:--</span></span>
                    <span>📍 <span class="distance" id="mapDistance">-- km</span></span>
                </div>
                <div class="floating-map-actions-row">
                    <button class="floating-map-action-btn call-btn" id="btnCallShop">
                        📞 ${isHindi ? 'दुकान' : 'Call'}
                    </button>
                    <button class="floating-map-action-btn view-btn" id="btnViewFullMap">
                        🗺️ ${isHindi ? 'पूरा मैप' : 'Full Map'}
                    </button>
                </div>
            </div>
            <div class="floating-map-resize-handle" id="mapResizeHandle"></div>
        `;
        
        document.body.appendChild(this.container);
        this.mapElement = document.getElementById('floatingMapBody');
        
        setTimeout(() => this.initMap(), 300);
    }
    
    // ============================================
    // INIT MAP
    // ============================================
    initMap() {
        if (!this.mapElement) return;
        if (typeof L === 'undefined') {
            setTimeout(() => this.initMap(), 500);
            return;
        }
        
        this.map = L.map(this.mapElement, {
            center: [this.shopLocation.lat, this.shopLocation.lng],
            zoom: 14,
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            scrollWheelZoom: true,
            doubleClickZoom: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(this.map);
        
        this.addShopMarker();
        console.log('🗺️ Map initialized');
    }
    
    // ============================================
    // MARKERS
    // ============================================
    addShopMarker() {
        if (!this.map) return;
        
        const shopIcon = L.divIcon({
            html: '<div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏪</div>',
            className: 'custom-marker',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });
        
        this.markers.shop = L.marker(
            [this.shopLocation.lat, this.shopLocation.lng],
            { icon: shopIcon }
        ).addTo(this.map);
        
        this.markers.shop.bindPopup(`<b>${this.shopLocation.name}</b>`);
    }
    
    addCustomerMarker(lat, lng) {
        if (!this.map) return;
        if (this.markers.customer) this.map.removeLayer(this.markers.customer);
        
        const customerIcon = L.divIcon({
            html: '<div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(255,0,0,0.3));">📍</div>',
            className: 'custom-marker',
            iconSize: [34, 34],
            iconAnchor: [17, 34]
        });
        
        this.markers.customer = L.marker([lat, lng], { icon: customerIcon }).addTo(this.map);
        this.markers.customer.bindPopup('<b>Customer</b><br>Delivery Location');
    }
    
    addRiderMarker(lat, lng) {
        if (!this.map) return;
        if (this.markers.rider) this.map.removeLayer(this.markers.rider);
        
        const riderIcon = L.divIcon({
            html: '<div class="rider-marker">🛵</div>',
            className: 'custom-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        
        this.markers.rider = L.marker([lat, lng], { icon: riderIcon }).addTo(this.map);
    }
    
    addRouteLine() {
        if (!this.map || !this.activeOrder) return;
        if (this.routeLine) this.map.removeLayer(this.routeLine);
        
        const shopLat = this.shopLocation.lat;
        const shopLng = this.shopLocation.lng;
        const custLat = this.activeOrder.tracking?.customerLocation?.lat || shopLat + 0.01;
        const custLng = this.activeOrder.tracking?.customerLocation?.lng || shopLng + 0.01;
        
        this.routeLine = L.polyline(
            [[shopLat, shopLng], [custLat, custLng]],
            { color: '#2E7D32', weight: 3, opacity: 0.5, dashArray: '8, 8' }
        ).addTo(this.map);
        
        const bounds = L.latLngBounds([shopLat, shopLng], [custLat, custLng]);
        this.map.fitBounds(bounds, { padding: [25, 25] });
    }
    
    // ============================================
    // CALCULATIONS
    // ============================================
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    
    toRad(deg) { return deg * (Math.PI / 180); }
    
    // ============================================
    // 🔥 UPDATE MAP WITH ORDER — DISTANCE-BASED TIMER
    // ============================================
    updateMapWithOrder(order) {
        this.activeOrder = order;
        
        if (!order.tracking?.customerLocation) {
            console.warn('⚠️ No customer location for tracking');
            return;
        }
        
        const custLat = order.tracking.customerLocation.lat;
        const custLng = order.tracking.customerLocation.lng;
        
        this.addCustomerMarker(custLat, custLng);
        this.addRouteLine();
        
        // 🔥 Calculate distance (Shop → Customer)
        this.distance = this.calculateDistance(
            this.shopLocation.lat, this.shopLocation.lng,
            custLat, custLng
        );
        
        // 🔥 TIMER BASED ON DISTANCE
        let calculatedMinutes = Math.round(this.distance * this.SPEED_PER_KM);
        
        // 🔥 Apply MIN and MAX limits
        if (calculatedMinutes < this.MIN_TIMER_MINUTES) {
            calculatedMinutes = this.MIN_TIMER_MINUTES;
        } else if (calculatedMinutes > this.MAX_TIMER_MINUTES) {
            calculatedMinutes = this.MAX_TIMER_MINUTES;
        }
        
        this.remainingSeconds = calculatedMinutes * 60;
        this.totalSteps = Math.ceil(this.remainingSeconds / (this.RIDER_UPDATE_INTERVAL / 1000));
        this.currentStep = 0;
        this.popupShownForCurrentTimer = false;
        this.noCount = 0;
        
        // Add rider at start position (shop)
        this.addRiderMarker(this.shopLocation.lat, this.shopLocation.lng);
        
        // Update displays
        this.updateTimerDisplay();
        this.updateDistanceDisplay();
        
        // Start timer and rider animation
        this.startTimer();
        this.startRiderUpdates();
        
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        console.log(`⏱️ Distance: ${this.distance.toFixed(2)} km | Timer: ${mins}:${String(secs).padStart(2, '0')} | Steps: ${this.totalSteps}`);
    }
    
    // ============================================
    // TIMER
    // ============================================
    startTimer() {
        this.stopTimer();
        
        this.timerInterval = setInterval(() => {
            this.remainingSeconds--;
            this.updateTimerDisplay();
            
            // 🔥 Timer ends → Show delivery popup
            if (this.remainingSeconds <= 0 && !this.popupShownForCurrentTimer) {
                this.popupShownForCurrentTimer = true;
                this.stopTimer();
                this.stopRiderUpdates();
                this.showDeliveryPopup();
            }
        }, this.TIMER_UPDATE_INTERVAL);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimerDisplay() {
        const timerEl = document.getElementById('mapTimer');
        if (!timerEl) return;
        
        if (this.remainingSeconds <= 0) {
            timerEl.textContent = '00:00';
            timerEl.style.color = '#FF1744';
            timerEl.style.fontWeight = '900';
            return;
        }
        
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        // Red color when less than 1 minute remaining
        if (this.remainingSeconds <= 60) {
            timerEl.style.color = '#FF1744';
            timerEl.style.fontWeight = '900';
            timerEl.style.animation = 'none';
            timerEl.offsetHeight;
            timerEl.style.animation = 'dotPulse 0.5s infinite';
        } else {
            timerEl.style.color = '#FF6D00';
            timerEl.style.fontWeight = '800';
            timerEl.style.animation = 'none';
        }
    }
    
    // ============================================
    // RIDER ANIMATION
    // ============================================
    startRiderUpdates() {
        this.stopRiderUpdates();
        
        this.riderInterval = setInterval(() => {
            this.currentStep++;
            const progress = Math.min(this.currentStep / this.totalSteps, 1);
            
            const shopLat = this.shopLocation.lat;
            const shopLng = this.shopLocation.lng;
            const custLat = this.activeOrder?.tracking?.customerLocation?.lat || shopLat + 0.01;
            const custLng = this.activeOrder?.tracking?.customerLocation?.lng || shopLng + 0.01;
            
            const riderLat = shopLat + (custLat - shopLat) * progress;
            const riderLng = shopLng + (custLng - shopLng) * progress;
            
            this.addRiderMarker(riderLat, riderLng);
            this.updateDistanceDisplay();
            
        }, this.RIDER_UPDATE_INTERVAL);
    }
    
    stopRiderUpdates() {
        if (this.riderInterval) {
            clearInterval(this.riderInterval);
            this.riderInterval = null;
        }
    }
    
    updateDistanceDisplay() {
        const distanceEl = document.getElementById('mapDistance');
        if (!distanceEl) return;
        
        const progress = this.totalSteps > 0 ? this.currentStep / this.totalSteps : 0;
        const remainingDist = this.distance * (1 - progress);
        
        if (remainingDist < 0.05) {
            distanceEl.textContent = this.currentLang === 'hi' ? 'पहुँच गया' : 'Arrived';
            distanceEl.style.color = '#4CAF50';
            distanceEl.style.fontWeight = '700';
        } else if (remainingDist < 1) {
            distanceEl.textContent = `${Math.round(remainingDist * 1000)} m`;
            distanceEl.style.color = '#2E7D32';
            distanceEl.style.fontWeight = '700';
        } else {
            distanceEl.textContent = `${remainingDist.toFixed(1)} km`;
            distanceEl.style.color = '#2E7D32';
            distanceEl.style.fontWeight = '700';
        }
    }
    
    // ============================================
    // DELIVERY POPUP
    // ============================================
    showDeliveryPopup() {
        if (window.orderPopupManager && this.activeOrder) {
            console.log('🚚 Timer ended — showing delivery popup');
            window.orderPopupManager.showDeliveryPopup(this.activeOrder);
        }
    }
    
    // ============================================
    // 🔥 ADD EXTRA TIME — TIMER CONTINUE (NOT RESTART)
    // ============================================
    addExtraTime() {
        this.noCount++;
        
        // 🔥 Add time to REMAINING timer (continue from where it stopped)
        let addSeconds;
        if (this.noCount === 1) {
            addSeconds = 120; // +2:00 min
        } else if (this.noCount === 2) {
            addSeconds = 180; // +3:00 min
        } else {
            addSeconds = 300; // +5:00 min
        }
        
        // 🔥 Add to remaining time (timer was at 00:00, now goes to +addSeconds)
        this.remainingSeconds += addSeconds;
        
        // 🔥 Recalculate total steps based on new remaining time
        // Current step stays, total steps increase
        const totalDuration = this.remainingSeconds + (this.currentStep * (this.RIDER_UPDATE_INTERVAL / 1000));
        this.totalSteps = Math.ceil(totalDuration / (this.RIDER_UPDATE_INTERVAL / 1000));
        
        this.popupShownForCurrentTimer = false;
        
        this.updateTimerDisplay();
        this.updateDistanceDisplay();
        
        // 🔥 Restart timer from current remaining time
        this.startTimer();
        this.startRiderUpdates();
        
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        console.log(`⏱️ Timer +${addSeconds}s (No#${this.noCount}) | Now: ${mins}:${String(secs).padStart(2, '0')} | Steps: ${this.totalSteps}`);
    }
    
    // ============================================
    // CHECK ACTIVE ORDER — NO TIMER RESET
    // ============================================
    checkActiveOrder() {
        if (!window.ordersManager) return;
        
        const orders = window.ordersManager.getOrders();
        const activeOrder = orders.find(o => o.status === 'confirmed' || o.status === 'in_transit');
        
        if (activeOrder) {
            this.activeOrder = activeOrder;
            const ordersModal = document.getElementById('ordersModal');
            
            if (ordersModal?.classList.contains('hidden')) {
                if (this.timerInterval || this.riderInterval) {
                    // Timer already running — just show
                    this.show();
                } else if (!this.isVisible) {
                    // Map hidden, no timer — fresh start
                    this.show();
                    this.updateMapWithOrder(activeOrder);
                } else {
                    // Map visible, timer stopped — restart
                    this.show();
                    this.updateMapWithOrder(activeOrder);
                }
            }
        } else {
            this.hide();
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
        
        setTimeout(() => {
            if (this.map) this.map.invalidateSize();
        }, 300);
    }
    
    hide() {
        if (!this.container) return;
        this.container.classList.remove('visible');
        this.isVisible = false;
    }
    
    // ============================================
    // DRAG
    // ============================================
    bindDragEvents() {
        const header = document.getElementById('floatingMapHeader');
        if (!header) return;
        
        header.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.floating-map-btn')) return;
            
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            
            const rect = this.container.getBoundingClientRect();
            this.dragStartLeft = rect.left;
            this.dragStartTop = rect.top;
            
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
            this.container.style.left = this.dragStartLeft + 'px';
            this.container.style.top = this.dragStartTop + 'px';
            
            e.preventDefault();
        });
        
        document.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;
            
            this.container.style.left = (this.dragStartLeft + dx) + 'px';
            this.container.style.top = (this.dragStartTop + dy) + 'px';
        });
        
        document.addEventListener('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.savePosition();
            }
        });
    }
    
    // ============================================
    // RESIZE
    // ============================================
    bindResizeEvents() {
        const handle = document.getElementById('mapResizeHandle');
        if (!handle) return;
        
        handle.addEventListener('pointerdown', (e) => {
            this.isResizing = true;
            this.resizeStartX = e.clientX;
            this.resizeStartY = e.clientY;
            this.resizeStartWidth = this.container.offsetWidth;
            this.resizeStartHeight = this.container.offsetHeight;
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('pointermove', (e) => {
            if (!this.isResizing) return;
            
            const dx = e.clientX - this.resizeStartX;
            const dy = e.clientY - this.resizeStartY;
            
            const newWidth = Math.max(240, Math.min(500, this.resizeStartWidth + dx));
            const newHeight = Math.max(200, Math.min(500, this.resizeStartHeight + dy));
            
            this.container.style.width = newWidth + 'px';
            
            if (this.mapElement) {
                this.mapElement.style.height = (newHeight - 80) + 'px';
            }
            
            if (this.map) this.map.invalidateSize();
        });
        
        document.addEventListener('pointerup', () => {
            if (this.isResizing) {
                this.isResizing = false;
                this.saveSize();
            }
        });
    }
    
    // ============================================
    // POSITION MEMORY
    // ============================================
    savePosition() {
        const rect = this.container.getBoundingClientRect();
        try {
            localStorage.setItem('qd-map-position', JSON.stringify({
                left: rect.left,
                top: rect.top
            }));
        } catch (e) {}
    }
    
    loadPosition() {
        try {
            const saved = localStorage.getItem('qd-map-position');
            if (saved) {
                const pos = JSON.parse(saved);
                this.container.style.right = 'auto';
                this.container.style.bottom = 'auto';
                this.container.style.left = pos.left + 'px';
                this.container.style.top = pos.top + 'px';
            }
        } catch (e) {}
    }
    
    saveSize() {
        try {
            localStorage.setItem('qd-map-size', JSON.stringify({
                width: this.container.offsetWidth,
                height: this.mapElement?.offsetHeight || 160
            }));
        } catch (e) {}
    }
    
    // ============================================
    // EVENTS
    // ============================================
    bindEvents() {
        setTimeout(() => this.bindDragEvents(), 500);
        setTimeout(() => this.bindResizeEvents(), 500);
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnCollapseMap')) {
                this.container.classList.toggle('collapsed');
                this.isCollapsed = !this.isCollapsed;
                setTimeout(() => this.map?.invalidateSize(), 300);
            }
            
            if (e.target.closest('#btnCloseMap')) {
                this.hide();
            }
            
            if (e.target.closest('#btnCallShop')) {
                window.open('tel:919719312956', '_blank');
            }
            
            if (e.target.closest('#btnViewFullMap')) {
                this.openFullMap();
            }
        });
        
        // Orders modal observer
        const observer = new MutationObserver(() => {
            const modal = document.getElementById('ordersModal');
            if (modal && !modal.classList.contains('hidden')) {
                this.hide();
            }
        });
        
        const modal = document.getElementById('ordersModal');
        if (modal) {
            observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
        }
        
        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
        });
        
        window.addEventListener('pageshow', () => {
            setTimeout(() => this.checkActiveOrder(), 500);
        });
    }
    
    openFullMap() {
        if (!this.activeOrder?.tracking?.customerLocation) return;
        
        const custLat = this.activeOrder.tracking.customerLocation.lat;
        const custLng = this.activeOrder.tracking.customerLocation.lng;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${this.shopLocation.lat},${this.shopLocation.lng}&destination=${custLat},${custLng}&travelmode=driving`;
        window.open(url, '_blank');
    }
    
    invalidateSize() {
        if (this.map) {
            setTimeout(() => this.map.invalidateSize(), 200);
        }
    }
    
    destroy() {
        this.stopTimer();
        this.stopRiderUpdates();
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