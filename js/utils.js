
/* ═══════════════════════════════════════════ */
/* UTILITY FUNCTIONS                          */
/* ═══════════════════════════════════════════ */

const Utils = {
    // Format Indian Rupees
    formatPrice(price) {
        return '₹' + price.toLocaleString('en-IN');
    },
    
    // Calculate discount percentage
    calculateDiscount(mrp, price) {
        if (!mrp || mrp <= price) return 0;
        return Math.round(((mrp - price) / mrp) * 100);
    },
    
    // Generate unique order reference
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
    
    // Get formatted date-time
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
    
    // Truncate text
    truncateText(text, maxLength = 30) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    
    // Debounce function
    debounce(func, delay = 300) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    // Fuzzy search — Levenshtein Distance
    levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
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
    
    // Fuzzy match product name
    fuzzyMatch(query, productName) {
        query = query.toLowerCase().trim();
        const name = productName.toLowerCase().trim();
        
        // Exact match
        if (name === query) return { match: true, score: 100, type: 'exact' };
        
        // Contains match
        if (name.includes(query)) return { match: true, score: 95, type: 'contains' };
        
        // Word-by-word check
        const words = name.split(/\s+/);
        for (const word of words) {
            if (word === query) return { match: true, score: 90, type: 'word-exact' };
            if (word.includes(query)) return { match: true, score: 85, type: 'word-contains' };
        }
        
        // Character sequence match
        let queryIdx = 0;
        for (let i = 0; i < name.length; i++) {
            if (query[queryIdx] === name[i]) queryIdx++;
            if (queryIdx === query.length) return { match: true, score: 75, type: 'sequence' };
        }
        
        // Levenshtein distance (max 2 changes)
        const fullDist = this.levenshteinDistance(query, name);
        if (fullDist <= 2) return { match: true, score: 70 - fullDist * 10, type: 'fuzzy-full' };
        
        // Word-level fuzzy
        for (const word of words) {
            const wordDist = this.levenshteinDistance(query, word);
            if (wordDist <= 2) return { match: true, score: 65 - wordDist * 10, type: 'fuzzy-word' };
        }
        
        return { match: false, score: 0, type: 'none' };
    },
    
    // Detect if voice search is supported
    isVoiceSearchSupported() {
        return 'webkitSpeechRecognition' in window || 
               'SpeechRecognition' in window;
    }
};
