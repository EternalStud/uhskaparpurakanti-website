document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('theme-toggle');

    if (!toggleButton) {
        console.error('Theme toggle button not found');
        return;
    }

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

    function toggleTheme() {
        const isDark = document.body.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';

        applyTheme(newTheme);
        localStorage.setItem('school-theme', newTheme);

        toggleButton.style.transform = 'scale(0.92)';
        setTimeout(() => {
            toggleButton.style.transform = 'scale(1)';
        }, 120);
    }

    toggleButton.addEventListener('click', toggleTheme);
    toggleButton.addEventListener('touchstart', toggleTheme, { passive: true });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (event) => {
        if (!localStorage.getItem('school-theme')) {
            applyTheme(event.matches ? 'dark' : 'light');
        }
    });

    async function loadNotices() {
        const noticeContainer = document.getElementById('notice-container');

        if (!noticeContainer) {
            return;
        }

        const NOTICE_API_URL = 'https://script.google.com/macros/s/AKfycbzJ_s1J02Q3bs9PVV6nREQLacFYUr_p5d9etNChGntnq4RzirSYZBrntZp4IMl2bhrY/exec';

        try {
            const response = await fetch(NOTICE_API_URL);
            const notices = await response.json();

            if (!notices.length) {
                noticeContainer.innerHTML = '<div class="notice-loading">No active notices available.</div>';
                return;
            }

            noticeContainer.innerHTML = notices.map(notice => {
                const priorityClass = notice.priority === 'High' ? 'notice-high' : 'notice-normal';

                return `
                    <div class="notice-card ${priorityClass}">
                        <div class="notice-category">${notice.category || ''}</div>
                        <h3>${notice.title || ''}</h3>
                        <p>${notice.details || ''}</p>

                        ${notice.documents ? `
                        <div class="notice-documents">
                            <strong>Required Documents:</strong><br>
                            ${notice.documents}
                        </div>` : ''}

                        ${notice.lastDate ? `
                        <div class="notice-date">
                            📅 Last Date: ${new Date(notice.lastDate).toLocaleDateString('en-IN')}
                        </div>` : ''}

                        ${notice.pdf ? `
                        <div class="notice-pdf">
                            <a href="${notice.pdf}" target="_blank">📎 Download Official Notification</a>
                        </div>` : ''}
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading notices:', error);
            noticeContainer.innerHTML = '<div class="notice-loading">Unable to load notices at the moment.</div>';
        }
    }

    loadNotices();
    console.log('UCHCH MADHYAMIK VIDYALAYA KAPARPURA website loaded successfully.');
});