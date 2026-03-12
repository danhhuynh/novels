// Main JavaScript for the Novel Reading Website

document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializeTheme();
    initializeKeyboardNavigation();
});

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-search');
    
    if (!searchInput) return;
    
    let searchTimeout;
    
    // Real-time search with debouncing
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(this.value);
        }, 300);
    });
    
    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch(searchInput.value);
        });
    }
    
    // Clear search button
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            window.location.href = '/';
        });
    }
    
    // Enter key search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(this.value);
        }
    });
}

function performSearch(query) {
    if (!query.trim()) {
        window.location.href = '/';
        return;
    }
    
    // Update URL with search query
    const url = new URL(window.location.href);
    url.searchParams.set('search', query.trim());
    window.location.href = url.toString();
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('isDarkTheme');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-theme');
    }
}

// Keyboard navigation
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', function(event) {
        // Only handle keyboard shortcuts when not in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
            return;
        }
        
        // Ignore if modifier keys are pressed (for browser shortcuts)
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }
        
        switch (event.key) {
            case '/':
                event.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
                break;
                
            case 'Escape':
                const activeElement = document.activeElement;
                if (activeElement && activeElement.blur) {
                    activeElement.blur();
                }
                break;
        }
    });
}

// Utility functions for novel cards
function handleNovelCardInteraction() {
    const novelCards = document.querySelectorAll('.novel-card');
    
    novelCards.forEach(card => {
        // Add keyboard support
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const link = card.querySelector('.novel-title a');
                if (link) {
                    link.click();
                }
            }
        });
        
        // Make cards focusable
        if (!card.hasAttribute('tabindex')) {
            card.setAttribute('tabindex', '0');
        }
    });
}

// Chapter navigation utilities
function enhanceChapterNavigation() {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Loading states for better UX
function showLoadingState(element) {
    if (!element) return;
    
    const originalText = element.textContent;
    element.textContent = 'Loading...';
    element.disabled = true;
    
    return function hideLoading() {
        element.textContent = originalText;
        element.disabled = false;
    };
}

// Error handling for network requests
function handleNetworkError(error) {
    console.error('Network error:', error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>Something went wrong. Please try again later.</p>
        <button onclick="this.parentElement.remove()">Dismiss</button>
    `;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Local storage utilities
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('Could not read from localStorage:', error);
        return defaultValue;
    }
}

// Reading progress tracking
function trackReadingProgress() {
    if (window.location.pathname.includes('/chapters/')) {
        const pathParts = window.location.pathname.split('/');
        const novelId = pathParts[2];
        const chapterNumber = parseInt(pathParts[3]);
        
        if (novelId && chapterNumber) {
            const progress = getFromLocalStorage('readingProgress', {});
            if (!progress[novelId] || progress[novelId] < chapterNumber) {
                progress[novelId] = chapterNumber;
                saveToLocalStorage('readingProgress', progress);
            }
        }
    }
}

// Initialize reading progress tracking
trackReadingProgress();

// Performance optimization: Lazy loading for images
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// Initialize lazy loading
initializeLazyLoading();

// Accessibility enhancements
function enhanceAccessibility() {
    // Add skip link for keyboard users
    if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1000;
            transition: top 0.2s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // Add main content ID if not present
    const mainContent = document.querySelector('.main-content');
    if (mainContent && !mainContent.id) {
        mainContent.id = 'main-content';
    }
    
    // Enhance focus management
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
}

// Initialize accessibility enhancements
enhanceAccessibility();

// Export functions for use in other scripts
window.NovelReads = {
    performSearch,
    showLoadingState,
    handleNetworkError,
    saveToLocalStorage,
    getFromLocalStorage,
    trackReadingProgress
};