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

    // ===== Forum Chat Modal UI Logic & API Integration =====
    const chatModal = document.getElementById('forumChatModal');
    const chatShowBtn = document.getElementById('forumChatShowBtn');
    const chatToggleBtn = document.getElementById('forumChatToggleBtn');
    const chatMessagesBox = document.getElementById('forumChatMessages');
    const chatForm = document.getElementById('forumChatForm');
    const chatInput = document.getElementById('forumChatInput');
    let chatLoading = false;
    let chatPollingInterval = null;

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    function renderMessages(messages) {
        if (!Array.isArray(messages) || !messages.length) {
            chatMessagesBox.innerHTML = '<div class="forum-chat-loading">Chưa có tin nhắn nào.</div>';
            return;
        }
        chatMessagesBox.innerHTML = messages.map(msg =>
            `<div class="forum-chat-message">
                <span class="forum-chat-username">${escapeHtml(msg.username || 'Ẩn danh')}</span>:
                <span class="forum-chat-text">${escapeHtml(msg.message)}</span>
                <span class="forum-chat-time">${msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>`
        ).join('');
    }

    async function fetchMessages() {
        if (chatLoading) return;
        chatLoading = true;
        chatMessagesBox.innerHTML = '<div class="forum-chat-loading">Đang tải tin nhắn...</div>';
        try {
            const res = await fetch('/api/forum-chat');
            if (!res.ok) throw new Error('Không thể tải tin nhắn');
            const data = await res.json();
            renderMessages(data.messages || []);
        } catch (err) {
            chatMessagesBox.innerHTML = `<div class="forum-chat-loading">${escapeHtml(err.message)}</div>`;
        } finally {
            chatLoading = false;
        }
    }

    async function sendMessage(e) {
        e.preventDefault();
        if (!chatInput) return;
        const message = chatInput.value.trim();
        if (!message) return;
        if (message.length > 70) {
            alert('Tin nhắn tối đa 70 ký tự.');
            return;
        }
        const user = window.getCurrentUser && window.getCurrentUser();
        if (!user) {
            alert('Bạn cần đăng nhập để gửi tin nhắn.');
            return;
        }
        chatInput.disabled = true;
        try {
            const res = await fetch('/api/forum-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    username: user.username,
                    userId: user.id || user.email || user._id || user.userId || 'unknown'
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Gửi tin nhắn thất bại');
            }
            chatInput.value = '';
            fetchMessages();
        } catch (err) {
            alert(err.message);
        } finally {
            chatInput.disabled = false;
        }
    }

    if (chatModal && chatShowBtn && chatToggleBtn) {
        // Show modal, hide button
        chatShowBtn.addEventListener('click', () => {
            chatModal.classList.remove('hidden');
            chatShowBtn.classList.add('hidden');
            fetchMessages();
            if (!chatPollingInterval) {
                chatPollingInterval = setInterval(fetchMessages, 5000);
            }
        });
        // Hide modal, show button
        chatToggleBtn.addEventListener('click', () => {
            chatModal.classList.add('hidden');
            chatShowBtn.classList.remove('hidden');
            if (chatPollingInterval) {
                clearInterval(chatPollingInterval);
                chatPollingInterval = null;
            }
        });
        // ESC to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !chatModal.classList.contains('hidden')) {
                chatModal.classList.add('hidden');
                chatShowBtn.classList.remove('hidden');
                if (chatPollingInterval) {
                    clearInterval(chatPollingInterval);
                    chatPollingInterval = null;
                }
            }
        });
        // Initial fetch if modal is open by default
        if (!chatModal.classList.contains('hidden')) {
            fetchMessages();
            if (!chatPollingInterval) {
                chatPollingInterval = setInterval(fetchMessages, 5000);
            }
        }
    }

    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', sendMessage);
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