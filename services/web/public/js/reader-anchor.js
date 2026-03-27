class ReaderAnchor {
    constructor(chapterId) {
        console.log('[ReaderAnchor] Initializing for chapter:', chapterId);
        this.chapterId = chapterId;
        this.storageKey = `reader_anchor_${chapterId}`;
        this.container = document.querySelector('#chapter-text');

        if (!this.container) {
            console.error('[ReaderAnchor] Container #chapter-text not found. Aborting.');
            return;
        }

        // Find all trackable readable elements
        // Excluded inline elements like 'span' to prevent duplicate bounding rects inside block elements.
        let rawElements = Array.from(this.container.querySelectorAll('p, h2, h3, h4, h5, img, li, blockquote'));

        // If the chapter is essentially a single blob of text or uses raw <br> line breaks instead of <p> tags,
        // it makes accurate IntersectionObserver tracking literally impossible because the entire chapter is just "1 element"
        // (hence Anchor Index constantly staying at 0). We will normalize the DOM into <p> chunks!
        if (rawElements.length < 5) {
            console.log('[ReaderAnchor] Low semantic element count. Normalizing DOM <br> breaks into standard <p> paragraphs...');
            // Replace <br> tags with paragraph closures to fragment the giant text block.
            let cleanHtml = `<p>${this.container.innerHTML.replace(/<br\s*\/?>/gi, '</p><p>')}</p>`;
            this.container.innerHTML = cleanHtml;

            // Re-query now that the DOM is properly formatted into block elements
            rawElements = Array.from(this.container.querySelectorAll('p, h2, h3, h4, h5, img, li, blockquote'));
        }

        // Filter out completely empty paragraphs (e.g. from back-to-back <br><br> transformations)
        this.elements = rawElements.filter(el => {
            return el.textContent.trim().length > 0 || el.tagName === 'IMG';
        });

        console.log(`[ReaderAnchor] Found ${this.elements.length} trackable elements after normalization and filtering.`);

        if (this.elements.length === 0) {
            console.warn('[ReaderAnchor] No trackable elements found inside container. Aborting tracker API.', this.container.innerHTML.substring(0, 200));
            return;
        }

        // Disable native browser scroll restoration to prevent fighting with our custom JS anchor system
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        // Assign static ID/indices for reliable tracking across resize
        this.elements.forEach((el, idx) => {
            el.setAttribute('data-read-idx', idx);
        });

        this.visibleElements = new Set();
        this.anchorIndex = null;
        this.lastSavedIndex = null;

        this.injectUI();
        this.initObserver();
        this.restorePosition();
        this.startSaveLoop();
        this.setupScrollListener();
        console.log('[ReaderAnchor] Initialization complete.');
    }

    injectUI() {
        console.log('[ReaderAnchor] Injecting UI elements (progress bar, toast).');
        // Create the progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.id = 'reading-progress-bar';
        document.body.appendChild(this.progressBar);

        // Create the toast popup
        this.toast = document.createElement('div');
        this.toast.id = 'resume-toast';
        this.toast.innerHTML = '<span>Resuming where you left off...</span>';
        document.body.appendChild(this.toast);
    }

    initObserver() {
        console.log('[ReaderAnchor] Setting up IntersectionObserver.');
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const idx = parseInt(entry.target.getAttribute('data-read-idx'), 10);
                if (entry.isIntersecting) {
                    this.visibleElements.add(idx);
                } else {
                    this.visibleElements.delete(idx);
                }
            });
            this.updateAnchor();
        }, {
            rootMargin: '0px 0px 0px 0px'
        });

        this.elements.forEach(el => this.observer.observe(el));
    }

    updateAnchor() {
        if (this.visibleElements.size === 0) return;

        let closestIdx = -1;
        let minDistance = Infinity;

        // Target an arbitrary reading line near the top nav
        const targetY = 100;

        for (const idx of this.visibleElements) {
            const el = this.elements[idx];
            if (!el) continue;

            const rect = el.getBoundingClientRect();
            const distance = Math.abs(rect.top - targetY);

            if (distance < minDistance) {
                minDistance = distance;
                closestIdx = idx;
            }
        }

        if (closestIdx !== -1 && this.anchorIndex !== closestIdx) {
            this.anchorIndex = closestIdx;
            // Verbose log disabled to avoid console spam over scroll
            // console.log(`[ReaderAnchor] Anchor updated to index: ${this.anchorIndex}`);
        }
    }

    startSaveLoop() {
        console.log(`[ReaderAnchor] Starting auto-save loop to key: ${this.storageKey}`);
        // Throttled interval save every 10s
        setInterval(() => this.forceSave(), 10000);

        // Save exactly upon page reload/exit to ensure 100% accurate position
        window.addEventListener('beforeunload', () => this.forceSave());
    }

    forceSave() {
        if (this.anchorIndex !== null && this.anchorIndex !== this.lastSavedIndex) {
            const scrollPercentage = this.getScrollProgress();

            // If the user reaches the bottom (~99%), clear the saved memory
            if (scrollPercentage >= 99) {
                console.log('[ReaderAnchor] Reached bottom (>=99%). Clearing saved state.');
                localStorage.removeItem(this.storageKey);
                this.lastSavedIndex = null;
            } else {
                console.log(`[ReaderAnchor] Auto-saving progress. Anchor Index: ${this.anchorIndex}, Progress: ${Math.round(scrollPercentage)}%`);
                localStorage.setItem(this.storageKey, this.anchorIndex.toString());
                this.lastSavedIndex = this.anchorIndex;
            }
        }
    }

    restorePosition() {
        const savedIndexRaw = localStorage.getItem(this.storageKey);
        console.log(`[ReaderAnchor] LocalStorage check for '${this.storageKey}' returned:`, savedIndexRaw);

        if (savedIndexRaw !== null) {
            const savedIndex = parseInt(savedIndexRaw, 10);

            // Wait slightly for DOM to settle and arbitrary fonts to render
            setTimeout(() => {
                const targetEl = this.elements[savedIndex];
                if (targetEl) {
                    console.log(`[ReaderAnchor] Restoring position to element at index: ${savedIndex}`);
                    targetEl.scrollIntoView({ behavior: 'auto', block: 'start' });

                    // Show a toast when successfully resumed not from the very beginning
                    if (savedIndex > 0) {
                        this.showToast();
                    }
                } else {
                    console.warn(`[ReaderAnchor] Saved index ${savedIndex} exceeds available elements (${this.elements.length}).`);
                }
            }, 300);
        }
    }

    showToast() {
        if (!this.toast) return;
        this.toast.classList.add('show');
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    setupScrollListener() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateProgressBar();

                    // Fast track: remove saved if bottom reached without waiting 10s
                    if (this.getScrollProgress() >= 99) {
                        localStorage.removeItem(this.storageKey);
                        this.lastSavedIndex = null;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Ensure UI displays current progress initially
        setTimeout(() => this.updateProgressBar(), 100);
    }

    getScrollProgress() {
        const docHeight = document.documentElement.scrollHeight;
        const scrollHeight = docHeight - window.innerHeight;
        if (scrollHeight <= 0) return 100;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const progress = (scrollTop / scrollHeight) * 100;
        return progress;
    }

    updateProgressBar() {
        if (!this.progressBar) return;
        const progress = this.getScrollProgress();
        this.progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }
}

function initReaderAnchor(chapterId) {
    console.log('[ReaderAnchor] initReaderAnchor called with:', chapterId);
    if (document.readyState === 'loading') {
        console.log('[ReaderAnchor] Document loading, attaching DOMContentLoaded listener.');
        document.addEventListener('DOMContentLoaded', () => new ReaderAnchor(chapterId));
    } else {
        console.log('[ReaderAnchor] Document already loaded. Initializing immediately.');
        new ReaderAnchor(chapterId);
    }
}
