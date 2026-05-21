function getToken() {
    return localStorage.getItem('diag_token');
}

function logout() {
    localStorage.removeItem('diag_token');
    window.location.href = 'login.html';
}

async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401 || response.status === 403) {
        logout();
        return;
    }
    
    return response;
}

// Redirect if already logged in on login/register pages
window.addEventListener('DOMContentLoaded', () => {
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
    if (isAuthPage && getToken()) {
        window.location.href = 'diagnostico.html';
    }
});
