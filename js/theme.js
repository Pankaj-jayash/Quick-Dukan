const Theme = {
    init() {
        const savedTheme = localStorage.getItem('quickdukan_theme');
        if (savedTheme === 'dark') document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        this.updateIcon();
    },
    toggle() {
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) { document.body.classList.remove('dark-mode'); localStorage.setItem('quickdukan_theme', 'light'); }
        else { document.body.classList.add('dark-mode'); localStorage.setItem('quickdukan_theme', 'dark'); }
        this.updateIcon();
    },
    updateIcon() {
        const icon = document.getElementById('toggleIcon');
        if (!icon) return;
        icon.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    },
    getCurrentTheme() { return document.body.classList.contains('dark-mode') ? 'dark' : 'light'; }
};
console.log('✅ Quick Dukan — Theme Manager Loaded');