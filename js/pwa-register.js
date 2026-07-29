// ============================================
//  PWA SERVICE WORKER REGISTRATION
//  Quick Dukan
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('✅ Quick Dukan - Service Worker registered');
                
                // Auto update on new version
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available - reload page
                            console.log('🔄 New version available. Reloading...');
                            window.location.reload();
                        }
                    });
                });
            })
            .catch(function(err) {
                console.log('❌ Service Worker registration failed:', err);
            });
    });
}