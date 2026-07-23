// ========== CONFIGURATION ==========

const CONFIG = {
    store: {
        name: 'Quick Dukan',
        tagline: 'Ghar Baithe Kirana',
        phone: '919719312956',
        phoneDisplay: '9719312956',
        email: 'quickdukan@gmail.com',
        address: 'Near Ram Mandir, Bhopal, MP',
        pincode: '462001',
        city: 'Bhopal',
        state: 'Madhya Pradesh',
        timing: 'Subah 8:00 AM - Raat 10:00 PM',
        googleMapsQuery: 'Near+Ram+Mandir+Bhopal+MP+462001'
    },
    
    delivery: {
        freeDeliveryNote: 'Free Delivery*',
        estimatedTime: '45-60 mins',
        pickupTime: '15-20 mins',
        servicedStates: ['Madhya Pradesh'],
        servicedCities: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain']
    },
    
    features: {
        recentlyViewedLimit: 4,
        searchSuggestionsLimit: 5,
        mostOrderedLimit: 12,
        toastDuration: 2500,
        enableDarkMode: true,
        enableVoiceSearch: true
    },
    
    urls: {
        categoriesList: 'data/categories-list.json',
        productsPath: 'data/products/',
        imagesPath: 'images/products/',
        whatsappAPI: 'https://wa.me/',
        placeholderImage: 'https://picsum.photos/400/400'
    },
    
    searchPlaceholders: [
        'Biwi ne list di? Copy-paste karo yahan! 😅',
        'Atta dhundh rahe ho? Yahan sab milega... 😊',
        'Chawal, daal, masale — pet khush, jeb khush! 😋',
        'Maggi khani hai? 2 minute me dhundho! 🍜',
        'Kirana dhundhna ab mazaak jaisa easy... 🛒✨',
        'Pados wali aunty se sasta, apni dukan se fast! 🚀',
        'Jo chahiye type karo, hum dhundhte hain! 🔍❤️'
    ]
};

// Freeze to prevent accidental changes
Object.freeze(CONFIG);