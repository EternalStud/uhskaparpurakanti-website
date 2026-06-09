

const toggleButton = document.getElementById('theme-toggle');

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
        toggleButton.textContent = '☀️';
    } else {
        document.body.classList.remove('dark');
        toggleButton.textContent = '🌙';
    }
}

const savedTheme = localStorage.getItem('school-theme');

if (savedTheme) {
    applyTheme(savedTheme);
} else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
}

toggleButton.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';

    applyTheme(newTheme);
    localStorage.setItem('school-theme', newTheme);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (!localStorage.getItem('school-theme')) {
        applyTheme(event.matches ? 'dark' : 'light');
    }
});

console.log('UCHCH MADHYAMIK VIDYALAYA KAPARPURA website loaded successfully.');