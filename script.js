document.addEventListener('DOMContentLoaded', () => {

    function formatDriveUrl(url) {
        if (!url) return '';
        const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
        }
        return url;
    }

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
    // INDEPENDENCE DAY FESTIVE CHECK (Only displays on 15th August)
    // =====================
    const today = new Date();
    const is15thAugust = (today.getMonth() === 7 && today.getDate() === 15);
    const festiveBadge = document.getElementById('festive-badge');
    const heroContent = document.querySelector('.hero-content');
    
    if (festiveBadge) {
        if (is15thAugust) {
            festiveBadge.style.display = 'inline-flex';
            if (heroContent) heroContent.classList.add('has-festive-ribbon');
        } else {
            festiveBadge.style.display = 'none';
            if (heroContent) heroContent.classList.remove('has-festive-ribbon');
        }
    }

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
    // API CACHE HELPER
    // =====================
    async function fetchWithCache(url, cacheKey, ttlMinutes = 30) {
        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < ttlMinutes * 60 * 1000) {
                    return data;
                }
            }
        } catch (e) {
            console.warn("Cache read error", e);
        }

        const response = await fetch(url, { cache: 'no-store' });
        const data = await response.json();

        try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
        } catch (e) {
            console.warn("Cache write error", e);
        }
        return data;
    }

    // =====================
    // NOTICES
    // =====================
    async function loadNotices() {
        const noticeContainer = document.getElementById('notice-container');
        if (!noticeContainer) return;

        const NOTICE_API_URL = 'https://script.google.com/macros/s/AKfycbzJ_s1J02Q3bs9PVV6nREQLacFYUr_p5d9etNChGntnq4RzirSYZBrntZp4IMl2bhrY/exec';

        try {
            let notices = await fetchWithCache(NOTICE_API_URL, 'cache_notices', 30);

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

            noticeContainer.innerHTML = notices.map((notice, index) => {
                const priorityClass = notice.priority === 'High' ? 'notice-high' : 'notice-normal';
                const details = notice.details || '';
                const shareLink = 'https://uhskaparpurakanti.in/#notices';
                return `
                    <div class="notice-card ${priorityClass}" id="notice-${index}">
                        <button class="btn-notice-share" type="button" 
                                data-title="${encodeURIComponent(notice.title || '')}" 
                                data-text="${encodeURIComponent(details)}" 
                                data-url="${shareLink}">
                            🔗 साझा करें
                        </button>
                        <div class="notice-category">${notice.category || ''}</div>
                        <h3>${notice.title || ''}</h3>
                        <p class="notice-text collapsed">${details}</p>
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

                    if (text.classList.contains('expanded')) {
                        text.classList.remove('expanded');
                        text.classList.add('collapsed');
                        button.textContent = 'पूरा पढ़ें ▼';
                    } else {
                        text.classList.remove('collapsed');
                        text.classList.add('expanded');
                        button.textContent = 'कम करें ▲';
                    }
                });
            });

            // Share handler
            noticeContainer.querySelectorAll('.btn-notice-share').forEach(button => {
                button.addEventListener('click', async () => {
                    const title = decodeURIComponent(button.dataset.title);
                    const text = decodeURIComponent(button.dataset.text);
                    const url = button.dataset.url;

                    if (navigator.share) {
                        try {
                            await navigator.share({
                                title: title,
                                text: `${title}\n\n${text}`,
                                url: url
                            });
                        } catch (err) {
                            if (err.name !== 'AbortError') {
                                console.log('Share canceled or failed:', err);
                            }
                        }
                    } else {
                        // Fallback: Copy link to clipboard
                        try {
                            const fullShareMessage = `${title}\n\n${text}\n\nपढ़ें: ${url}`;
                            await navigator.clipboard.writeText(fullShareMessage);
                            alert('लिंक क्लिपबोर्ड पर कॉपी हो गया है! अब आप इसे कहीं भी शेयर कर सकते हैं।');
                        } catch (copyErr) {
                            alert('लिंक कॉपी करने में त्रुटि हुई।');
                        }
                    }
                });
            });

        } catch (error) {
            console.error('Error loading notices:', error);
            noticeContainer.innerHTML = '<div class="notice-loading">सूचनाएँ लोड नहीं हो सकीं।</div>';
        }
    }

    // =====================
    // GALLERY (Photos & Videos)
    // =====================
    async function loadGallery() {
        const galleryContainer = document.getElementById('gallery-categories');
        const galleryViewer = document.getElementById('gallery-viewer');
        if (!galleryContainer || !galleryViewer) return;

        const GALLERY_API_URL = 'https://script.google.com/macros/s/AKfycbwQtEdZ-Y-NIgFFoWCmqQap-hCdfHk6lTFjSqswH-bOS75MkPr4PFz31S-TuFea9KE/exec?action=public.gallery.get';

        function extractDriveId(url) {
            if (!url) return '';
            const match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            return match ? match[1] : '';
        }

        function isVideoMedia(item) {
            if (!item) return false;
            if (item.isVideo !== undefined) return Boolean(item.isVideo);
            const name = (item.name || '').toLowerCase();
            const url = (item.url || '').toLowerCase();
            const mime = (item.mimeType || item.type || '').toLowerCase();
            return mime.startsWith('video/') ||
                   name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm') ||
                   name.endsWith('.mkv') || name.endsWith('.m4v') || name.endsWith('.avi') ||
                   url.includes('.mp4') || url.includes('.webm') || url.includes('video');
        }

        function processMedia(item) {
            const isVid = isVideoMedia(item);
            const driveId = item.id || extractDriveId(item.url);

            let posterUrl = '';
            let streamUrl = '';
            let displayUrl = '';

            if (driveId) {
                posterUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
                streamUrl = `https://drive.google.com/file/d/${driveId}/preview`;
                displayUrl = isVid ? posterUrl : `https://lh3.googleusercontent.com/d/${driveId}`;
            } else {
                posterUrl = item.url;
                streamUrl = item.streamUrl || item.url;
                displayUrl = item.url;
            }

            return {
                ...item,
                isVideo: isVid,
                driveId: driveId,
                url: displayUrl,
                posterUrl: posterUrl,
                streamUrl: streamUrl
            };
        }

        try {
            const resData = await fetchWithCache(GALLERY_API_URL, 'cache_gallery_v3', 5);
            const rawCategories = resData && resData.categories ? resData.categories : (Array.isArray(resData) ? resData : []);
            
            const categories = rawCategories.map(cat => {
                const processedMedia = (cat.photos || []).map(processMedia);
                const photoCount = processedMedia.filter(m => !m.isVideo).length;
                const videoCount = processedMedia.filter(m => m.isVideo).length;

                return {
                    ...cat,
                    cover: formatDriveUrl(cat.cover),
                    photos: processedMedia,
                    photoCount: photoCount,
                    videoCount: videoCount,
                    totalCount: processedMedia.length
                };
            });

            let currentMediaList = [];
            let activeFilter = 'all';
            let currentIndex = 0;
            let currentCategoryName = '';

            const lightbox      = document.getElementById('gallery-lightbox');
            const lightboxImg   = document.getElementById('lightbox-image');
            const videoWrap     = document.getElementById('lightbox-video-wrap');
            const videoFrame    = document.getElementById('lightbox-video-frame');
            const videoPlayer   = document.getElementById('lightbox-video-player');
            const closeBtn      = document.getElementById('lightbox-close');
            const prevBtn       = document.getElementById('lightbox-prev');
            const nextBtn       = document.getElementById('lightbox-next');
            const mPrevBtn      = document.getElementById('lightbox-mobile-prev');
            const mNextBtn      = document.getElementById('lightbox-mobile-next');
            const counterEl     = document.getElementById('lightbox-counter');
            const titleEl       = document.getElementById('lightbox-title');

            function renderLightboxSlide(index) {
                if (!currentMediaList.length) return;
                currentIndex = (index + currentMediaList.length) % currentMediaList.length;
                const item = currentMediaList[currentIndex];

                if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${currentMediaList.length}`;
                if (titleEl) {
                    const typeLabel = item.isVideo ? '🎥 वीडियो' : '📸 फोटो';
                    titleEl.textContent = `${currentCategoryName} • ${typeLabel}`;
                }

                if (item.isVideo) {
                    if (lightboxImg) lightboxImg.style.display = 'none';
                    if (videoWrap) videoWrap.style.display = 'block';

                    if (item.driveId) {
                        if (videoPlayer) videoPlayer.style.display = 'none';
                        if (videoFrame) {
                            videoFrame.style.display = 'block';
                            videoFrame.src = item.streamUrl;
                        }
                    } else {
                        if (videoFrame) {
                            videoFrame.style.display = 'none';
                            videoFrame.src = '';
                        }
                        if (videoPlayer) {
                            videoPlayer.style.display = 'block';
                            videoPlayer.src = item.streamUrl;
                            videoPlayer.play().catch(() => {});
                        }
                    }
                } else {
                    if (videoWrap) videoWrap.style.display = 'none';
                    if (videoFrame) videoFrame.src = '';
                    if (videoPlayer) { videoPlayer.pause(); videoPlayer.src = ''; }

                    if (lightboxImg) {
                        lightboxImg.style.display = 'block';
                        lightboxImg.src = item.url;
                    }
                }
            }

            function openLightbox(index) {
                renderLightboxSlide(index);
                if (lightbox) {
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }

            function closeLightbox() {
                if (videoFrame) videoFrame.src = '';
                if (videoPlayer) { videoPlayer.pause(); videoPlayer.src = ''; }
                if (lightbox) {
                    lightbox.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }

            function showPrev() {
                renderLightboxSlide(currentIndex - 1);
            }

            function showNext() {
                renderLightboxSlide(currentIndex + 1);
            }

            if (!categories.length) {
                galleryContainer.innerHTML = '<div class="gallery-loading">कोई मीडिया उपलब्ध नहीं है।</div>';
                return;
            }

            galleryContainer.innerHTML = categories.map(category => {
                const firstId = category.photos[0] ? category.photos[0].driveId : '';
                return `
                <div class="gallery-category-card" data-category="${category.category}">
                    <img src="${category.cover}" alt="${category.category}" loading="lazy" referrerpolicy="no-referrer" data-driveid="${firstId}" onerror="if(!this.dataset.fb && this.dataset.driveid){this.dataset.fb='1'; this.src='https://drive.google.com/thumbnail?id=' + this.dataset.driveid + '&sz=w1200';}">
                    <div class="gallery-category-info">
                        <h3>${category.category}</h3>
                        <div class="gallery-photo-count">
                            <div class="gallery-count-badges">
                                ${category.photoCount > 0 ? `<span class="gallery-count-pill">📸 ${category.photoCount} फोटो</span>` : ''}
                                ${category.videoCount > 0 ? `<span class="gallery-count-pill" style="background: rgba(239,68,68,0.12); color: #ef4444;">🎥 ${category.videoCount} वीडियो</span>` : ''}
                                ${category.photoCount === 0 && category.videoCount === 0 ? `<span class="gallery-count-pill">${category.count || 0} मीडिया</span>` : ''}
                            </div>
                            <span class="gallery-see-btn">देखें →</span>
                        </div>
                    </div>
                </div>
            `;}).join('');

            function renderCategory(category) {
                activeFilter = 'all';
                currentCategoryName = category.category;

                function renderFilteredMedia() {
                    if (activeFilter === 'photos') {
                        currentMediaList = category.photos.filter(m => !m.isVideo);
                    } else if (activeFilter === 'videos') {
                        currentMediaList = category.photos.filter(m => m.isVideo);
                    } else {
                        currentMediaList = category.photos;
                    }

                    const grid = document.getElementById('category-media-grid');
                    if (!grid) return;

                    if (!currentMediaList.length) {
                        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b; font-weight: 600;">इस श्रेणी में कोई मीडिया उपलब्ध नहीं है।</div>';
                        return;
                    }

                    grid.innerHTML = currentMediaList.map((item, i) => `
                        <div class="gallery-media-card ${item.isVideo ? 'video-card' : 'photo-card'}" data-index="${i}">
                            <img src="${item.url}" alt="${category.category}" loading="lazy" referrerpolicy="no-referrer" data-driveid="${item.driveId || ''}" onerror="if(!this.dataset.fb && this.dataset.driveid){this.dataset.fb='1'; this.src='https://drive.google.com/thumbnail?id=' + this.dataset.driveid + '&sz=w1200';}">
                            ${item.isVideo ? `
                                <div class="gallery-video-play-btn">
                                    <svg viewBox="0 0 24 24" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                                <div class="gallery-video-badge">🎥 Video</div>
                            ` : ''}
                        </div>
                    `).join('');

                    grid.querySelectorAll('.gallery-media-card').forEach(card => {
                        card.addEventListener('click', () => {
                            const idx = parseInt(card.dataset.index, 10);
                            openLightbox(idx);
                        });
                    });
                }

                galleryViewer.innerHTML = `
                    <div class="gallery-viewer-header">
                        <h3 class="gallery-viewer-title">📸 🎥 ${category.category}</h3>
                        <div class="gallery-filter-bar">
                            <button class="gallery-filter-btn active" data-filter="all">
                                🌟 सभी (${category.photos.length})
                            </button>
                            ${category.photoCount > 0 ? `
                            <button class="gallery-filter-btn" data-filter="photos">
                                📸 फोटो (${category.photoCount})
                            </button>` : ''}
                            ${category.videoCount > 0 ? `
                            <button class="gallery-filter-btn" data-filter="videos">
                                🎥 वीडियो (${category.videoCount})
                            </button>` : ''}
                            <button id="close-gallery" class="btn-primary" style="margin-left: 8px; font-size: 0.84rem; padding: 7px 16px;">
                                ⬅ सभी श्रेणियाँ
                            </button>
                        </div>
                    </div>
                    <div class="gallery-viewer-grid" id="category-media-grid"></div>
                `;
                galleryViewer.style.display = 'block';

                // Wire filter buttons
                galleryViewer.querySelectorAll('.gallery-filter-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        galleryViewer.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        activeFilter = btn.dataset.filter;
                        renderFilteredMedia();
                    });
                });

                document.getElementById('close-gallery').addEventListener('click', () => {
                    galleryViewer.style.display = 'none';
                    galleryContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });

                renderFilteredMedia();
            }

            galleryViewer.style.display = 'none';

            if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
            if (prevBtn)  prevBtn.addEventListener('click', showPrev);
            if (nextBtn)  nextBtn.addEventListener('click', showNext);
            if (mPrevBtn) mPrevBtn.addEventListener('click', showPrev);
            if (mNextBtn) mNextBtn.addEventListener('click', showNext);

            if (lightbox) {
                let touchStartX = 0;
                let touchEndX = 0;

                lightbox.addEventListener('touchstart', (e) => {
                    touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });

                lightbox.addEventListener('touchend', (e) => {
                    touchEndX = e.changedTouches[0].screenX;
                    const diff = touchEndX - touchStartX;
                    if (Math.abs(diff) > 45) {
                        if (diff < 0) {
                            showNext();
                        } else {
                            showPrev();
                        }
                    }
                }, { passive: true });

                lightbox.addEventListener('click', (e) => {
                    if (e.target === lightbox || e.target === document.getElementById('lightbox-media-container')) {
                        closeLightbox();
                    }
                });
            }

            document.addEventListener('keydown', (e) => {
                if (!lightbox || !lightbox.classList.contains('active')) return;
                
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
            const data = await fetchWithCache(API_URL, 'cache_principal', 30);
            if (data.principalPhoto) data.principalPhoto = formatDriveUrl(data.principalPhoto);
            if (data.staffPhoto) data.staffPhoto = formatDriveUrl(data.staffPhoto);

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
                const pId = (data.principalPhoto && (data.principalPhoto.match(/[?&]id=([^&]+)/) || data.principalPhoto.match(/\/d\/([^/]+)/))) ? (data.principalPhoto.match(/[?&]id=([^&]+)/) || data.principalPhoto.match(/\/d\/([^/]+)/))[1] : '1RjP_eTO6pAPIFiRyrVNNEN2l2YcCshmp';
                const pSrc = `https://drive.google.com/thumbnail?id=${pId}&sz=w1200`;
                photoWrap.outerHTML = `<img id="principal-photo" src="${pSrc}" alt="${data.principal?.name || 'प्रधानाध्यापक'}" loading="lazy" referrerpolicy="no-referrer" data-driveid="${pId}" onerror="if(!this.dataset.fb){this.dataset.fb='1'; this.src='https://lh3.googleusercontent.com/d/' + this.dataset.driveid;} else if(this.dataset.fb==='1'){this.dataset.fb='2'; this.src='images/staff.jpg';}">`;
            }

            if (staffWrap) {
                const sId = (data.staffPhoto && (data.staffPhoto.match(/[?&]id=([^&]+)/) || data.staffPhoto.match(/\/d\/([^/]+)/))) ? (data.staffPhoto.match(/[?&]id=([^&]+)/) || data.staffPhoto.match(/\/d\/([^/]+)/))[1] : '1LDN7sKzh6ktyi9cmr95ZoFSCOSSp__jU';
                const sSrc = `https://drive.google.com/thumbnail?id=${sId}&sz=w1200`;
                staffWrap.outerHTML = `<img id="staff-group-photo" src="${sSrc}" alt="विद्यालय शिक्षक समूह" loading="lazy" referrerpolicy="no-referrer" data-driveid="${sId}" onerror="if(!this.dataset.fb){this.dataset.fb='1'; this.src='https://lh3.googleusercontent.com/d/' + this.dataset.driveid;} else if(this.dataset.fb==='1'){this.dataset.fb='2'; this.src='images/staff.jpg';}">`;
            }

        } catch (error) {
            console.error('Principal section error:', error);
            const msgContent = document.getElementById('principal-message-content');
            if (msgContent) msgContent.innerHTML = '<p style="opacity:.6">संदेश लोड नहीं हो सका।</p>';
            const pw = document.getElementById('principal-photo-wrap');
            if (pw) pw.outerHTML = `<img id="principal-photo" src="https://drive.google.com/thumbnail?id=1RjP_eTO6pAPIFiRyrVNNEN2l2YcCshmp&sz=w1200" alt="प्रधानाध्यापक" referrerpolicy="no-referrer" onerror="this.src='https://lh3.googleusercontent.com/d/1RjP_eTO6pAPIFiRyrVNNEN2l2YcCshmp';">`;
            const sw = document.getElementById('staff-photo-wrap');
            if (sw) sw.outerHTML = `<img id="staff-group-photo" src="https://drive.google.com/thumbnail?id=1LDN7sKzh6ktyi9cmr95ZoFSCOSSp__jU&sz=w1200" alt="विद्यालय स्टाफ" referrerpolicy="no-referrer" onerror="this.src='https://lh3.googleusercontent.com/d/1LDN7sKzh6ktyi9cmr95ZoFSCOSSp__jU';">`;
        }
    }

    // =====================
    // SCHOOL STATS
    // =====================
    async function loadSchoolStats() {
        const API_URL = 'https://script.google.com/macros/s/AKfycbw586WFslTxwTECtYWwu0XWiUD9czAeZ5BDg8zTnRSafE0PgF0PMc8W3rdU1h4BS1rS/exec';

        try {
            const data = await fetchWithCache(API_URL, 'cache_school_stats', 30);

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
            let data;
            if (action === 'get') {
                data = await fetchWithCache(`${API_URL}?action=get`, 'cache_visitor_count', 60);
            } else {
                const response = await fetch(`${API_URL}?action=visit`);
                data = await response.json();
                localStorage.setItem('uhs-last-visit', today);
            }

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
    // PORTAL ADMISSION SETTING
    // =====================
    async function checkAdmissionStatus() {
        const ADMIN_API_URL = "https://script.google.com/macros/s/AKfycbwQtEdZ-Y-NIgFFoWCmqQap-hCdfHk6lTFjSqswH-bOS75MkPr4PFz31S-TuFea9KE/exec";
        try {
            const data = await fetchWithCache(`${ADMIN_API_URL}?action=public.settings.get`, 'cache_admission_status', 1);
            if (data && data.success && data.settings) {
                if (data.settings.admission_open) {
                    // Calculate dynamic session (starting in April)
                    const today = new Date();
                    const currentYear = today.getFullYear();
                    const startYear = today.getMonth() >= 3 ? currentYear : currentYear - 1;
                    const endYear = startYear + 1;
                    const sessionStr = `${startYear}-${String(endYear).slice(-2)}`;

                    const sessionTextSpan = document.getElementById('admission-session-text');
                    if (sessionTextSpan) {
                        sessionTextSpan.textContent = sessionStr;
                    }

                    // Show Hero section banner
                    const banner = document.getElementById('admission-banner-container');
                    if (banner) banner.style.display = 'block';

                    // Proactively add admission link to the Desktop Nav bar
                    const desktopNav = document.querySelector('.desktop-nav');
                    if (desktopNav && !desktopNav.querySelector('a[href="admission.html"]')) {
                        const link = document.createElement('a');
                        link.href = 'admission.html';
                        link.style.color = '#2ecc71';
                        link.style.fontWeight = '700';
                        link.textContent = 'नामांकन (Online Admission)';
                        desktopNav.appendChild(link);
                    }

                    // Proactively add admission link to the Nav Drawer
                    const drawerNav = document.querySelector('.nav-drawer nav');
                    if (drawerNav && !drawerNav.querySelector('a[href="admission.html"]')) {
                        const link = document.createElement('a');
                        link.href = 'admission.html';
                        link.className = 'drawer-link';
                        link.style.color = '#2ecc71';
                        link.style.fontWeight = '700';
                        link.textContent = '📝 ऑनलाइन नामांकन';
                        drawerNav.appendChild(link);
                        
                        // Re-bind click event to close drawer
                        link.addEventListener('click', () => {
                            const drawer = document.getElementById('nav-drawer');
                            const overlay = document.getElementById('nav-overlay');
                            if (drawer) drawer.classList.remove('active');
                            if (overlay) overlay.classList.remove('active');
                            document.body.style.overflow = '';
                        });
                    }
                }

                // Check for result publication setting and show banner & link
                if (data.settings.result_published) {
                    const resultBanner = document.getElementById('result-banner-container');
                    if (resultBanner) resultBanner.style.display = 'block';

                    const navResultLink = document.getElementById('nav-result-link');
                    if (navResultLink) navResultLink.style.display = 'inline-block';

                    const drawerResultLink = document.getElementById('drawer-result-link');
                    if (drawerResultLink) drawerResultLink.style.display = 'block';
                }

                // Check for registration setting and show link
                if (data.settings.registration_open) {
                    const desktopNav = document.querySelector('.desktop-nav');
                    if (desktopNav && !desktopNav.querySelector('a[href="registration.html"]')) {
                        const link = document.createElement('a');
                        link.href = 'registration.html';
                        link.style.color = '#eab308'; // Gold color to stand out
                        link.style.fontWeight = '700';
                        link.textContent = 'पंजीयन (Registration)';
                        desktopNav.appendChild(link);
                    }

                    const drawerNav = document.querySelector('.nav-drawer nav');
                    if (drawerNav && !drawerNav.querySelector('a[href="registration.html"]')) {
                        const link = document.createElement('a');
                        link.href = 'registration.html';
                        link.className = 'drawer-link';
                        link.style.color = '#eab308';
                        link.style.fontWeight = '700';
                        link.textContent = '📋 ऑनलाइन पंजीयन';
                        drawerNav.appendChild(link);
                        
                        link.addEventListener('click', () => {
                            const drawer = document.getElementById('nav-drawer');
                            const overlay = document.getElementById('nav-overlay');
                            if (drawer) drawer.classList.remove('active');
                            if (overlay) overlay.classList.remove('active');
                            document.body.style.overflow = '';
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load portal settings:', error);
        }
    }

    // =====================
    // INIT & OPTIMIZED LOADING
    // =====================
    async function init() {
        // Critical components first
        checkAdmissionStatus();
        loadNotices();
        
        // Stagger non-critical components to prevent GAS API throttling and browser connection exhaustion
        setTimeout(() => {
            loadPrincipalSection();
        }, 500);

        setTimeout(() => {
            loadSchoolStats();
        }, 1000);

        setTimeout(() => {
            loadGallery();
        }, 1500);

        setTimeout(() => {
            updateVisitorCount();
        }, 2000);
    }
    
    init();

    console.log('UCHCH MADHYAMIK VIDYALAYA KAPARPURA website loaded successfully.');
});
