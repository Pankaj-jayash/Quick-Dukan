document.addEventListener('DOMContentLoaded', () => {
    
    const topHeader = document.getElementById('topHeader');
    const headerBrand = document.getElementById('headerBrand');
    const freeDelivery = document.getElementById('freeDelivery');
    const themeToggle = document.getElementById('themeToggle');
    const toggleIcon = document.getElementById('toggleIcon');
    const sparkleContainer = document.getElementById('sparkleContainer');
    
    const searchWrapper = document.getElementById('searchWrapper');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const searchIcon = document.getElementById('searchIcon');
    const voiceIcon = document.getElementById('voiceIcon');
    const suggestionsDropdown = document.getElementById('suggestionsDropdown');
    
    const navItems = document.querySelectorAll('.nav-item');
    const navTop = document.getElementById('navTop');
    
    const quickText = document.getElementById('quickText');
    const dukanText = document.getElementById('dukanText');
    
    let placeholderIndex = 0;
    let placeholderInterval = null;
    let isUserTyping = false;
    let isVoiceListening = false;
    let currentSearchResults = [];
    
    // ========== INIT ==========
    Theme.init();
    UI.setupScrollShadow(topHeader, searchWrapper);
    startPlaceholderCycle();
    checkVoiceSupport();
    initNavbar();
    initCartListener();
    Categories.init();
    Products.init();
    
    function initNavbar() {
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                UI.createNavRipple(e, this);
                this.style.transform = 'scale(0.9)';
                setTimeout(() => { this.style.transform = 'scale(1.05)'; }, 100);
                setTimeout(() => { this.style.transform = 'scale(1)'; }, 250);
            });
        });
        const cart = Cart.getCart();
        UI.updateCartBadge(cart.totalItems);
        if (window.scrollY > 300) navTop.classList.add('visible');
    }
    
    function initCartListener() {
        window.addEventListener('cartUpdated', (e) => {
            UI.updateCartBadge(e.detail.cart.totalItems);
        });
    }
    
    function playBrandAnimation() {
        quickText.style.animation = 'none';
        dukanText.style.animation = 'none';
        dukanText.style.opacity = '0';
        quickText.style.textShadow = '0 2px 8px rgba(0,0,0,0.2)';
        setTimeout(() => { quickText.style.animation = 'quickTypewriter 0.5s steps(5) forwards'; }, 200);
        setTimeout(() => { quickText.style.animation = 'quickTypewriter 0.5s steps(5) forwards, quickFlash 0.6s ease-out'; }, 650);
        setTimeout(() => { dukanText.style.opacity = '1'; dukanText.style.animation = 'dukanSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'; }, 750);
        setTimeout(() => { quickText.style.animation = ''; quickText.style.textShadow = '0 2px 8px rgba(0,0,0,0.2)'; }, 1300);
    }
    
    playBrandAnimation();
    headerBrand.addEventListener('dblclick', () => playBrandAnimation());
    
    headerBrand.addEventListener('click', function(event) {
        UI.createRipple(event, this);
        const brandIcon = this.querySelector('.brand-icon');
        brandIcon.style.animation = 'none'; brandIcon.offsetHeight;
        brandIcon.style.animation = 'cartWiggle 3s ease-in-out infinite';
        brandIcon.style.transform = 'translateY(-6px) scale(1.1)';
        setTimeout(() => { brandIcon.style.transform = 'translateY(0) scale(1)'; brandIcon.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'; }, 120);
        setTimeout(() => { brandIcon.style.transition = ''; }, 520);
        UI.addTextGlow(quickText, 'gold');
        setTimeout(() => { window.location.href = 'index.html'; }, 350);
    });
    
    freeDelivery.addEventListener('click', function(event) {
        UI.createRipple(event, this);
        const truckIcon = this.querySelector('.truck-icon');
        truckIcon.style.animation = 'none'; truckIcon.offsetHeight;
        truckIcon.style.animation = 'truckDrive 0.35s ease-in-out 4';
        setTimeout(() => { truckIcon.style.animation = 'truckDrive 1.8s ease-in-out infinite'; }, 1400);
        const roadLines = this.querySelector('.road-lines');
        roadLines.style.animation = 'none'; roadLines.offsetHeight;
        roadLines.style.animation = 'roadMove 0.18s linear 8';
        setTimeout(() => { roadLines.style.animation = 'roadMove 0.6s linear infinite'; }, 1400);
        UI.addTextGlow(this.querySelector('.free-text'), 'green');
        UI.createSparkles(sparkleContainer);
        this.style.transform = 'rotate(4deg)';
        setTimeout(() => { this.style.transform = 'rotate(-4deg)'; }, 100);
        setTimeout(() => { this.style.transform = 'rotate(3deg)'; }, 200);
        setTimeout(() => { this.style.transform = 'rotate(-2deg)'; }, 300);
        setTimeout(() => { this.style.transform = 'rotate(1deg)'; }, 400);
        setTimeout(() => { this.style.transform = 'rotate(0deg)'; }, 500);
    });
    
    themeToggle.addEventListener('click', function(event) {
        UI.createRing(this);
        this.style.transform = 'scale(0.8)';
        setTimeout(() => { this.style.transform = 'scale(1.15)'; }, 120);
        setTimeout(() => { this.style.transform = 'scale(1)'; }, 350);
        toggleIcon.classList.add('flipping');
        setTimeout(() => { Theme.toggle(); }, 250);
        setTimeout(() => { toggleIcon.classList.remove('flipping'); }, 500);
        UI.createStars(this);
    });
    
    function startPlaceholderCycle() {
        if (placeholderInterval) clearInterval(placeholderInterval);
        placeholderInterval = setInterval(() => {
            if (!isUserTyping && document.activeElement !== searchInput) changePlaceholder();
        }, CONFIG.search.placeholderCycleInterval);
    }
    
    function stopPlaceholderCycle() { if (placeholderInterval) { clearInterval(placeholderInterval); placeholderInterval = null; } }
    
    function changePlaceholder() {
        placeholderIndex = (placeholderIndex + 1) % CONFIG.placeholders.length;
        searchInput.style.transition = 'none'; searchInput.style.transform = 'translateY(6px)'; searchInput.style.opacity = '0';
        setTimeout(() => {
            searchInput.placeholder = CONFIG.placeholders[placeholderIndex];
            searchInput.style.transition = 'all 0.4s ease'; searchInput.style.transform = 'translateY(0)'; searchInput.style.opacity = '1';
        }, 150);
    }
    
    searchInput.addEventListener('focus', () => {
        isUserTyping = true; stopPlaceholderCycle(); searchInput.placeholder = '';
        if (searchInput.value.length >= CONFIG.search.minCharsToSearch) performSearch(searchInput.value);
    });
    
    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (searchInput.value.trim() === '') {
                isUserTyping = false; searchInput.placeholder = CONFIG.placeholders[placeholderIndex];
                startPlaceholderCycle(); closeSuggestions();
            }
        }, 200);
    });
    
    searchInput.addEventListener('input', UI.debounce(() => {
        const query = searchInput.value.trim();
        if (query.length >= CONFIG.search.minCharsToSearch) performSearch(query);
        else closeSuggestions();
    }, CONFIG.search.debounceDelay));
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); executeSearch(searchInput.value.trim()); }
        if (e.key === 'Escape') { searchInput.blur(); closeSuggestions(); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); navigateSuggestions(e.key); }
    });
    
    searchIcon.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query.length >= CONFIG.search.minCharsToSearch) {
            searchIcon.style.transform = 'scale(0.85)';
            setTimeout(() => { searchIcon.style.transform = 'scale(1.2)'; }, 100);
            setTimeout(() => { searchIcon.style.transform = 'scale(1)'; }, 250);
            executeSearch(query);
        } else { searchInput.focus(); }
    });
    
    // ========== REAL SEARCH ==========
    function performSearch(query) {
        currentSearchResults = Search.searchProducts(query);
        renderSuggestions(currentSearchResults, query);
    }
    
    function executeSearch(query) {
        if (query.length < CONFIG.search.minCharsToSearch) return;
        if (currentSearchResults.length > 0) {
            const products = currentSearchResults;
            const grid = document.getElementById('productsGrid');
            const section = document.getElementById('mostOrderedSection');
            const catBack = document.getElementById('categoryBack');
            const catTitle = document.getElementById('categoryTitle');
            const catSection = document.getElementById('categoryProductsSection');
            
            if (section) section.style.display = 'block';
            if (catBack) catBack.style.display = 'none';
            if (catTitle) { catTitle.style.display = 'block'; catTitle.textContent = `🔍 Search results for "${query}" (${products.length})`; }
            if (catSection) catSection.style.display = 'none';
            
            Products.renderProductCards(products, 'productsGrid');
        }
        closeSuggestions();
    }
    
    function renderSuggestions(results, query) {
        if (!results || results.length === 0) {
            suggestionsDropdown.innerHTML = `<div class="suggestions-header"><span>🔍 No results for "${query}"</span><span class="suggestions-close" onclick="document.getElementById('suggestionsDropdown').classList.remove('active')">✕</span></div><div style="padding:24px;text-align:center;"><span style="font-size:40px;">📦</span><p style="margin:10px 0;font-weight:600;">"${query}" abhi available nahi hai</p><p style="font-size:12px;">⚡ Hum jald hi add karenge!</p></div>`;
            suggestionsDropdown.classList.add('active');
            return;
        }
        let html = `<div class="suggestions-header"><span>🔍 Results for "${query}" (${results.length})</span><span class="suggestions-close" onclick="document.getElementById('suggestionsDropdown').classList.remove('active')">✕</span></div>`;
        results.forEach((item, index) => {
            const icon = item.icon || '📦';
            html += `<div class="suggestion-item" data-index="${index}" onclick="selectSuggestionFromSearch('${item.id}')"><span style="font-size:28px;">${icon}</span><div class="suggestion-info"><div class="suggestion-name">${item.name}</div><div class="suggestion-meta">${item.weight || ''} · ⭐${item.rating || 'N/A'}</div></div><div class="suggestion-price">₹${item.price}</div></div>`;
        });
        html += `<div class="suggestions-footer" onclick="executeSearch('${query}')">📋 View all results →</div>`;
        suggestionsDropdown.innerHTML = html;
        suggestionsDropdown.classList.add('active');
    }
    
    function closeSuggestions() { suggestionsDropdown.classList.remove('active'); }
    
    window.selectSuggestionFromSearch = function(id) {
        closeSuggestions();
        searchInput.blur();
        window.location.href = `product.html?id=${id}`;
    };
    
    function navigateSuggestions(direction) {
        const items = suggestionsDropdown.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        const currentActive = suggestionsDropdown.querySelector('.suggestion-item.active');
        let nextIndex = 0;
        if (currentActive) { currentActive.classList.remove('active'); const ci = parseInt(currentActive.dataset.index); nextIndex = direction === 'ArrowDown' ? (ci + 1) % items.length : (ci - 1 + items.length) % items.length; }
        else if (direction === 'ArrowDown') nextIndex = 0; else nextIndex = items.length - 1;
        items[nextIndex].classList.add('active');
    }
    
    document.addEventListener('click', (e) => { if (!searchContainer.contains(e.target) && !suggestionsDropdown.contains(e.target)) closeSuggestions(); });
    
    function checkVoiceSupport() { if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) voiceIcon.style.display = 'none'; }
    
    voiceIcon.addEventListener('click', () => {
        if (isVoiceListening) { stopVoiceSearch(); return; }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Voice search not supported.'); return; }
        startVoiceSearch(SpeechRecognition);
    });
    
    function startVoiceSearch(SpeechRecognition) {
        isVoiceListening = true; voiceIcon.classList.add('listening'); UI.createVoiceRing(voiceIcon);
        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN'; recognition.interimResults = false; recognition.maxAlternatives = 1;
        recognition.start();
        recognition.onresult = (event) => { searchInput.value = event.results[0][0].transcript; searchInput.focus(); performSearch(event.results[0][0].transcript); stopVoiceSearch(); };
        recognition.onerror = () => stopVoiceSearch();
        recognition.onend = () => stopVoiceSearch();
    }
    
    function stopVoiceSearch() { isVoiceListening = false; voiceIcon.classList.remove('listening'); }
    
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement !== searchInput)) { e.preventDefault(); searchInput.focus(); }
        if (e.key === 'Escape') { searchInput.blur(); closeSuggestions(); }
    });
    
    console.log('✅ Quick Dukan — All Systems Ready');
});