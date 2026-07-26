// ============================================
// SEARCH.JS - Search Bar Logic
// ============================================

class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchIcon = document.getElementById('searchIcon');
        this.searchResults = document.getElementById('searchResults');
        this.noResults = document.getElementById('noResults');
        this.suggestedProducts = document.getElementById('suggestedProducts');
        
        this.placeholderIndex = 0;
        this.placeholderInterval = null;
        this.debounceTimer = null;
        this.isSearchOpen = false;
        
        this.init();
    }
    
    init() {
        // Rotating placeholder text
        this.startPlaceholderRotation();
        
        // Search on typing (with debounce)
        this.searchInput.addEventListener('input', () => {
            this.handleSearch();
        });
        
        // Focus event
        this.searchInput.addEventListener('focus', () => {
            this.isSearchOpen = true;
            this.stopPlaceholderRotation();
            this.searchInput.placeholder = '';
            this.searchInput.classList.add('focused');
        });
        
        // Blur event
        this.searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                this.isSearchOpen = false;
                this.searchResults.innerHTML = '';
                this.noResults.classList.add('hidden');
                this.startPlaceholderRotation();
                this.searchInput.classList.remove('focused');
            }, 200);
        });
        
        // Search icon click
        this.searchIcon.addEventListener('click', () => {
            this.performSearch();
            this.searchIcon.classList.add('pop-animation');
            setTimeout(() => this.searchIcon.classList.remove('pop-animation'), 300);
        });
        
        // Enter key
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // Listen for language change
        document.addEventListener('languageChanged', () => {
            this.updatePlaceholder();
        });
    }
    
    startPlaceholderRotation() {
        if (this.placeholderInterval) clearInterval(this.placeholderInterval);
        
        const texts = CONFIG.searchPlaceholderTexts[window.languageManager?.currentLang || 'hi'];
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
        const texts = CONFIG.searchPlaceholderTexts[window.languageManager?.currentLang || 'hi'];
        this.searchInput.placeholder = texts[this.placeholderIndex];
    }
    
    handleSearch() {
        const query = this.searchInput.value.trim();
        
        // Clear previous timer
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        
        // If empty, clear results
        if (query.length === 0) {
            this.searchResults.innerHTML = '';
            this.noResults.classList.add('hidden');
            return;
        }
        
        // Debounce: search after 300ms of no typing
        this.debounceTimer = setTimeout(() => {
            this.performLiveSearch(query);
        }, 300);
    }
    
    performLiveSearch(query) {
        if (!window.dataLoader || !window.dataLoader.isLoaded) return;
        
        // Try exact search first, then fuzzy
        let results = window.dataLoader.searchProducts(query);
        
        if (results.length === 0 && CONFIG.features.spellCorrection) {
            results = window.dataLoader.fuzzySearch(query);
        }
        
        if (results.length > 0) {
            this.showResults(results);
            this.noResults.classList.add('hidden');
        } else {
            this.showNoResults(query);
        }
    }
    
    performSearch() {
        const query = this.searchInput.value.trim();
        if (!query || !window.dataLoader) return;
        
        this.performLiveSearch(query);
        
        // Scroll to all products section and show filtered
        const allProductsSection = document.getElementById('allProductsSection');
        if (allProductsSection) {
            allProductsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    showResults(results) {
        this.searchResults.innerHTML = '';
        
        results.slice(0, 10).forEach(product => {
            const lang = window.languageManager?.currentLang || 'hi';
            const name = product.name ? (product.name[lang] || product.name.hi || product.name.en || '') : '';
            const price = product.price || 0;
            const image = product.image || 'https://via.placeholder.com/60';
            
            const item = document.createElement('div');
            item.className = 'search-result-item fade-in';
            item.innerHTML = `
                <img src="${image}" alt="${name}" onerror="this.src='https://via.placeholder.com/60?text=No+Image'">
                <div class="search-result-info">
                    <div class="search-result-name">${name}</div>
                    <div class="search-result-price">₹${price}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.searchInput.value = name;
                this.searchResults.innerHTML = '';
                this.addToRecentlyViewed(product);
                this.scrollToProduct(product);
            });
            
            this.searchResults.appendChild(item);
        });
    }
    
    showNoResults(query) {
        this.searchResults.innerHTML = '';
        this.noResults.classList.remove('hidden');
        
        // Update message language
        const msgEl = this.noResults.querySelector('.no-results-msg');
        if (msgEl) {
            msgEl.textContent = CONFIG.noProductMessages[window.languageManager?.currentLang || 'hi'];
        }
        
        // Show random suggested products
        const suggested = window.dataLoader.getRandomProducts(5);
        this.suggestedProducts.innerHTML = '';
        
        suggested.forEach(product => {
            const lang = window.languageManager?.currentLang || 'hi';
            const name = product.name ? (product.name[lang] || product.name.hi || '') : '';
            const price = product.price || 0;
            const image = product.image || 'https://via.placeholder.com/60';
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.width = '120px';
            card.style.flexShrink = '0';
            card.innerHTML = `
                <div class="product-card-image">
                    <img src="${image}" alt="${name}" onerror="this.src='https://via.placeholder.com/60?text=No+Image'">
                    <div class="price-overlay">₹${price}</div>
                </div>
                <div class="product-card-info">
                    <div class="product-name">${name}</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.addToRecentlyViewed(product);
                this.searchInput.value = name;
                this.noResults.classList.add('hidden');
            });
            
            this.suggestedProducts.appendChild(card);
        });
    }
    
    addToRecentlyViewed(product) {
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.addProduct(product);
        }
    }
    
    scrollToProduct(product) {
        const allProductsGrid = document.getElementById('allProductsGrid');
        if (allProductsGrid) {
            allProductsGrid.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});

