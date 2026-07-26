// ============================================
// THEME.JS - Day/Night Mode Toggle
// ============================================

class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggle.querySelector('.theme-icon');
        this.body = document.body;
        this.isDarkMode = false;
        
        this.init();
    }
    
    init() {
        // Load saved preference
        const savedTheme = localStorage.getItem('quick-dukan-theme');
        if (savedTheme === 'dark') {
            this.enableDarkMode();
        }
        
        // Toggle on click
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    }
    
    toggleTheme() {
        if (this.isDarkMode) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
        this.animateToggle();
    }
    
    enableDarkMode() {
        this.body.classList.add('dark-mode');
        this.themeIcon.textContent = '☀️';
        this.isDarkMode = true;
        localStorage.setItem('quick-dukan-theme', 'dark');
    }
    
    disableDarkMode() {
        this.body.classList.remove('dark-mode');
        this.themeIcon.textContent = '🌙';
        this.isDarkMode = false;
        localStorage.setItem('quick-dukan-theme', 'light');
    }
    
    animateToggle() {
        this.themeIcon.style.animation = 'spin 0.5s ease';
        setTimeout(() => {
            this.themeIcon.style.animation = '';
        }, 500);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});