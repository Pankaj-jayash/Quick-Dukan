var Theme = {
    init: function() {
        var saved = localStorage.getItem('quickdukan_theme');
        if (saved === 'dark') document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        this.updateIcon();
    },
    toggle: function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('quickdukan_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        this.updateIcon();
    },
    updateIcon: function() {
        var icon = document.getElementById('toggleIcon');
        if (icon) icon.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    }
};