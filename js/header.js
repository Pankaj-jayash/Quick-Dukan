document.addEventListener('DOMContentLoaded', function() {
    
    var topHeader = document.getElementById('topHeader');
    var headerBrand = document.getElementById('headerBrand');
    var freeDelivery = document.getElementById('freeDelivery');
    var themeToggle = document.getElementById('themeToggle');
    var toggleIcon = document.getElementById('toggleIcon');
    var sparkleContainer = document.getElementById('sparkleContainer');
    
    var searchWrapper = document.getElementById('searchWrapper');
    var searchContainer = document.getElementById('searchContainer');
    var searchInput = document.getElementById('searchInput');
    var searchIcon = document.getElementById('searchIcon');
    var voiceIcon = document.getElementById('voiceIcon');
    var suggestionsDropdown = document.getElementById('suggestionsDropdown');
    
    var navItems = document.querySelectorAll('.nav-item');
    var navTop = document.getElementById('navTop');
    
    var quickText = document.getElementById('quickText');
    var dukanText = document.getElementById('dukanText');
    
    var placeholderIndex = 0;
    var placeholderInterval = null;
    var isUserTyping = false;
    var isVoiceListening = false;
    var currentSearchResults = [];
    
    // ========== INIT ==========
    if (typeof Theme !== 'undefined') Theme.init();
    if (typeof UI !== 'undefined') UI.setupScrollShadow(topHeader, searchWrapper);
    startPlaceholderCycle();
    checkVoiceSupport();
    initNavbar();
    initCartListener();
    
    if (typeof Categories !== 'undefined') Categories.init();
    if (typeof Products !== 'undefined') Products.init();
    
    function initNavbar() {
        var items = document.querySelectorAll('.nav-item');
        for (var i = 0; i < items.length; i++) {
            (function(item) {
                item.addEventListener('click', function(e) {
                    if (typeof UI !== 'undefined') UI.createNavRipple(e, item);
                    item.style.transform = 'scale(0.9)';
                    setTimeout(function() { item.style.transform = 'scale(1.05)'; }, 100);
                    setTimeout(function() { item.style.transform = 'scale(1)'; }, 250);
                });
            })(items[i]);
        }
        
        if (typeof Cart !== 'undefined') {
            var cart = Cart.getCart();
            if (typeof UI !== 'undefined') UI.updateCartBadge(cart.totalItems);
        }
        
        if (window.scrollY > 300 && navTop) navTop.classList.add('visible');
    }
    
    function initCartListener() {
        window.addEventListener('cartUpdated', function(e) {
            if (typeof UI !== 'undefined') UI.updateCartBadge(e.detail.cart.totalItems);
        });
    }
    
    function playBrandAnimation() {
        if (!quickText || !dukanText) return;
        quickText.style.animation = 'none';
        dukanText.style.animation = 'none';
        dukanText.style.opacity = '0';
        quickText.style.textShadow = '0 2px 8px rgba(0,0,0,0.2)';
        setTimeout(function() { quickText.style.animation = 'quickTypewriter 0.5s steps(5) forwards'; }, 200);
        setTimeout(function() { quickText.style.animation = 'quickTypewriter 0.5s steps(5) forwards, quickFlash 0.6s ease-out'; }, 650);
        setTimeout(function() { dukanText.style.opacity = '1'; dukanText.style.animation = 'dukanSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'; }, 750);
        setTimeout(function() { quickText.style.animation = ''; quickText.style.textShadow = '0 2px 8px rgba(0,0,0,0.2)'; }, 1300);
    }
    
    if (quickText && dukanText) playBrandAnimation();
    
    if (headerBrand) {
        headerBrand.addEventListener('dblclick', function() { playBrandAnimation(); });
        headerBrand.addEventListener('click', function(event) {
            if (typeof UI !== 'undefined') UI.createRipple(event, this);
            var brandIcon = this.querySelector('.brand-icon');
            if (brandIcon) {
                brandIcon.style.animation = 'none'; brandIcon.offsetHeight;
                brandIcon.style.animation = 'cartWiggle 3s ease-in-out infinite';
                brandIcon.style.transform = 'translateY(-6px) scale(1.1)';
                setTimeout(function() { brandIcon.style.transform = 'translateY(0) scale(1)'; brandIcon.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'; }, 120);
                setTimeout(function() { brandIcon.style.transition = ''; }, 520);
            }
            if (quickText && typeof UI !== 'undefined') UI.addTextGlow(quickText, 'gold');
            setTimeout(function() { window.location.href = 'index.html'; }, 350);
        });
    }
    
    if (freeDelivery) {
        freeDelivery.addEventListener('click', function(event) {
            if (typeof UI !== 'undefined') UI.createRipple(event, this);
            var truckIcon = this.querySelector('.truck-icon');
            if (truckIcon) {
                truckIcon.style.animation = 'none'; truckIcon.offsetHeight;
                truckIcon.style.animation = 'truckDrive 0.35s ease-in-out 4';
                setTimeout(function() { truckIcon.style.animation = 'truckDrive 1.8s ease-in-out infinite'; }, 1400);
            }
            var roadLines = this.querySelector('.road-lines');
            if (roadLines) {
                roadLines.style.animation = 'none'; roadLines.offsetHeight;
                roadLines.style.animation = 'roadMove 0.18s linear 8';
                setTimeout(function() { roadLines.style.animation = 'roadMove 0.6s linear infinite'; }, 1400);
            }
            var freeText = this.querySelector('.free-text');
            if (freeText && typeof UI !== 'undefined') UI.addTextGlow(freeText, 'green');
            if (sparkleContainer && typeof UI !== 'undefined') UI.createSparkles(sparkleContainer);
            this.style.transform = 'rotate(4deg)';
            setTimeout(function() { freeDelivery.style.transform = 'rotate(-4deg)'; }, 100);
            setTimeout(function() { freeDelivery.style.transform = 'rotate(3deg)'; }, 200);
            setTimeout(function() { freeDelivery.style.transform = 'rotate(-2deg)'; }, 300);
            setTimeout(function() { freeDelivery.style.transform = 'rotate(1deg)'; }, 400);
            setTimeout(function() { freeDelivery.style.transform = 'rotate(0deg)'; }, 500);
        });
    }
    
    if (themeToggle && toggleIcon) {
        themeToggle.addEventListener('click', function(event) {
            if (typeof UI !== 'undefined') UI.createRing(this);
            this.style.transform = 'scale(0.8)';
            setTimeout(function() { themeToggle.style.transform = 'scale(1.15)'; }, 120);
            setTimeout(function() { themeToggle.style.transform = 'scale(1)'; }, 350);
            toggleIcon.classList.add('flipping');
            setTimeout(function() { 
                if (typeof Theme !== 'undefined') Theme.toggle();
                else {
                    document.body.classList.toggle('dark-mode');
                    toggleIcon.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
                }
            }, 250);
            setTimeout(function() { toggleIcon.classList.remove('flipping'); }, 500);
            if (typeof UI !== 'undefined') UI.createStars(this);
        });
    }
    
    function startPlaceholderCycle() {
        if (!searchInput) return;
        if (placeholderInterval) clearInterval(placeholderInterval);
        placeholderInterval = setInterval(function() {
            if (!isUserTyping && document.activeElement !== searchInput) changePlaceholder();
        }, CONFIG.search.placeholderCycleInterval);
    }
    
    function stopPlaceholderCycle() { if (placeholderInterval) { clearInterval(placeholderInterval); placeholderInterval = null; } }
    
    function changePlaceholder() {
        if (!searchInput) return;
        placeholderIndex = (placeholderIndex + 1) % CONFIG.placeholders.length;
        searchInput.style.transition = 'none'; searchInput.style.transform = 'translateY(6px)'; searchInput.style.opacity = '0';
        setTimeout(function() {
            searchInput.placeholder = CONFIG.placeholders[placeholderIndex];
            searchInput.style.transition = 'all 0.4s ease'; searchInput.style.transform = 'translateY(0)'; searchInput.style.opacity = '1';
        }, 150);
    }
    
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            isUserTyping = true; stopPlaceholderCycle(); searchInput.placeholder = '';
            if (searchInput.value.length >= CONFIG.search.minCharsToSearch) performSearch(searchInput.value);
        });
        
        searchInput.addEventListener('blur', function() {
            setTimeout(function() {
                if (searchInput.value.trim() === '') {
                    isUserTyping = false; searchInput.placeholder = CONFIG.placeholders[placeholderIndex];
                    startPlaceholderCycle(); closeSuggestions();
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
    
    if (searchIcon) {
        searchIcon.addEventListener('click', function() {
            var query = searchInput ? searchInput.value.trim() : '';
            if (query.length >= CONFIG.search.minCharsToSearch) {
                searchIcon.style.transform = 'scale(0.85)';
                setTimeout(function() { searchIcon.style.transform = 'scale(1.2)'; }, 100);
                setTimeout(function() { searchIcon.style.transform = 'scale(1)'; }, 250);
                executeSearch(query);
            } else if (searchInput) { searchInput.focus(); }
        });
    }
    
    function performSearch(query) {
        if (typeof Search !== 'undefined') {
            currentSearchResults = Search.searchProducts(query);
        } else if (typeof Products !== 'undefined') {
            currentSearchResults = Products.searchProducts(query);
        } else {
            currentSearchResults = [];
        }
        renderSuggestions(currentSearchResults, query);
    }
    
    function executeSearch(query) {
        if (query.length < CONFIG.search.minCharsToSearch) return;
        closeSuggestions();
        if (currentSearchResults.length > 0) {
            var section = document.getElementById('mostOrderedSection');
            if (section) section.style.display = 'block';
            if (typeof Products !== 'undefined') Products.renderProductCards(currentSearchResults, 'productsGrid');
        }
    }
    
    function renderSuggestions(results, query) {
        if (!suggestionsDropdown) return;
        if (!results || results.length === 0) {
            suggestionsDropdown.innerHTML = '<div class="suggestions-header"><span>🔍 No results</span><span class="suggestions-close" onclick="document.getElementById(\'suggestionsDropdown\').classList.remove(\'active\')">✕</span></div><div style="padding:24px;text-align:center;"><span style="font-size:40px;">📦</span><p>Not available</p></div>';
            suggestionsDropdown.classList.add('active');
            return;
        }
        var html = '<div class="suggestions-header"><span>🔍 Results (' + results.length + ')</span><span class="suggestions-close" onclick="document.getElementById(\'suggestionsDropdown\').classList.remove(\'active\')">✕</span></div>';
        for (var i = 0; i < results.length; i++) {
            var item = results[i];
            html += '<div class="suggestion-item" onclick="window.location.href=\'product.html?id=' + item.id + '\'"><span style="font-size:28px;">' + (item.icon || '📦') + '</span><div class="suggestion-info"><div class="suggestion-name">' + item.name + '</div><div class="suggestion-meta">' + (item.weight || '') + ' · ⭐' + (item.rating || 'N/A') + '</div></div><div class="suggestion-price">₹' + item.price + '</div></div>';
        }
        suggestionsDropdown.innerHTML = html;
        suggestionsDropdown.classList.add('active');
    }
    
    function closeSuggestions() { if (suggestionsDropdown) suggestionsDropdown.classList.remove('active'); currentSearchResults = []; }
    
    document.addEventListener('click', function(e) { if (searchContainer && suggestionsDropdown && !searchContainer.contains(e.target) && !suggestionsDropdown.contains(e.target)) closeSuggestions(); });
    
    function checkVoiceSupport() { if (voiceIcon && !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) voiceIcon.style.display = 'none'; }
    
    if (voiceIcon) {
        voiceIcon.addEventListener('click', function() {
            if (isVoiceListening) { stopVoiceSearch(); return; }
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) { alert('Voice search not supported.'); return; }
            startVoiceSearch(SpeechRecognition);
        });
    }
    
    function startVoiceSearch(SpeechRecognition) {
        isVoiceListening = true; if (voiceIcon) { voiceIcon.classList.add('listening'); if (typeof UI !== 'undefined') UI.createVoiceRing(voiceIcon); }
        var recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN'; recognition.interimResults = false; recognition.maxAlternatives = 1;
        recognition.start();
        recognition.onresult = function(event) { if (searchInput) { searchInput.value = event.results[0][0].transcript; searchInput.focus(); performSearch(event.results[0][0].transcript); } stopVoiceSearch(); };
        recognition.onerror = function() { stopVoiceSearch(); };
        recognition.onend = function() { stopVoiceSearch(); };
    }
    
    function stopVoiceSearch() { isVoiceListening = false; if (voiceIcon) voiceIcon.classList.remove('listening'); }
    
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement !== searchInput)) { e.preventDefault(); if (searchInput) searchInput.focus(); }
        if (e.key === 'Escape') { if (searchInput) searchInput.blur(); closeSuggestions(); }
    });
    
    console.log('✅ Quick Dukan — All Systems Ready (v2)');
});