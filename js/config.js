const CONFIG = {
    store: {
        name: 'Quick Dukan',
        tagline: 'Ghar Baithe Kirana',
        phone: '919876543210',           // ← APNA WHATSAPP NUMBER
        phoneDisplay: '98765-43210',
        email: 'quickdukan@gmail.com',
        address: 'Near Ram Mandir, Bhopal, MP',
        pincode: '462001',
        timing: 'Subah 8 Baje - Raat 9 Baje',
        googleMapsQuery: 'Near+Ram+Mandir+Bhopal+MP+462001'
    },
    delivery: {
        freeDeliveryNote: 'Free Delivery*',
        estimatedTime: '45-60 mins',
        pickupTime: '15 mins'
    },
    features: {
        enableDarkMode: true,
        toastDuration: 2500,
        recentlyViewedLimit: 4,
        brandAnimationDelay: 500
    },
    search: {
        placeholderCycleInterval: 4000,
        minCharsToSearch: 2,
        maxSuggestions: 5,
        debounceDelay: 300
    },
    payments: {
        qrCodeImage: 'https://i.ibb.co/YOUR-QR-CODE.png',  // ← APNA QR CODE
        phonePeUPI: 'quickdukan@upi',                        // ← APNA UPI ID
        googlePayUPI: 'quickdukan@upi'
    },
    placeholders: [
        "Search atta, chawal, sabun...",
        "Kya chahiye? Atta, Chawal, Masale...",
        "Dhundho apna kirana...",
        "Maggi, Surf Excel, Tata Atta...",
        "Ghar baithe mangao, 2 ghante me..."
    ],
    urls: {
        productsData: 'data/products/',
        categoriesList: 'data/products/categories-list.json',
        imagesPath: 'images/products/',
        whatsappAPI: 'https://wa.me/'
    }
};