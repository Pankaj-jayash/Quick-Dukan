const UI = {
    createRipple(event, element) {
        const ripple = document.createElement('span');
        ripple.classList.add('header-ripple');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        element.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    },
    createNavRipple(event, element) {
        const container = element.querySelector('.nav-ripple-container');
        if (!container) return;
        const ripple = document.createElement('span');
        ripple.classList.add('nav-ripple');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        container.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    },
    addTextGlow(element, type) {
        if (type === 'gold') element.style.animation = 'textGlowGold 0.5s ease-out';
        else if (type === 'green') element.style.animation = 'textGlowGreen 0.5s ease-out';
        setTimeout(() => { element.style.animation = ''; }, 500);
    },
    createSparkles(container) {
        const sparkles = ['✨', '⭐', '💫', '⚡', '🌟', '✨', '💥', '🔥'];
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('span');
            sparkle.classList.add('sparkle-particle');
            sparkle.textContent = sparkles[i];
            sparkle.style.left = '50%'; sparkle.style.top = '50%';
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 35 + Math.random() * 25;
            sparkle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            sparkle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
            container.appendChild(sparkle);
            sparkle.addEventListener('animationend', () => sparkle.remove());
        }
    },
    createCartSparkles() {
        const container = document.getElementById('cartSparkles');
        if (!container) return;
        const sparkles = ['✨', '💖', '⭐', '💫', '✨', '💝'];
        for (let i = 0; i < 6; i++) {
            const sparkle = document.createElement('span');
            sparkle.classList.add('cart-sparkle');
            sparkle.textContent = sparkles[i];
            const angle = (Math.PI * 2 * i) / 6;
            const distance = 20 + Math.random() * 15;
            sparkle.style.setProperty('--cx', Math.cos(angle) * distance + 'px');
            sparkle.style.setProperty('--cy', Math.sin(angle) * distance + 'px');
            container.appendChild(sparkle);
            sparkle.addEventListener('animationend', () => sparkle.remove());
        }
    },
    createTopSparkles() {
        const container = document.getElementById('topSparkles');
        if (!container) return;
        const sparkles = ['✨', '⬆️', '💫', '⭐', '✨', '⚡'];
        for (let i = 0; i < 6; i++) {
            const sparkle = document.createElement('span');
            sparkle.classList.add('top-sparkle');
            sparkle.textContent = sparkles[i];
            const angle = (Math.PI * 2 * i) / 6;
            const distance = 18 + Math.random() * 12;
            sparkle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            sparkle.style.setProperty('--ty', Math.sin(angle) * distance - 20 + 'px');
            container.appendChild(sparkle);
            sparkle.addEventListener('animationend', () => sparkle.remove());
        }
    },
    createStars(element) {
        const stars = ['⭐', '✨', '🌟', '💫', '⭐', '✨'];
        for (let i = 0; i < 6; i++) {
            const star = document.createElement('span');
            star.classList.add('star-particle');
            star.textContent = stars[i];
            star.style.left = '50%'; star.style.top = '50%';
            const angle = (Math.PI * 2 * i) / 6;
            const distance = 30 + Math.random() * 20;
            star.style.setProperty('--sx', Math.cos(angle) * distance + 'px');
            star.style.setProperty('--sy', Math.sin(angle) * distance + 'px');
            element.appendChild(star);
            star.addEventListener('animationend', () => star.remove());
        }
    },
    createRing(element) {
        const ring = document.createElement('span');
        ring.classList.add('toggle-ring');
        element.appendChild(ring);
        ring.addEventListener('animationend', () => ring.remove());
    },
    createVoiceRing(element) {
        const ring = document.createElement('span');
        ring.classList.add('voice-ring');
        ring.style.top = '50%'; ring.style.left = '50%';
        ring.style.transform = 'translate(-50%, -50%)';
        element.appendChild(ring);
        ring.addEventListener('animationend', () => ring.remove());
    },
    setupScrollShadow(headerElement, searchWrapper) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                headerElement.classList.add('scrolled');
                if (searchWrapper) searchWrapper.classList.add('scrolled');
            } else {
                headerElement.classList.remove('scrolled');
                if (searchWrapper) searchWrapper.classList.remove('scrolled');
            }
            const navTop = document.getElementById('navTop');
            if (navTop) {
                if (window.scrollY > 300) navTop.classList.add('visible');
                else navTop.classList.remove('visible');
            }
        });
    },
    updateCartBadge(count) {
        const badge = document.getElementById('cartBadge');
        const cartButton = document.querySelector('.nav-cart');
        if (!badge || !cartButton) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.add('visible');
            badge.classList.remove('bouncing');
            void badge.offsetWidth;
            badge.classList.add('bouncing');
            cartButton.classList.remove('shaking');
            void cartButton.offsetWidth;
            cartButton.classList.add('shaking');
            UI.createCartSparkles();
        } else {
            badge.classList.remove('visible');
            badge.textContent = '0';
        }
    },
    showCartToast(productName) {
        const toast = document.getElementById('cartToast');
        const toastProduct = document.getElementById('toastProduct');
        if (!toast || !toastProduct) return;
        toastProduct.textContent = productName;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, CONFIG.features.toastDuration);
    },
    showLoading() {
        const loader = document.getElementById('productsLoading');
        if (loader) loader.classList.remove('hidden');
    },
    hideLoading() {
        const loader = document.getElementById('productsLoading');
        if (loader) loader.classList.add('hidden');
    },
    // Recently Viewed
    addToRecentlyViewed(product) {
        let recent = JSON.parse(localStorage.getItem('quickdukan_recent') || '[]');
        recent = recent.filter(p => p.id !== product.id);
        recent.unshift({ id: product.id, name: product.name, price: product.price, image: product.image, icon: product.icon });
        recent = recent.slice(0, CONFIG.features.recentlyViewedLimit);
        localStorage.setItem('quickdukan_recent', JSON.stringify(recent));
        this.renderRecentlyViewed();
    },
    renderRecentlyViewed() {
        const section = document.getElementById('recentlyViewedSection');
        const container = document.getElementById('recentlyGrid');
        if (!section || !container) return;
        const recent = JSON.parse(localStorage.getItem('quickdukan_recent') || '[]');
        if (recent.length === 0) { section.classList.remove('visible'); return; }
        section.classList.add('visible');
        container.innerHTML = recent.map(p => `
            <div class="recently-card" onclick="window.location.href='product.html?id=${p.id}'">
                <div class="recently-card-image">${p.icon || '📦'}</div>
                <div class="recently-card-name">${p.name}</div>
                <div class="recently-card-price">₹${p.price}</div>
            </div>
        `).join('');
    },
    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }
};
console.log('✅ Quick Dukan — UI Helpers Loaded');