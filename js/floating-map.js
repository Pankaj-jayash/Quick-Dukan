// ============================================
// FLOATING-MAP.JS - Live Tracking Floating Map v3
// 3 Sizes + All Buttons | Preview Fix | 1hr Expiry
// ============================================

class FloatingMapManager {
    constructor() {
        // DOM
        this.container = null;
        this.mapElement = null;
        this.map = null;
        this.markers = {};
        this.routeLine = null;
        this.offlineBanner = null;
        
        // Shop Location
        this.shopLocation = {
            lat: 27.6667496,
            lng: 77.7124673,
            name: 'Quick Dukan',
            icon: '🏪'
        };
        
        // State
        this.isVisible = false;
        this.isCollapsed = false;
        this.currentLang = 'hi';
        this.activeOrder = null;
        
        // Size: 'compact' | 'normal' | 'full'
        this.currentSize = 'normal';
        this.sizes = {
            compact: { w: 160, h: 130 },
            normal:  { w: 280, h: 200 },
            full:    { w: 360, h: 300 }
        };
        
        // Dragging
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Timer
        this.initialSeconds = 0;
        this.startTimestamp = null;
        this.remainingSeconds = 0;
        this.totalSteps = 0;
        this.currentStep = 0;
        this.distance = 0;
        this.timerInterval = null;
        this.riderInterval = null;
        this.popupShownForCurrentTimer = false;
        
        this.MIN_TIMER_MINUTES = 10;
        this.MAX_TIMER_MINUTES = 45;
        this.SPEED_PER_KM = 5;
        this.RIDER_UPDATE_INTERVAL = 10000;
        this.TIMER_UPDATE_INTERVAL = 1000;
        this.MAX_ORDER_AGE = 60 * 60 * 1000; // 1 ghanta
        
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
        
        console.log('🗺️ Floating Map v3 Ready (All Buttons)');
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
                    <span class="map-header-text">${isHindi ? '🛵 लाइव ट्रैकिंग' : '🛵 Live Tracking'}</span>
                </div>
                <div class="floating-map-actions">
                    <!-- 3 SIZE BUTTONS -->
                    <button class="floating-map-btn size-btn" data-size="compact" title="${isHindi ? 'बहुत छोटा' : 'Compact'}">◉</button>
                    <button class="floating-map-btn size-btn active" data-size="normal" title="${isHindi ? 'मध्यम' : 'Normal'}">◉</button>
                    <button class="floating-map-btn size-btn" data-size="full" title="${isHindi ? 'बड़ा' : 'Full'}">◉</button>
                    <!-- COLLAPSE BUTTON -->
                    <button class="floating-map-btn" id="btnCollapseMap" title="${isHindi ? 'छोटा करें' : 'Collapse'}">−</button>
                    <!-- CLOSE BUTTON -->
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
        
        this.applySize(this.currentSize);
        setTimeout(() => this.initMap(), 300);
    }
    
    // ============================================
    // OFFLINE BANNER
    // ============================================
    createOfflineBanner() {
        this.offlineBanner = document.createElement('div');
        this.offlineBanner.className = 'map-offline-banner';
        this.offlineBanner.innerHTML = '⚠️ आप ऑफलाइन हैं! टाइमर चल रहा है';
        this.offlineBanner.style.display = 'none';
        this.container.appendChild(this.offlineBanner);
    }
    
    bindOnlineEvents() {
        window.addEventListener('offline', () => {
            if (this.offlineBanner && this.isVisible) {
                this.offlineBanner.style.display = 'flex';
            }
        });
        
        window.addEventListener('online', () => {
            if (this.offlineBanner) this.offlineBanner.style.display = 'none';
            if (this.map && this.isVisible) {
                setTimeout(() => this.map.invalidateSize(), 300);
            }
        });
    }
    
    // ============================================
    // SIZE MANAGEMENT
    // ============================================
    applySize(size) {
        this.currentSize = size;
        const s = this.sizes[size];
        
        this.container.style.width = s.w + 'px';
        if (this.mapElement) {
            this.mapElement.style.height = (s.h - 55) + 'px';
        }
        this.container.style.height = s.h + 'px';
        
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
        
        try { localStorage.setItem('qd-map-size-pref', size); } catch(e) {}
        
        setTimeout(() => {
            if (this.map) this.map.invalidateSize();
        }, 200);
    }
    
    // ============================================
    // INIT MAP
    // ============================================
    initMap() {
        if (!this.mapElement) return;
        if (typeof L === 'undefined') {
            if (!navigator.onLine) {
                console.log('⚠️ Offline - Map unavailable, timer active');
                return;
            }
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
        const custLat = this.activeOrder.tracking?.customerLocation?.lat || this.shopLocation.lat + 0.01;
        const custLng = this.activeOrder.tracking?.customerLocation?.lng || this.shopLocation.lng + 0.01;
        this.routeLine = L.polyline(
            [[this.shopLocation.lat, this.shopLocation.lng], [custLat, custLng]],
            { color: '#2E7D32', weight: 3, opacity: 0.5, dashArray: '8, 8' }
        ).addTo(this.map);
        this.map.fitBounds(L.latLngBounds(
            [this.shopLocation.lat, this.shopLocation.lng], [custLat, custLng]
        ), { padding: [15, 15] });
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2-lat1)*Math.PI/180;
        const dLng = (lng2-lng1)*Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
        return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    
    updateMapWithOrder(order) {
        this.activeOrder = order;
        if (!order.tracking?.customerLocation) return;
        const custLat = order.tracking.customerLocation.lat;
        const custLng = order.tracking.customerLocation.lng;
        this.addCustomerMarker(custLat, custLng);
        this.addRouteLine();
        this.distance = this.calculateDistance(this.shopLocation.lat, this.shopLocation.lng, custLat, custLng);
        let mins = Math.round(this.distance * this.SPEED_PER_KM);
        mins = Math.max(this.MIN_TIMER_MINUTES, Math.min(this.MAX_TIMER_MINUTES, mins));
        this.initialSeconds = mins*60;
        this.remainingSeconds = this.initialSeconds;
        this.startTimestamp = Date.now();
        this.totalSteps = Math.ceil(this.remainingSeconds/(this.RIDER_UPDATE_INTERVAL/1000));
        this.currentStep = 0;
        this.popupShownForCurrentTimer = false;
        this.addRiderMarker(this.shopLocation.lat, this.shopLocation.lng);
        this.updateTimerDisplay();
        this.updateDistanceDisplay();
        this.startTimer();
        this.startRiderUpdates();
    }
    
    startTimer() {
        this.stopTimer();
        this.startTimestamp = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now()-this.startTimestamp)/1000);
            this.remainingSeconds = Math.max(0, this.initialSeconds-elapsed);
            this.updateTimerDisplay();
            if (this.remainingSeconds<=0 && !this.popupShownForCurrentTimer) {
                this.popupShownForCurrentTimer=true;
                this.stopTimer();
                this.stopRiderUpdates();
                this.showDeliveryPopup();
            }
        }, this.TIMER_UPDATE_INTERVAL);
    }
    
    stopTimer() { if(this.timerInterval){clearInterval(this.timerInterval);this.timerInterval=null;} }
    
    updateTimerDisplay() {
        const el=document.getElementById('mapTimer');
        if(!el)return;
        if(this.remainingSeconds<=0){el.textContent='00:00';return;}
        el.textContent=`${String(Math.floor(this.remainingSeconds/60)).padStart(2,'0')}:${String(this.remainingSeconds%60).padStart(2,'0')}`;
    }
    
    startRiderUpdates() {
        this.stopRiderUpdates();
        this.riderInterval=setInterval(()=>{
            this.currentStep++;
            const p=Math.min(this.currentStep/this.totalSteps,1);
            const custLat=this.activeOrder?.tracking?.customerLocation?.lat||this.shopLocation.lat+0.01;
            const custLng=this.activeOrder?.tracking?.customerLocation?.lng||this.shopLocation.lng+0.01;
            this.addRiderMarker(
                this.shopLocation.lat+(custLat-this.shopLocation.lat)*p,
                this.shopLocation.lng+(custLng-this.shopLocation.lng)*p
            );
            this.updateDistanceDisplay();
        },this.RIDER_UPDATE_INTERVAL);
    }
    
    stopRiderUpdates() { if(this.riderInterval){clearInterval(this.riderInterval);this.riderInterval=null;} }
    
    updateDistanceDisplay() {
        const el=document.getElementById('mapDistance');
        if(!el)return;
        const p=this.totalSteps>0?this.currentStep/this.totalSteps:0;
        const rem=this.distance*(1-p);
        el.textContent=rem<0.05?'पहुँच गया':rem<1?`${Math.round(rem*1000)} m`:`${rem.toFixed(1)} km`;
    }
    
    showDeliveryPopup() {
        if(window.orderPopupManager&&this.activeOrder) window.orderPopupManager.showDeliveryPopup(this.activeOrder);
        this.autoHideTimeout=setTimeout(()=>{this.hide();this.activeOrder=null;},3000);
    }
    
    checkActiveOrder() {
        if(!window.ordersManager)return;
        const orders=window.ordersManager.getOrders();
        const now=Date.now();
        const activeOrder=orders.find(o=>{
            if(o.status!=='confirmed'&&o.status!=='in_transit')return false;
            if(now-(o.timestamp||o.date||0)>this.MAX_ORDER_AGE){o.status='delivered';if(window.ordersManager.saveOrders)window.ordersManager.saveOrders();return false;}
            return true;
        });
        if(!activeOrder){this.hide();this.stopTimer();this.stopRiderUpdates();this.activeOrder=null;return;}
        if(this.timerInterval&&this.activeOrder?.id===activeOrder.id){if(!this.isVisible)this.show();return;}
        this.activeOrder=activeOrder;
        this.updateMapWithOrder(activeOrder);
        this.show();
    }
    
    show() { if(!this.container||this.isVisible)return; this.container.classList.add('visible'); this.isVisible=true; setTimeout(()=>{if(this.map)this.map.invalidateSize();},300); }
    hide() { if(!this.container)return; this.container.classList.remove('visible'); this.isVisible=false; }
    
    bindEvents() {
        const header=document.getElementById('floatingMapHeader');
        if(!header)return;
        
        header.addEventListener('pointerdown',(e)=>{
            if(e.target.closest('.floating-map-btn'))return;
            this.isDragging=true;
            this.dragStartX=e.clientX-this.container.offsetLeft;
            this.dragStartY=e.clientY-this.container.offsetTop;
            this.container.style.transition='none';
        });
        
        document.addEventListener('pointermove',(e)=>{
            if(!this.isDragging)return;
            this.container.style.left=(e.clientX-this.dragStartX)+'px';
            this.container.style.top=(e.clientY-this.dragStartY)+'px';
            this.container.style.right='auto';
            this.container.style.bottom='auto';
        });
        
        document.addEventListener('pointerup',()=>{
            if(this.isDragging){this.isDragging=false;this.container.style.transition='';this.savePosition();}
        });
        
        document.addEventListener('click',(e)=>{
            const sizeBtn=e.target.closest('.size-btn');
            if(sizeBtn){this.applySize(sizeBtn.dataset.size);return;}
            if(e.target.closest('#btnCollapseMap')){this.container.classList.toggle('collapsed');this.isCollapsed=!this.isCollapsed;setTimeout(()=>this.map?.invalidateSize(),300);return;}
            if(e.target.closest('#btnCloseMap')){this.hide();return;}
            if(e.target.closest('#btnCallShop')){window.open('tel:919719312956','_blank');return;}
            if(e.target.closest('#btnViewFullMap')){this.openFullMap();return;}
        });
        
        try{
            const saved=localStorage.getItem('qd-map-size-pref');
            if(saved&&this.sizes[saved]){this.currentSize=saved;this.applySize(saved);}
        }catch(e){}
    }
    
    savePosition() { try{localStorage.setItem('qd-map-position',JSON.stringify({left:this.container.offsetLeft,top:this.container.offsetTop}));}catch(e){} }
    loadPosition() { try{const s=localStorage.getItem('qd-map-position');if(s){const p=JSON.parse(s);this.container.style.left=p.left+'px';this.container.style.top=p.top+'px';this.container.style.right='auto';this.container.style.bottom='auto';}}catch(e){} }
    
    openFullMap() {
        if(!this.activeOrder?.tracking?.customerLocation)return;
        const c=this.activeOrder.tracking.customerLocation;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${this.shopLocation.lat},${this.shopLocation.lng}&destination=${c.lat},${c.lng}&travelmode=driving`,'_blank');
    }
    
    destroy() {
        this.stopTimer();
        this.stopRiderUpdates();
        if(this.autoHideTimeout)clearTimeout(this.autoHideTimeout);
        if(this.map){this.map.remove();this.map=null;}
        if(this.container){this.container.remove();this.container=null;}
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{window.floatingMapManager=new FloatingMapManager();},1000);
});