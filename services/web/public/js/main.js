// Main JavaScript for the Novel Reading Website

document.addEventListener('DOMContentLoaded', function () {
    showAllNovels();

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const showAllBtn = document.getElementById('showAllBtn');

    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') searchNovels();
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', searchNovels);
    }

    if (showAllBtn) {
        showAllBtn.addEventListener('click', showAllNovels);
    }

    // ===== Forum Chat Modal UI Logic =====
    const chatModal = document.getElementById('forumChatModal');
    const chatShowBtn = document.getElementById('forumChatShowBtn');
    const chatToggleBtn = document.getElementById('forumChatToggleBtn');
    if (chatModal && chatShowBtn && chatToggleBtn) {
        // Show modal, hide button
        chatShowBtn.addEventListener('click', () => {
            chatModal.classList.remove('hidden');
            chatShowBtn.classList.add('hidden');
        });
        // Hide modal, show button
        chatToggleBtn.addEventListener('click', () => {
            chatModal.classList.add('hidden');
            chatShowBtn.classList.remove('hidden');
        });
        // ESC to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !chatModal.classList.contains('hidden')) {
                chatModal.classList.add('hidden');
                chatShowBtn.classList.remove('hidden');
            }
        });
    }

    // Animate cards on initial load
    animateCards();
});

async function showAllNovels() {
    const grid = document.getElementById('novelsGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading novels...</p></div>';

    try {
        const response = await fetch('/api/novels');
        if (!response.ok) throw new Error('Failed to fetch');
        const novels = await response.json();
        displayNovels(novels);
    } catch (error) {
        displayError('Failed to load novels: ' + error.message);
    }
}

async function searchNovels() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        showAllNovels();
        return;
    }

    const grid = document.getElementById('novelsGrid');
    if (grid) {
        grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Searching...</p></div>';
    }

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        const novels = await response.json();
        displayNovels(novels);
    } catch (error) {
        displayError('Search failed: ' + error.message);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function displayNovels(novels) {
    const grid = document.getElementById('novelsGrid');
    if (!grid) return;

    if (!novels.length) {
        grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No novels found</h3>
        <p>Try searching with different keywords</p>
      </div>`;
        return;
    }

    grid.innerHTML = novels.map(novel => `
    <div class="novel-card">
      <div class="novel-card-header">
        <h2 class="novel-title">
          <a href="/novels/${escapeHtml(novel.id)}">${escapeHtml(novel.title)}</a>
        </h2>
        <p class="novel-author">by ${escapeHtml(novel.author)}</p>
      </div>
      <div class="novel-genre">
        <span class="genre-tag">${escapeHtml(novel.genre)}</span>
      </div>
      <p class="novel-description">${escapeHtml(novel.description)}</p>
      <div class="novel-meta">
        <span>📊 ${escapeHtml(novel.status)}</span>
        <span>📖 ${novel.totalChapters || 'Unknown'} chapters</span>
      </div>
      <div class="novel-actions">
        ${novel.chapters && novel.chapters.length > 0
            ? `<a href="/chapters/${escapeHtml(novel.id)}/1" class="btn-primary">Start Reading</a>`
            : `<a href="/novels/${escapeHtml(novel.id)}" class="btn-primary">View Details</a>`
        }
        <a href="/novels/${escapeHtml(novel.id)}" class="btn-secondary">Details</a>
      </div>
    </div>
  `).join('');

    animateCards();
}

function displayError(message) {
    const grid = document.getElementById('novelsGrid');
    if (!grid) return;
    grid.innerHTML = `
    <div class="empty-state error-state">
      <div class="empty-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn-primary" id="retryBtn">Try Again</button>
    </div>`;
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) retryBtn.addEventListener('click', showAllNovels);
}

function animateCards() {
    const cards = document.querySelectorAll('.novel-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 80);
    });
}