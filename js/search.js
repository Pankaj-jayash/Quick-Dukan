var Search = {
    searchProducts: function(query) {
        if (!Products.allProducts || Products.allProducts.length === 0) return [];
        var q = query.toLowerCase();
        return Products.allProducts.filter(function(p) {
            return p.name.toLowerCase().indexOf(q) > -1;
        }).slice(0, CONFIG.search.maxSuggestions);
    }
};