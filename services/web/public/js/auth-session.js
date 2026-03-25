// User session management for header and auth UI

function getCurrentUser() {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
}

function updateHeaderAuthUI() {
    const user = getCurrentUser();
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');
    if (user && userMenu) {
        userMenu.style.display = 'flex';
        userMenu.querySelector('.user-name').textContent = user.username;
        if (authButtons) authButtons.style.display = 'none';
    } else if (authButtons) {
        authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', updateHeaderAuthUI);
window.updateHeaderAuthUI = updateHeaderAuthUI;
window.setCurrentUser = setCurrentUser;
window.getCurrentUser = getCurrentUser;
