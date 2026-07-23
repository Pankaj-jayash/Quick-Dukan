var UI = {
    createRipple: function(event, element) {
        var ripple = document.createElement('span');
        ripple.className = 'header-ripple';
        var rect = element.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        element.appendChild(ripple);
        ripple.addEventListener('animationend', function() { ripple.remove(); });
    },
    
    showCartToast: function(productName) {
        var toast = document.getElementById('cartToast');
        var toastProduct = document.getElementById('toastProduct');
        if (!toast || !toastProduct) return;
        toastProduct.textContent = productName;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(function() { toast.classList.remove('show'); }, CONFIG.features.toastDuration);
    },
    
    showLoading: function() {
        var loader = document.getElementById('productsLoading');
        if (loader) loader.classList.remove('hidden');
    },
    
    hideLoading: function() {
        var loader = document.getElementById('productsLoading');
        if (loader) loader.classList.add('hidden');
    },
    
    updateCartBadge: function(count) {
        var badge = document.getElementById('cartBadge');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
            badge.textContent = '0';
        }
    },
    
    setupScrollShadow: function(header, search) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 10) {
                if (header) header.classList.add('scrolled');
                if (search) search.classList.add('scrolled');
            } else {
                if (header) header.classList.remove('scrolled');
                if (search) search.classList.remove('scrolled');
            }
            var navTop = document.getElementById('navTop');
            if (navTop) {
                if (window.scrollY > 300) navTop.classList.add('visible');
                else navTop.classList.remove('visible');
            }
        });
    },
    
    addToRecentlyViewed: function(product) {
        var recent = JSON.parse(localStorage.getItem('quickdukan_recent') || '[]');
        recent = recent.filter(function(p) { return p.id !== product.id; });
        recent.unshift({ id: product.id, name: product.name, price: product.price, icon: product.icon || '📦' });
        recent = recent.slice(0, CONFIG.features.recentlyViewedLimit);
        localStorage.setItem('quickdukan_recent', JSON.stringify(recent));
        this.renderRecentlyViewed();
    },
    
    renderRecentlyViewed: function() {
        var section = document.getElementById('recentlyViewedSection');
        var container = document.getElementById('recentlyGrid');
        if (!section || !container) return;
        var recent = JSON.parse(localStorage.getItem('quickdukan_recent') || '[]');
        if (recent.length === 0) { section.style.display = 'none'; return; }
        section.style.display = 'block';
        container.innerHTML = recent.map(function(p) {
            return '<div class="recently-card" onclick="window.location.href=\'product.html?id=' + p.id + '\'"><div class="recently-card-image">' + (p.icon || '📦') + '</div><div class="recently-card-name">' + p.name + '</div><div class="recently-card-price">₹' + p.price + '</div></div>';
        }).join('');
    },
    
    debounce: function(func, delay) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() { func.apply(context, args); }, delay);
        };
    }
};