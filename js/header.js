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
        if (currentSearchResults.length > 0 && typeof Products !== 'undefined') {
            document.getElementById('mostOrderedSection').style.display = 'block';
            Products.renderProductCards(currentSearchResults, 'productsGrid');
        }
    }

    function renderSuggestions(results, query) {
        if (!suggestionsDropdown) return;
        if (!results || results.length === 0) {
            suggestionsDropdown.innerHTML = '<div class="suggestions-header">No results</div>';
            suggestionsDropdown.classList.add('active');
            return;
        }
        var html = '<div class="suggestions-header">🔍 ' + results.length + ' results</div>';
        results.forEach(function(item) {
            html += '<div class="suggestion-item" onclick="window.location.href=\'product.html?id=' + item.id + '\'"><span style="font-size:28px;">' + (item.icon||'📦') + '</span><div class="suggestion-info"><div class="suggestion-name">' + item.name + '</div><div class="suggestion-meta">' + (item.weight||'') + '</div></div><div class="suggestion-price">₹' + item.price + '</div></div>';
        });
        suggestionsDropdown.innerHTML = html;
        suggestionsDropdown.classList.add('active');
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