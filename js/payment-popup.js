// ============================================
// PAYMENT-POPUP.JS (FIXED v3) — Working
// ============================================

class PaymentPopupManager {
    constructor() {
        this.currentLang = 'hi';
        this.upiId = '98979027@ybl';
        this.payeeName = 'Quick Dukan';
        this.merchantCode = 'QUICKG';
        this.init();
    }

    init() {
        this.detectLanguage();
        document.addEventListener('languageChanged', () => this.detectLanguage());
        console.log('💳 Payment Popup Ready | UPI: ' + this.upiId);
    }

    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }

    show(orderData) {
        const existing = document.querySelector('.payment-popup-container');
        if (existing) existing.remove();

        const total = orderData.total || orderData.totals?.total || 0;
        const itemCount = orderData.itemCount || orderData.totals?.itemCount || 0;
        const hi = this.currentLang === 'hi';

        this.currentOrder = orderData;
        this.currentAmount = total;
        const upiUrl = this.buildUPIUrl(total);

        const container = document.createElement('div');
        container.className = 'payment-popup-container';
        container.innerHTML = `
            <div class="payment-overlay"></div>
            <div class="payment-card">
                <div class="payment-header">
                    <div class="payment-header-left">
                        <span class="payment-icon">💳</span>
                        <div>
                            <h3>${hi ? 'भुगतान करें' : 'Make Payment'}</h3>
                            <p class="payment-amount">💰 ₹${total} (${itemCount} ${hi ? 'आइटम' : 'items'})</p>
                        </div>
                    </div>
                </div>
                
                <div class="payment-qr-section" id="qrSection">
                    <p class="qr-main-hint">${hi ? '👇 QR स्कैन करें या टैप करें' : '👇 Scan QR or Tap'}</p>
                    <div class="qr-container" id="qrContainer">
                        <img id="qrImage" 
                             src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}&bgcolor=ffffff&color=000000" 
                             alt="Scan to Pay ₹${total}"
                             style="width:180px;height:180px;cursor:pointer;border-radius:12px;"
                             title="${hi ? 'टैप करें - UPI ऐप खोलें' : 'Tap to open UPI app'}">
                    </div>
                    <p class="qr-amount-badge">₹${total}</p>
                    <p class="qr-upi-id">UPI: ${this.upiId}</p>
                    <button class="copy-upi-btn" id="btnCopyUPI">
                        📋 ${hi ? 'UPI ID कॉपी करें' : 'Copy UPI ID'}
                    </button>
                </div>
                
                <div class="payment-divider">
                    <span>${hi ? 'या सीधे ऐप से' : 'OR Direct App'}</span>
                </div>
                
                <div class="payment-apps-section">
                    <p class="apps-title">${hi ? '📱 UPI ऐप चुनें' : '📱 Choose UPI App'}</p>
                    <div class="upi-apps-grid">
                        <button class="upi-app-btn" data-app="gpay">
                            <span class="app-icon-g">G</span>
                            <span>GPay</span>
                        </button>
                        <button class="upi-app-btn" data-app="phonepe">
                            <span class="app-icon-p">P</span>
                            <span>PhonePe</span>
                        </button>
                        <button class="upi-app-btn" data-app="paytm">
                            <span class="app-icon-pt">₹</span>
                            <span>Paytm</span>
                        </button>
                        <button class="upi-app-btn" data-app="bhim">
                            <span class="app-icon-b">B</span>
                            <span>BHIM</span>
                        </button>
                    </div>
                    <button class="upi-any-app-btn" id="btnAnyUPI">
                        📱 ${hi ? 'कोई भी UPI ऐप खोलें' : 'Open Any UPI App'}
                    </button>
                </div>
                
                <div class="payment-divider">
                    <span>${hi ? 'या' : 'OR'}</span>
                </div>
                
                <div class="payment-cod-section">
                    <button class="cod-btn" id="btnCOD">
                        <span class="cod-icon">🏍️</span>
                        <div class="cod-text">
                            <strong>${hi ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'}</strong>
                            <small>${hi ? 'सामान आने पर ₹' + total + ' दें' : 'Pay ₹' + total + ' on delivery'}</small>
                        </div>
                    </button>
                </div>
                
                <div class="payment-auto-forward">
                    <label class="auto-forward-label">
                        <input type="checkbox" id="chkAutoForward" checked>
                        <span>${hi ? '✅ पेमेंट के बाद WhatsApp पर भेजें' : '✅ Auto-send to WhatsApp'}</span>
                    </label>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        requestAnimationFrame(() => container.classList.add('show'));
        this.bindEvents(container);
    }

    buildUPIUrl(amount) {
        const params = new URLSearchParams({
            pa: this.upiId,
            pn: this.payeeName,
            am: amount.toString(),
            cu: 'INR',
            mode: '02',
            purpose: '00',
            mc: this.merchantCode,
            tn: 'Quick Dukan Order',
            orgid: '000000'
        });
        return 'upi://pay?' + params.toString();
    }

    bindEvents(container) {
        const hi = this.currentLang === 'hi';
        const amount = this.currentAmount;
        const upiUrl = this.buildUPIUrl(amount);

        // QR IMAGE CLICK
        const qrImage = container.querySelector('#qrImage');
        if (qrImage) {
            qrImage.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🖱️ QR Clicked');
                this.openUPIUrl(upiUrl, amount);
            });
        }

        // QR SECTION CLICK
        const qrSection = container.querySelector('#qrSection');
        if (qrSection) {
            qrSection.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                console.log('🖱️ QR Section Clicked');
                this.openUPIUrl(upiUrl, amount);
            });
        }

        // COPY UPI
        const btnCopy = container.querySelector('#btnCopyUPI');
        if (btnCopy) {
            btnCopy.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(this.upiId).then(() => {
                    this.showToast(hi ? '✅ UPI ID कॉपी!' : '✅ UPI ID Copied!');
                });
            });
        }

        // UPI APP BUTTONS
        container.querySelectorAll('.upi-app-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSpecificUPIApp(btn.dataset.app, amount);
            });
        });

        // ANY UPI
        const btnAny = container.querySelector('#btnAnyUPI');
        if (btnAny) {
            btnAny.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openUPIUrl(upiUrl, amount);
            });
        }

        // COD
        const btnCOD = container.querySelector('#btnCOD');
        if (btnCOD) {
            btnCOD.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCOD(container);
            });
        }
    }

    openUPIUrl(upiUrl, amount) {
        console.log('💳 Opening UPI:', upiUrl);
        window.location.href = upiUrl;
        this.waitForReturn();
    }

    openSpecificUPIApp(app, amount) {
        const upiUrl = this.buildUPIUrl(amount);
        const config = {
            gpay: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount}&cu=INR&mode=02#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
            phonepe: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount}&cu=INR&mode=02#Intent;scheme=upi;package=com.phonepe.app;end`,
            paytm: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount}&cu=INR&mode=02#Intent;scheme=upi;package=net.one97.paytm;end`,
            bhim: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount}&cu=INR&mode=02#Intent;scheme=upi;package=in.org.npci.upiapp;end`
        };
        const intent = config[app];
        if (intent) {
            console.log('💳 Opening app:', app);
            window.location.href = intent;
        } else {
            this.openUPIUrl(upiUrl, amount);
        }
        this.waitForReturn();
    }

    waitForReturn() {
        let handled = false;
        const handler = () => {
            if (document.visibilityState === 'visible' && !handled) {
                handled = true;
                document.removeEventListener('visibilitychange', handler);
                setTimeout(() => {
                    const chk = document.getElementById('chkAutoForward');
                    if (chk?.checked) this.autoForwardToWhatsApp();
                }, 2000);
            }
        };
        document.addEventListener('visibilitychange', handler);
        setTimeout(() => {
            if (!handled) { handled = true; document.removeEventListener('visibilitychange', handler); }
        }, 60000);
    }

    handleCOD(container) {
        const hi = this.currentLang === 'hi';
        this.showToast(hi ? '✅ कैश ऑन डिलीवरी! ₹' + this.currentAmount + ' सामान आने पर दें।' : '✅ COD! Pay ₹' + this.currentAmount + ' on delivery.');
        const chk = container.querySelector('#chkAutoForward');
        if (chk?.checked) setTimeout(() => this.autoForwardToWhatsApp('COD'), 2000);
        this.hide(container);
    }

    autoForwardToWhatsApp(mode = 'UPI') {
        const hi = this.currentLang === 'hi';
        const phone = window.CONFIG?.whatsappNumber || '919719312956';
        let msg = hi ? '💳 *पेमेंट जानकारी*\n\n' : '💳 *Payment Info*\n\n';
        msg += hi ? `💰 राशि: ₹${this.currentAmount}\n` : `💰 Amount: ₹${this.currentAmount}\n`;
        msg += hi ? `💳 मोड: ${mode}\n` : `💳 Mode: ${mode}\n`;
        msg += hi ? `🆔 UPI: ${this.upiId}\n\n` : `🆔 UPI: ${this.upiId}\n\n`;
        msg += hi ? '✅ भुगतान हो गया। कृपया कन्फर्म करें।' : '✅ Payment done. Please confirm.';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    hide(container) {
        container.classList.remove('show');
        setTimeout(() => { if (container.parentNode) container.remove(); }, 300);
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { window.paymentPopupManager = new PaymentPopupManager(); }, 1200);
});