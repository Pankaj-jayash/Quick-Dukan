const WhatsApp = {
    
    buildOrderMessage(orderData) {
        let message = '';
        
        // Header
        message += `🛒 *${CONFIG.store.name} — New Order*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Order Items
        message += `📋 *Order Details:*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        orderData.items.forEach((item, index) => {
            message += `${index + 1}️⃣ *${item.name}*\n`;
            message += `   📦 Qty: ${item.quantity}`;
            if (item.weight) message += ` (${item.weight})`;
            message += `\n`;
            message += `   💰 Price: ₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}\n`;
            if (item.image && item.image.startsWith('http')) {
                message += `   🖼️ ${item.image}\n`;
            }
            message += `\n`;
        });
        
        // Total
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `💰 *Total Amount: ₹${orderData.total}*\n`;
        message += `📦 Total Items: ${orderData.totalItems}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Payment Info
        message += `💳 *Payment Method:*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (orderData.paymentMethod === 'cash') {
            message += `💵 Cash on Delivery\n`;
            message += `ℹ️ *Aap chahe to QR code se bhi pay kar sakte hain:*\n`;
            message += `📱 QR Code: ${CONFIG.payments.qrCodeImage || 'Contact for QR'}\n`;
        } else if (orderData.paymentMethod === 'qr') {
            message += `📱 UPI / QR Code Payment\n`;
            message += `📱 QR Code: ${CONFIG.payments.qrCodeImage || 'Contact for QR'}\n`;
            message += `🆔 UPI ID: ${CONFIG.payments.phonePeUPI}\n`;
            message += `⚠️ *Payment complete hone ke baad confirm karein.*\n`;
        } else if (orderData.paymentMethod === 'phonepe') {
            message += `💸 PhonePe Payment\n`;
            message += `🆔 UPI ID: ${CONFIG.payments.phonePeUPI}\n`;
            message += `📱 Amount: ₹${orderData.total}\n`;
            message += `⚠️ *Payment complete hone ke baad confirm karein.*\n`;
        }
        message += `\n`;
        
        // Customer Details
        message += `👤 *Customer Details:*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `👤 Name: ${orderData.customer.name}\n`;
        message += `📞 Phone: ${orderData.customer.phone}\n`;
        
        if (orderData.deliveryType === 'home') {
            message += `📍 Address: ${orderData.customer.address}\n`;
        }
        message += `\n`;
        
        // Delivery Type
        message += `🚚 *Delivery Option:* `;
        message += orderData.deliveryType === 'home' ? 'Home Delivery 🚚' : 'Store Pickup 🏬';
        message += `\n\n`;
        
        // Instructions
        if (orderData.customer.instructions) {
            message += `📝 *Special Instructions:*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            message += `${orderData.customer.instructions}\n\n`;
        }
        
        // Location Map
        if (orderData.deliveryType === 'home' && orderData.customer.address) {
            const locationQuery = encodeURIComponent(orderData.customer.address);
            message += `📍 *Location on Map:*\n`;
            message += `https://maps.google.com/?q=${locationQuery}\n\n`;
        }
        
        if (orderData.deliveryType === 'pickup') {
            message += `📍 *Store Location:*\n`;
            message += `https://maps.google.com/?q=${CONFIG.store.googleMapsQuery}\n\n`;
        }
        
        // GPS Coordinates (if available)
        if (orderData.location) {
            message += `📍 *GPS Coordinates:*\n`;
            message += `https://maps.google.com/?q=${orderData.location.lat},${orderData.location.lng}\n\n`;
        }
        
        // Footer
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📅 *Date & Time:* ${orderData.dateTime}\n`;
        message += `🆔 *Order Ref:* #${orderData.orderRef}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `🙏 *Thank you for your order!*\n`;
        message += `We will confirm your order shortly.\n\n`;
        message += `📞 *${CONFIG.store.name}:* ${CONFIG.store.phoneDisplay}\n`;
        message += `📍 ${CONFIG.store.address}\n`;
        
        return message;
    },
    
    sendOrder(orderData) {
        const message = this.buildOrderMessage(orderData);
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${CONFIG.store.phone}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
    },
    
    sendContactMessage() {
        const message = `Hi ${CONFIG.store.name}, I want to order groceries.`;
        window.open(`https://wa.me/${CONFIG.store.phone}?text=${encodeURIComponent(message)}`, '_blank');
    },
    
    sendProductOrder(product, quantity) {
        const orderData = {
            items: [{ id: product.id, name: product.name, price: product.price, weight: product.weight || '', quantity: quantity, image: product.image || '', icon: product.icon || '' }],
            total: product.price * quantity,
            totalItems: quantity,
            deliveryType: 'home',
            paymentMethod: 'cash',
            customer: { name: 'Customer', phone: '', address: 'Will share', instructions: '' },
            location: null,
            orderRef: 'QD-DIRECT',
            dateTime: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })
        };
        this.sendOrder(orderData);
    }
};

console.log('✅ Quick Dukan — WhatsApp Order System Ready');