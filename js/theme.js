// ========== DARK/LIGHT MODE ==========

const Theme = {
    init() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        
        // Apply saved theme
        const savedTheme = Storage.getTheme();
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            toggle.querySelector('.toggle-icon').textContent = '☀️';
        }
        
        toggle.addEventListener('click', () => {
            this.toggle();
        });
        
        // Ripple effect
        toggle.addEventListener('click', function(e) {
            UI.createRipple(e, this, 'rgba(255,255,255,0.2)');
        });
    },
    
    toggle() {
        const isDark = document.body.classList.toggle('dark-mode');
        const icon = document.querySelector('.toggle-icon');
        
        if (icon) {
            icon.classList.add('flipping');
            setTimeout(() => {
                icon.textContent = isDark ? '☀️' : '🌙';
                icon.classList.remove('flipping');
            }, 200);
        }
        
        Storage.setTheme(isDark ? 'dark' : 'light');
    }
};