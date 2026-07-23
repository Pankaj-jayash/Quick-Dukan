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

        var itemsSummary = this.currentCart.items.map(function(item) {
            return '<span style="white-space:nowrap;">' + (item.icon || '📦') + ' ' + item.name + ' x' + item.quantity + '</span>';
        }).join(', ');

        var html = '';
        html += '<div class="modal-overlay" id="checkoutModal" onclick="if(event.target===this)CheckoutModal.close()">';
        html += '<div class="modal-container" onclick="event.stopPropagation()" style="max-height:95vh;">';
        
        // Compact Header
        html += '<div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;">';
        html += '<span style="font-size:18px;font-weight:700;">📦 Checkout</span>';
        html += '<button onclick="CheckoutModal.close()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#999;padding:4px 8px;">✕</button>';
        html += '</div>';
        
        html += '<div style="padding:12px 16px;">';
        
        // Order Summary — 1 line
        html += '<div style="background:#F8FAFB;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:12px;">';
        html += '<strong>📋 Order:</strong> ' + itemsSummary + ' <strong style="color:#1A3A5C;">₹' + this.currentCart.totalAmount + '</strong>';
        html += '</div>';

        // Row 1: Delivery + Payment side by side
        html += '<div style="display:flex;gap:10px;margin-bottom:10px;">';
        
        // Delivery
        html += '<div style="flex:1;">';
        html += '<div style="font-size:12px;font-weight:700;margin-bottom:4px;">🚚 Delivery</div>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<div id="modalHome" onclick="CheckoutModal.selectDelivery(\'home\')" style="flex:1;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:11px;font-weight:600;background:#F0F4FA;border:2px solid #4A6FA5;">🚚 Home</div>';
        html += '<div id="modalPickup" onclick="CheckoutModal.selectDelivery(\'pickup\')" style="flex:1;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:11px;font-weight:600;background:#FFF;border:2px solid #E5E7EB;">🏬 Pickup</div>';
        html += '</div></div>';
        
        // Payment
        html += '<div style="flex:1;">';
        html += '<div style="font-size:12px;font-weight:700;margin-bottom:4px;">💳 Payment</div>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<div id="modalPayCash" onclick="CheckoutModal.selectPayment(\'cash\')" style="flex:1;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:11px;font-weight:600;background:#F0F4FA;border:2px solid #4A6FA5;">💵 Cash</div>';
        html += '<div id="modalPayQR" onclick="CheckoutModal.selectPayment(\'qr\')" style="flex:1;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:11px;font-weight:600;background:#FFF;border:2px solid #E5E7EB;">📱 QR</div>';
        html += '<div id="modalPayPhonePe" onclick="CheckoutModal.selectPayment(\'phonepe\')" style="flex:1;padding:8px;border-radius:8px;text-align:center;cursor:pointer;font-size:11px;font-weight:600;background:#FFF;border:2px solid #E5E7EB;">💸 PP</div>';
        html += '</div></div>';
        html += '</div>';

        // Pickup Info
        html += '<div id="modalPickupInfo" style="display:none;background:#F0FDF4;border-radius:8px;padding:8px;margin-bottom:8px;font-size:11px;color:#166534;">📍 Pickup: Near Ram Mandir, Bhopal | ⏰ 8AM-9PM</div>';

        // Location Section — Compact
        html += '<div style="background:#F0F7FF;border:1px solid #BFDBFE;border-radius:10px;padding:10px;margin-bottom:10px;">';
        html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">';
        html += '<span style="font-size:16px;">📍</span>';
        html += '<span style="font-size:13px;font-weight:700;color:#1E40AF;">Your Location</span>';
        html += '<span id="locationStatusBadge" style="margin-left:auto;font-size:10px;padding:2px 8px;border-radius:20px;background:#FEF3C7;color:#92400E;">Detecting...</span>';
        html += '</div>';
        html += '<div id="locationAddressText" style="font-size:13px;font-weight:500;color:#1A3A5C;line-height:1.3;margin-bottom:4px;">📍 Detecting your exact location...</div>';
        html += '<div style="display:flex;gap:8px;align-items:center;">';
        html += '<div id="locationMap" style="width:60px;height:60px;background:#E5E7EB;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;overflow:hidden;">📍</div>';
        html += '<div style="flex:1;font-size:10px;color:#6B7280;">';
        html += '<div>✅ GPS + IP precise location</div>';
        html += '<div>🗺️ Google Maps link shared</div>';
        html += '<div>📌 Address auto-filled below</div>';
        html += '</div></div></div>';

        // Form — 4 fields compact
        html += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">';
        html += '<input type="text" id="modalName" placeholder="Full Name *" style="padding:10px 12px;border:2px solid #E5E7EB;border-radius:8px;font-size:14px;font-weight:500;" required>';
        html += '<input type="tel" id="modalPhone" placeholder="10-digit Phone *" maxlength="10" style="padding:10px 12px;border:2px solid #E5E7EB;border-radius:8px;font-size:14px;font-weight:500;" required>';
        html += '<div id="modalAddressGroup"><input type="text" id="modalAddress" placeholder="Delivery Address *" style="padding:10px 12px;border:2px solid #E5E7EB;border-radius:8px;font-size:14px;font-weight:500;width:100%;" required></div>';
        html += '<input type="text" id="modalInstructions" placeholder="Instructions (optional): Gate no., Floor..." style="padding:10px 12px;border:2px solid #E5E7EB;border-radius:8px;font-size:14px;font-weight:500;">';
        html += '</div>';

        // QR display — compact
        html += '<div id="modalQR" style="display:none;text-align:center;margin-bottom:8px;">';
        html += '<img src="' + CONFIG.payments.qrCodeImage + '" style="width:80px;height:80px;border-radius:8px;" onerror="this.style.display=\'none\'">';
        html += '<p style="font-size:10px;color:#666;margin-top:2px;">Scan with any UPI app</p></div>';

        // PhonePe button
        html += '<button id="modalPhonePeBtn" onclick="CheckoutModal.openPhonePe()" style="display:none;width:100%;padding:10px;background:#5F259F;color:#FFF;border:none;border-radius:8px;font-weight:700;font-size:13px;margin-bottom:8px;">💸 Pay via PhonePe — ₹' + this.currentCart.totalAmount + '</button>';

        // WhatsApp Button
        html += '<button onclick="CheckoutModal.placeOrder()" style="width:100%;padding:14px;background:#25D366;color:#FFF;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(37,211,102,0.25);">💬 Order via WhatsApp</button>';
        html += '<p style="text-align:center;font-size:10px;color:#999;margin-top:6px;">Opens WhatsApp with full details + live location</p>';

        html += '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    selectDelivery: function(type) {
        this.deliveryType = type;
        document.getElementById('modalHome').style.background = type === 'home' ? '#F0F4FA' : '#FFF';
        document.getElementById('modalHome').style.borderColor = type === 'home' ? '#4A6FA5' : '#E5E7EB';
        document.getElementById('modalPickup').style.background = type === 'pickup' ? '#F0F4FA' : '#FFF';
        document.getElementById('modalPickup').style.borderColor = type === 'pickup' ? '#4A6FA5' : '#E5E7EB';
        document.getElementById('modalPickupInfo').style.display = type === 'pickup' ? 'block' : 'none';
        document.getElementById('modalAddressGroup').style.display = type === 'home' ? 'block' : 'none';
    },

    selectPayment: function(method) {
        this.paymentMethod = method;
        ['cash','qr','phonepe'].forEach(function(m) {
            var el = document.getElementById('modalPay' + m.charAt(0).toUpperCase() + m.slice(1));
            if (el) {
                el.style.background = method === m ? '#F0F4FA' : '#FFF';
                el.style.borderColor = method === m ? '#4A6FA5' : '#E5E7EB';
            }
        });
        document.getElementById('modalQR').style.display = (method === 'qr' || method === 'cash') ? 'block' : 'none';
        document.getElementById('modalPhonePeBtn').style.display = method === 'phonepe' ? 'block' : 'none';
    },

    openPhonePe: function() {
        var amount = this.currentCart.totalAmount;
        var upi = CONFIG.payments.phonePeUPI;
        var name = CONFIG.store.name;
        window.location.href = 'phonepe://pay?pa=' + upi + '&pn=' + encodeURIComponent(name) + '&am=' + amount + '&tn=Quick%20Dukan%20Order';
        setTimeout(function() { window.location.href = 'upi://pay?pa=' + upi + '&pn=' + encodeURIComponent(name) + '&am=' + amount + '&tn=Quick%20Dukan%20Order'; }, 2000);
    },

    loadSavedDetails: function() {
        var saved = JSON.parse(localStorage.getItem('quickdukan_customer') || '{}');
        if (saved.name) document.getElementById('modalName').value = saved.name;
        if (saved.phone) document.getElementById('modalPhone').value = saved.phone;
    },

    autoDetectLocation: function() {
        var self = this;
        var statusBadge = document.getElementById('locationStatusBadge');
        var addressText = document.getElementById('locationAddressText');
        var addressInput = document.getElementById('modalAddress');
        var mapContainer = document.getElementById('locationMap');

        var setManualMode = function() {
            statusBadge.textContent = '⚠️ Enter Manually';
            statusBadge.style.background = '#FEE2E2';
            statusBadge.style.color = '#991B1B';
            addressText.textContent = 'Please enter your delivery address';
            if (addressInput) {
                addressInput.style.background = '#FFF';
                addressInput.style.borderColor = '#E5E7EB';
            }
        };

        // Try GPS first
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(pos) {
                    self.detectedLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    self.reverseGeocode(pos.coords.latitude, pos.coords.longitude, statusBadge, addressText, addressInput, mapContainer);
                },
                function() {
                    // GPS failed, try IP geolocation
                    self.getIPLocation(statusBadge, addressText, addressInput, mapContainer);
                },
                { timeout: 8000, enableHighAccuracy: true }
            );
        } else {
            self.getIPLocation(statusBadge, addressText, addressInput, mapContainer);
        }
    },

    reverseGeocode: function(lat, lng, statusBadge, addressText, addressInput, mapContainer) {
        var self = this;
        
        // Update map
        if (mapContainer) {
            var osmURL = 'https://staticmap.openstreetmap.de/staticmap.php?center=' + lat + ',' + lng + '&zoom=17&size=120x120&markers=' + lat + ',' + lng + ',red-pushpin';
            mapContainer.innerHTML = '<img src="' + osmURL + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.innerHTML=\'📍\'">';
        }

        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&addressdetails=1&zoom=18')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data && data.display_name) {
                    self.locationAddress = data.display_name;
                    var shortAddr = self.formatShortAddress(data);
                    addressText.textContent = '📍 ' + shortAddr;
                    addressText.style.color = '#1A3A5C';
                    if (addressInput && self.deliveryType === 'home') {
                        addressInput.value = shortAddr;
                        addressInput.style.background = '#F0FDF4';
                        addressInput.style.borderColor = '#BBF7D0';
                    }
                    statusBadge.textContent = '✅ Exact Location';
                    statusBadge.style.background = '#D1FAE5';
                    statusBadge.style.color = '#065F46';
                }
            })
            .catch(function() {
                self.locationAddress = lat.toFixed(5) + ', ' + lng.toFixed(5);
                addressText.textContent = '📍 GPS: ' + self.locationAddress;
                statusBadge.textContent = '✅ GPS';
                statusBadge.style.background = '#FEF3C7';
                statusBadge.style.color = '#92400E';
                if (addressInput) addressInput.value = self.locationAddress;
            });
    },

    getIPLocation: function(statusBadge, addressText, addressInput, mapContainer) {
        var self = this;
        
        fetch('https://ipapi.co/json/')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data && data.latitude && data.longitude) {
                    self.detectedLocation = { lat: data.latitude, lng: data.longitude };
                    self.locationAddress = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
                    
                    addressText.textContent = '📍 ' + self.locationAddress + ' (IP-based)';
                    addressText.style.color = '#1A3A5C';
                    statusBadge.textContent = '✅ IP Location';
                    statusBadge.style.background = '#D1FAE5';
                    statusBadge.style.color = '#065F46';
                    
                    if (addressInput && self.deliveryType === 'home') {
                        addressInput.value = self.locationAddress;
                        addressInput.style.background = '#FFF7ED';
                        addressInput.style.borderColor = '#FED7AA';
                    }
                    
                    if (mapContainer && data.latitude) {
                        var osmURL = 'https://staticmap.openstreetmap.de/staticmap.php?center=' + data.latitude + ',' + data.longitude + '&zoom=12&size=120x120&markers=' + data.latitude + ',' + data.longitude + ',red-pushpin';
                        mapContainer.innerHTML = '<img src="' + osmURL + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.innerHTML=\'📍\'">';
                    }
                } else {
                    addressText.textContent = 'Please enter your address manually';
                    statusBadge.textContent = '⚠️ Manual';
                }
            })
            .catch(function() {
                addressText.textContent = 'Please enter your address manually';
                statusBadge.textContent = '⚠️ Manual';
            });
    },

    formatShortAddress: function(data) {
        var addr = data.address;
        var parts = [];
        if (addr.road) parts.push(addr.road);
        if (addr.house_number) parts[0] = addr.house_number + ' ' + (parts[0] || '');
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
        if (addr.state) parts.push(addr.state);
        if (addr.postcode) parts.push(addr.postcode);
        return parts.join(', ') || data.display_name;
    },

    placeOrder: function() {
        var name = document.getElementById('modalName').value.trim();
        var phone = document.getElementById('modalPhone').value.trim();
        var address = this.deliveryType === 'home' ? document.getElementById('modalAddress').value.trim() : 'Store Pickup';
        var instructions = document.getElementById('modalInstructions').value.trim();

        if (!name) { alert('Please enter your name'); return; }
        if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) { alert('Please enter a valid 10-digit phone number'); return; }
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