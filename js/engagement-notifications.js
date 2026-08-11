// ============================================
// ENGAGEMENT-NOTIFICATIONS.JS
// 20+ Creative Notifications | Random Timing
// Works: PWA + Website | Online + Offline
// ============================================

class EngagementNotificationManager {
    constructor() {
        this.isSupported = false;
        this.permission = 'default';
        this.swRegistration = null;
        this.timerInterval = null;
        this.currentLang = 'hi';
        this.isPWA = false;
        
        // Random interval: 30 min to 1 hour
        this.MIN_INTERVAL = 30 * 60 * 1000; // 30 min
        this.MAX_INTERVAL = 60 * 60 * 1000; // 60 min
        
        // Track which notifications were sent to avoid repeats
        this.sentHistory = [];
        this.MAX_HISTORY = 15;
        
        // Check if running as PWA
        this.checkPWA();
        
        this.init();
    }
    
    checkPWA() {
        this.isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                     window.navigator.standalone === true;
    }
    
    async init() {
        this.detectLanguage();
        
        // Check support
        if (!('Notification' in window)) {
            console.log('🔕 Notifications not supported');
            return;
        }
        
        this.isSupported = true;
        this.permission = Notification.permission;
        
        // Get SW registration
        await this.getSWRegistration();
        
        // Listen for language changes
        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
        });
        
        // Start if already permitted
        if (this.permission === 'granted') {
    console.log('🎯 Engagement notifications starting...');
    // Turant pehla notification
    setTimeout(() => this.sendRandomNotification(), 17000); // 17 sec mein
    this.scheduleNext(); // Agla regular schedule pe
}
        
        console.log('💬 Engagement Notification Manager Ready');
    }
    
    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }
    
    async getSWRegistration() {
        if (!('serviceWorker' in navigator)) return;
        
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length > 0) {
                this.swRegistration = registrations[0];
            }
        } catch (e) {
            console.warn('⚠️ SW check failed:', e);
        }
    }
    
    // ============================================
    // REQUEST PERMISSION WITH FUN MESSAGE
    // ============================================
    async requestPermission() {
        if (!this.isSupported) return false;
        if (this.permission === 'granted') return true;
        if (this.permission === 'denied') {
            this.showEnableInstructions();
            return false;
        }
        
        // Show fun dialog first
        await this.showFunPermissionDialog();
        
        try {
            const result = await Notification.requestPermission();
            this.permission = result;
            
            if (result === 'granted') {
                console.log('✅ Notifications granted!');
                this.showToast(this.t('notifOn', '🔔 नोटिफिकेशन चालू! अब मज़ा आएगा! 😄'));
                setTimeout(() => this.sendFirstNotification(), 3000);
                this.scheduleNext();
                return true;
            } else {
                this.showToast(this.t('notifOff', '😢 कोई नहीं, फिर कभी!'));
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    
    async showFunPermissionDialog() {
        const messages = [
            { hi: '🔔 क्या मैं आपको कभी-कभी याद दिला सकता हूँ? 😊', en: '🔔 Can I remind you sometimes? 😊' },
            { hi: '💬 भाभी ने क्या मँगाया, बता दूँ? 😜', en: '💬 Want to know what Bhabhi ordered? 😜' },
            { hi: '🛒 शॉपिंग के मज़ेदार रिमाइंडर चाहिए?', en: '🛒 Want fun shopping reminders?' },
        ];
        
        const msg = messages[Math.floor(Math.random() * messages.length)];
        this.showToast(msg[this.currentLang] || msg.hi);
        
        // Small delay for user to read
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    showEnableInstructions() {
        const hi = this.currentLang === 'hi';
        alert(hi
            ? '🔔 नोटिफिकेशन बंद हैं!\n\nकृपया ब्राउज़र सेटिंग्स में जाकर Quick Dukan के लिए Notifications Allow करें।'
            : '🔔 Notifications blocked!\n\nPlease go to browser settings and Allow notifications for Quick Dukan.'
        );
    }
    
    // ============================================
    // 25+ CREATIVE NOTIFICATIONS
    // ============================================
    getNotificationPool() {
        const hi = this.currentLang === 'hi';
        
        // All notifications with categories
        const pool = [
            // === FUNNY (6) ===
            {
                category: 'funny',
                title: hi ? '🤔 भाभी ने क्या मँगाया?' : '🤔 What did Bhabhi order?',
                body: hi ? 'पता लगाओ! शायद कुछ मीठा... या मिर्ची? 🌶️🍬 जल्दी Check करो!' : 'Find out! Maybe something sweet... or spicy? 🌶️🍬 Check now!',
                icon: '🤔', tag: 'bhabhi'
            },
            {
                category: 'funny',
                title: hi ? '😱 पापा आ रहे हैं!' : '😱 Dad is coming!',
                body: hi ? 'जल्दी से फ्रिज भर दो! नहीं तो डाँट पड़ेगी! 🏃‍♂️💨 अभी ऑर्डर करो।' : 'Quick! Fill the fridge before he arrives! 🏃‍♂️💨 Order now.',
                icon: '😱', tag: 'papa'
            },
            {
                category: 'funny',
                title: hi ? '🍕 पिज़्ज़ा vs दाल-चावल' : '🍕 Pizza vs Dal-Chawal',
                body: hi ? 'आज कौन जीतेगा? वोट करो! वैसे भी दाल-चावल सेहत के लिए अच्छा है... 😜' : 'Who will win today? Vote now! Btw dal-chawal is healthier... 😜',
                icon: '🍕', tag: 'pizza'
            },
            {
                category: 'funny',
                title: hi ? '🫣 मम्मी का फेवरेट सामान खत्म!' : '🫣 Mom\'s favorite item finished!',
                body: hi ? 'पकड़े जाने से पहले ऑर्डर कर दो! वरना सीधा डाँट! 😅' : 'Order before you get caught! Or face the music! 😅',
                icon: '🫣', tag: 'mummy'
            },
            {
                category: 'funny',
                title: hi ? '🧐 पड़ोस वाली आंटी ने देखा?' : '🧐 Did neighbor aunty see?',
                body: hi ? 'उन्होंने कहा- "बेटा, तुम्हारे घर चीनी खत्म है!" अब तो ऑर्डर करना पड़ेगा! 😂' : 'She said- "Beta, your sugar is finished!" Now you HAVE to order! 😂',
                icon: '🧐', tag: 'aunty'
            },
            {
                category: 'funny',
                title: hi ? '🐶 कुत्ते ने रोटी माँगी!' : '🐶 Dog asked for roti!',
                body: hi ? 'आटा खत्म है! बेचारे कुत्ते के लिए भी कुछ ऑर्डर कर दो। 🐕❤️' : 'Flour is finished! Order some for the poor dog too. 🐕❤️',
                icon: '🐶', tag: 'dog'
            },
            
            // === FRIENDS (5) ===
            {
                category: 'friends',
                title: hi ? '🥤 दोस्त के साथ पेप्सी पीनी है?' : '🥤 Pepsi with friends?',
                body: hi ? 'दोस्त बुलाओ, पेप्सी हम भिजवा देंगे! 🧊🍿 पार्टी का सामान एक साथ ऑर्डर करो!' : 'Call your friends, we\'ll send the Pepsi! 🧊🍿 Order party items together!',
                icon: '🥤', tag: 'pepsi'
            },
            {
                category: 'friends',
                title: hi ? '🎮 गेम नाइट प्लान?' : '🎮 Game Night Plan?',
                body: hi ? 'चिप्स-कोल्ड ड्रिंक के बिना गेमिंग अधूरी है! 🎮🍿 सब कुछ मँगा लो।' : 'Gaming is incomplete without chips & cold drinks! 🎮🍿 Order everything.',
                icon: '🎮', tag: 'game'
            },
            {
                category: 'friends',
                title: hi ? '🏏 क्रिकेट मैच देख रहे हो?' : '🏏 Watching Cricket Match?',
                body: hi ? 'मैच का मज़ा स्नैक्स के साथ दोगुना! 🏏🍪 जल्दी ऑर्डर करो।' : 'Match is twice the fun with snacks! 🏏🍪 Order quickly.',
                icon: '🏏', tag: 'cricket'
            },
            {
                category: 'friends',
                title: hi ? '🎉 दोस्त की सरप्राइज़ पार्टी?' : '🎉 Surprise Party for Friend?',
                body: hi ? 'केक, चिप्स, ड्रिंक्स... सब कुछ यहाँ मिलेगा! 🎂🎈 अभी ऑर्डर करो।' : 'Cake, chips, drinks... everything here! 🎂🎈 Order now.',
                icon: '🎉', tag: 'party'
            },
            {
                category: 'friends',
                title: hi ? '☕ चाय पर चर्चा?' : '☕ Chai pe Charcha?',
                body: hi ? 'दोस्तों के साथ चाय की चुस्की... कुछ बिस्किट भी मँगा लो! ☕🍪' : 'Tea with friends... order some biscuits too! ☕🍪',
                icon: '☕', tag: 'chai'
            },
            
            // === EMOTIONAL (5) ===
            {
                category: 'emotional',
                title: hi ? '❤️ माँ को याद किया?' : '❤️ Remembered Mom?',
                body: hi ? 'उनकी पसंद की चाय या मसाला मँगाओ, फिर call करके बताओ। ❤️☕' : 'Order her favorite tea or spice, then call and tell her. ❤️☕',
                icon: '❤️', tag: 'maa'
            },
            {
                category: 'emotional',
                title: hi ? '👴 दादाजी का सामान?' : '👴 Grandfather\'s items?',
                body: hi ? 'उनका फेवरेट सामान मँगा दो। बूढ़ों की दुआ बहुत काम आती है। 🙏❤️' : 'Order their favorite things. Elders\' blessings are priceless. 🙏❤️',
                icon: '👴', tag: 'dada'
            },
            {
                category: 'emotional',
                title: hi ? '🤱 बीवी ने कुछ कहा क्या?' : '🤱 Did Wife Say Something?',
                body: hi ? 'सुन लो वरना "तुम्हें कुछ याद नहीं रहता!" सुनने को मिलेगा। 😅💕' : 'Listen now or hear "You never remember anything!" later. 😅💕',
                icon: '🤱', tag: 'wife'
            },
            {
                category: 'emotional',
                title: hi ? '👶 बच्चे का टिफ़िन?' : '👶 Kid\'s Tiffin?',
                body: hi ? 'कल के लिए कुछ अच्छा मँगा दो। बच्चे की smile priceless है! 🥰' : 'Order something nice for tomorrow. Kid\'s smile is priceless! 🥰',
                icon: '👶', tag: 'bachha'
            },
            {
                category: 'emotional',
                title: hi ? '🏠 घर की रौनक' : '🏠 Home Sweet Home',
                body: hi ? 'अच्छे खाने से घर की रौनक बढ़ती है। कुछ अच्छा मँगाओ आज! 🏠❤️' : 'Good food brightens the home. Order something nice today! 🏠❤️',
                icon: '🏠', tag: 'ghar'
            },
            
            // === PYAR/MOHABBAT (5) ===
            {
                category: 'love',
                title: hi ? '💕 क्रश के लिए कुछ खास?' : '💕 Something Special for Crush?',
                body: hi ? 'चॉकलेट, केक, या कुछ मीठा... इशारा समझो! 😍🍫' : 'Chocolate, cake, or something sweet... take the hint! 😍🍫',
                icon: '💕', tag: 'crush'
            },
            {
                category: 'love',
                title: hi ? '🌹 आज रोमांटिक डिनर?' : '🌹 Romantic Dinner Tonight?',
                body: hi ? 'पनीर, क्रीम, मसाले... सब मँगा लो, फिर candle light dinner! 🕯️❤️' : 'Paneer, cream, spices... order everything for a candle light dinner! 🕯️❤️',
                icon: '🌹', tag: 'romantic'
            },
            {
                category: 'love',
                title: hi ? '💌 पति/पत्नी के लिए सरप्राइज?' : '💌 Surprise for Spouse?',
                body: hi ? 'उनकी पसंद का कुछ मँगाओ, फिर देखो कितना प्यार मिलता है! 💑🎁' : 'Order what they love, then see how much love you get! 💑🎁',
                icon: '💌', tag: 'spouse'
            },
            {
                category: 'love',
                title: hi ? '🍫 चॉकलेट डे तो नहीं?' : '🍫 Is it Chocolate Day?',
                body: hi ? 'नहीं भी है तो क्या? चॉकलेट तो रोज़ खानी चाहिए! 🍫😋' : 'Even if it\'s not, chocolate should be eaten daily! 🍫😋',
                icon: '🍫', tag: 'chocolate'
            },
            {
                category: 'love',
                title: hi ? '💝 प्यार का इज़हार' : '💝 Express Your Love',
                body: hi ? 'खाने से अच्छा इज़हार और क्या होगा? कुछ मीठा ऑर्डर करो! 💝🍰' : 'What better way to express love than food? Order something sweet! 💝🍰',
                icon: '💝', tag: 'izhaar'
            },
            
            // === HELPFUL (5) ===
            {
                category: 'helpful',
                title: hi ? '🛒 कल का सामान भूल तो नहीं गए?' : '🛒 Forgot Tomorrow\'s Items?',
                body: hi ? 'सुबह की चाय से लेकर रात के खाने तक... अभी लिस्ट चेक कर लो! 📋' : 'From morning tea to dinner... check your list now! 📋',
                icon: '🛒', tag: 'forgot'
            },
            {
                category: 'helpful',
                title: hi ? '📦 स्टॉक चेक कर लो!' : '📦 Check Your Stock!',
                body: hi ? 'दाल, चावल, आटा... कहीं कुछ खत्म तो नहीं? जल्दी चेक करो! 🔍' : 'Dal, rice, flour... is anything running out? Check quickly! 🔍',
                icon: '📦', tag: 'stock'
            },
            {
                category: 'helpful',
                title: hi ? '⚠️ राशन खत्म होने वाला है!' : '⚠️ Ration is About to Finish!',
                body: hi ? 'पिछले हफ्ते का ऑर्डर देखकर लगता है आटा-तेल खत्म होने वाला है। 🫣' : 'Looking at last week\'s order, seems flour & oil are about to finish. 🫣',
                icon: '⚠️', tag: 'ration'
            },
            {
                category: 'helpful',
                title: hi ? '🌧️ बारिश में भीगने से बचो!' : '🌧️ Avoid Getting Wet in Rain!',
                body: hi ? 'बाहर बारिश है! घर बैठे सामान मँगाओ। हम पहुँचा देंगे! 🌂🛵' : 'It\'s raining outside! Order from home. We\'ll deliver! 🌂🛵',
                icon: '🌧️', tag: 'rain'
            },
            {
                category: 'helpful',
                title: hi ? '🏪 दुकान जाने की ज़रूरत नहीं!' : '🏪 No Need to Go to Shop!',
                body: hi ? 'हम हैं ना! घर बैठे सब मँगाओ। समय और पैसे दोनों बचाओ! 💰' : 'We\'re here! Order everything from home. Save time & money! 💰',
                icon: '🏪', tag: 'dukan'
            }
        ];
        
        // Filter out recently sent
        const available = pool.filter(n => !this.sentHistory.includes(n.tag));
        
        // If all sent, reset history
        if (available.length === 0) {
            this.sentHistory = [];
            return pool;
        }
        
        return available;
    }
    
    // ============================================
    // SEND A RANDOM NOTIFICATION
    // ============================================
    sendRandomNotification() {
        if (this.permission !== 'granted') return;
        if (document.visibilityState === 'visible' && !this.isPWA) {
            // Don't send if user is actively browsing (website only, PWA always sends)
            this.scheduleNext();
            return;
        }
        
        const pool = this.getNotificationPool();
        if (pool.length === 0) return;
        
        // Pick random
        const notification = pool[Math.floor(Math.random() * pool.length)];
        
        // Send it
        this.sendNotification(notification);
        
        // Track history
        this.sentHistory.push(notification.tag);
        if (this.sentHistory.length > this.MAX_HISTORY) {
            this.sentHistory.shift();
        }
        
        // Schedule next
        this.scheduleNext();
    }
    
    sendNotification(data) {
        const options = {
            body: data.body,
            icon: '/Quick-Dukan/icons/icon-192.png',
            badge: '/Quick-Dukan/icons/icon-72.png',
            tag: data.tag || 'engagement',
            vibrate: [100, 50, 100],
            requireInteraction: false,
            silent: false,
            data: {
                type: 'engagement',
                category: data.category,
                tag: data.tag,
                url: '/Quick-Dukan/'
            },
            actions: [
                {
                    action: 'open',
                    title: this.currentLang === 'hi' ? '🛒 ऑर्डर करें' : '🛒 Order Now'
                },
                {
                    action: 'dismiss',
                    title: this.currentLang === 'hi' ? '👋 बाद में' : '👋 Later'
                }
            ]
        };
        
        try {
            if (this.swRegistration) {
                this.swRegistration.showNotification(data.title, options);
            } else {
                const notif = new Notification(data.title, options);
                notif.onclick = () => {
                    window.focus();
                    notif.close();
                };
            }
            console.log(`💬 Engagement sent: ${data.title}`);
        } catch (e) {
            console.error('❌ Failed to send engagement notification:', e);
        }
    }
    
    sendFirstNotification() {
        const hi = this.currentLang === 'hi';
        const firstMessages = [
            {
                title: hi ? '🎉 वेलकम टू Quick Dukan!' : '🎉 Welcome to Quick Dukan!',
                body: hi ? 'अब से मैं आपको शॉपिंग के मज़ेदार रिमाइंडर भेजूंगा। तैयार रहो! 😄🛒' : 'From now on, I\'ll send you fun shopping reminders. Get ready! 😄🛒',
                tag: 'welcome'
            },
            {
                title: hi ? '🤝 दोस्ती हो गई!' : '🤝 We\'re Friends Now!',
                body: hi ? 'अब मैं आपका शॉपिंग बड्डी हूँ! भूले-भटके रिमाइंडर भेजता रहूँगा। 🛒💕' : 'I\'m your shopping buddy now! I\'ll keep sending reminders. 🛒💕',
                tag: 'welcome'
            }
        ];
        
        const first = firstMessages[Math.floor(Math.random() * firstMessages.length)];
        this.sendNotification(first);
        this.sentHistory.push(first.tag);
    }
    
    // ============================================
    // SCHEDULING
    // ============================================
    scheduleNext() {
        // Clear existing
        if (this.timerInterval) {
            clearTimeout(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Random time between 30-60 minutes
        const delay = this.MIN_INTERVAL + Math.random() * (this.MAX_INTERVAL - this.MIN_INTERVAL);
        const minutes = Math.round(delay / 60000);
        
        console.log(`⏰ Next engagement notification in ~${minutes} minutes`);
        
        this.timerInterval = setTimeout(() => {
            this.sendRandomNotification();
        }, delay);
    }
    
    // ============================================
    // MANUAL TRIGGER
    // ============================================
    sendNow() {
        if (this.permission !== 'granted') {
            this.requestPermission().then(granted => {
                if (granted) {
                    setTimeout(() => this.sendRandomNotification(), 2000);
                }
            });
            return;
        }
        this.sendRandomNotification();
    }
    
    // ============================================
    // STOP
    // ============================================
    stop() {
        if (this.timerInterval) {
            clearTimeout(this.timerInterval);
            this.timerInterval = null;
        }
        console.log('⏸️ Engagement notifications stopped');
    }
    
    // ============================================
    // HELPERS
    // ============================================
    t(key, fallback) {
        return fallback;
    }
    
    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
    
    destroy() {
        this.stop();
    }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.engagementNotifications = new EngagementNotificationManager();
        
        // Auto-request after 30 seconds if not already decided
        setTimeout(() => {
            if (window.engagementNotifications.permission === 'default') {
                console.log('💬 Showing notification permission prompt...');
                // Silent check - don't force
            }
        }, 30000);
    }, 2000);
});