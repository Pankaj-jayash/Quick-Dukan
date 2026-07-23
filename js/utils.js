// ========== UTILITY FUNCTIONS ==========

const Utils = {
    formatPrice(price) {
        return '₹' + Number(price).toLocaleString('en-IN');
    },
    
    calculateDiscount(mrp, price) {
        if (!mrp || mrp <= price) return 0;
        return Math.round(((mrp - price) / mrp) * 100);
    },
    
    calculateSaveAmount(mrp, price) {
        return mrp - price;
    },
    
    generateOrderRef() {
        const now = new Date();
        return 'QD' +
            now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
    },
    
    getCurrentDateTime() {
        const now = new Date();
        return now.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    truncateText(text, maxLength = 30) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    
    debounce(func, delay = 300) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    // Fuzzy search - Levenshtein distance
    levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b[i - 1] === a[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    },
    
    fuzzyMatch(query, text) {
        query = query.toLowerCase().trim();
        const name = text.toLowerCase().trim();
        
        if (!query || !name) return { match: false, score: 0 };
        
        // Exact match
        if (name === query) return { match: true, score: 100 };
        
        // Contains
        if (name.includes(query)) return { match: true, score: 90 };
        
        // Word by word
        const words = name.split(/\s+/);
        for (const word of words) {
            if (word === query) return { match: true, score: 85 };
            if (word.includes(query)) return { match: true, score: 80 };
        }
        
        // Character sequence
        let qi = 0;
        for (let i = 0; i < name.length && qi < query.length; i++) {
            if (query[qi] === name[i]) qi++;
        }
        if (qi === query.length) return { match: true, score: 70 };
        
        // Levenshtein on full name
        const fullDist = this.levenshteinDistance(query, name);
        if (fullDist <= 2) return { match: true, score: Math.max(0, 65 - fullDist * 15) };
        
        // Levenshtein on individual words
        for (const word of words) {
            if (word.length < 3) continue;
            const wordDist = this.levenshteinDistance(query, word);
            if (wordDist <= 2) return { match: true, score: Math.max(0, 55 - wordDist * 15) };
        }
        
        return { match: false, score: 0 };
    },
    
    // Get user location
    async getUserLocation() {
        // Try GPS first
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        maximumAge: 300000
                    });
                });
                return {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    source: 'gps'
                };
            } catch (e) {
                // GPS failed, try IP
            }
        }
        
        // Try IP address
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return {
                city: data.city,
                region: data.region,
                pincode: data.postal,
                country: data.country_name,
                source: 'ip'
            };
        } catch (e) {
            return {
                city: CONFIG.store.city,
                region: CONFIG.store.state,
                pincode: CONFIG.store.pincode,
                source: 'default'
            };
        }
    },
    
    // Play success sound
    playSuccessSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            
            const notes = [800, 1000, 1200];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';
                
                const startTime = audioCtx.currentTime + i * 0.15;
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
                
                osc.start(startTime);
                osc.stop(startTime + 0.3);
            });
        } catch (e) {
            // Audio not supported
        }
    }
};