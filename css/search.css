'use strict';

// ============================================
// SEARCH.JS - Live Search (FULL FIXED)
// Search Icon = Dropdown Only | Enter = Scroll
// ============================================

class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchIcon = document.getElementById('searchIcon');
        this.voiceBtn = document.getElementById('voiceSearchBtn');
        this.searchResults = document.getElementById('searchResults');
        this.noResults = document.getElementById('noResults');
        this.suggestedProducts = document.getElementById('suggestedProducts');
        
        this.placeholderIndex = 0;
        this.placeholderInterval = null;
        this.debounceTimer = null;
        this.isDropdownOpen = false;
        this.isListening = false;
        this.recognition = null;
        
        // Search history
        this.searchHistory = [];
        this.maxHistory = 8;
        
        this.init();
    }
    
    init() {
        // Load search history
        this.loadHistory();
        
        // Rotating placeholder
        this.startPlaceholderRotation();
        
        // 🔧 Live search on every keystroke
        this.searchInput.addEventListener('input', () => {
            this.handleInput();
        });
        
        // 🔧 Focus → show history + trending
        this.searchInput.addEventListener('focus', () => {
            this.isDropdownOpen = true;
            this.stopPlaceholderRotation();
            this.showIdleState();
        });
        
        // 🔧 Blur → close dropdown after delay
        this.searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (!document.activeElement?.closest('.search-section')) {
                    this.isDropdownOpen = false;
                    this.clearDropdown();
                    this.startPlaceholderRotation();
                }
            }, 250);
        });
        
        // 🔧 Search icon click → dropdown only, NO scroll
        this.searchIcon.addEventListener('click', (e) => {
            e.preventDefault();
            this.addRipple(e);
            this.performSearch(false);
        });
        
        // 🔧 Enter key → dropdown + scroll to products
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch(true);
            }
        });
        
        // Voice search button
        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => this.toggleVoiceSearch());
        }
        this.initVoiceRecognition();
        
        // Language change
        document.addEventListener('languageChanged', () => {
            this.updatePlaceholder();
        });
        
        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-section')) {
                this.clearDropdown();
            }
        });
        
        // Add ripple keyframe if not exists
        if (!document.getElementById('search-ripple-style')) {
            const style = document.createElement('style');
            style.id = 'search-ripple-style';
            style.textContent = `
                @keyframes btnRipple { to { transform: scale(3); opacity: 0; } }
                .search-result-item { transition: transform 0.1s ease, background 0.15s ease; }
                .highlight { background: rgba(46,125,50,0.18); color: #2E7D32; font-weight:700; padding:0 2px; border-radius:2px; }
            `;
            document.head.appendChild(style);
        }
    }
    
    // ============================================
    // PLACEHOLDER ROTATION
    // ============================================
    startPlaceholderRotation() {
        if (this.placeholderInterval) clearInterval(this.placeholderInterval);
        
        const lang = window.languageManager?.currentLang || 'hi';
        const texts = CONFIG?.searchPlaceholderTexts?.[lang] || [
            'आज क्या चाहिए? 😋', 'कुछ ढूंढो...'
        ];
        
        this.placeholderIndex = 0;
        this.searchInput.placeholder = texts[0];
        
        this.placeholderInterval = setInterval(() => {
            this.placeholderIndex = (this.placeholderIndex + 1) % texts.length;
            this.searchInput.placeholder = texts[this.placeholderIndex];
        }, 3000);
    }
    
    stopPlaceholderRotation() {
        if (this.placeholderInterval) {
            clearInterval(this.placeholderInterval);
            this.placeholderInterval = null;
        }
    }
    
    updatePlaceholder() {
        const lang = window.languageManager?.currentLang || 'hi';
        const texts = CONFIG?.searchPlaceholderTexts?.[lang] || ['Search...'];
        this.searchInput.placeholder = texts[this.placeholderIndex % texts.length];
    }
    
    // ============================================
    // IDLE STATE (History + Trending)
    // ============================================
    showIdleState() {
        const lang = window.languageManager?.currentLang || 'hi';
        let html = '';
        
        // Search History
        if (this.searchHistory.length > 0) {
            html += `<div class="search-history">`;
            html += `<div class="search-history-header">`;
            html += `<span class="search-history-title">${lang === 'hi' ? 'हाल की खोज' : 'Recent Searches'}</span>`;
            html += `<button class="search-history-clear">${lang === 'hi' ? 'साफ करें' : 'Clear'}</button>`;
            html += `</div>`;
            
            this.searchHistory.forEach((item, i) => {
                html += `
                    <div class="search-history-item" data-index="${i}">
                        <span class="history-icon">🕐</span>
                        <span class="history-text">${this.escapeHtml(item)}</span>
                        <span class="history-delete" data-index="${i}">✕</span>
                    </div>`;
            });
            html += `</div>`;
        }
        
        // Trending
        html += `<div class="trending-searches">`;
        html += `<div class="trending-searches-title">${lang === 'hi' ? 'ट्रेंडिंग 🔥' : 'Trending 🔥'}</div>`;
        html += `<div class="trending-tags">`;
        
        const trending = this.getTrendingSearches();
        trending.forEach(tag => {
            html += `<span class="trending-tag">${this.escapeHtml(tag)}</span>`;
        });
        html += `</div></div>`;
        
        this.searchResults.innerHTML = html;
        this.noResults.classList.add('hidden');
        this.attachIdleEvents();
    }
    
    attachIdleEvents() {
        // Clear history
        const clearBtn = this.searchResults.querySelector('.search-history-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearHistory());
        }
        
        // History item click
        this.searchResults.querySelectorAll('.search-history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('history-delete')) return;
                const text = item.querySelector('.history-text').textContent;
                this.searchInput.value = text;
                this.performSearch(false);
            });
        });
        
        // History delete
        this.searchResults.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                this.removeHistoryItem(index);
                this.showIdleState();
            });
        });
        
        // Trending tags
        this.searchResults.querySelectorAll('.trending-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                this.searchInput.value = tag.textContent;
                this.performSearch(false);
            });
        });
    }
    
    getTrendingSearches() {
        const lang = window.languageManager?.currentLang || 'hi';
        if (window.dataLoader?.mostOrderedProducts?.length > 0) {
            return window.dataLoader.mostOrderedProducts
                .slice(0, 6)
                .map(p => p.name?.[lang] || p.name?.hi || p.name?.en || '')
                .filter(Boolean);
        }
        return lang === 'hi' 
            ? ['चावल', 'आटा', 'चीनी', 'दूध', 'तेल', 'दाल']
            : ['Rice', 'Flour', 'Sugar', 'Milk', 'Oil', 'Dal'];
    }
    
    // ============================================
    // HANDLE INPUT - Live Search
    // ============================================
    handleInput() {
        const query = this.searchInput.value.trim();
        
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        
        if (query.length === 0) {
            this.showIdleState();
            return;
        }
        
        // Save to history as user types
        this.addToHistory(query);
        
        // Live search after 150ms
        this.debounceTimer = setTimeout(() => {
            this.performLiveSearch(query);
        }, 150);
    }
    
    performLiveSearch(query) {
        if (!window.dataLoader?.isLoaded) {
            this.showMessage('⏳ लोड हो रहा है...');
            return;
        }
        
        if (query.length < 1) {
            this.clearDropdown();
            return;
        }
        
        // Deep search in all data
        let results = this.deepSearch(query);
        
        if (results.length > 0) {
            this.showResults(results, query);
        } else {
            // Try fuzzy search
            if (window.dataLoader.fuzzySearch) {
                results = window.dataLoader.fuzzySearch(query);
                if (results.length > 0) {
                    this.showResults(results, query, true);
                    return;
                }
            }
            this.showNoResults(query);
        }
    }
    
    // ============================================
    // DEEP SEARCH - Naam, Category, Unit, Price
    // ============================================
    deepSearch(query) {
        const q = query.toLowerCase().trim();
        const products = window.dataLoader.allProducts || [];
        
        return products.filter(product => {
            // Hindi name
            if ((product.name?.hi || '').toLowerCase().includes(q)) return true;
            // English name
            if ((product.name?.en || '').toLowerCase().includes(q)) return true;
            // Category Hindi
            if ((product.categoryNameHi || '').toLowerCase().includes(q)) return true;
            // Category English
            if ((product.categoryName || '').toLowerCase().includes(q)) return true;
            // Unit Hindi
            if ((product.unit?.hi || '').toLowerCase().includes(q)) return true;
            // Unit English
            if ((product.unit?.en || '').toLowerCase().includes(q)) return true;
            // Price
            if (product.price && product.price.toString().includes(q)) return true;
            
            return false;
        });
    }
    
    // ============================================
    // PERFORM SEARCH
    // 🔧 scrollToResults = false → dropdown only
    // 🔧 scrollToResults = true  → dropdown + scroll
    // ============================================
    performSearch(scrollToResults = false) {
        const query = this.searchInput.value.trim();
        if (!query) return;
        
        // Save to history
        this.addToHistory(query);
        
        // Live search in dropdown
        this.performLiveSearch(query);
        
        // Only scroll down if Enter key pressed
        if (scrollToResults) {
            const allProductsSection = document.getElementById('allProductsSection');
            if (allProductsSection) {
                setTimeout(() => {
                    allProductsSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 150);
            }
        }
    }
    
    // ============================================
    // SHOW RESULTS
    // ============================================
    showResults(results, query, isFuzzy = false) {
        const lang = window.languageManager?.currentLang || 'hi';
        let html = '';
        
        // Fuzzy indicator
        if (isFuzzy) {
            html += `<div style="padding:8px 16px;font-size:11px;color:var(--text-light);border-bottom:1px solid rgba(0,0,0,0.04);">
                🔍 ${lang === 'hi' ? 'क्या आप ये ढूंढ रहे थे?' : 'Did you mean?'}
            </div>`;
        }
        
        results.slice(0, 12).forEach(product => {
            const name = product.name?.[lang] || product.name?.hi || product.name?.en || '';
            const unit = product.unit?.[lang] || product.unit?.hi || product.unit?.en || '';
            const price = product.price || 0;
            const image = product.image || 'https://via.placeholder.com/60';
            
            const highlightedName = this.highlightText(name, query);
            
            html += `
                <div class="search-result-item" data-product-id="${product.id || ''}">
                    <img src="${image}" alt="${this.escapeHtml(name)}" 
                         onerror="this.src='https://via.placeholder.com/60?text=N/A'" loading="lazy">
                    <div class="search-result-info">
                        <div class="search-result-name">${highlightedName}</div>
                        ${unit ? `<div class="search-result-unit">${this.escapeHtml(unit)}</div>` : ''}
                    </div>
                    <div class="search-result-price">₹${price}</div>
                </div>`;
        });
        
        this.searchResults.innerHTML = html;
        this.noResults.classList.add('hidden');
        
        // Click events on results
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('mousedown', () => item.style.transform = 'scale(0.97)');
            item.addEventListener('mouseup', () => item.style.transform = '');
            item.addEventListener('mouseleave', () => item.style.transform = '');
            
            item.addEventListener('click', () => {
                const productId = item.getAttribute('data-product-id');
                const product = window.dataLoader?.getProductById?.(productId);
                if (product) {
                    this.addToRecentlyViewed(product);
                    const pName = product.name?.[lang] || product.name?.hi || '';
                    this.searchInput.value = pName;
                    this.clearDropdown();
                    this.searchInput.blur();
                    this.startPlaceholderRotation();
                }
            });
        });
    }
    
    // ============================================
    // SHOW NO RESULTS
    // ============================================
    showNoResults(query) {
        const lang = window.languageManager?.currentLang || 'hi';
        
        const msgEl = this.noResults.querySelector('.no-results-msg');
        if (msgEl) {
            msgEl.textContent = lang === 'hi' 
                ? `"${query}" नहीं मिला। ये ट्राई करें:`
                : `"${query}" not found. Try these:`;
        }
        
        this.searchResults.innerHTML = '';
        this.noResults.classList.remove('hidden');
        
        // Show random suggestions
        const suggested = window.dataLoader?.getRandomProducts?.(5) || [];
        const container = this.noResults.querySelector('.suggested-products');
        
        if (container && suggested.length > 0) {
            container.innerHTML = '';
            suggested.forEach(product => {
                const name = product.name?.[lang] || product.name?.hi || '';
                const price = product.price || 0;
                const image = product.image || 'https://via.placeholder.com/60';
                
                const card = document.createElement('div');
                card.className = 'product-card';
                card.style.cssText = 'width:110px;flex-shrink:0;cursor:pointer;';
                card.innerHTML = `
                    <div class="product-card-image" style="aspect-ratio:1/1;background:#f5f5f5;">
                        <img src="${image}" alt="${this.escapeHtml(name)}" 
                             onerror="this.src='https://via.placeholder.com/60?text=N/A'" loading="lazy"
                             style="width:100%;height:100%;object-fit:cover;">
                    </div>
                    <div class="product-card-info" style="padding:6px 8px;">
                        <div style="font-size:10px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</div>
                        <div style="font-size:11px;font-weight:700;color:var(--primary);">₹${price}</div>
                    </div>`;
                
                card.addEventListener('click', () => {
                    this.addToRecentlyViewed(product);
                    this.searchInput.value = name;
                    this.noResults.classList.add('hidden');
                });
                
                container.appendChild(card);
            });
        }
    }
    
    // ============================================
    // VOICE SEARCH
    // ============================================
    initVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            if (this.voiceBtn) this.voiceBtn.style.display = 'none';
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.lang = (window.languageManager?.currentLang === 'en') ? 'en-IN' : 'hi-IN';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        
        this.recognition.addEventListener('result', (e) => {
            const transcript = e.results[0][0].transcript;
            this.searchInput.value = transcript;
            this.performSearch(false);
            this.stopListening();
        });
        
        this.recognition.addEventListener('error', () => this.stopListening());
        this.recognition.addEventListener('end', () => this.stopListening());
    }
    
    toggleVoiceSearch() {
        this.isListening ? this.stopListening() : this.startListening();
    }
    
    startListening() {
        if (!this.recognition) return;
        try {
            this.recognition.start();
            this.isListening = true;
            if (this.voiceBtn) {
                this.voiceBtn.classList.add('listening');
                this.voiceBtn.querySelector('span').textContent = '🎙️';
            }
        } catch (e) {}
    }
    
    stopListening() {
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }
        this.isListening = false;
        if (this.voiceBtn) {
            this.voiceBtn.classList.remove('listening');
            this.voiceBtn.querySelector('span').textContent = '🎤';
        }
    }
    
    // ============================================
    // HISTORY MANAGEMENT
    // ============================================
    loadHistory() {
        try {
            const saved = localStorage.getItem('quick-dukan-search-history');
            this.searchHistory = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.searchHistory = [];
        }
    }
    
    saveHistory() {
        try {
            localStorage.setItem('quick-dukan-search-history', JSON.stringify(this.searchHistory));
        } catch (e) {}
    }
    
    addToHistory(query) {
        if (!query || query.length < 2) return;
        this.searchHistory = this.searchHistory.filter(h => h.toLowerCase() !== query.toLowerCase());
        this.searchHistory.unshift(query);
        if (this.searchHistory.length > this.maxHistory) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistory);
        }
        this.saveHistory();
    }
    
    removeHistoryItem(index) {
        this.searchHistory.splice(index, 1);
        this.saveHistory();
    }
    
    clearHistory() {
        this.searchHistory = [];
        this.saveHistory();
        this.showIdleState();
    }
    
    // ============================================
    // HELPERS
    // ============================================
    clearDropdown() {
        this.searchResults.innerHTML = '';
        this.noResults.classList.add('hidden');
    }
    
    showMessage(msg) {
        this.searchResults.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-light);font-size:14px;">${msg}</div>`;
        this.noResults.classList.add('hidden');
    }
    
    highlightText(text, query) {
        if (!query) return this.escapeHtml(text);
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return this.escapeHtml(text).replace(regex, '<span class="highlight">$1</span>');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    addToRecentlyViewed(product) {
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.addProduct(product);
        }
    }
    
    addRipple(event) {
        const btn = event.currentTarget;
        const existing = btn.querySelector('.btn-ripple');
        if (existing) existing.remove();
        
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
            position:absolute; width:${size}px; height:${size}px;
            left:${event.clientX - rect.left - size/2}px;
            top:${event.clientY - rect.top - size/2}px;
            border-radius:50%; background:rgba(255,255,255,0.4);
            animation:btnRipple 0.5s ease-out; pointer-events:none;
        `;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});