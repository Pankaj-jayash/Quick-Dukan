// ============================================
// WHATSAPP.JS - WhatsApp Message Handler
// Compact & Bilingual WhatsApp Message with Emoji Separators
// ============================================

class WhatsAppManager {
    constructor() {
        this.phoneNumber = '919719312956'; // ⭐ YOUR NUMBER
        console.log('✅ WhatsApp Manager Ready | Number:', this.phoneNumber);
    }

    sendOrder(orderData) {
        const message = this.buildOrderMessage(orderData);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        return true;
    }

    buildOrderMessage(data) {
        const lang = window.languageManager?.currentLang || 'hi';
        const now = new Date();
        const dateStr = now.toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString(lang === 'en' ? 'en-IN' : 'hi-IN', {
            hour: '2-digit', minute: '2-digit'
        });

        let msg = '';

        // Header
        msg += '🛒 *Quick Dukan - New Order / नया ऑर्डर*\n';
        msg += '🔸───────────────────────────────🔸\n';

        // Customer Info
        if (data.customer) {
            msg += `👤 Customer / ग्राहक: ${data.customer.name || ''}\n`;
            msg += `📱 Phone / फ़ोन: ${data.customer.phone || ''}\n`;
            if (data.customer.villageCity) msg += `🏙️ City / शहर: ${data.customer.villageCity}\n`;
            if (data.customer.landmark) msg += `📍 Landmark / आस-पास: ${data.customer.landmark}\n`;
            if (data.customer.pincode) msg += `📮 Pincode / पिन कोड: ${data.customer.pincode}\n`;
        }

        msg += `📅 Date / तारीख: ${dateStr} | ⏰ Time / समय: ${timeStr}\n`;

        // Items
        msg += '\n📦 Items / आइटम्स\n';
        msg += '🟢───────────────────────────────🟢\n';
        if (data.items && data.items.length > 0) {
            data.items.forEach((item, index) => {
                const itemNameEn = item.name?.en || item.name?.hi || 'Product';
                const itemNameHi = item.name?.hi || item.name?.en || 'प्रोडक्ट';
                const unitEn = item.unit?.en || item.unit?.hi || '';
                const unitHi = item.unit?.hi || item.unit?.en || '';
                const price = item.price || 0;
                const qty = item.quantity || 1;
                const itemTotal = price * qty;

                msg += `${index + 1}. ${itemNameEn} (${itemNameHi})\n`;
                msg += `   📏 ${unitEn} (${unitHi}) | ×${qty} | 💰 ₹${itemTotal}\n`;
                if (item.discount && item.discount > 0) {
                    const originalPrice = Math.round(price / (1 - item.discount / 100));
                    msg += `   🏷️ ${item.discount}% OFF (MRP ₹${originalPrice})\n`;
                }
            });
        }

        // Totals
        if (data.totals) {
            msg += '\n🔸───────────────────────────────🔸\n';
            msg += `📦 Total Items / कुल आइटम: ${data.totals.itemCount || 0}\n`;
            msg += `💰 Amount / कुल राशि: ₹${data.totals.total || 0}\n`;
            if (data.totals.total >= 500) {
                msg += '🚚 Delivery / डिलीवरी: *Free!* 🎉\n';
            }
        }

        // Notes
        if (data.customer && data.customer.notes) {
            msg += `\n📝 Notes / निर्देश: "${data.customer.notes}"\n`;
        }

        // Location
        if (data.location && data.location.lat && data.location.lng) {
            msg += '\n📍 Location / लोकेशन\n';
            msg += '🟢───────────────────────────────🟢\n';
            const mapsUrl = data.location.url || 
                `https://maps.google.com/?q=${data.location.lat},${data.location.lng}`;
            msg += `   🔗 ${mapsUrl}\n`;
            msg += `   📌 ${data.location.lat}, ${data.location.lng}\n`;
        }

        // Footer
        msg += '\n🔸───────────────────────────────🔸\n';
        msg += '🙏 Please confirm the order and share delivery time.\n';
        msg += 'धन्यवाद! 🛒✨';

        return msg;
    }

    sendQuickOrder(product) {
        const nameEn = product.name?.en || product.name?.hi || '';
        const nameHi = product.name?.hi || product.name?.en || '';
        const unitEn = product.unit?.en || product.unit?.hi || '';
        const unitHi = product.unit?.hi || product.unit?.en || '';
        const price = product.price || 0;

        const message = `🛒 *Quick Dukan - New Order / नया ऑर्डर*\n` +
            '🟢───────────────────────────────🟢\n' +
            `📦 ${nameEn} (${nameHi})\n` +
            `📏 ${unitEn} (${unitHi})\n` +
            `💰 Price / कीमत: ₹${price}\n\n` +
            '🙏 Please confirm delivery.\nधन्यवाद! 🛒';

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        return true;
    }

    getPhoneNumber() {
        return this.phoneNumber;
    }
}

// Initialize globally
document.addEventListener('DOMContentLoaded', () => {
    window.whatsappManager = new WhatsAppManager();
});