

// ========== RECENTLY VIEWED ==========

const Recent = {
    async render() {
        const section = document.getElementById('recentlySection');
        const container = document.getElementById('recentScroll');
        
        if (!section || !container) return;
        
        const recentProducts = Storage.getRecent();
        
        if (recentProducts.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        // Check if category is selected
        if (Categories.currentCategory) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = recentProducts.map(p => ProductLoader.renderCompactCard(p)).join('');
    },
    
    async add(product) {
        Storage.addToRecent(product);
        await this.render();
    }
};