// ============================================
// WHATSAPP.JS - WhatsApp Message Handler
// Quick Dukan - Clean Format | Universal Emojis
// ============================================

class WhatsAppManager {
    constructor() {
        this.phoneNumber = window.CONFIG?.whatsappNumber || '919719312956';
        console.log('✅ WhatsApp Manager Ready');
    }

    /**
     * Send order via WhatsApp
     * @param {Object} orderData - Complete order data
     */
    sendOrder(orderData) {
        const lang = window.languageManager?.currentLang || 'hi';
        const message = this.buildOrderMessage(orderData, lang);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        return true;
    }

    /**
     * Build complete order message - Single Language
     */
    buildOrderMessage(data, lang) {
        const isHindi = lang === 'hi';
        const now = new Date();
        const dateStr = this.formatDate(now, lang);
        const timeStr = this.formatTime(now);

        let msg = '';

        // ============================================
        // HEADER
        // ============================================
        msg += '════════════════════════════════\n';
        if (isHindi) {
            msg += '     *Quick Dukan*\n';
            msg += '        \uD83D\uDED2 \u0928\u092F\u093E \u0911\u0930\u094D\u0921\u0930\n';
        } else {
            msg += '     *Quick Dukan*\n';
            msg += '        \uD83D\uDED2 New Order\n';
        }
        msg += '════════════════════════════════\n\n';

        // ============================================
        // ORDER ITEMS
        // ============================================
        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
        if (isHindi) {
            msg += '  \uD83D\uDCE6 *\u0911\u0930\u094D\u0921\u0930 \u0935\u093F\u0935\u0930\u0923*\n';
        } else {
            msg += '  \uD83D\uDCE6 *ORDER DETAILS*\n';
        }
        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n';

        if (data.items && data.items.length > 0) {
            data.items.forEach((item, index) => {
                const name = this.getItemName(item, lang);
                const unit = this.getItemUnit(item, lang);
                const price = item.price || 0;
                const qty = item.quantity || 1;
                const total = price * qty;
                const emoji = this.getProductEmoji(item.id);

                // Item name with emoji
                msg += `${index + 1}. ${emoji} *${name}*\n`;
                
                // Unit + Quantity + Total
                msg += `   \uD83D\uDCCF ${unit} \u00D7 ${qty} = \u20B9${total}\n`;
                
                // Discount badge
                if (item.discount && item.discount > 0) {
                    const mrp = Math.round(price / (1 - item.discount / 100));
                    if (isHindi) {
                        msg += `   \uD83C\uDFF7\uFE0F -${item.discount}% \u091B\u0942\u091F (MRP \u20B9${mrp})\n`;
                    } else {
                        msg += `   \uD83C\uDFF7\uFE0F -${item.discount}% OFF (MRP \u20B9${mrp})\n`;
                    }
                }
                
                // Stock warning (if applicable)
                if (item.stock && item.stock <= 5) {
                    if (isHindi) {
                        msg += `   \u26A0\uFE0F \u0938\u093F\u0930\u094D\u092B ${item.stock} \u092C\u091A\u0947!\n`;
                    } else {
                        msg += `   \u26A0\uFE0F Only ${item.stock} left!\n`;
                    }
                }
                
                msg += '\n';
            });
        }

        // ============================================
        // BILLING
        // ============================================
        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
        if (isHindi) {
            msg += '  \uD83D\uDCB0 *\u092C\u093F\u0932\u093F\u0902\u0917*\n';
        } else {
            msg += '  \uD83D\uDCB0 *BILLING*\n';
        }
        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n';

        const subtotal = data.totals?.subtotal || data.totals?.total || 0;
        const couponDiscount = data.totals?.couponDiscount || 0;
        const delivery = data.totals?.delivery || 0;
        const grandTotal = data.totals?.grandTotal || data.totals?.total || 0;
        const savings = data.totals?.savings || 0;

        if (isHindi) {
            msg += `  \uD83D\uDCE6 \u0938\u092C\u091F\u094B\u091F\u0932:     \u20B9${subtotal}\n`;
        } else {
            msg += `  \uD83D\uDCE6 Subtotal:     \u20B9${subtotal}\n`;
        }

        // Coupon row
        if (couponDiscount > 0 && data.coupon) {
            if (isHindi) {
                msg += `  \uD83C\uDFAB \u0915\u0942\u092A\u0928 (${data.coupon.code}): -\u20B9${couponDiscount}\n`;
            } else {
                msg += `  \uD83C\uDFAB Coupon (${data.coupon.code}): -\u20B9${couponDiscount}\n`;
            }
        }

        // Delivery row
        if (delivery === 0) {
            if (isHindi) {
                msg += '  \uD83D\uDE9A \u0921\u093F\u0932\u0940\u0935\u0930\u0940:    FREE \uD83C\uDF89\n';
            } else {
                msg += '  \uD83D\uDE9A Delivery:     FREE \uD83C\uDF89\n';
            }
        } else {
            if (isHindi) {
                msg += `  \uD83D\uDE9A \u0921\u093F\u0932\u0940\u0935\u0930\u0940:    \u20B9${delivery}\n`;
            } else {
                msg += `  \uD83D\uDE9A Delivery:     \u20B9${delivery}\n`;
            }
        }

        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
        
        if (isHindi) {
            msg += `  \uD83D\uDCB5 *\u0915\u0941\u0932 \u0930\u093E\u0936\u093F: \u20B9${grandTotal}*\n`;
        } else {
            msg += `  \uD83D\uDCB5 *GRAND TOTAL: \u20B9${grandTotal}*\n`;
        }

        // Savings
        if (savings > 0) {
            if (isHindi) {
                msg += `  \uD83E\uDD11 \u092C\u091A\u0924: \u20B9${savings}!\n`;
            } else {
                msg += `  \uD83E\uDD11 You Saved: \u20B9${savings}!\n`;
            }
        }
        
        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n';

        // ============================================
        // CUSTOMER DETAILS
        // ============================================
        if (data.customer) {
            msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
            if (isHindi) {
                msg += '  \uD83D\uDC64 *\u0917\u094D\u0930\u093E\u0939\u0915 \u091C\u093E\u0928\u0915\u093E\u0930\u0940*\n';
            } else {
                msg += '  \uD83D\uDC64 *CUSTOMER DETAILS*\n';
            }
            msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n';

            if (data.customer.name) {
                if (isHindi) {
                    msg += `  \uD83D\uDE4B \u0928\u093E\u092E: ${data.customer.name}\n`;
                } else {
                    msg += `  \uD83D\uDE4B Name: ${data.customer.name}\n`;
                }
            }
            
            if (data.customer.phone) {
                if (isHindi) {
                    msg += `  \uD83D\uDCF1 \u092B\u093C\u094B\u0928: ${data.customer.phone}\n`;
                } else {
                    msg += `  \uD83D\uDCF1 Phone: ${data.customer.phone}\n`;
                }
            }
            
            if (data.customer.villageCity) {
                if (isHindi) {
                    msg += `  \uD83C\uDFD8\uFE0F \u0917\u093E\u0901\u0935/\u0936\u0939\u0930: ${data.customer.villageCity}\n`;
                } else {
                    msg += `  \uD83C\uDFD8\uFE0F Village/City: ${data.customer.villageCity}\n`;
                }
            }
            
            if (data.customer.landmark) {
                if (isHindi) {
                    msg += `  \uD83C\uDFE0 \u0906\u0938-\u092A\u093E\u0938: ${data.customer.landmark}\n`;
                } else {
                    msg += `  \uD83C\uDFE0 Nearby: ${data.customer.landmark}\n`;
                }
            }
            
            if (data.customer.pincode) {
                if (isHindi) {
                    msg += `  \uD83D\uDCEE \u092A\u093F\u0928 \u0915\u094B\u0921: ${data.customer.pincode}\n`;
                } else {
                    msg += `  \uD83D\uDCEE Pincode: ${data.customer.pincode}\n`;
                }
            }

            if (data.customer.deliveryTime) {
                if (isHindi) {
                    msg += `  \u23F1\uFE0F \u0921\u093F\u0932\u0940\u0935\u0930\u0940 \u0938\u092E\u092F: ${data.customer.deliveryTime}\n`;
                } else {
                    msg += `  \u23F1\uFE0F Delivery Time: ${data.customer.deliveryTime}\n`;
                }
            }

            if (data.customer.notes) {
                if (isHindi) {
                    msg += `  \uD83D\uDCDD \u0928\u094B\u091F\u094D\u0938: ${data.customer.notes}\n`;
                } else {
                    msg += `  \uD83D\uDCDD Notes: ${data.customer.notes}\n`;
                }
            }

            msg += '\n';
        }

        // ============================================
        // LOCATION
        // ============================================
        if (data.location?.url || (data.location?.lat && data.location?.lng)) {
            msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
            if (isHindi) {
                msg += '  \uD83D\uDCCD *\u0932\u094B\u0915\u0947\u0936\u0928*\n';
            } else {
                msg += '  \uD83D\uDCCD *LOCATION*\n';
            }
            msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n';

            const mapsUrl = data.location.url || 
                `https://maps.google.com/?q=${data.location.lat},${data.location.lng}`;
            
            msg += `  \uD83D\uDD17 ${mapsUrl}\n\n`;
        }

        // ============================================
        // FOOTER
        // ============================================
        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
        msg += `  \uD83D\uDCC5 ${dateStr}  |  \uD83D\uDD50 ${timeStr}\n`;
        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n';

        if (isHindi) {
            msg += '\u2705 \u0915\u0943\u092A\u092F\u093E \u0911\u0930\u094D\u0921\u0930 \u0915\u0928\u094D\u092B\u0930\u094D\u092E \u0915\u0930\u0947\u0902!\n';
            msg += '\uD83D\uDE4F \u0927\u0928\u094D\u092F\u0935\u093E\u0926! \uD83D\uDED2\u2728';
        } else {
            msg += '\u2705 Please confirm this order!\n';
            msg += '\uD83D\uDE4F Thank you! \uD83D\uDED2\u2728';
        }

        return msg;
    }

    /**
     * Quick message for single product
     */
    sendQuickOrder(product) {
        const lang = window.languageManager?.currentLang || 'hi';
        const isHindi = lang === 'hi';
        const name = this.getItemName(product, lang);
        const unit = this.getItemUnit(product, lang);
        const price = product.price || 0;
        const emoji = this.getProductEmoji(product.id);

        let msg = '';

        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
        if (isHindi) {
            msg += '     *Quick Dukan*\n';
            msg += '        \uD83D\uDED2 \u0928\u092F\u093E \u0911\u0930\u094D\u0921\u0930\n';
        } else {
            msg += '     *Quick Dukan*\n';
            msg += '        \uD83D\uDED2 New Order\n';
        }
        msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n';

        if (isHindi) {
            msg += '\uD83D\uDE4B \u092E\u0948\u0902 \u0911\u0930\u094D\u0921\u0930 \u0915\u0930\u0928\u093E \u091A\u093E\u0939\u0924\u093E \u0939\u0942\u0901:\n\n';
        } else {
            msg += '\uD83D\uDE4B I want to order:\n\n';
        }

        msg += `${emoji} *${name}*\n`;
        msg += `   \uD83D\uDCCF ${unit}\n`;
        msg += `   \uD83D\uDCB0 \u20B9${price}\n\n`;

        if (isHindi) {
            msg += '\uD83D\uDE4F \u0915\u0943\u092A\u092F\u093E \u0921\u093F\u0932\u0940\u0935\u0930\u0940 \u0915\u0928\u094D\u092B\u0930\u094D\u092E \u0915\u0930\u0947\u0902\u0964\n';
            msg += '\u0927\u0928\u094D\u092F\u0935\u093E\u0926! \uD83D\uDED2';
        } else {
            msg += '\uD83D\uDE4F Please confirm delivery.\n';
            msg += 'Thank you! \uD83D\uDED2';
        }

        const encodedMessage = encodeURIComponent(msg);
        const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        return true;
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /**
     * Get item name based on language
     */
    getItemName(item, lang) {
        if (!item.name) return 'Product';
        if (typeof item.name === 'string') return item.name;
        return item.name[lang] || item.name.hi || item.name.en || 'Product';
    }

    /**
     * Get item unit based on language
     */
    getItemUnit(item, lang) {
        if (!item.unit) return '';
        if (typeof item.unit === 'string') return item.unit;
        return item.unit[lang] || item.unit.hi || item.unit.en || '';
    }

    /**
     * Get product emoji (universal, works on all devices)
     */
    getProductEmoji(productId) {
        const emojiMap = {
            'atta': '\uD83C\uDF3E',           // 🌾
            'chawal': '\uD83C\uDF5A',         // 🍚
            'chai-patti': '\uD83C\uDF75',     // 🍵
            'doodh': '\uD83E\uDD5B',          // 🥛
            'bread': '\uD83C\uDF5E',          // 🍞
            'cheeni': '\uD83C\uDF6C',         // 🍬
            'namak': '\uD83E\uDDC2',          // 🧂
            'tel': '\uD83E\uDED7',            // 🫗
            'masala': '\uD83C\uDF36\uFE0F',   // 🌶️
            'dal': '\uD83E\uDED8',            // 🫘
            'biscuit': '\uD83C\uDF6A',        // 🍪
            'sabji': '\uD83E\uDD6C',          // 🥬
            'ghee': '\uD83E\uDD5B',           // 🥛
            'paneer': '\uD83E\uDDC0',         // 🧀
            'dahi': '\uD83E\uDD5B',           // 🥛
            'fruits': '\uD83C\uDF4E',         // 🍎
            'sabun': '\uD83E\uDDFC',          // 🧼
            'shampoo': '\uD83E\uDDF4',        // 🧴
            'paste': '\uD83E\uDDB7',          // 🦷
            'oil': '\uD83E\uDED7',            // 🫗
        };
        
        return emojiMap[productId] || '\uD83D\uDED2'; // 🛒
    }

    /**
     * Format date in Hindi or English
     */
    formatDate(date, lang) {
        const options = { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        };
        
        if (lang === 'hi') {
            return date.toLocaleDateString('hi-IN', options);
        }
        return date.toLocaleDateString('en-IN', options);
    }

    /**
     * Format time
     */
    formatTime(date) {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
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