// ============================================
//  PWA INSTALL POPUP
//  Quick Dukan - 41 seconds delay
//  Easy to customize - change timing, text here
// ============================================

// ============ CUSTOMIZATION SECTION ============
const INSTALL_CONFIG = {
    popupDelay: 41000,           // Kitne ms baad popup show ho (41000 = 41 seconds)
    appIcon: '🛒',              // App ka icon
    appName: 'Quick Dukan',     // App ka naam
    appDescription: 'Install for fast ordering',  // Popup description
    installBtnText: 'Install',   // Install button ka text
    manualInstallMsg: 'Please open in Chrome browser for direct install 📲'  // Manual install message
};
// ==============================================

let deferredPrompt;
let popupShown = false;

// Capture install prompt event
window.addEventListener('beforeinstallprompt', function(e) {
    // Prevent default browser prompt
    e.preventDefault();
    // Save the event for later use
    deferredPrompt = e;
    console.log('📲 Install prompt ready');
});

// Show popup after delay (only if user hasn't installed)
window.addEventListener('load', function() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 App already installed');
        return;
    }
    
    setTimeout(function() {
        if (!popupShown) {
            showInstallPopup();
            popupShown = true;
        }
    }, INSTALL_CONFIG.popupDelay);
});

// Create and show install popup
function showInstallPopup() {
    // Remove existing popup if any
    const existingPopup = document.getElementById('installPopup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'install-popup';
    popup.id = 'installPopup';
    popup.innerHTML = `
        <div class="install-popup-card">
            <div class="install-popup-left">
                <span class="install-popup-icon">${INSTALL_CONFIG.appIcon}</span>
                <div class="install-popup-text">
                    <strong>${INSTALL_CONFIG.appName}</strong>
                    <span>${INSTALL_CONFIG.appDescription}</span>
                </div>
            </div>
            <div class="install-popup-right">
                <button class="install-btn" id="installBtn">${INSTALL_CONFIG.installBtnText}</button>
                <button class="install-close-btn" id="installClose">✕</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Slide in animation
    setTimeout(() => {
        popup.classList.add('show');
    }, 100);

    // Install button click handler
    document.getElementById('installBtn').addEventListener('click', function() {
        if (deferredPrompt) {
            // Show native install prompt
            deferredPrompt.prompt();
            
            deferredPrompt.userChoice.then(function(result) {
                console.log(`User ${result.outcome} the install`);
                deferredPrompt = null;
                
                // Hide and remove popup
                popup.classList.remove('show');
                setTimeout(() => popup.remove(), 400);
            });
        } else {
            // Fallback for browsers that don't support install
            alert(INSTALL_CONFIG.manualInstallMsg);
        }
    });

    // Close button handler
    document.getElementById('installClose').addEventListener('click', function() {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 400);
    });
    
    // Auto hide after 30 seconds if not clicked
    setTimeout(() => {
        if (document.getElementById('installPopup')) {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 400);
        }
    }, 30000);
}