var WhatsApp = {
    sendOrder: function(orderData) {
        var msg = '🛒 *' + CONFIG.store.name + ' — New Order*\n━━━━━━━━━━━━━━━━\n\n📋 *Items:*\n';
        orderData.items.forEach(function(item, i) {
            msg += (i+1) + '. ' + item.name + ' x' + item.quantity + ' = ₹' + (item.price * item.quantity) + '\n';
        });
        msg += '\n💰 *Total: ₹' + orderData.total + '*\n';
        msg += '💳 Payment: ' + (orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : orderData.paymentMethod === 'qr' ? 'QR/UPI' : 'PhonePe') + '\n';
        msg += '🚚 Delivery: ' + (orderData.deliveryType === 'home' ? 'Home Delivery' : 'Store Pickup') + '\n\n';
        msg += '👤 *Customer:*\n' + orderData.customer.name + '\n📞 ' + orderData.customer.phone + '\n';
        if (orderData.customer.address) msg += '📍 ' + orderData.customer.address + '\n';
        if (orderData.customer.instructions) msg += '📝 ' + orderData.customer.instructions + '\n';
        if (orderData.location) msg += '\n📍 Map: https://maps.google.com/?q=' + orderData.location.lat + ',' + orderData.location.lng + '\n';
        msg += '\n🆔 ' + orderData.orderRef + '\n📅 ' + orderData.dateTime + '\n\n🙏 Thank you!';
        window.open('https://wa.me/' + CONFIG.store.phone + '?text=' + encodeURIComponent(msg), '_blank');
    }
};