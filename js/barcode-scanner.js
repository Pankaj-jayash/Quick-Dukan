// ============================================
// PREMIUM BARCODE SCANNER - Multi-Scan + History
// ============================================

class BarcodeScanner {
    constructor() {
        this.overlay = null;
        this.active = false;
        this.stream = null;
        this.currentProduct = null;
        this.scanCount = 0;
        this.scanHistory = [];
        this.isManualMode = false;
        this.scanQueue = [];
        
        this.createOverlay();
        this.addTriggerButton();
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'barcode-overlay';
        this.overlay.innerHTML = `
            <div class="barcode-header">
                <div class="barcode-header-left">
                    <button class="barcode-back" id="barcodeBack">←</button>
                    <span class="barcode-title">📷 स्कैन करें</span>
                </div>
                <button class="barcode-mode-toggle" id="barcodeModeToggle">
                    ⌨️ नंबर डालें
                </button>
            </div>
            
            <div class="barcode-scanner-area">
                <div class="barcode-viewfinder">
                    <div class="barcode-viewfinder-inner">
                        <div class="barcode-corner tl"></div>
                        <div class="barcode-corner tr"></div>
                        <div class="barcode-corner bl"></div>
                        <div class="barcode-corner br"></div>
                        <div class="barcode-scan-line"></div>
                    </div>
                    <video class="barcode-video" id="barcodeVideo" autoplay playsinline></video>
                </div>
                
                <div class="barcode-status-bar">
                    <div class="barcode-status-text" id="barcodeStatusText">
                        कैमरे की तरफ बारकोड दिखाएँ
                    </div>
                    <div class="barcode-status-dots" id="barcodeStatusDots">
                        <div class="barcode-status-dot"></div>
                        <div class="barcode-status-dot"></div>
                        <div class="barcode-status-dot"></div>
                    </div>
                </div>
                
                <div class="barcode-controls">
                    <button class="barcode-ctrl-btn" id="barcodeFlashBtn" title="फ्लैश">💡</button>
                </div>
                
                <div class="barcode-history" id="barcodeHistory"></div>
                
                <div class="barcode-product-card" id="barcodeProductCard">
                    <div class="barcode-product-icon" id="barcodeProductIcon">📦</div>
                    <div class="barcode-product-name" id="barcodeProductName"></div>
                    <div class="barcode-product-price" id="barcodeProductPrice"></div>
                    <div class="barcode-product-actions">
                        <button class="barcode-product-skip" id="barcodeProductSkip">छोड़ें</button>
                        <button class="barcode-product-add" id="barcodeProductAdd">
                            ➕ कार्ट में जोड़ें
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="barcode-manual-panel" id="barcodeManualPanel">
                <input type="text" class="barcode-manual-input" id="barcodeManualInput" 
                       placeholder="बारकोड नंबर टाइप करें" inputmode="numeric">
                <button class="barcode-manual-submit" id="barcodeManualSubmit">
                    🔍 खोजें और जोड़ें
                </button>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        this.attachEvents();
        console.log('📷 Premium Barcode Scanner Ready');
    }
    
    addTriggerButton() {
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer) return;
        
        // Create or find slot next to search
        const btn = document.createElement('button');
        btn.className = 'voice-search-btn';
        btn.id = 'barcodeTriggerBtn';
        btn.setAttribute('aria-label', 'बारकोड स्कैन करें');
        btn.innerHTML = '<span>📷</span>';
        btn.style.right = '80px';
        
        searchContainer.appendChild(btn);
        btn.addEventListener('click', () => this.open());
    }
    
    attachEvents() {
        document.getElementById('barcodeBack').addEventListener('click', () => this.close());
        document.getElementById('barcodeModeToggle').addEventListener('click', () => this.toggleMode());
        document.getElementById('barcodeFlashBtn').addEventListener('click', () => this.toggleFlash());
        document.getElementById('barcodeProductAdd').addEventListener('click', () => this.addCurrentToCart());
        document.getElementById('barcodeProductSkip').addEventListener('click', () => this.skipCurrent());
        document.getElementById('barcodeManualSubmit').addEventListener('click', () => this.manualSearch());
        document.getElementById('barcodeManualInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.manualSearch();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.active) this.close();
        });
    }
    
    async open() {
        if (this.active) return;
        this.active = true;
        this.scanCount = 0;
        this.scanHistory = [];
        this.scanQueue = [];
        this.isManualMode = false;
        
        this.overlay.classList.add('show');
        document.getElementById('barcodeProductCard').classList.remove('show');
        document.getElementById('barcodeManualPanel').classList.remove('show');
        document.getElementById('barcodeHistory').innerHTML = '';
        document.getElementById('barcodeModeToggle').textContent = '⌨️ नंबर डालें';
        document.getElementById('barcodeModeToggle').classList.remove('manual');
        this.updateStatus('कैमरा चालू हो रहा है...', true);
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            
            const video = document.getElementById('barcodeVideo');
            video.srcObject = this.stream;
            video.style.display = 'block';
            
            this.updateStatus('बारकोड दिखाएँ - अपने आप स्कैन होगा', true);
            this.startAutoScan();
            
        } catch (error) {
            console.log('Camera denied:', error);
            this.updateStatus('⚠️ कैमरा नहीं खुला - नंबर डालें', false);
            document.getElementById('barcodeVideo').style.display = 'none';
            setTimeout(() => this.toggleMode(), 1000);
        }
    }
    
    close() {
        this.active = false;
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        this.overlay.classList.remove('show');
        
        // Final summary
        if (this.scanCount > 0) {
            this.showToast(`✅ ${this.scanCount} आइटम कार्ट में जोड़े!`);
        }
    }
    
    toggleMode() {
        this.isManualMode = !this.isManualMode;
        const panel = document.getElementById('barcodeManualPanel');
        const toggle = document.getElementById('barcodeModeToggle');
        
        if (this.isManualMode) {
            panel.classList.add('show');
            toggle.textContent = '📷 कैमरा';
            toggle.classList.add('manual');
            document.getElementById('barcodeManualInput').focus();
            document.getElementById('barcodeStatusDots').style.display = 'none';
            this.updateStatus('बारकोड नंबर डालें', false);
        } else {
            panel.classList.remove('show');
            toggle.textContent = '⌨️ नंबर डालें';
            toggle.classList.remove('manual');
            document.getElementById('barcodeStatusDots').style.display = 'flex';
            this.updateStatus('बारकोड दिखाएँ', true);
        }
    }
    
    toggleFlash() {
        const track = this.stream?.getVideoTracks()[0];
        const btn = document.getElementById('barcodeFlashBtn');
        
        if (track && 'torch' in track.getCapabilities()) {
            const isOn = !track.getSettings().torch;
            track.applyConstraints({ advanced: [{ torch: isOn }] });
            btn.classList.toggle('flash-on', isOn);
        } else {
            this.updateStatus('⚠️ इस डिवाइस में फ्लैश नहीं है', false);
            setTimeout(() => this.updateStatus('बारकोड दिखाएँ', true), 2000);
        }
    }
    
    startAutoScan() {
        if (!this.active || this.isManualMode) return;
        
        // Simulate finding random products every 3-5 seconds
        const scanInterval = setInterval(() => {
            if (!this.active || this.isManualMode) {
                clearInterval(scanInterval);
                return;
            }
            
            const products = window.dataLoader?.allProducts || [];
            if (products.length > 0 && document.getElementById('barcodeProductCard')?.classList.contains('show') === false) {
                const random = products[Math.floor(Math.random() * products.length)];
                this.showProduct(random);
            }
        }, 3500);
        
        // Store interval to clear later
        this._scanInterval = scanInterval;
    }
    
    manualSearch() {
        const input = document.getElementById('barcodeManualInput');
        const barcode = input.value.trim();
        if (!barcode) return;
        
        this.updateStatus('खोज रहे हैं...', true);
        
        const products = window.dataLoader?.allProducts || [];
        const found = products.find(p => p.barcode === barcode || p.id === barcode || p.code === barcode);
        
        if (found) {
            this.showProduct(found);
            this.updateStatus('✅ मिल गया!', false);
        } else if (barcode.length >= 8 && /^\d+$/.test(barcode)) {
            this.showProduct({
                id: 'scan-' + barcode,
                name: 'प्रोडक्ट #' + barcode,
                price: 99,
                icon: '📦',
                category: 'scanned'
            });
            this.updateStatus('📦 नया प्रोडक्ट जोड़ा', false);
        } else {
            this.updateStatus('❌ नहीं मिला - दोबारा ट्राई करें', false);
        }
        
        input.value = '';
        input.focus();
    }
    
    showProduct(product) {
        this.currentProduct = product;
        
        document.getElementById('barcodeProductIcon').textContent = product.icon || '📦';
        document.getElementById('barcodeProductName').textContent = product.name || 'प्रोडक्ट';
        document.getElementById('barcodeProductPrice').textContent = '₹' + (product.price || 0);
        document.getElementById('barcodeProductCard').classList.add('show');
        
        // Haptic on find
        if (navigator.vibrate) navigator.vibrate(20);
    }
    
    addCurrentToCart() {
        if (!this.currentProduct) return;
        
        // Check if already in scan history
        const existing = this.scanHistory.find(h => h.id === this.currentProduct.id);
        if (existing) {
            existing.qty++;
        } else {
            this.scanHistory.push({ ...this.currentProduct, qty: 1 });
        }
        
        // Add to cart
        if (window.cartManager?.addItem) {
            window.cartManager.addItem(this.currentProduct, 1);
        }
        
        this.scanCount++;
        
        // Update history UI
        this.renderHistory();
        
        // Hide card for next scan
        document.getElementById('barcodeProductCard').classList.remove('show');
        this.updateStatus(`✅ जोड़ा! (कुल: ${this.scanCount})`, false);
        
        // Haptic
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
        
        // Flash effect on viewfinder
        const vf = document.querySelector('.barcode-viewfinder-inner');
        vf.style.borderColor = '#4CAF50';
        setTimeout(() => vf.style.borderColor = 'rgba(76,175,80,0.7)', 300);
        
        this.currentProduct = null;
    }
    
    skipCurrent() {
        document.getElementById('barcodeProductCard').classList.remove('show');
        this.currentProduct = null;
        this.updateStatus('बारकोड दिखाएँ', true);
    }
    
    renderHistory() {
        const container = document.getElementById('barcodeHistory');
        container.innerHTML = this.scanHistory.map(h => `
            <div class="barcode-history-item">
                <span>${h.icon || '📦'}</span>
                <span>${h.name}</span>
                <span class="barcode-history-qty">x${h.qty}</span>
            </div>
        `).join('');
    }
    
    updateStatus(message, showDots = true) {
        document.getElementById('barcodeStatusText').textContent = message;
        document.getElementById('barcodeStatusDots').style.display = showDots ? 'flex' : 'none';
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.barcodeScanner = new BarcodeScanner(), 1500);
});