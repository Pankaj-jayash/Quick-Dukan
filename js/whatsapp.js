var WhatsApp = {
    sendOrder: function(orderData) {
        var msg = '';
        
        msg += '🛒 *' + CONFIG.store.name + ' — New Order*\n';
        msg += '━━━━━━━━━━━━━━━━\n\n';
        
        msg += '📋 *Order Details:*\n';
        orderData.items.forEach(function(item, i) {
            msg += (i+1) + '. *' + item.name + '*\n';
            msg += '   📦 Qty: ' + item.quantity;
            if (item.weight) msg += ' (' + item.weight + ')';
            msg += '\n   💰 ₹' + item.price + ' × ' + item.quantity + ' = ₹' + (item.price * item.quantity) + '\n';
            if (item.image && item.image.indexOf('http') === 0) msg += '   🖼️ ' + item.image + '\n';
            msg += '\n';
        });
        
        msg += '━━━━━━━━━━━━━━━━\n';
        msg += '💰 *Total: ₹' + orderData.total + '*\n';
        msg += '📦 Items: ' + orderData.totalItems + '\n';
        msg += '━━━━━━━━━━━━━━━━\n\n';
        
        msg += '💳 *Payment:* ';
        if (orderData.paymentMethod === 'cash') {
            msg += 'Cash on Delivery 💵\n';
            msg += 'ℹ️ _QR se bhi pay kar sakte hain:_ ' + (CONFIG.payments.qrCodeImage || 'Contact for QR') + '\n';
        } else if (orderData.paymentMethod === 'qr') {
            msg += 'QR/UPI Payment 📱\n';
            msg += '🆔 UPI: ' + CONFIG.payments.phonePeUPI + '\n';
            msg += '📱 QR: ' + (CONFIG.payments.qrCodeImage || 'Contact for QR') + '\n';
        } else {
            msg += 'PhonePe Payment 💸\n';
            msg += '🆔 UPI: ' + CONFIG.payments.phonePeUPI + '\n';
        }
        msg += '\n';
        
        msg += '👤 *Customer:*\n';
        msg += '👤 ' + orderData.customer.name + '\n';
        msg += '📞 ' + orderData.customer.phone + '\n';
        if (orderData.deliveryType === 'home') {
            msg += '📍 ' + orderData.customer.address + '\n';
        }
        if (orderData.customer.instructions) {
            msg += '📝 ' + orderData.customer.instructions + '\n';
        }
        msg += '\n';
        
        msg += '🚚 *Delivery:* ' + (orderData.deliveryType === 'home' ? 'Home Delivery' : 'Store Pickup') + '\n\n';
        
        // LIVE LOCATION
        if (orderData.location) {
            msg += '📍 *Live Location:*\n';
            msg += '🗺️ Google Maps: https://maps.google.com/?q=' + orderData.location.lat + ',' + orderData.location.lng + '\n';
            if (orderData.locationAddress) {
                msg += '📌 Address: ' + orderData.locationAddress + '\n';
            }
            msg += '\n';
        }
        
        if (orderData.deliveryType === 'pickup') {
            msg += '🏬 *Store:* https://maps.google.com/?q=' + CONFIG.store.googleMapsQuery + '\n\n';
        }
        
        msg += '━━━━━━━━━━━━━━━━\n';
        msg += '🆔 ' + orderData.orderRef + '\n';
        msg += '📅 ' + orderData.dateTime + '\n';
        msg += '━━━━━━━━━━━━━━━━\n\n';
        msg += '🙏 *Thank you!* We will confirm shortly.\n';
        msg += '📞 ' + CONFIG.store.phoneDisplay + '\n';
        msg += '📍 ' + CONFIG.store.address;
        
        window.open('https://wa.me/' + CONFIG.store.phone + '?text=' + encodeURIComponent(msg), '_blank');
    }
};