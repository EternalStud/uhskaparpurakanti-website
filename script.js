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
        applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    function toggleTheme() {
        const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('school-theme', newTheme);
        toggleButton.style.transform = 'scale(0.92)';
        setTimeout(() => { toggleButton.style.transform = 'scale(1)'; }, 120);
    }

    toggleButton.addEventListener('click', toggleTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (!localStorage.getItem('school-theme')) {
            applyTheme(event.matches ? 'dark' : 'light');
        }
    });

    // =====================
    // HAMBURGER MENU
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
    drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));

    // =====================
    // E: ACTIVE NAV HIGHLIGHT ON SCROLL
    // =====================
    const sections = document.querySelectorAll('section[id]');
    const allNavLinks = document.querySelectorAll('[data-section]');

    function updateActiveNav() {
        let current = '';
        const scrollY = window.scrollY + 120;

        sections.forEach(section => {
            if (scrollY >= section.offsetTop) {
                current = section.id;
            }
        });

        allNavLinks.forEach(link => {
            link.classList.toggle('nav-active', link.dataset.section === current);
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav(); // run once on load

    // =====================
    // L: SCROLL TO TOP
    // =====================
    const scrollTopBtn = document.getElementById('scroll-top');

    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // =====================
    // NOTICES
    // =====================
    async function loadNotices() {
        const noticeContainer = document.getElementById('notice-container');
        if (!noticeContainer) return;

        const NOTICE_API_URL = 'https://script.google.com/macros/s/AKfycbzJ_s1J02Q3bs9PVV6nREQLacFYUr_p5d9etNChGntnq4RzirSYZBrntZp4IMl2bhrY/exec';

        try {
            const response = await fetch(NOTICE_API_URL, {
                cache: 'no-store'
            });
            let notices = await response.json();

            // Auto-hide expired notices
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            notices = notices.filter(notice => {
                if (!notice.expiryDate) return true;
                const expiry = new Date(notice.expiryDate);
                expiry.setHours(0, 0, 0, 0);
                return expiry >= today;
            });

            if (!notices.length) {
                noticeContainer.innerHTML = '<div class="notice-loading">कोई सक्रिय सूचना उपलब्ध नहीं है।</div>';
                return;
            }

            noticeContainer.innerHTML = notices.map(notice => {
                const priorityClass = notice.priority === 'High' ? 'notice-high' : 'notice-normal';
                const details = notice.details || '';
                return `
                    <div class="notice-card ${priorityClass}">
                        <div class="notice-category">${notice.category || ''}</div>
                        <h3>${notice.title || ''}</h3>
                        <p class="notice-text">${details}</p>
                        ${details.length > 120 ? `
                        <button class="notice-toggle" type="button">पूरा पढ़ें ▼</button>
                        ` : ''}
                        ${notice.documents ? `
                        <div class="notice-documents">
                            <strong>आवश्यक दस्तावेज:</strong><br>${notice.documents}
                        </div>` : ''}
                        ${notice.lastDate ? `
                        <div class="notice-date">
                            📅 अंतिम तिथि: ${new Date(notice.lastDate).toLocaleDateString('hi-IN')}
                        </div>` : ''}
                        ${notice.pdf ? `
                        <div class="notice-pdf">
                            <a href="${notice.pdf}" target="_blank">📎 Download Official Notification</a>
                        </div>` : ''}
                    </div>
                `;
            }).join('');

            // Expand/collapse toggle
            noticeContainer.querySelectorAll('.notice-toggle').forEach(button => {
                button.addEventListener('click', () => {
                    const text = button.parentElement.querySelector('.notice-text');
                    const expanded = text.classList.toggle('expanded');
                    button.textContent = expanded ? 'कम करें ▲' : 'पूरा पढ़ें ▼';
                });
            });

        } catch (error) {
            console.error('Error loading notices:', error);
            noticeContainer.innerHTML = '<div class="notice-loading">सूचनाएँ लोड नहीं हो सकीं।</div>';
        }
    }

    // =====================
    // GALLERY
    // =====================
    async function loadGallery() {
        const galleryContainer = document.getElementById('gallery-categories');
        const galleryViewer = document.getElementById('gallery-viewer');
        if (!galleryContainer || !galleryViewer) return;

        const GALLERY_API_URL = 'https://script.google.com/macros/s/AKfycbzojAlGSjnTcE5_BfkbmO4E1ga2ptIct9cbbsOTaf18Pffow9bu1FlIVq5tFzZrLF2R/exec';

        try {
            const response = await fetch(GALLERY_API_URL, {
                cache: 'no-store'
            });
            const categories = await response.json();

            let currentPhotos = [];
            let currentIndex = 0;

            const lightbox    = document.getElementById('gallery-lightbox');
            const lightboxImg = document.getElementById('lightbox-image');
            const closeBtn    = document.getElementById('lightbox-close');
            const prevBtn     = document.getElementById('lightbox-prev');
            const nextBtn     = document.getElementById('lightbox-next');

            function openLightbox(index) {
                currentIndex = index;
                lightboxImg.src = currentPhotos[currentIndex].url;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            function closeLightbox() {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }

            function showPrev() {
                currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
                lightboxImg.src = currentPhotos[currentIndex].url;
            }

            function showNext() {
                currentIndex = (currentIndex + 1) % currentPhotos.length;
                lightboxImg.src = currentPhotos[currentIndex].url;
            }

            if (!categories.length) {
                galleryContainer.innerHTML = '<div class="gallery-loading">कोई फोटो उपलब्ध नहीं है।</div>';
                return;
            }

            galleryContainer.innerHTML = categories.map(category => `
                <div class="gallery-category-card" data-category="${category.category}">
                    <img src="${category.cover}" alt="${category.category}">
                    <div class="gallery-category-info">
                        <h3>${category.category}</h3>
                        <div class="gallery-photo-count">
                            <span>📸 ${category.count} फोटो</span>
                            <span class="gallery-see-btn">देखें →</span>
                        </div>
                    </div>
                </div>
            `).join('');

            function renderCategory(category) {
                currentPhotos = category.photos;
                galleryViewer.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;margin-bottom:20px;">
                        <h3 class="gallery-viewer-title">📸 ${category.category}</h3>
                        <button id="close-gallery" class="btn-primary">⬅ सभी श्रेणियाँ देखें</button>
                    </div>
                    <div class="gallery-viewer-grid">
                        ${category.photos.map((photo, i) => `
                            <img src="${photo.url}" alt="${photo.name}" loading="lazy" data-index="${i}">
                        `).join('')}
                    </div>
                `;
                galleryViewer.style.display = 'block';

                galleryViewer.querySelectorAll('.gallery-viewer-grid img').forEach(img => {
                    img.addEventListener('click', () => openLightbox(parseInt(img.dataset.index, 10)));
                });

                document.getElementById('close-gallery').addEventListener('click', () => {
                    galleryViewer.style.display = 'none';
                    galleryContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }

            galleryViewer.style.display = 'none';

            if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
            if (prevBtn)  prevBtn.addEventListener('click', showPrev);
            if (nextBtn)  nextBtn.addEventListener('click', showNext);

            lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

            document.addEventListener('keydown', (e) => {
                if (!lightbox.classList.contains('active')) return;
                
                // Block default page scrolling behavior when shifting lightbox slides
                if (['ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
                    e.preventDefault();
                }
                
                if (e.key === 'Escape')      closeLightbox();
                if (e.key === 'ArrowLeft')   showPrev();
                if (e.key === 'ArrowRight')  showNext();
            });

            galleryContainer.querySelectorAll('.gallery-category-card').forEach(card => {
                card.addEventListener('click', () => {
                    const selected = categories.find(c => c.category === card.dataset.category);
                    if (selected) {
                        renderCategory(selected);
                        setTimeout(() => {
                            galleryViewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                    }
                });
            });

        } catch (error) {
            console.error('Gallery error:', error);
            galleryContainer.innerHTML = '<div class="gallery-loading">गैलरी लोड नहीं हो सकी।</div>';
        }
    }

    // =====================
    // PRINCIPAL SECTION
    // =====================
    async function loadPrincipalSection() {
        const API_URL = 'https://script.google.com/macros/s/AKfycbxRHACdvIq2cdOZsVB8ZcRTSdkrZ-7QuwnwE2diPJH-Sgt14XGqhe58z2p4_IlBnVme/exec';

        try {
            const response = await fetch(API_URL, {
                cache: 'no-store'
            });
            const data = await response.json();

            const nameEl        = document.getElementById('principal-name');
            const desigEl       = document.getElementById('principal-designation');
            const msgContent    = document.getElementById('principal-message-content');
            const mobileEl      = document.getElementById('principal-mobile');
            const photoWrap     = document.getElementById('principal-photo-wrap');
            const staffWrap     = document.getElementById('staff-photo-wrap');
            const subtitleEl    = document.getElementById('principal-subtitle');

            if (msgContent) {
                msgContent.innerHTML = `
                    <p id="principal-message">${data.principal?.message || ''}</p>
                `;
            }

            if (subtitleEl) subtitleEl.textContent = data.principal?.subtitle || '';
            if (nameEl)     nameEl.textContent  = data.principal?.name || '';
            if (desigEl)    desigEl.textContent = data.principal?.designation || '';

            if (mobileEl) {
                if (data.principal?.mobile) {
                    mobileEl.textContent = `📞 ${data.principal.mobile}`;
                    mobileEl.style.display = 'block';
                } else {
                    mobileEl.style.display = 'none';
                }
            }

            if (photoWrap) {
                if (data.principalPhoto) {
                    photoWrap.outerHTML = `<img id="principal-photo" src="${data.principalPhoto}" alt="${data.principal?.name || 'प्रधानाध्यापक'}">`;
                } else {
                    photoWrap.outerHTML = `<img id="principal-photo" src="images/staff.jpg" alt="प्रधानाध्यापक">`;
                }
            }

            if (staffWrap) {
                if (data.staffPhoto) {
                    staffWrap.outerHTML = `<img id="staff-group-photo" src="${data.staffPhoto}" alt="विद्यालय शिक्षक समूह">`;
                } else {
                    staffWrap.outerHTML = `<img id="staff-group-photo" src="images/staff.jpg" alt="विद्यालय शिक्षक समूह">`;
                }
            }

        } catch (error) {
            console.error('Principal section error:', error);
            const msgContent = document.getElementById('principal-message-content');
            if (msgContent) msgContent.innerHTML = '<p style="opacity:.6">संदेश लोड नहीं हो सका।</p>';
            const pw = document.getElementById('principal-photo-wrap');
            if (pw) pw.outerHTML = `<img id="principal-photo" src="images/staff.jpg" alt="प्रधानाध्यापक">`;
            const sw = document.getElementById('staff-photo-wrap');
            if (sw) sw.outerHTML = `<img id="staff-group-photo" src="images/staff.jpg" alt="विद्यालय स्टाफ">`;
        }
    }

    // =====================
    // SCHOOL STATS
    // =====================
    async function loadSchoolStats() {
        const API_URL = 'https://script.google.com/macros/s/AKfycbw586WFslTxwTECtYWwu0XWiUD9czAeZ5BDg8zTnRSafE0PgF0PMc8W3rdU1h4BS1rS/exec';

        try {
            const response = await fetch(API_URL, {
                cache: 'no-store'
            });
            const data = await response.json();

            const statsArea = document.getElementById('stats-cards-area');
            if (statsArea) {
                statsArea.innerHTML = `
                    <div id="students-card" class="stats-card">
                        <strong>👨‍🎓 विद्यार्थी</strong>
                        <p id="student-count">${data.stats.students}</p>
                    </div>
                    <div id="teachers-card" class="stats-card">
                        <strong>👨‍🏫 शिक्षक</strong>
                        <p id="teacher-count">${data.stats.teachers}</p>
                    </div>
                    <div id="clerks-card" class="stats-card">
                        <strong>🏢 कार्यालय कर्मी</strong>
                        <p id="clerk-count">${data.stats.clerks}</p>
                    </div>
                `;
            }

            const achievementsContainer = document.getElementById('achievements-container');
            if (achievementsContainer && data.achievements) {
                const achievements = data.achievements
                    .filter(item => {
                        const a = String(item.active || '').toLowerCase();
                        return a === 'true' || a === 'yes' || a === '1';
                    })
                    .sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999));

                if (!achievements.length) {
                    achievementsContainer.innerHTML = `<div class="achievement-loading">अभी कोई उपलब्धि उपलब्ध नहीं है।</div>`;
                } else {
                    achievementsContainer.innerHTML = achievements.map(item => `
                        <div class="achievement-card achievement-${item.color || 'gold'}">
                            <div class="achievement-header">
                                <div class="achievement-icon">${item.icon || '🏆'}</div>
                                <div class="achievement-title">${item.title || ''}</div>
                            </div>
                            <div class="achievement-description">${item.description || ''}</div>
                        </div>
                    `).join('');
                }
            }

            const modal    = document.getElementById('stats-modal');
            const modalBody = document.getElementById('stats-modal-body');
            const closeBtn  = document.getElementById('stats-modal-close');

            function openModal(title, content) {
                modalBody.innerHTML = `<h3>${title}</h3>${content}`;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            function closeModal() {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }

            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

            document.getElementById('students-card')?.addEventListener('click', () => {
                const totalBoys  = data.studentDetails.reduce((s, i) => s + Number(i.boys  || 0), 0);
                const totalGirls = data.studentDetails.reduce((s, i) => s + Number(i.girls || 0), 0);
                const totalAll   = data.studentDetails.reduce((s, i) => s + Number(i.total || 0), 0);
                const rows = data.studentDetails.map(i => `
                    <tr><td>${i.class}</td><td>${i.section}</td><td>${i.boys}</td><td>${i.girls}</td><td>${i.total}</td></tr>
                `).join('');
                openModal('📊 कक्षा-वार नामांकन विवरण', `
                    <table class="stats-table">
                        <thead><tr><th>कक्षा</th><th>सेक्शन</th><th>बालक</th><th>बालिका</th><th>कुल</th></tr></thead>
                        <tbody>${rows}
                            <tr style="font-weight:bold;background:rgba(217,119,6,.08);">
                                <td>योग</td><td>-</td><td>${totalBoys}</td><td>${totalGirls}</td><td>${totalAll}</td>
                            </tr>
                        </tbody>
                    </table>`
                );
            });

            document.getElementById('teachers-card')?.addEventListener('click', () => {
                const rows = data.teacherDetails.map(i => `
                    <tr><td>${i.name}</td><td>${i.category}</td><td>${i.subject}</td></tr>
                `).join('');
                openModal(`👨‍🏫 शिक्षक विवरण (कुल ${data.stats.teachers})`, `
                    <table class="stats-table">
                        <thead><tr><th>नाम</th><th>कोटि</th><th>नियुक्ति विषय</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>`
                );
            });

            document.getElementById('clerks-card')?.addEventListener('click', () => {
                const rows = data.clerkDetails.map(i => `
                    <tr><td>${i.name}</td><td>${i.designation}</td></tr>
                `).join('');
                openModal(`🏢 कार्यालय कर्मी (कुल ${data.stats.clerks})`, `
                    <table class="stats-table">
                        <thead><tr><th>नाम</th><th>पदनाम</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>`
                );
            });

        } catch (error) {
            const achievementsContainer = document.getElementById('achievements-container');
            if (achievementsContainer) {
                achievementsContainer.innerHTML = `<div class="achievement-loading">उपलब्धियाँ लोड नहीं हो सकीं।</div>`;
            }
            const statsArea = document.getElementById('stats-cards-area');
            if (statsArea) {
                statsArea.innerHTML = `<div class="achievement-loading" style="grid-column:1/-1">आँकड़े लोड नहीं हो सके।</div>`;
            }
            console.error('Stats error:', error);
        }
    }

    // =====================
    // VISITOR COUNT
    // =====================
    async function updateVisitorCount() {
        const visitorEl = document.getElementById('visitor-count');
        if (!visitorEl) return;

        const API_URL = 'https://script.google.com/macros/s/AKfycbxQ20oeRs-fiKEUrrYUY2HD6fiMvjQhh7_NR0m-QmHzYc0JqGRgA871gBFCI1BJYwNq/exec';

        try {
            const today = new Date().toLocaleDateString('en-CA');
            const lastVisit = localStorage.getItem('uhs-last-visit');
            const action = lastVisit !== today ? 'visit' : 'get';

            const response = await fetch(`${API_URL}?action=${action}`);
            const data = await response.json();

            if (action === 'visit') localStorage.setItem('uhs-last-visit', today);

            const count = Number(data.count || 0);

            function formatCount(n) {
                if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
                if (n >= 10000)   return (n / 1000).toFixed(1).replace('.0', '') + 'K';
                return n.toLocaleString('en-IN');
            }

            visitorEl.textContent = `👥 कुल आगंतुक: ${formatCount(count)}`;

        } catch (error) {
            visitorEl.textContent = '👥 कुल आगंतुक: --';
        }
    }

    // =====================
    // INIT
    // =====================
    loadNotices();
    loadGallery();
    loadSchoolStats();
    loadPrincipalSection();
    updateVisitorCount();

    console.log('UCHCH MADHYAMIK VIDYALAYA KAPARPURA website loaded successfully.');
});
