const API_BASE_URL = API_CONFIG.API_URL;

class AuthManager {
    constructor() {
        this.token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        this.user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_INFO) || 'null');
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    getRole() {
        return this.user?.role || null;
    }

    getUser() {
        return this.user;
    }

    setAuth(user, token) {
        this.user = user;
        this.token = token;
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        window.location.href = 'login.html';
    }

    getAuthHeader() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

const auth = new AuthManager();

window.addEventListener('load', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage !== 'login.html' && currentPage !== 'index.html') {
        if (!auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        if (currentPage === 'admin.html' && auth.getRole() !== 'ADMIN') {
            window.location.href = 'customer.html';
        } else if (currentPage === 'customer.html' && auth.getRole() === 'ADMIN') {
            window.location.href = 'admin.html';
        }
    }
});

function toggleForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    if (formType === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        toggleBtns[0].classList.add('active');
        toggleBtns[1].classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        toggleBtns[0].classList.remove('active');
        toggleBtns[1].classList.add('active');
    }
    clearError();
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.classList.remove('show');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function handleLogin(event) {
    event.preventDefault();
    clearError();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        showError('Vui lòng điền đầy đủ thông tin');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Đang xử lý...';

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Đăng nhập thất bại');
        }

        const data = await response.json();
        const user = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            phone: data.user.phone || ''
        };

        auth.setAuth(user, data.accessToken);
        showToast(SUCCESS_MESSAGES.LOGIN_SUCCESS);

        if (user.role === 'ADMIN') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'customer.html';
        }
    } catch (error) {
        showError(error.message);
        btn.disabled = false;
        btn.innerHTML = 'Đăng nhập';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    clearError();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const phone = document.getElementById('registerPhone').value;
    const btn = document.getElementById('registerBtn');

    if (!name || !email || !password || !passwordConfirm) {
        showError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    if (password !== passwordConfirm) {
        showError('Mật khẩu không khớp');
        return;
    }

    if (password.length < 6) {
        showError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Đang xử lý...';

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone: phone || '', password, role: 'CUSTOMER' })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Đăng ký thất bại');
        }

        showToast(SUCCESS_MESSAGES.REGISTER_SUCCESS);
        document.getElementById('registerForm').reset();
        toggleForm('login');
        btn.disabled = false;
        btn.innerHTML = 'Đăng ký';
    } catch (error) {
        showError(error.message);
        btn.disabled = false;
        btn.innerHTML = 'Đăng ký';
    }
}

function logout() {
    auth.logout();
}
