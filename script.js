document.addEventListener('DOMContentLoaded', () => {

    // =====================
    // THEME TOGGLE
    // =====================
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

    function toggleTheme() {
        const isDark = document.body.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('school-theme', newTheme);
        toggleButton.style.transform = 'scale(0.92)';
        setTimeout(() => { toggleButton.style.transform = 'scale(1)'; }, 120);
    }

    toggleButton.addEventListener('click', toggleTheme);
    toggleButton.addEventListener('touchstart', toggleTheme, { passive: true });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (!localStorage.getItem('school-theme')) {
            applyTheme(event.matches ? 'dark' : 'light');
        }
    });

    // =====================
    // FIX 1: HAMBURGER MENU
    // =====================
    const hamburger = document.getElementById('hamburger');
    const drawer = document.getElementById('nav-drawer');
    const overlay = document.getElementById('nav-overlay');
    const drawerClose = document.getElementById('drawer-close');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (hamburger) hamburger.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // Close drawer when any nav link is clicked
    drawerLinks.forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // =====================
    // NOTICES
    // =====================
    async function loadNotices() {
        const noticeContainer = document.getElementById('notice-container');
        if (!noticeContainer) return;

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
                        <p class="notice-text">${notice.details || ''}</p>
                        ${(notice.details || '').length > 250 ? `
                        <button class="notice-toggle btn-primary" type="button">पूरा पढ़ें ▼</button>
                        ` : ''}
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
            document.querySelectorAll('.notice-toggle').forEach(button => {
                button.addEventListener('click', () => {
                    const text = button.parentElement.querySelector('.notice-text');

                    if (text.classList.contains('expanded')) {
                        text.classList.remove('expanded');
                        button.textContent = 'पूरा पढ़ें ▼';
                    } else {
                        text.classList.add('expanded');
                        button.textContent = 'कम करें ▲';
                    }
                });
            });

        } catch (error) {
            console.error('Error loading notices:', error);
            noticeContainer.innerHTML = '<div class="notice-loading">Unable to load notices at the moment.</div>';
        }
    }

    // =====================
    // FIX 11: GALLERY with always-visible देखें button
    // =====================
    async function loadGallery() {
        const galleryContainer = document.getElementById('gallery-categories');
        const galleryViewer = document.getElementById('gallery-viewer');
        if (!galleryContainer || !galleryViewer) return;

        const GALLERY_API_URL = 'https://script.google.com/macros/s/AKfycbzojAlGSjnTcE5_BfkbmO4E1ga2ptIct9cbbsOTaf18Pffow9bu1FlIVq5tFzZrLF2R/exec';

        try {
            const response = await fetch(GALLERY_API_URL);
            const categories = await response.json();

            if (!categories.length) {
                galleryContainer.innerHTML = '<div class="gallery-loading">No photos available.</div>';
                return;
            }

            // FIX 11: Added always-visible "देखें →" button in the count row
            galleryContainer.innerHTML = categories.map(category => `
                <div class="gallery-category-card" data-category="${category.category}">
                    <img src="${category.cover}" alt="${category.category}">
                    <div class="gallery-category-info">
                        <h3>${category.category}</h3>
                        <div class="gallery-photo-count">
                            <span>📸 ${category.count} Photos</span>
                            <span class="gallery-see-btn">देखें →</span>
                        </div>
                    </div>
                </div>
            `).join('');

            function renderCategory(category) {
                galleryViewer.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;margin-bottom:20px;">
                        <h3 class="gallery-viewer-title">📸 ${category.category}</h3>
                        <button id="close-gallery" class="btn-primary">⬅ सभी श्रेणियाँ देखें</button>
                    </div>
                    <div class="gallery-viewer-grid">
                        ${category.photos.map(photo => `
                            <img src="${photo.url}" alt="${photo.name}" loading="lazy">
                        `).join('')}
                    </div>
                `;
                galleryViewer.style.display = 'block';

                document.getElementById('close-gallery').addEventListener('click', () => {
                    galleryViewer.style.display = 'none';
                    document.getElementById('gallery-categories').scrollIntoView({
                        behavior: 'smooth', block: 'start'
                    });
                });
            }

            galleryViewer.style.display = 'none';

            document.querySelectorAll('.gallery-category-card').forEach(card => {
                card.addEventListener('click', () => {
                    const selected = categories.find(item => item.category === card.dataset.category);
                    if (selected) {
                        renderCategory(selected);
                        setTimeout(() => {
                            galleryViewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                    }
                });
            });

        } catch (error) {
            console.error('Error loading gallery:', error);
            galleryContainer.innerHTML = '<div class="gallery-loading">Unable to load gallery.</div>';
        }
    }

    loadNotices();
    loadGallery();
    console.log('UCHCH MADHYAMIK VIDYALAYA KAPARPURA website loaded successfully.');
});