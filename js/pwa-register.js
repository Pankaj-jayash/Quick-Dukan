if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/Quick-Dukan/service-worker.js')
            .then(function(registration) {
                console.log('✅ Quick Dukan - Service Worker registered');
                
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
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