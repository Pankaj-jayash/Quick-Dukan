'use strict';

// ============================================
// SEARCH.JS - Complete Smart Search (ALL 20 FEATURES)
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
        this.searchHistory = [];
        this.maxHistory = 8;
        this.isListening = false;
        this.recognition = null;
        this.currentQuery = '';
        
        this.init();
    }
    
    init() {
        this.loadHistory();
        this.startPlaceholderRotation();
        this.initVoiceRecognition();
        
        // Input events
        this.searchInput.addEventListener('input', () => this.handleInput());
        this.searchInput.addEventListener('focus', () => this.handleFocus());
        this.searchInput.addEventListener('blur', () => this.handleBlur());
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
                this.searchInput.blur();
            }
        });
        
        // Search icon with ripple
        this.searchIcon.addEventListener('click', (e) => {
            this.addRipple(e);
            this.performSearch();
        });
        
        // Voice search
        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => this.toggleVoiceSearch());
        }
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-section')) {
                this.closeDropdown();
            }
        });
        
        // Language change
        document.addEventListener('languageChanged', () => this.updatePlaceholder());
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
                this.searchInput.blur();
            }
        });
    }
    
    // ============================================
    // PLACEHOLDER ROTATION
    // ============================================
    startPlaceholderRotation() {
        if (this.placeholderInterval) clearInterval(this.placeholderInterval);
        const texts = this.getPlaceholderTexts();
        this.placeholderIndex = 0;
        this.searchInput.placeholder = texts[0];
        
        this.placeholderInterval = setInterval(() => {
            this.placeholderIndex = (this.placeholderIndex + 1) % texts.length;
            this.searchInput.placeholder = texts[this.placeholderIndex];
        }, 3000);
    }
    
    getPlaceholderTexts() {
        const lang = window.languageManager?.currentLang || 'hi';
        if (window.CONFIG?.searchPlaceholderTexts?.[lang]) {
            return window.CONFIG.searchPlaceholderTexts[lang];
        }
        return lang === 'hi' 
            ? ['आज क्या चाहिए? 😋', 'चावल, आटा, तेल...', 'नाम लिखो और पाओ! 🔍', 'कुछ भी ढूंढो...']
            : ['What do you need? 😋', 'Rice, flour, oil...', 'Type and find! 🔍', 'Search anything...'];
    }
    
    stopPlaceholderRotation() {
        if (this.placeholderInterval) {
            clearInterval(this.placeholderInterval);
            this.placeholderInterval = null;
        }
    }
    
    updatePlaceholder() {
        const texts = this.getPlaceholderTexts();
        this.searchInput.placeholder = texts[this.placeholderIndex % texts.length];
    }
    
    // ============================================
    // FOCUS / BLUR
    // ============================================
    handleFocus() {
        this.stopPlaceholderRotation();
        this.searchInput.placeholder = '';
        
        if (this.searchInput.value.trim() === '') {
            this.showIdleState();
        }
    }
    
    handleBlur() {
        setTimeout(() => {
            if (!document.activeElement?.closest('.search-section')) {
                this.closeDropdown();
                this.startPlaceholderRotation();
                this.updatePlaceholder();
            }
        }, 200);
    }
    
    closeDropdown() {
        this.isDropdownOpen = false;
        this.searchResults.innerHTML = '';
        this.searchResults.classList.add('hidden');
        this.noResults.classList.add('hidden');
    }
    
    // ============================================
    // IDLE STATE (History + Trending + Location)
    // ============================================
    showIdleState() {
        this.isDropdownOpen = true;
        let html = '';
        
        // Location suggestion
        const locationSuggestion = this.getLocationSuggestion();
        if (locationSuggestion) {
            html += `<div class="trending-section">
                <div class="search-history-header">
                    <span class="search-history-title">📍 आपके आस-पास</span>
                </div>
                <div class="trending-tags">
                    <span class="trending-tag popular">${this.escapeHtml(locationSuggestion)}</span>
                </div>
            </div>`;
        }
        
        // Search History
        if (this.searchHistory.length > 0) {
            const now = Date.now();
            html += '<div class="search-history">';
            html += '<div class="search-history-header">';
            html += '<span class="search-history-title">🕐 हाल की खोज</span>';
            html += '<button class="search-history-clear">साफ करें</button>';
            html += '</div>';
            
            this.searchHistory.forEach((item, i) => {
                const timeAgo = this.getTimeAgo(item.time || now);
                html += `<div class="search-history-item" data-index="${i}">
                    <span class="history-icon">🕐</span>
                    <span class="history-text">${this.escapeHtml(item.text)}</span>
                    <span class="history-time">${timeAgo}</span>
                    <span class="history-actions">
                        <button class="history-action-btn copy-btn" title="कॉपी करें">📋</button>
                        <button class="history-action-btn share-btn" title="शेयर करें">🔗</button>
                        <button class="history-action-btn delete-btn" title="हटाएं">✕</button>
                    </span>
                </div>`;
            });
            html += '</div>';
        }
        
        // Trending
        html += '<div class="trending-section">';
        html += '<div class="search-history-header">';
        html += '<span class="search-history-title">🔥 ट्रेंडिंग</span>';
        html += '</div>';
        html += '<div class="trending-tags">';
        
        const trending = this.getTrendingSearches();
        trending.forEach((tag, i) => {
            const isPopular = i < 2;
            html += `<span class="trending-tag${isPopular ? ' popular' : ''}">${this.escapeHtml(tag)}</span>`;
        });
        html += '</div></div>';
        
        this.searchResults.innerHTML = html;
        this.searchResults.classList.remove('hidden');
        this.noResults.classList.add('hidden');
        this.attachIdleEvents();
    }
    
    attachIdleEvents() {
        // Clear history
        const clearBtn = this.searchResults.querySelector('.search-history-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearHistory();
                this.showIdleState();
            });
        }
        
        // History item click
        this.searchResults.querySelectorAll('.search-history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                const text = item.querySelector('.history-text').textContent;
                this.searchInput.value = text;
                this.performSearch();
            });
        });
        
        // Copy button
        this.searchResults.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = btn.closest('.search-history-item').querySelector('.history-text').textContent;
                navigator.clipboard?.writeText(text);
                this.showToast('📋 कॉपी किया!');
            });
        });
        
        // Share button
        this.searchResults.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = btn.closest('.search-history-item').querySelector('.history-text').textContent;
                const url = `https://wa.me/?text=${encodeURIComponent('Quick Dukan पर ढूंढें: ' + text)}`;
                window.open(url, '_blank');
            });
        });
        
        // Delete button
        this.searchResults.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.closest('.search-history-item').getAttribute('data-index'));
                this.removeHistoryItem(index);
                this.showIdleState();
            });
        });
        
        // Trending tags
        this.searchResults.querySelectorAll('.trending-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                this.searchInput.value = tag.textContent.replace('🔥', '').trim();
                this.performSearch();
            });
        });
    }
    
    getLocationSuggestion() {
        try {
            const saved = localStorage.getItem('quick-dukan-location');
            if (saved) {
                const loc = JSON.parse(saved);
                return loc.villageCity || '';
            }
        } catch (e) {}
        return '';
    }
    
    getTrendingSearches() {
        const lang = window.languageManager?.currentLang || 'hi';
        if (window.dataLoader?.mostOrderedProducts) {
            return window.dataLoader.mostOrderedProducts
                .slice(0, 6)
                .map(p => lang === 'hi' ? (p.name?.hi || '') : (p.name?.en || ''))
                .filter(Boolean);
        }
        return lang === 'hi' 
            ? ['चावल', 'आटा', 'चीनी', 'दूध', 'तेल', 'दाल']
            : ['Rice', 'Flour', 'Sugar', 'Milk', 'Oil', 'Dal'];
    }
    
    // ============================================
    // HANDLE INPUT (Auto-complete + Live Search)
    // ============================================
    handleInput() {
        const query = this.searchInput.value.trim();
        this.currentQuery = query;
        
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        
        if (query.length === 0) {
            this.showIdleState();
            return;
        }
        
        // Auto-complete suggestion from history
        const historyMatch = this.searchHistory.find(h => 
            h.text.toLowerCase().startsWith(query.toLowerCase()) && 
            h.text.toLowerCase() !== query.toLowerCase()
        );
        
        this.debounceTimer = setTimeout(() => {
            this.performLiveSearch(query);
        }, 200);
    }
    
    performLiveSearch(query) {
        if (!window.dataLoader?.isLoaded) return;
        
        let results = window.dataLoader.searchProducts(query);
        
        if (results.length === 0 && window.CONFIG?.features?.spellCorrection) {
            results = window.dataLoader.fuzzySearch?.(query) || [];
        }
        
        if (results.length > 0) {
            this.showResults(results, query);
            this.noResults.classList.add('hidden');
            this.searchResults.classList.remove('hidden');
        } else {
            this.showNoResults(query);
        }
    }
    
    performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) return;
        
        this.addToHistory(query);
        this.performLiveSearch(query);
    }
    
    // ============================================
    // SHOW RESULTS
    // ============================================
    showResults(results, query = '') {
        let html = '';
        
        results.slice(0, 10).forEach((product, i) => {
            const lang = window.languageManager?.currentLang || 'hi';
            const name = product.name?.[lang] || product.name?.hi || product.name?.en || '';
            const unit = product.unit?.[lang] || product.unit?.hi || product.unit?.en || '';
            const price = product.price || 0;
            const image = product.image || 'https://via.placeholder.com/60';
            const category = product.category || '';
            const isPopular = (window.dataLoader?.mostOrderedProducts || [])
                .slice(0, 3).some(p => p.id === product.id);
            
            html += `
                <div class="search-result-item" data-product-id="${product.id}">
                    <img src="${image}" alt="${this.escapeHtml(name)}" 
                         onerror="this.src='https://via.placeholder.com/60?text=No+Image'" loading="lazy">
                    <div class="search-result-info">
                        <div class="search-result-name">${this.highlightMatch(name, query)}</div>
                        <div class="search-result-meta">
                            ${category ? `<span class="search-result-category">${this.escapeHtml(category)}</span>` : ''}
                            ${unit ? `<span class="search-result-unit">${this.escapeHtml(unit)}</span>` : ''}
                        </div>
                    </div>
                    <div class="search-result-right">
                        <div class="search-result-price">₹${price}</div>
                        ${isPopular ? '<div class="search-result-badge">🔥 लोकप्रिय</div>' : ''}
                    </div>
                </div>`;
        });
        
        this.searchResults.innerHTML = html;
        
        // Click events
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const productId = item.getAttribute('data-product-id');
                this.selectResult(productId);
            });
        });
    }
    
    selectResult(productId) {
        const product = window.dataLoader?.allProducts?.find(p => p.id === productId);
        if (product) {
            const lang = window.languageManager?.currentLang || 'hi';
            const name = product.name?.[lang] || product.name?.hi || '';
            this.searchInput.value = name;
            this.addToRecentlyViewed(product);
            this.closeDropdown();
            this.searchInput.blur();
            this.startPlaceholderRotation();
            this.updatePlaceholder();
        }
    }
    
    highlightMatch(text, query) {
        if (!query) return this.escapeHtml(text);
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return this.escapeHtml(text).replace(regex, '<span class="highlight">$1</span>');
    }
    
    // ============================================
    // NO RESULTS
    // ============================================
    showNoResults(query) {
        this.searchResults.classList.add('hidden');
        this.noResults.classList.remove('hidden');
        
        const msgEl = this.noResults.querySelector('.no-results-msg');
        if (msgEl) {
            const lang = window.languageManager?.currentLang || 'hi';
            msgEl.textContent = lang === 'hi' 
                ? `"${query}" के लिए कुछ नहीं मिला 😕` 
                : `Nothing found for "${query}" 😕`;
        }
        
        const suggested = window.dataLoader?.getRandomProducts?.(5) || [];
        this.suggestedProducts.innerHTML = '';
        
        suggested.forEach(product => {
            const lang = window.languageManager?.currentLang || 'hi';
            const name = product.name?.[lang] || product.name?.hi || '';
            const price = product.price || 0;
            const image = product.image || 'https://via.placeholder.com/60';
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.cssText = 'width:110px;flex-shrink:0;';
            card.innerHTML = `
                <div class="product-card-image">
                    <img src="${image}" alt="${this.escapeHtml(name)}" 
                         onerror="this.src='https://via.placeholder.com/60?text=No+Image'" loading="lazy">
                    <div class="price-overlay" style="font-size:11px;">₹${price}</div>
                </div>
                <div class="product-card-info" style="padding:6px 8px;">
                    <div class="product-name" style="font-size:10px;">${name}</div>
                </div>`;
            
            card.addEventListener('click', () => {
                this.addToRecentlyViewed(product);
                this.noResults.classList.add('hidden');
                this.searchInput.value = name;
            });
            
            this.suggestedProducts.appendChild(card);
        });
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
        this.recognition.lang = 'hi-IN';
        this.recognition.interimResults = false;
        
        this.recognition.addEventListener('result', (e) => {
            const transcript = e.results[0][0].transcript;
            this.searchInput.value = transcript;
            this.performSearch();
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
            this.showToast('🎤 सुन रहा हूँ... बोलो!');
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
        if (!query) return;
        this.searchHistory = this.searchHistory.filter(h => h.text.toLowerCase() !== query.toLowerCase());
        this.searchHistory.unshift({ text: query, time: Date.now() });
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
    }
    
    // ============================================
    // HELPERS
    // ============================================
    addToRecentlyViewed(product) {
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.addProduct(product);
        }
    }
    
    addRipple(event) {
        const btn = event.currentTarget;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
            width:${size}px;height:${size}px;
            left:${event.clientX - rect.left - size/2}px;
            top:${event.clientY - rect.top - size/2}px;
        `;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }
    
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'अभी अभी';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} मिनट पहले`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} घंटे पहले`;
        return `${Math.floor(seconds / 86400)} दिन पहले`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});