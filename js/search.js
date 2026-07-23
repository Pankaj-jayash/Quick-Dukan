// ========== SEARCH FUNCTIONALITY ==========

const Search = {
    
    init() {
        // Search is initialized in header.js
        // This module provides search functions
    },
    
    // Search across all loaded products
    searchProducts(query) {
        if (!query || query.length < CONFIG.search.minCharsToSearch) return [];
        
        const products = Products.allProducts;
        if (products.length === 0) return this.getFallbackResults(query);
        
        const q = query.toLowerCase();
        
        // Score-based search
        const results = products.map(product => {
            const name = product.name.toLowerCase();
            let score = 0;
            
            // Exact match
            if (name === q) score = 100;
            // Starts with
            else if (name.startsWith(q)) score = 90;
            // Contains
            else if (name.includes(q)) score = 80;
            // Word match
            else if (name.split(' ').some(w => w.includes(q))) score = 70;
            // Fuzzy match (simple: all chars in order)
            else {
                let qi = 0;
                for (let i = 0; i < name.length && qi < q.length; i++) {
                    if (name[i] === q[qi]) qi++;
                }
                if (qi === q.length) score = 60;
            }
            
            // Check weight too
            if (product.weight && product.weight.toLowerCase().includes(q)) score = Math.max(score, 50);
            
            return { ...product, searchScore: score };
        })
        .filter(p => p.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore);
        
        return results.slice(0, CONFIG.search.maxSuggestions);
    },
    
    getFallbackResults(query) {
        const fallback = Products.getFallbackProducts();
        const q = query.toLowerCase();
        return fallback.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.weight && p.weight.toLowerCase().includes(q))
        ).slice(0, CONFIG.search.maxSuggestions);
    }
};

console.log('✅ Quick Dukan — Search Module Ready');