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

    // Animate cards on initial load
    animateCards();
});

async function showAllNovels() {
    const grid = document.getElementById('novelsGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="x79291c5d"><div class="x6b8054f6"></div><p>Loading novels...</p></div>';

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
        grid.innerHTML = '<div class="x79291c5d"><div class="x6b8054f6"></div><p>Searching...</p></div>';
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
      <div class="xfd34e0a6">
        <div class="xd9054b40">📭</div>
        <h3>No novels found</h3>
        <p>Try searching with different keywords</p>
      </div>`;
        return;
    }

    grid.innerHTML = novels.map(novel => `
    <div class="x52e80831">
      <div class="xdcac961f">
        <h2 class="x3f65f0e9">
          <a href="/novels/${escapeHtml(novel.id)}">${escapeHtml(novel.title)}</a>
        </h2>
        <p class="x352f8e5a">by ${escapeHtml(novel.author)}</p>
      </div>
      <div class="xe1339419">
        <span class="x4baffbf1">${escapeHtml(novel.genre)}</span>
      </div>
      <p class="xa75a6c3c">${escapeHtml(novel.description)}</p>
      <div class="xe31df97a">
        <span>📊 ${escapeHtml(novel.status)}</span>
        <span>📖 ${novel.totalChapters || 'Unknown'} chapters</span>
      </div>
      <div class="xfd804b3f">
        ${novel.chapters && novel.chapters.length > 0
            ? `<a href="/chapters/${escapeHtml(novel.id)}/1" class="x504854fd">Start Reading</a>`
            : `<a href="/novels/${escapeHtml(novel.id)}" class="x504854fd">View Details</a>`
        }
        <a href="/novels/${escapeHtml(novel.id)}" class="x7d440cc3">Details</a>
      </div>
    </div>
  `).join('');

    animateCards();
}

function displayError(message) {
    const grid = document.getElementById('novelsGrid');
    if (!grid) return;
    grid.innerHTML = `
    <div class="xfd34e0a6 x2bde8fd5">
      <div class="xd9054b40">⚠️</div>
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      <button class="x504854fd" id="retryBtn">Try Again</button>
    </div>`;
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) retryBtn.addEventListener('click', showAllNovels);
}

function animateCards() {
    const cards = document.querySelectorAll('.x52e80831');
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