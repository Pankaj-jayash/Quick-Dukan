var CheckoutModal = {
    currentProduct: null,
    currentCart: null,
    deliveryType: 'home',
    paymentMethod: 'cash',
    detectedLocation: null,
    locationAddress: '',

    open: function(productOrCart) {
        if (productOrCart && productOrCart.id) {
            this.currentProduct = productOrCart;
            var qty = productOrCart.quantity || 1;
            this.currentCart = {
                items: [{ id: productOrCart.id, name: productOrCart.name, price: productOrCart.price, weight: productOrCart.weight, quantity: qty, icon: productOrCart.icon }],
                totalItems: qty,
                totalAmount: productOrCart.price * qty
            };
        } else {
            var cart = Cart.getCart();
            if (cart.totalItems === 0) { alert('Your cart is empty! 🛒'); return; }
            this.currentCart = cart;
            this.currentProduct = null;
        }
        this.renderModal();
        document.getElementById('checkoutModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.loadSavedDetails();
        this.autoDetectLocation();
    },

    close: function() {
        var modal = document.getElementById('checkoutModal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    renderModal: function() {
        var old = document.getElementById('checkoutModal');
        if (old) old.remove();

        var itemsHTML = this.currentCart.items.map(function(item) {
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.04);"><span style="display:flex;align-items:center;gap:8px;"><span style="font-size:20px;">' + (item.icon || '📦') + '</span><span style="font-size:13px;font-weight:500;">' + item.name + ' <span style="color:#999;">x' + item.quantity + '</span></span></span><span style="font-weight:700;color:#1A3A5C;">₹' + (item.price * item.quantity) + '</span></div>';
        }).join('');

        var html = '<div class="modal-overlay" id="checkoutModal" onclick="if(event.target===this)CheckoutModal.close()">';
        html += '<div class="modal-container" onclick="event.stopPropagation()">';
        
        // Header
        html += '<div class="modal-header">';
        html += '<h2 class="modal-title">📦 Quick Checkout</h2>';
        html += '<button class="modal-close" onclick="CheckoutModal.close()">✕</button>';
        html += '</div>';
        
        // Body
        html += '<div class="modal-body">';
        
        // Order Summary
        html += '<div style="background:#F8FAFB;border-radius:12px;padding:12px;margin-bottom:14px;">';
        html += '<div style="font-weight:700;font-size:13px;margin-bottom:8px;color:#555;">📋 Order Summary</div>';
        html += itemsHTML;
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;margin-top:6px;border-top:2px solid #E0E0E0;font-weight:700;font-size:16px;">';
        html += '<span>Total</span><span style="color:#1A3A5C;">₹' + this.currentCart.totalAmount + '</span>';
        html += '</div></div>';

        // Delivery Option
        html += '<div style="font-weight:700;font-size:13px;margin-bottom:8px;color:#555;">🚚 Delivery Option</div>';
        html += '<div class="delivery-options" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">';
        html += '<div class="delivery-option-card selected" id="modalHome" onclick="CheckoutModal.selectDelivery(\'home\')" style="background:#fff;border:2px solid #4A6FA5;border-radius:12px;padding:14px;cursor:pointer;text-align:center;transition:all 0.3s;">';
        html += '<div style="font-size:28px;">🚚</div><div style="font-weight:700;font-size:13px;margin-top:4px;">Home Delivery</div><div style="font-size:10px;color:#999;">45-60 mins</div></div>';
        html += '<div class="delivery-option-card" id="modalPickup" onclick="CheckoutModal.selectDelivery(\'pickup\')" style="background:#fff;border:2px solid #E0E0E0;border-radius:12px;padding:14px;cursor:pointer;text-align:center;transition:all 0.3s;">';
        html += '<div style="font-size:28px;">🏬</div><div style="font-weight:700;font-size:13px;margin-top:4px;">Store Pickup</div><div style="font-size:10px;color:#999;">Ready in 15 mins</div></div></div>';

        // Pickup Info
        html += '<div id="modalPickupInfo" style="display:none;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:10px;margin-bottom:14px;font-size:12px;color:#166534;">📍 <strong>Pickup:</strong> Near Ram Mandir, Bhopal | ⏰ 8AM-9PM</div>';

        // Location Section
        html += '<div style="background:#F0F7FF;border:1px solid #BFDBFE;border-radius:12px;padding:12px;margin-bottom:14px;" id="locationSection">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
        html += '<span style="font-size:18px;">📍</span>';
        html += '<span style="font-weight:700;font-size:13px;color:#1E40AF;">Live Location</span>';
        html += '<span id="locationStatusBadge" style="margin-left:auto;font-size:10px;padding:3px 8px;border-radius:20px;background:#FEF3C7;color:#92400E;">Detecting...</span>';
        html += '</div>';
        html += '<div id="locationMap" style="width:100%;height:120px;background:#E5E7EB;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:40px;margin-bottom:8px;overflow:hidden;position:relative;">';
        html += '<span id="locationMapEmoji">📍</span>';
        html += '<div id="locationMapImg" style="display:none;width:100%;height:100%;"></div>';
        html += '</div>';
        html += '<div style="font-size:11px;color:#6B7280;" id="locationAddressText">Detecting your location...</div>';
        html += '</div>';

        // Contact Form
        html += '<div style="font-weight:700;font-size:13px;margin-bottom:8px;color:#555;">👤 Your Details</div>';
        html += '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">';
        html += '<input type="text" id="modalName" placeholder="Full Name *" style="padding:10px 14px;border:2px solid #E5E7EB;border-radius:10px;font-size:13px;width:100%;" required>';
        html += '<input type="tel" id="modalPhone" placeholder="10-digit Phone *" maxlength="10" style="padding:10px 14px;border:2px solid #E5E7EB;border-radius:10px;font-size:13px;width:100%;" required>';
        html += '<div id="modalAddressGroup">';
        html += '<input type="text" id="modalAddress" placeholder="Delivery Address *" style="padding:10px 14px;border:2px solid #E5E7EB;border-radius:10px;font-size:13px;width:100%;" required>';
        html += '</div>';
        html += '<textarea id="modalInstructions" placeholder="Instructions (optional) e.g., Gate no. 3, Ring bell..." rows="2" style="padding:10px 14px;border:2px solid #E5E7EB;border-radius:10px;font-size:13px;width:100%;resize:vertical;"></textarea>';
        html += '</div>';

        // Payment
        html += '<div style="font-weight:700;font-size:13px;margin-bottom:8px;color:#555;">💳 Payment Method</div>';
        html += '<div class="payment-options" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;">';
        html += '<div class="payment-option selected" id="modalPayCash" onclick="CheckoutModal.selectPayment(\'cash\')" style="background:#fff;border:2px solid #4A6FA5;border-radius:10px;padding:10px;cursor:pointer;text-align:center;transition:all 0.3s;"><div style="font-size:24px;">💵</div><div style="font-size:11px;font-weight:700;margin-top:2px;">Cash</div></div>';
        html += '<div class="payment-option" id="modalPayQR" onclick="CheckoutModal.selectPayment(\'qr\')" style="background:#fff;border:2px solid #E0E0E0;border-radius:10px;padding:10px;cursor:pointer;text-align:center;transition:all 0.3s;"><div style="font-size:24px;">📱</div><div style="font-size:11px;font-weight:700;margin-top:2px;">QR/UPI</div></div>';
        html += '<div class="payment-option" id="modalPayPhonePe" onclick="CheckoutModal.selectPayment(\'phonepe\')" style="background:#fff;border:2px solid #E0E0E0;border-radius:10px;padding:10px;cursor:pointer;text-align:center;transition:all 0.3s;"><div style="font-size:24px;">💸</div><div style="font-size:11px;font-weight:700;margin-top:2px;">PhonePe</div></div></div>';

        // QR Display
        html += '<div id="modalQR" style="display:none;text-align:center;background:#F8FAFB;border-radius:10px;padding:12px;margin-bottom:14px;">';
        html += '<img src="' + CONFIG.payments.qrCodeImage + '" style="width:100px;height:100px;margin:0 auto;" onerror="this.style.display=\'none\'">';
        html += '<p style="font-size:11px;color:#666;margin-top:6px;">Scan with any UPI app</p></div>';

        // PhonePe Button
        html += '<button id="modalPhonePeBtn" onclick="CheckoutModal.openPhonePe()" style="display:none;width:100%;padding:12px;background:#5F259F;color:#FFF;border:none;border-radius:10px;font-weight:700;font-size:14px;margin-bottom:10px;">💸 Open PhonePe — ₹' + this.currentCart.totalAmount + '</button>';

        // WhatsApp Order Button
        html += '<button class="whatsapp-order-btn" onclick="CheckoutModal.placeOrder()" style="width:100%;padding:16px;background:#25D366;color:#FFF;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 16px rgba(37,211,102,0.25);">';
        html += '💬 Place Order via WhatsApp</button>';
        html += '<p style="text-align:center;font-size:10px;color:#999;margin-top:8px;">Opens WhatsApp with full order details</p>';

        html += '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    selectDelivery: function(type) {
        this.deliveryType = type;
        document.getElementById('modalHome').style.borderColor = type === 'home' ? '#4A6FA5' : '#E0E0E0';
        document.getElementById('modalHome').style.background = type === 'home' ? '#F0F4FA' : '#FFF';
        document.getElementById('modalPickup').style.borderColor = type === 'pickup' ? '#4A6FA5' : '#E0E0E0';
        document.getElementById('modalPickup').style.background = type === 'pickup' ? '#F0F4FA' : '#FFF';
        document.getElementById('modalPickupInfo').style.display = type === 'pickup' ? 'block' : 'none';
        document.getElementById('modalAddressGroup').style.display = type === 'home' ? 'block' : 'none';
    },

    selectPayment: function(method) {
        this.paymentMethod = method;
        document.getElementById('modalPayCash').style.borderColor = method === 'cash' ? '#4A6FA5' : '#E0E0E0';
        document.getElementById('modalPayCash').style.background = method === 'cash' ? '#F0F4FA' : '#FFF';
        document.getElementById('modalPayQR').style.borderColor = method === 'qr' ? '#4A6FA5' : '#E0E0E0';
        document.getElementById('modalPayQR').style.background = method === 'qr' ? '#F0F4FA' : '#FFF';
        document.getElementById('modalPayPhonePe').style.borderColor = method === 'phonepe' ? '#4A6FA5' : '#E0E0E0';
        document.getElementById('modalPayPhonePe').style.background = method === 'phonepe' ? '#F0F4FA' : '#FFF';
        document.getElementById('modalQR').style.display = (method === 'qr' || method === 'cash') ? 'block' : 'none';
        document.getElementById('modalPhonePeBtn').style.display = method === 'phonepe' ? 'block' : 'none';
    },

    openPhonePe: function() {
        var amount = this.currentCart.totalAmount;
        var upi = CONFIG.payments.phonePeUPI;
        var name = CONFIG.store.name;
        window.location.href = 'phonepe://pay?pa=' + upi + '&pn=' + encodeURIComponent(name) + '&am=' + amount + '&tn=Quick%20Dukan%20Order';
        setTimeout(function() {
            window.location.href = 'upi://pay?pa=' + upi + '&pn=' + encodeURIComponent(name) + '&am=' + amount + '&tn=Quick%20Dukan%20Order';
        }, 2000);
    },

    loadSavedDetails: function() {
        var saved = JSON.parse(localStorage.getItem('quickdukan_customer') || '{}');
        if (saved.name) document.getElementById('modalName').value = saved.name;
        if (saved.phone) document.getElementById('modalPhone').value = saved.phone;
        if (saved.address && this.deliveryType === 'home') document.getElementById('modalAddress').value = saved.address;
    },

    autoDetectLocation: function() {
        var self = this;
        var statusBadge = document.getElementById('locationStatusBadge');
        var mapEmoji = document.getElementById('locationMapEmoji');
        var addressText = document.getElementById('locationAddressText');
        var addressInput = document.getElementById('modalAddress');

        if (!navigator.geolocation) {
            statusBadge.textContent = 'Not Supported';
            statusBadge.style.background = '#FEE2E2';
            statusBadge.style.color = '#991B1B';
            addressText.textContent = 'Please enter address manually';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function(pos) {
                self.detectedLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                
                // Show static map
                var mapImg = document.getElementById('locationMapImg');
                var mapContainer = document.getElementById('locationMap');
                if (mapImg && mapContainer) {
                    var mapURL = 'https://maps.googleapis.com/maps/api/staticmap?center=' + pos.coords.latitude + ',' + pos.coords.longitude + '&zoom=16&size=600x200&markers=color:red%7C' + pos.coords.latitude + ',' + pos.coords.longitude + '&key=YOUR_API_KEY';
                    // Fallback: OpenStreetMap static
                    var osmURL = 'https://staticmap.openstreetmap.de/staticmap.php?center=' + pos.coords.latitude + ',' + pos.coords.longitude + '&zoom=16&size=600x200&markers=' + pos.coords.latitude + ',' + pos.coords.longitude + ',red-pushpin';
                    mapImg.innerHTML = '<img src="' + osmURL + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.display=\'none\';document.getElementById(\'locationMapEmoji\').style.display=\'block\';">';
                    mapImg.style.display = 'block';
                    mapEmoji.style.display = 'none';
                }

                // Reverse geocode
                fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude)
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        if (data && data.display_name) {
                            self.locationAddress = data.display_name;
                            addressText.textContent = '📍 ' + data.display_name;
                            if (addressInput && self.deliveryType === 'home') {
                                addressInput.value = data.display_name;
                                addressInput.style.background = '#F0FDF4';
                                addressInput.style.borderColor = '#BBF7D0';
                            }
                            statusBadge.textContent = '✅ Detected';
                            statusBadge.style.background = '#D1FAE5';
                            statusBadge.style.color = '#065F46';
                        }
                    })
                    .catch(function() {
                        addressText.textContent = '📍 Lat: ' + pos.coords.latitude.toFixed(4) + ', Lng: ' + pos.coords.longitude.toFixed(4);
                        statusBadge.textContent = '✅ GPS Only';
                        statusBadge.style.background = '#FEF3C7';
                        statusBadge.style.color = '#92400E';
                    });
            },
            function(err) {
                statusBadge.textContent = '⚠️ Manual';
                statusBadge.style.background = '#FEE2E2';
                statusBadge.style.color = '#991B1B';
                addressText.textContent = 'Could not detect. Please enter address manually.';
                if (addressInput) {
                    addressInput.placeholder = 'Enter your full delivery address';
                    addressInput.style.background = '#FFF';
                    addressInput.style.borderColor = '#E5E7EB';
                }
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    },

    placeOrder: function() {
        var name = document.getElementById('modalName').value.trim();
        var phone = document.getElementById('modalPhone').value.trim();
        var address = this.deliveryType === 'home' ? document.getElementById('modalAddress').value.trim() : 'Store Pickup';
        var instructions = document.getElementById('modalInstructions').value.trim();

        if (!name) { alert('Please enter your name'); return; }
        if (!phone || phone.length !== 10) { alert('Please enter a valid 10-digit phone number'); return; }
        if (this.deliveryType === 'home' && !address) { alert('Please enter delivery address'); return; }

        localStorage.setItem('quickdukan_customer', JSON.stringify({ name: name, phone: phone, address: address }));

        var orderData = {
            items: this.currentCart.items,
            total: this.currentCart.totalAmount,
            totalItems: this.currentCart.totalItems,
            deliveryType: this.deliveryType,
            paymentMethod: this.paymentMethod,
            customer: { name: name, phone: phone, address: address, instructions: instructions },
            location: this.detectedLocation,
            locationAddress: this.locationAddress,
            orderRef: 'QD' + Date.now(),
            dateTime: new Date().toLocaleString('en-IN')
        };

        WhatsApp.sendOrder(orderData);
        if (!this.currentProduct) Cart.clearCart();
        this.close();
        window.location.href = 'success.html';
    }
};