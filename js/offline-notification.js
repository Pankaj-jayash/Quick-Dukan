// ============================================
// OFFLINE-NOTIFICATION.JS - Beautiful Offline Toast
// ============================================

class OfflineNotifier {
    constructor() {
        this.element = null;
        this.isVisible = false;
        this.create();
    }

    create() {
        // Create notification element
        this.element = document.createElement('div');
        this.element.id = 'offlineNotification';
        this.element.className = 'offline-notification hidden';
        this.element.innerHTML = `
            <div class="offline-notif-inner">
                <span class="offline-notif-icon">📴</span>
                <div class="offline-notif-text">
                    <strong>आप ऑफ़लाइन हैं!</strong>
                    <span>लेकिन ऐप फिर भी चलेगा 💪</span>
                </div>
                <button class="offline-notif-close" id="offlineNotifClose" aria-label="बंद करें">✕</button>
            </div>
            <div class="offline-notif-progress"></div>
        `;
        
        document.body.appendChild(this.element);
        
        // Close button
        document.getElementById('offlineNotifClose').addEventListener('click', () => {
            this.hide();
        });
    }

    show() {
        if (this.isVisible) return;
        
        this.element.classList.remove('hidden');
        this.element.style.animation = 'offlineSlideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        this.isVisible = true;
        
        // Auto hide after 8 seconds
        this.autoHideTimer = setTimeout(() => {
            this.hide();
        }, 8000);
    }

    hide() {
        if (!this.isVisible) return;
        
        this.element.style.animation = 'offlineSlideUp 0.4s ease forwards';
        
        setTimeout(() => {
            this.element.classList.add('hidden');
            this.isVisible = false;
        }, 400);
        
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.offlineNotifier = new OfflineNotifier();
    
    // Check initial state
    if (!navigator.onLine) {
        setTimeout(() => {
            window.offlineNotifier.show();
        }, 1000);
    }
});