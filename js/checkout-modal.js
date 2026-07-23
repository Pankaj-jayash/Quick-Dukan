const CheckoutModal = {
    currentProduct: null,
    currentCart: null,
    deliveryType: 'home',
    paymentMethod: 'cash',
    detectedLocation: null,

    open(productOrCart) {
        if (Array.isArray(productOrCart)) {
            this.currentCart = {
                items: productOrCart,
                totalItems: productOrCart.length,
                totalAmount: productOrCart.reduce((s, i) => s + i.price * i.quantity, 0)
            };
            this.currentProduct = null;
        } else if (productOrCart && productOrCart.id) {
            this.currentProduct = productOrCart;
            const qty = productOrCart.quantity || 1;
            this.currentCart = {
                items: [{ ...productOrCart, quantity: qty }],
                totalItems: qty,
                totalAmount: productOrCart.price * qty
            };
        } else {
            const cart = Cart.getCart();
            if (cart.totalItems === 0) { alert('Cart is empty!'); return; }
            this.currentCart = cart;
            this.currentProduct = null;
        }
        this.renderModal();
        document.getElementById('checkoutModal').classList.add('active');
        this.loadSavedDetails();
        this.autoDetectLocation();
    },

    close() {
        document.getElementById('checkoutModal').classList.remove('active');
    },

    renderModal() {
        const old = document.getElementById('checkoutModal');
        if (old) old.remove();
        const html = `
        <div class="modal-overlay" id="checkoutModal" onclick="if(event.target===this) CheckoutModal.close()">
            <div class="modal-container" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">📦 Quick Checkout</h2>
                    <button class="modal-close" onclick="CheckoutModal.close()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="delivery-options">
                        <div class="delivery-option-card selected" id="modalHome" onclick="CheckoutModal.selectDelivery('home')">
                            <span class="option-icon">🚚</span><span class="option-title">Home Delivery</span>
                        </div>
                        <div class="delivery-option-card" id="modalPickup" onclick="CheckoutModal.selectDelivery('pickup')">
                            <span class="option-icon">🏬</span><span class="option-title">Store Pickup</span>
                        </div>
                    </div>
                    <div id="modalPickupInfo" style="display:none;font-size:12px;color:#166534;background:#F0FDF4;padding:8px;border-radius:8px;margin-bottom:10px;">
                        📍 Pickup: Near Ram Mandir, Bhopal | ⏰ 8AM-9PM
                    </div>
                    <div class="location-status loading" id="modalLocationStatus">
                        <span class="location-dot searching" id="modalLocationDot"></span>
                        <span id="modalLocationText">Detecting your location...</span>
                    </div>
                    <div class="form-group"><input type="text" class="form-input" id="modalName" placeholder="Full Name *" required></div>
                    <div class="form-group"><input type="tel" class="form-input" id="modalPhone" placeholder="10-digit Phone *" maxlength="10"></div>
                    <div class="form-group" id="modalAddressGroup"><input type="text" class="form-input" id="modalAddress" placeholder="Delivery Address *"></div>
                    <div class="form-group"><textarea class="form-textarea" id="modalInstructions" placeholder="Instructions (optional)" rows="2"></textarea></div>
                    <div class="payment-options">
                        <div class="payment-option selected" id="modalPayCash" onclick="CheckoutModal.selectPayment('cash')"><span class="pay-icon">💵</span><span class="pay-title">Cash</span></div>
                        <div class="payment-option" id="modalPayQR" onclick="CheckoutModal.selectPayment('qr')"><span class="pay-icon">📱</span><span class="pay-title">QR/UPI</span></div>
                        <div class="payment-option" id="modalPayPhonePe" onclick="CheckoutModal.selectPayment('phonepe')"><span class="pay-icon">💸</span><span class="pay-title">PhonePe</span></div>
                    </div>
                    <div id="modalQR" style="display:none;text-align:center;margin:10px 0;">
                        <img src="${CONFIG.payments.qrCodeImage}" style="width:110px;height:110px;" onerror="this.style.display='none'">
                        <p style="font-size:11px;">Scan & Pay with any UPI app</p>
                    </div>
                    <button id="modalPhonePeBtn" style="display:none;width:100%;padding:10px;background:#5F259F;color:#FFF;border:none;border-radius:8px;font-weight:700;margin:8px 0;" onclick="CheckoutModal.openPhonePe()">💸 Pay via PhonePe</button>
                    <div class="order-summary" style="margin:10px 0;font-size:13px;" id="modalOrderSummary"></div>
                    <button class="whatsapp-order-btn" onclick="CheckoutModal.placeOrder()">💬 Order via WhatsApp</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        this.updateOrderSummary();
    },

    updateOrderSummary() {
        const c = this.currentCart;
        const el = document.getElementById('modalOrderSummary');
        if (!el) return;
        el.innerHTML = `<strong>📋 Order:</strong> ${c.items.map(i => i.name + ' x' + i.quantity).join(', ')}<br><strong>Total: ₹${c.totalAmount}</strong>`;
    },

    selectDelivery(type) {
        this.deliveryType = type;
        document.getElementById('modalHome').classList.toggle('selected', type==='home');
        document.getElementById('modalPickup').classList.toggle('selected', type==='pickup');
        document.getElementById('modalPickupInfo').style.display = type==='pickup' ? 'block' : 'none';
        document.getElementById('modalAddressGroup').style.display = type==='home' ? 'block' : 'none';
    },

    selectPayment(method) {
        this.paymentMethod = method;
        document.getElementById('modalPayCash').classList.toggle('selected', method==='cash');
        document.getElementById('modalPayQR').classList.toggle('selected', method==='qr');
        document.getElementById('modalPayPhonePe').classList.toggle('selected', method==='phonepe');
        document.getElementById('modalQR').style.display = (method==='qr' || method==='cash') ? 'block' : 'none';
        document.getElementById('modalPhonePeBtn').style.display = method==='phonepe' ? 'block' : 'none';
    },

    openPhonePe() {
        const amt = this.currentCart.totalAmount;
        const upi = CONFIG.payments.phonePeUPI;
        const name = CONFIG.store.name;
        window.location.href = `phonepe://pay?pa=${upi}&pn=${encodeURIComponent(name)}&am=${amt}&tn=Quick%20Dukan%20Order`;
        setTimeout(() => { window.location.href = `upi://pay?pa=${upi}&pn=${encodeURIComponent(name)}&am=${amt}&tn=Quick%20Dukan%20Order`; }, 2000);
    },

    loadSavedDetails() {
        const saved = JSON.parse(localStorage.getItem('quickdukan_customer') || '{}');
        if (saved.name) document.getElementById('modalName').value = saved.name;
        if (saved.phone) document.getElementById('modalPhone').value = saved.phone;
    },

    autoDetectLocation() {
        const status = document.getElementById('modalLocationStatus');
        const dot = document.getElementById('modalLocationDot');
        const text = document.getElementById('modalLocationText');
        const addr = document.getElementById('modalAddress');
        if (!navigator.geolocation) {
            status.className = 'location-status error';
            text.textContent = 'Location not supported. Enter manually.';
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            this.detectedLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                const data = await res.json();
                if (data && data.display_name) {
                    addr.value = data.display_name;
                    status.className = 'location-status found';
                    dot.className = 'location-dot found';
                    text.textContent = '📍 Location detected';
                }
            } catch (e) {
                addr.value = `Lat:${pos.coords.latitude.toFixed(4)}, Lng:${pos.coords.longitude.toFixed(4)}`;
                status.className = 'location-status found';
                text.textContent = '📍 Coordinates detected';
            }
        }, () => {
            status.className = 'location-status error';
            text.textContent = 'Could not detect. Enter manually.';
        }, { timeout: 8000 });
    },

    placeOrder() {
        const name = document.getElementById('modalName').value.trim();
        const phone = document.getElementById('modalPhone').value.trim();
        const address = this.deliveryType === 'home' ? document.getElementById('modalAddress').value.trim() : 'Store Pickup';
        const instructions = document.getElementById('modalInstructions').value.trim();
        if (!name || !phone || (this.deliveryType === 'home' && !address)) {
            alert('Please fill all required fields.'); return;
        }
        if (!/^\d{10}$/.test(phone)) { alert('Invalid phone number.'); return; }
        localStorage.setItem('quickdukan_customer', JSON.stringify({ name, phone, address }));
        const orderData = {
            items: this.currentCart.items,
            total: this.currentCart.totalAmount,
            totalItems: this.currentCart.totalItems,
            deliveryType: this.deliveryType,
            paymentMethod: this.paymentMethod,
            customer: { name, phone, address, instructions },
            location: this.detectedLocation,
            orderRef: 'QD' + Date.now(),
            dateTime: new Date().toLocaleString('en-IN')
        };
        WhatsApp.sendOrder(orderData);
        if (!this.currentProduct) Cart.clearCart();
        this.close();
        window.location.href = 'succes