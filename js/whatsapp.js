// ============================================
// WHATSAPP.JS - WhatsApp Message Handler
// All WhatsApp message logic in ONE file
// ============================================

class WhatsAppManager {
    constructor() {
        this.phoneNumber = '919719312956'; // ⭐ YOUR NUMBER
        console.log('✅ WhatsApp Manager Ready | Number:', this.phoneNumber);
    }
    
    /**
     * Send order via WhatsApp
     * @param {Object} orderData - Complete order data
     */
    sendOrder(orderData) {
        const message = this.buildOrderMessage(orderData);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        return true;
    }
    
    /**
     * Build professional WhatsApp message
     */
    buildOrderMessage(data) {
        const lang = window.languageManager?.currentLang || 'hi';
        const now = new Date();
        const dateStr = now.toLocaleDateString('hi-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('hi-IN', {
            hour: '2-digit', minute: '2-digit'
        });
        
        let msg = '';
        
        // Header
        msg += '🛒 *Quick Dukan - नया ऑर्डर*\n';
        msg += '━━━━━━━━━━━━━━━━━━━━\n\n';
        
        // Customer Info Section
        if (data.customer) {
            msg += '👤 *ग्राहक की जानकारी*\n';
            msg += '━━━━━━━━━━━━━━━━━━━━\n';
            if (data.customer.name) msg += `   📛 नाम: ${data.customer.name}\n`;
            if (data.customer.phone) msg += `   📱 फ़ोन: ${data.customer.phone}\n`;
            if (data.customer.villageCity) msg += `   📍 गाँव/शहर: ${data.customer.villageCity}\n`;
            if (data.customer.landmark) msg += `   🏫 आस-पास: ${data.customer.landmark}\n`;
            if (data.customer.pincode) msg += `   📮 पिन कोड: ${data.customer.pincode}\n`;
            msg += '\n';
        }
        
        // Order Date & Time
        msg += '📅 *ऑर्डर की जानकारी*\n';
        msg += '━━━━━━━━━━━━━━━━━━━━\n';
        msg += `   तारीख: ${dateStr}\n`;
        msg += `   समय: ${timeStr}\n`;
        msg += '\n';
        
        // Order Items
        msg += '📦 *ऑर्डर आइटम*\n';
        msg += '━━━━━━━━━━━━━━━━━━━━\n';
        
        if (data.items && data.items.length > 0) {
            data.items.forEach((item, index) => {
                const itemName = item.name ? (item.name[lang] || item.name.hi || item.name.en || 'प्रोडक्ट') : 'प्रोडक्ट';
                const unit = item.unit ? (item.unit[lang] || item.unit.hi || item.unit.en || '') : '';
                const price = item.price || 0;
                const qty = item.quantity || 1;
                const itemTotal = price * qty;
                
                msg += `${index + 1}. ${itemName}\n`;
                msg += `   📏 ${unit} | 🔢 ×${qty} | 💰 ₹${itemTotal}\n`;
                if (item.discount && item.discount > 0) {
                    const originalPrice = Math.round(price / (1 - item.discount / 100));
                    msg += `   🏷️ ${item.discount}% OFF (MRP ₹${originalPrice})\n`;
                }
            });
        }
        
        msg += '\n━━━━━━━━━━━━━━━━━━━━\n';
        
        // Total
        if (data.totals) {
            msg += `📦 कुल आइटम: ${data.totals.itemCount || 0}\n`;
            msg += `💰 कुल राशि: ₹${data.totals.total || 0}\n`;
            
            if (data.totals.total >= 500) {
                msg += '🚚 डिलीवरी: *फ्री!* 🎉\n';
            }
        }
        
        msg += '\n';
        
        // Order Notes
        if (data.customer && data.customer.notes) {
            msg += '📝 *खास निर्देश:*\n';
            msg += `   "${data.customer.notes}"\n\n`;
        }
        
        // ⭐ LIVE LOCATION ⭐
        if (data.location && data.location.lat && data.location.lng) {
            msg += '📍 *लाइव लोकेशन (मैप लिंक)*\n';
            msg += '━━━━━━━━━━━━━━━━━━━━\n';
            
            // Google Maps link
            const mapsUrl = data.location.url || 
                `https://maps.google.com/?q=${data.location.lat},${data.location.lng}`;
            
            msg += `   🔗 ${mapsUrl}\n`;
            msg += '   👆 मैप खोलने के लिए ऊपर दिए लिंक पर क्लिक करें\n\n';
            
            // Coordinates (backup)
            msg += `   📌 Coordinates: ${data.location.lat}, ${data.location.lng}\n`;
        }
        
        msg += '\n━━━━━━━━━━━━━━━━━━━━\n';
        msg += '🙏 *कृपया ऑर्डर कन्फर्म करें और डिलीवरी का समय बताएं।*\n';
        msg += 'धन्यवाद! 🛒✨';
        
        return msg;
    }
    
    /**
     * Quick message for single product
     */
    sendQuickOrder(product) {
        const lang = window.languageManager?.currentLang || 'hi';
        const name = product.name ? (product.name[lang] || product.name.hi || product.name.en || '') : '';
        const unit = product.unit ? (product.unit[lang] || product.unit.hi || product.unit.en || '') : '';
        const price = product.price || 0;
        
        const message = `🛒 *Quick Dukan - नया ऑर्डर*\n\n` +
            `नमस्ते! 🙏\n\n` +
            `मुझे यह ऑर्डर करना है:\n\n` +
            `📦 ${name}\n` +
            `📏 ${unit}\n` +
            `💰 कीमत: ₹${price}\n\n` +
            `कृपया डिलीवरी की जानकारी दें।\n` +
            `धन्यवाद! 🛒`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        return true;
    }
    
    /**
     * Get phone number
     */
    getPhoneNumber() {
        return this.phoneNumber;
    }
}

// Initialize globally
document.addEventListener('DOMContentLoaded', () => {
    window.whatsappManager = new WhatsAppManager();
});