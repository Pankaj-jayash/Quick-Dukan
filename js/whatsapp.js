// ============================================
// WHATSAPP.JS - WhatsApp Message Handler
// Quick Dukan - Full Details | Universal Emojis | Map Link
// ============================================

class WhatsAppManager {
    constructor() {
        this.phoneNumber = window.CONFIG?.whatsappNumber || '919719312956';
        console.log('✅ WhatsApp Manager Ready');
    }

    sendOrder(orderData) {
        const lang = window.languageManager?.currentLang || 'hi';
        const message = this.buildOrderMessage(orderData, lang);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        return true;
    }

    buildOrderMessage(data, lang) {
        const isHindi = lang === 'hi';
        const now = new Date();
        const dateStr = this.formatDate(now, lang);
        const timeStr = this.formatTime(now);
        let msg = '';

        // Header
        msg += '═'.repeat(35) + '\n';
        msg += '     *Quick Dukan*\n';
        msg += isHindi ? '        🛒 नया ऑर्डर\n' : '        🛒 New Order\n';
        msg += '═'.repeat(35) + '\n\n';

        // Order Items
        if (data.items && data.items.length > 0) {
            msg += '─'.repeat(35) + '\n';
            msg += isHindi ? '  📦 *ऑर्डर विवरण*\n' : '  📦 *ORDER DETAILS*\n';
            msg += '─'.repeat(35) + '\n\n';

            data.items.forEach((item, index) => {
                const name = this.getItemName(item, lang);
                const unit = this.getItemUnit(item, lang);
                const price = item.price || 0;
                const qty = item.quantity || 1;
                const total = price * qty;
                const emoji = this.getProductEmoji(item.id);

                msg += `${index + 1}. ${emoji} *${name}*\n`;
                msg += `   📏 ${unit} × ${qty} = ₹${total}\n`;

                if (item.discount && item.discount > 0) {
                    const mrp = Math.round(price / (1 - item.discount / 100));
                    msg += isHindi 
                        ? `   🏷️ -${item.discount}% छूट (MRP ₹${mrp})\n`
                        : `   🏷️ -${item.discount}% OFF (MRP ₹${mrp})\n`;
                }

                if (item.stock && item.stock <= 5) {
                    msg += isHindi 
                        ? `   ⚠️ सिर्फ ${item.stock} बचे!\n`
                        : `   ⚠️ Only ${item.stock} left!\n`;
                }
                msg += '\n';
            });
        }

        // Billing
        const subtotal = data.totals?.subtotal || data.totals?.total || 0;
        const couponDiscount = data.totals?.couponDiscount || 0;
        const delivery = data.totals?.delivery || 0;
        const grandTotal = data.totals?.grandTotal || data.totals?.total || 0;
        const savings = data.totals?.savings || 0;

        msg += '─'.repeat(35) + '\n';
        msg += isHindi ? '  💰 *बिलिंग*\n' : '  💰 *BILLING*\n';
        msg += '─'.repeat(35) + '\n\n';

        msg += isHindi 
            ? `  📦 सबटोटल: ₹${subtotal}\n`
            : `  📦 Subtotal: ₹${subtotal}\n`;

        if (couponDiscount > 0 && data.coupon) {
            msg += isHindi 
                ? `  🎫 कूपन (${data.coupon.code}): -₹${couponDiscount}\n`
                : `  🎫 Coupon (${data.coupon.code}): -₹${couponDiscount}\n`;
        }

        if (delivery === 0) {
            msg += isHindi 
                ? '  🚚 डिलीवरी: FREE 🎉\n'
                : '  🚚 Delivery: FREE 🎉\n';
        } else {
            msg += isHindi 
                ? `  🚚 डिलीवरी: ₹${delivery}\n`
                : `  🚚 Delivery: ₹${delivery}\n`;
        }

        msg += '─'.repeat(35) + '\n';
        msg += isHindi 
            ? `  💵 *कुल राशि: ₹${grandTotal}*\n`
            : `  💵 *GRAND TOTAL: ₹${grandTotal}*\n`;

        if (savings > 0) {
            msg += isHindi 
                ? `  🤑 बचत: ₹${savings}!\n`
                : `  🤑 You Saved: ₹${savings}!\n`;
        }
        msg += '─'.repeat(35) + '\n\n';

        // Customer Details
        if (data.customer) {
            msg += '─'.repeat(35) + '\n';
            msg += isHindi ? '  👤 *ग्राहक जानकारी*\n' : '  👤 *CUSTOMER DETAILS*\n';
            msg += '─'.repeat(35) + '\n\n';

            if (data.customer.name) {
                msg += `  🙋 ${isHindi ? 'नाम' : 'Name'}: ${data.customer.name}\n`;
            }
            if (data.customer.phone) {
                msg += `  📱 ${isHindi ? 'फ़ोन' : 'Phone'}: ${data.customer.phone}\n`;
            }
            if (data.customer.villageCity) {
                msg += `  🏘️ ${isHindi ? 'गाँव/शहर' : 'Village/City'}: ${data.customer.villageCity}\n`;
            }
            if (data.customer.landmark) {
                msg += `  🏠 ${isHindi ? 'आस-पास' : 'Nearby'}: ${data.customer.landmark}\n`;
            }
            if (data.customer.pincode) {
                msg += `  📮 ${isHindi ? 'पिन कोड' : 'Pincode'}: ${data.customer.pincode}\n`;
            }
            if (data.customer.deliveryTime) {
                msg += `  ⏱️ ${isHindi ? 'डिलीवरी समय' : 'Delivery Time'}: ${data.customer.deliveryTime}\n`;
            }
            if (data.customer.notes) {
                msg += `  📝 ${isHindi ? 'नोट्स' : 'Notes'}: ${data.customer.notes}\n`;
            }
            msg += '\n';
        }

        // Location
        const shopLat = 27.6667496;
        const shopLng = 77.7124673;
        const custLat = data.location?.lat || '';
        const custLng = data.location?.lng || '';

        msg += '─'.repeat(35) + '\n';
        msg += isHindi ? '  📍 *लोकेशन*\n' : '  📍 *LOCATION*\n';
        msg += '─'.repeat(35) + '\n\n';

        msg += isHindi 
            ? '  🏪 दुकान: Quick Dukan, Mathura\n'
            : '  🏪 Shop: Quick Dukan, Mathura\n';

        if (custLat && custLng) {
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${shopLat},${shopLng}&destination=${custLat},${custLng}&travelmode=driving`;
            msg += `  📍 ${isHindi ? 'ग्राहक लोकेशन' : 'Customer Location'}:\n`;
            msg += `  🔗 ${data.location?.url || `https://maps.google.com/?q=${custLat},${custLng}`}\n\n`;
            msg += isHindi 
                ? '  🚗 *दुकान से ग्राहक तक रास्ता:*\n'
                : '  🚗 *Route (Shop to Customer):*\n';
            msg += `  🔗 ${directionsUrl}\n\n`;
        } else {
            msg += `  📍 ${isHindi ? 'दुकान की लोकेशन' : 'Shop Location'}:\n`;
            msg += `  🔗 https://maps.google.com/?q=${shopLat},${shopLng}\n\n`;
        }

        // Footer
        msg += '─'.repeat(35) + '\n';
        msg += `  📅 ${dateStr}  |  🕐 ${timeStr}\n`;
        msg += '─'.repeat(35) + '\n\n';

        if (isHindi) {
            msg += '✅ कृपया ऑर्डर कन्फर्म करें!\n';
            msg += '🙏 धन्यवाद! 🛒✨';
        } else {
            msg += '✅ Please confirm this order!\n';
            msg += '🙏 Thank you! 🛒✨';
        }

        return msg;
    }

    sendQuickOrder(product) {
        const lang = window.languageManager?.currentLang || 'hi';
        const isHindi = lang === 'hi';
        const name = this.getItemName(product, lang);
        const unit = this.getItemUnit(product, lang);
        const price = product.price || 0;
        const emoji = this.getProductEmoji(product.id);
        let msg = '';

        msg += '─'.repeat(35) + '\n';
        msg += '     *Quick Dukan*\n';
        msg += isHindi ? '        🛒 नया ऑर्डर\n' : '        🛒 New Order\n';
        msg += '─'.repeat(35) + '\n\n';

        msg += isHindi 
            ? '🙋 मैं ऑर्डर करना चाहता हूँ:\n\n'
            : '🙋 I want to order:\n\n';

        msg += `${emoji} *${name}*\n`;
        msg += `   📏 ${unit}\n`;
        msg += `   💰 ₹${price}\n\n`;

        msg += isHindi 
            ? '🙏 कृपया डिलीवरी कन्फर्म करें।\n'
            : '🙏 Please confirm delivery.\n';
        msg += 'धन्यवाद! 🛒';

        const encodedMessage = encodeURIComponent(msg);
        const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        return true;
    }

    // Helpers
    getItemName(item, lang) {
        if (!item.name) return 'Product';
        if (typeof item.name === 'string') return item.name;
        return item.name[lang] || item.name.hi || item.name.en || 'Product';
    }

    getItemUnit(item, lang) {
        if (!item.unit) return '';
        if (typeof item.unit === 'string') return item.unit;
        return item.unit[lang] || item.unit.hi || item.unit.en || '';
    }

    getProductEmoji(productId) {
        const emojiMap = {
            'atta': '🌾',
            'chawal': '🍚',
            'chai-patti': '🍵',
            'doodh': '🥛',
            'bread': '🍞',
            'cheeni': '🍬',
            'namak': '🧂',
            'tel': '🫗',
            'masala': '🌶️',
            'dal': '🫘',
            'biscuit': '🍪',
            'sabji': '🥬',
            'ghee': '🥛',
            'paneer': '🧀',
            'dahi': '🥛',
            'fruits': '🍎',
            'sabun': '🧼',
            'shampoo': '🧴',
            'paste': '🦷',
            'oil': '🫗',
        };
        return emojiMap[productId] || '🛒';
    }

    formatDate(date, lang) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return lang === 'hi' 
            ? date.toLocaleDateString('hi-IN', options)
            : date.toLocaleDateString('en-IN', options);
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    getPhoneNumber() {
        return this.phoneNumber;
    }
}

// Initialize globally
document.addEventListener('DOMContentLoaded', () => {
    window.whatsappManager = new WhatsAppManager();
});