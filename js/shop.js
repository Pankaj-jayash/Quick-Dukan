
// ========== SHOP PAGE INIT ==========

document.addEventListener('DOMContentLoaded', async () => {
    // Init theme
    Theme.init();
    
    // Setup UI
    UI.setupHeaderScroll();
    UI.setupSearchSticky();
    UI.setupBackToTop();
    UI.setupNavNavigation();
    UI.setActiveNav('shop');
    UI.updateCartBadge();
    UI.setupPopupClose('productPopupOverlay', '.product-popup');
    UI.setupPopupClose('checkoutPopupOverlay', '.checkout-popup');
    UI.setupPopupClose('successPopupOverlay', '.success-popup');
    UI.setupPopupClose('ordersPopupOverlay', '.orders-popup');
    
    // Init search
    Search.init();
    
    // Load all products
    const allProducts = await ProductLoader.loadAllProducts();
    window._allProducts = allProducts;
    
    // Load categories for filter
    const categories = await ProductLoader.loadCategoriesList();
    const filterCategories = document.getElementById('filterCategories');
    if (filterCategories) {
        filterCategories.innerHTML = categories.map(cat => `
            <label class="filter-category-item">
                <input type="checkbox" value="${cat.id}" checked onchange="applyFilters()">
                ${cat.icon} ${cat.name}
                <span class="count">(${cat.totalProducts})</span>
            </label>
        `).join('');
    }
    
    // Render all products
    renderShopProducts(allProducts);
    
    // Sort change
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
    
    // Price range
    const priceRange = document.getElementById('priceRange');
    const maxPriceLabel = document.getElementById('maxPriceLabel');
    if (priceRange && maxPriceLabel) {
        priceRange.addEventListener('input', () => {
            maxPriceLabel.textContent = Utils.formatPrice(priceRange.value);
            applyFilters();
        });
    }
    
    // Filter reset
    const filterReset = document.getElementById('filterReset');
    if (filterReset) {
        filterReset.addEventListener('click', () => {
            document.querySelectorAll('.filter-category-item input').forEach(cb => cb.checked = true);
            if (priceRange) priceRange.value = priceRange.max;
            if (maxPriceLabel) maxPriceLabel.textContent = Utils.formatPrice(priceRange.max);
            if (sortSelect) sortSelect.value = 'popular';
            applyFilters();
        });
    }
    
    // Mobile filter toggle
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const filterCloseMobile = document.getElementById('filterCloseMobile');
    
    if (filterToggle && filterSidebar) {
        filterToggle.addEventListener('click', () => {
            filterSidebar.classList.add('open');
        });
    }
    if (filterCloseMobile && filterSidebar) {
        filterCloseMobile.addEventListener('click', () => {
            filterSidebar.classList.remove('open');
        });
    }
    
    // Header brand click
    const headerBrand = document.getElementById('headerBrand');
    if (headerBrand) {
        headerBrand.addEventListener('click', function(e) {
            UI.createRipple(e, this);
            window.location.href = 'index.html';
        });
    }
    
    // Product popup close
    const productPopupClose = document.getElementById('productPopupClose');
    if (productPopupClose) {
        productPopupClose.addEventListener('click', () => UI.hidePopup('productPopupOverlay'));
    }
    
    // Checkout popup close
    const checkoutPopupClose = document.getElementById('checkoutPopupClose');
    if (checkoutPopupClose) {
        checkoutPopupClose.addEventListener('click', () => UI.hidePopup('checkoutPopupOverlay'));
    }
    
    // Success popup
    const successPopupClose = document.getElementById('successPopupClose');
    if (successPopupClose) {
        successPopupClose.addEventListener('click', () => UI.hidePopup('successPopupOverlay'));
    }
    
    const viewOrdersBtn = document.getElementById('viewMyOrdersBtn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', () => {
            UI.hidePopup('successPopupOverlay');
            UI.showPopup('ordersPopupOverlay');
            if (typeof loadMyOrders === 'function') loadMyOrders();
        });
    }
    
    const backHomeBtn = document.getElementById('backToHomeBtn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', () => UI.hidePopup('successPopupOverlay'));
    }
    
    // Orders popup close
    const ordersPopupClose = document.getElementById('ordersPopupClose');
    if (ordersPopupClose) {
        ordersPopupClose.addEventListener('click', () => UI.hidePopup('ordersPopupOverlay'));
    }
});

function applyFilters() {
    if (!window._allProducts) return;
    
    // Get selected categories
    const selectedCats = Array.from(
        document.querySelectorAll('.filter-category-item input:checked')
    ).map(cb => cb.value);
    
    // Get price range
    const priceRange = document.getElementById('priceRange');
    const maxPrice = priceRange ? parseInt(priceRange.value) : 1000;
    
    // Get sort
    const sortSelect = document.getElementById('sortSelect');
    const sortBy = sortSelect ? sortSelect.value : 'popular';
    
    // Filter
    let filtered = window._allProducts.filter(p => {
        if (!selectedCats.includes(p.category)) return false;
        if (p.price > maxPrice) return false;
        return true;
    });
    
    // Sort
    switch(sortBy) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default: // popular
            filtered.sort((a, b) => (b.mostOrdered ? 1 : 0) - (a.mostOrdered ? 1 : 0));
            break;
    }
    
    renderShopProducts(filtered);
}

function renderShopProducts(products) {
    const grid = document.getElementById('shopProductGrid');
    const empty = document.getElementById('shopEmpty');
    
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
    } else {
        if (empty) empty.style.display = 'none';
        grid.innerHTML = products.map(p => ProductLoader.renderProductCard(p)).join('');
    }
}
