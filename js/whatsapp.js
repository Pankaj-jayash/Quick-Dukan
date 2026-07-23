// ========== WHATSAPP MESSAGE GENERATOR ==========

const WhatsApp = {
    buildMessage(orderData) {
        let message = '';
        
        // Header
        message += `🛒 *${CONFIG.store.name} — New Order*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Order Items
        message += `📋 *Order Details:*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        orderData.items.forEach((item, index) => {
            message += `${index + 1}️⃣ *${item.name}* (${item.weight})\n`;
            message += `   Qty: ${item.quantity} | ${Utils.formatPrice(item.price)} × ${item.quantity} = ${Utils.formatPrice(item.price * item.quantity)}\n`;
            if (item.image) {
                message += `   🖼️ ${item.image}\n`;
            }
            message += `\n`;
        });
        
        // Total
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `💰 *Total: ${Utils.formatPrice(orderData.total)}*\n`;
        message += `💵 Payment: ${orderData.payment || 'Cash on Delivery'}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Customer Details
        message += `👤 *Customer Details:*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `Name: ${orderData.customer.name}\n`;
        message += `📞 Phone: ${orderData.customer.phone}\n`;
        message += `📍 Address: ${orderData.customer.address}\n`;
        message += `🏘️ City: ${orderData.customer.city}\n\n`;
        
        // Delivery Type
        message += `🚚 Delivery: ${orderData.deliveryType === 'pickup' ? 'Store Pickup 🏬' : 'Home Delivery 🚚'}\n\n`;
        
        // Pickup info
        if (orderData.deliveryType === 'pickup') {
            message += `🏬 *Pickup Location:*\n`;
            message += `${CONFIG.store.name}\n`;
            message += `${CONFIG.store.address}\n`;
            message += `⏰ ${CONFIG.store.timing}\n`;
            message += `📞 ${CONFIG.store.phoneDisplay}\n\n`;
        }
        
        // Instructions
        if (orderData.customer.instructions) {
            message += `📝 *Instructions:* ${orderData.customer.instructions}\n\n`;
        }
        
        // Location
        if (orderData.location) {
            const locQuery = encodeURIComponent(
                (orderData.customer.address || '') + ' ' + 
                (orderData.customer.city || '') + ' ' + 
                (orderData.location.pincode || '')
            );
            message += `📍 *Location on Map:*\n`;
            message += `https://maps.google.com/?q=${locQuery}\n\n`;
        }
        
        // Footer
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📅 ${Utils.getCurrentDateTime()}\n`;
        message += `🆔 Order Ref: ${orderData.orderRef}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `🙏 Thank you for your order!\n`;
        message += `We'll confirm shortly.\n`;
        message += `📞 ${CONFIG.store.name}: ${CONFIG.store.phoneDisplay}\n`;
        
        return message;
    },
    
    sendOrder(orderData) {
        const message = this.buildMessage(orderData);
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `${CONFIG.urls.whatsappAPI}${CONFIG.store.phone}?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappURL, '_blank');
        
        // Save order
        Storage.addOrder({
            orderRef: orderData.orderRef,
            date: Utils.getCurrentDateTime(),
            items: orderData.items,
            total: orderData.total,
            payment: orderData.payment,
            deliveryType: orderData.deliveryType,
            customer: orderData.customer,
            instructions: orderData.customer.instructions || '',
            location: orderData.location,
            status: 'confirmed'
        });
        
        // Clear purchased items from cart
        const purchasedIds = orderData.items.map(item => item.id);
        Cart.clearPurchased(purchasedIds);
        
        return true;
    }
};