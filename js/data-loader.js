// ============================================
// DATA-LOADER.JS - Load JSON Data Files
// ============================================

class DataLoader {
    constructor() {
        this.masterData = null;
        this.allProducts = [];
        this.categories = [];
        this.productsByCategory = {};
        this.isLoaded = false;
    }
    
    async loadAllData() {
        try {
            // Step 1: Load master index.json
            const masterResponse = await fetch('data/index.json');
            if (!masterResponse.ok) throw new Error('Failed to load index.json');
            this.masterData = await masterResponse.json();
            this.categories = this.masterData.categories || [];
            
            // Step 2: Load all category files
            const loadPromises = this.categories.map(cat => this.loadCategoryData(cat));
            await Promise.all(loadPromises);
            
            this.isLoaded = true;
            console.log('✅ All data loaded successfully');
            console.log(`📦 Total Products: ${this.allProducts.length}`);
            console.log(`📂 Total Categories: ${this.categories.length}`);
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('dataLoaded', { 
                detail: { allProducts: this.allProducts, categories: this.categories } 
            }));
            
            return true;
        } catch (error) {
            console.error('❌ Error loading data:', error);
            return false;
        }
    }
    
    async loadCategoryData(category) {
        try {
            const response = await fetch(`data/${category.file}`);
            if (!response.ok) throw new Error(`Failed to load ${category.file}`);
            const products = await response.json();
            
            // Add category info to each product
            const processedProducts = (products.products || products).map(product => ({
                ...product,
                categoryId: category.id,
                categoryName: category.name,
                categoryNameHi: category.nameHi || category.name,
            }));
            
            this.productsByCategory[category.id] = processedProducts;
            this.allProducts = [...this.allProducts, ...processedProducts];
            
            console.log(`📁 Loaded ${category.name}: ${processedProducts.length} products`);
        } catch (error) {
            console.error(`❌ Error loading category ${category.name}:`, error);
            this.productsByCategory[category.id] = [];
        }
    }
    
    getProductsByCategory(categoryId) {
        if (categoryId === 'all') return this.allProducts;
        return this.productsByCategory[categoryId] || [];
    }
    
    getProductById(productId) {
        return this.allProducts.find(p => p.id === productId) || null;
    }
    
    searchProducts(query) {
        if (!query || query.trim().length === 0) return [];
        
        const q = query.toLowerCase().trim();
        
        // Search in both Hindi and English names
        return this.allProducts.filter(product => {
            const nameHi = (product.name && product.name.hi) ? product.name.hi.toLowerCase() : '';
            const nameEn = (product.name && product.name.en) ? product.name.en.toLowerCase() : '';
            return nameHi.includes(q) || nameEn.includes(q);
        });
    }
    
    // Fuzzy search for spell correction
    fuzzySearch(query) {
        const q = query.toLowerCase().trim();
        const results = this.searchProducts(query);
        
        if (results.length > 0) return results;
        
        // Try partial matching
        return this.allProducts.filter(product => {
            const nameHi = (product.name && product.name.hi) ? product.name.hi.toLowerCase() : '';
            const nameEn = (product.name && product.name.en) ? product.name.en.toLowerCase() : '';
            
            // Check if any word in the product name contains the query
            const words = [...nameHi.split(' '), ...nameEn.split(' ')];
            return words.some(word => word.includes(q) || this.levenshteinDistance(word, q) <= 2);
        });
    }
    
    levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
    
    getRandomProducts(count = 4, excludeIds = []) {
        const available = this.allProducts.filter(p => !excludeIds.includes(p.id));
        const shuffled = available.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    getMostOrderedProducts() {
        return this.allProducts.filter(p => p.mostOrdered === true);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    window.dataLoader = new DataLoader();
    await window.dataLoader.loadAllData();
});

