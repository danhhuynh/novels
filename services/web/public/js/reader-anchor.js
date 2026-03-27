class ReaderAnchor {
    constructor(chapterId) {
        this.chapterId = chapterId;
        this.storageKey = `reader_anchor_${chapterId}`;
        this.container = document.querySelector('#chapter-text');

        if (!this.container) return;

        // Find all trackable readable elements
        this.elements = Array.from(this.container.querySelectorAll('p, h2, img'));
        if (this.elements.length === 0) return;

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
    }

    injectUI() {
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

        if (closestIdx !== -1) {
            this.anchorIndex = closestIdx;
        }
    }

    startSaveLoop() {
        // Throttled interval save every 10s
        setInterval(() => {
            if (this.anchorIndex !== null && this.anchorIndex !== this.lastSavedIndex) {
                const scrollPercentage = this.getScrollProgress();

                // If the user reaches the bottom (~99%), clear the saved memory
                if (scrollPercentage >= 99) {
                    localStorage.removeItem(this.storageKey);
                    this.lastSavedIndex = null;
                } else {
                    localStorage.setItem(this.storageKey, this.anchorIndex.toString());
                    this.lastSavedIndex = this.anchorIndex;
                }
            }
        }, 10000);
    }

    restorePosition() {
        const savedIndexRaw = localStorage.getItem(this.storageKey);
        if (savedIndexRaw !== null) {
            const savedIndex = parseInt(savedIndexRaw, 10);

            // Wait slightly for DOM to settle and arbitrary fonts to render
            setTimeout(() => {
                const targetEl = this.elements[savedIndex];
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Show a toast when successfully resumed not from the very beginning
                    if (savedIndex > 2) {
                        this.showToast();
                    }
                }
            }, 500);
        }
    }

    showToast() {
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
        const progress = this.getScrollProgress();
        this.progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }
}

function initReaderAnchor(chapterId) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new ReaderAnchor(chapterId));
    } else {
        new ReaderAnchor(chapterId);
    }
}
