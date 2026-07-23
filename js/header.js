document.addEventListener('DOMContentLoaded', function() {

    var topHeader = document.getElementById('topHeader');
    var searchWrapper = document.getElementById('searchWrapper');
    var searchInput = document.getElementById('searchInput');
    var suggestionsDropdown = document.getElementById('suggestionsDropdown');
    var searchContainer = document.querySelector('.search-container');

    var placeholderIndex = 0;
    var placeholderInterval = null;
    var isUserTyping = false;
    var currentSearchResults = [];

    // Init
    if (typeof Theme !== 'undefined') Theme.init();
    if (typeof UI !== 'undefined') UI.setupScrollShadow(topHeader, searchWrapper);
    startPlaceholderCycle();

    // Cart badge
    if (typeof Cart !== 'undefined') {
        var cart = Cart.getCart();
        if (typeof UI !== 'undefined') UI.updateCartBadge(cart.totalItems);
        window.addEventListener('cartUpdated', function(e) {
            if (typeof UI !== 'undefined') UI.updateCartBadge(e.detail.cart.totalItems);
        });
    }

    // Theme toggle
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.onclick = function() {
            if (typeof Theme !== 'undefined') Theme.toggle();
        };
    }

    // Nav Top visibility
    var navTop = document.getElementById('navTop');
    if (navTop && window.scrollY > 300) navTop.classList.add('visible');

    // Placeholder cycle
    function startPlaceholderCycle() {
        if (!searchInput) return;
        if (placeholderInterval) clearInterval(placeholderInterval);
        placeholderInterval = setInterval(function() {
            if (!isUserTyping && document.activeElement !== searchInput) changePlaceholder();
        }, CONFIG.search.placeholderCycleInterval);
    }

    function changePlaceholder() {
        if (!searchInput) return;
        placeholderIndex = (placeholderIndex + 1) % CONFIG.placeholders.length;
        searchInput.placeholder = CONFIG.placeholders[placeholderIndex];
    }

    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            isUserTyping = true;
            searchInput.placeholder = '';
        });
        searchInput.addEventListener('blur', function() {
            setTimeout(function() {
                if (searchInput.value.trim() === '') {
                    isUserTyping = false;
                    searchInput.placeholder = CONFIG.placeholders[placeholderIndex];
                    startPlaceholderCycle();
                    closeSuggestions();
                }
            }, 200);
        });
        searchInput.addEventListener('input', UI.debounce(function() {
            var query = searchInput.value.trim();
            if (query.length >= CONFIG.search.minCharsToSearch) performSearch(query);
            else closeSuggestions();
        }, CONFIG.search.debounceDelay));
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); executeSearch(searchInput.value.trim()); }
            if (e.key === 'Escape') { searchInput.blur(); closeSuggestions(); }
        });
    }

    function performSearch(query) {
        if (typeof Search !== 'undefined') currentSearchResults = Search.searchProducts(query);
        else currentSearchResults = [];
        renderSuggestions(currentSearchResults, query);
    }

  function executeSearch(query) {
    if (query.length < CONFIG.search.minCharsToSearch) return;
    closeSuggestions();
    
    if (currentSearchResults.length > 0) {
        showSearchResultsOverlay(currentSearchResults, query);
    } else {
        showSearchEmptyOverlay(query);
    }
}

function showSearchResultsOverlay(results, query) {
    var overlay = document.getElementById('searchResultsOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'searchResultsOverlay';
        overlay.className = 'search-results-overlay';
        overlay.onclick = function(e) { if (e.target === overlay) overlay.classList.remove('active'); };
        document.body.appendChild(overlay);
    }
    
    var gridHTML = results.map(function(p) {
        return createProductCardHTML(p);
    }).join('');
    
    overlay.innerHTML = '<div class="search-results-container">' +
        '<div class="search-results-header"><span>🔍 "' + query + '" ke results (' + results.length + ')</span><button class="search-results-close" onclick="document.getElementById(\'searchResultsOverlay\').classList.remove(\'active\')">✕</button></div>' +
        '<div class="search-results-grid">' + gridHTML + '</div>' +
        '</div>';
    overlay.classList.add('active');
    
    var addBtns = overlay.querySelectorAll('.card-add-btn');
    addBtns.forEach(function(btn) {
        btn.onclick = function(e) {
            e.stopPropagation();
            var id = this.getAttribute('data-product-id');
            var product = results.find(function(p) { return p.id === id; });
            if (product) {
                Cart.addItem(product, 1);
                UI.showCartToast(product.name);
                UI.addToRecentlyViewed(product);
            }
        };
    });
    
    var buyBtns = overlay.querySelectorAll('.card-buy-btn');
    buyBtns.forEach(function(btn) {
        btn.onclick = function(e) {
            e.stopPropagation();
            var id = this.getAttribute('data-product-id');
            var product = results.find(function(p) { return p.id === id; });
            if (product && typeof CheckoutModal !== 'undefined') CheckoutModal.open(product);
        };
    });
}

function showSearchEmptyOverlay(query) {
    var overlay = document.getElementById('searchResultsOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'searchResultsOverlay';
        overlay.className = 'search-results-overlay';
        overlay.onclick = function(e) { if (e.target === overlay) overlay.classList.remove('active'); };
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = '<div class="search-results-container">' +
        '<div class="search-results-header"><span>🔍 "' + query + '" ke results</span><button class="search-results-close" onclick="document.getElementById(\'searchResultsOverlay\').classList.remove(\'active\')">✕</button></div>' +
        '<div class="search-empty">' +
        '<div class="search-empty-icon">📦</div>' +
        '<div class="search-empty-title">"' + query + '" abhi available nahi hai!</div>' +
        '<div class="search-empty-subtitle">Hum jald hi ye product add karenge. 😊</div>' +
        '<button class="search-empty-btn" onclick="document.getElementById(\'searchResultsOverlay\').classList.remove(\'active\');document.getElementById(\'searchInput\').focus();">🔍 Kuch aur search karo</button>' +
        '</div></div>';
    overlay.classList.add('active');
}
    function closeSuggestions() { if (suggestionsDropdown) suggestionsDropdown.classList.remove('active'); }

    document.addEventListener('click', function(e) {
        if (searchContainer && suggestionsDropdown && !searchContainer.contains(e.target) && !suggestionsDropdown.contains(e.target)) closeSuggestions();
    });

    // Init modules
    if (typeof Categories !== 'undefined') Categories.init();
    if (typeof Products !== 'undefined') Products.init();

    console.log('✅ Quick Dukan Ready');
});