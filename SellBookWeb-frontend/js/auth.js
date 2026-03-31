// ==============================
// AUTHENTICATION MANAGEMENT
// ==============================

let API_BASE_URL = 'http://localhost:3005/api';

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
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
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    getAuthHeader() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

let auth = new AuthManager();

// Check authentication on page load
window.addEventListener('load', function () {
    let currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage !== 'login.html') {
        if (!auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Redirect based on role
        if (currentPage === 'admin.html' && auth.getRole() !== 'ADMIN') {
            window.location.href = 'customer.html';
        } else if (currentPage === 'customer.html' && auth.getRole() === 'ADMIN') {
            window.location.href = 'admin.html';
        }
    }
});

// ==============================
// LOGIN/REGISTER FUNCTIONS
// ==============================

function toggleForm(formType) {
    let loginForm = document.getElementById('loginForm');
    let registerForm = document.getElementById('registerForm');
    let forgotForm = document.getElementById('forgotPasswordForm');
    let resetForm = document.getElementById('resetPasswordForm');
    let toggleBtns = document.querySelectorAll('.toggle-btn');

    if (loginForm) loginForm.classList.remove('active');
    if (registerForm) registerForm.classList.remove('active');
    if (forgotForm) forgotForm.classList.remove('active');
    if (resetForm) resetForm.classList.remove('active');

    if (formType === 'login') {
        if (loginForm) loginForm.classList.add('active');
        if (toggleBtns[0]) toggleBtns[0].classList.add('active');
        if (toggleBtns[1]) toggleBtns[1].classList.remove('active');
    } else if (formType === 'register') {
        if (registerForm) registerForm.classList.add('active');
        if (toggleBtns[0]) toggleBtns[0].classList.remove('active');
        if (toggleBtns[1]) toggleBtns[1].classList.add('active');
    } else if (formType === 'forgot') {
        if (forgotForm) forgotForm.classList.add('active');
        if (toggleBtns[0]) toggleBtns[0].classList.remove('active');
        if (toggleBtns[1]) toggleBtns[1].classList.remove('active');
    } else if (formType === 'reset') {
        if (resetForm) resetForm.classList.add('active');
        if (toggleBtns[0]) toggleBtns[0].classList.remove('active');
        if (toggleBtns[1]) toggleBtns[1].classList.remove('active');
    }

    clearError();
    clearNotice();
}

function showError(message) {
    let errorDiv = document.getElementById('errorMessage');
    let noticeDiv = document.getElementById('noticeMessage');
    if (noticeDiv) {
        noticeDiv.classList.remove('show');
    }
    if (!errorDiv) {
        return;
    }
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function clearError() {
    let errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}

function showNotice(message) {
    let noticeDiv = document.getElementById('noticeMessage');
    let errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
    if (!noticeDiv) {
        return;
    }
    noticeDiv.textContent = message;
    noticeDiv.classList.add('show');
}

function clearNotice() {
    let noticeDiv = document.getElementById('noticeMessage');
    if (noticeDiv) {
        noticeDiv.classList.remove('show');
    }
}

function showAlert(message) {
    alert(message);
}

function showForgotPasswordForm() {
    toggleForm('forgot');
}

function backToLoginForm() {
    toggleForm('login');
}

async function handleLogin(event) {
    event.preventDefault();
    clearError();

    let email = document.getElementById('loginEmail').value;
    let password = document.getElementById('loginPassword').value;
    let btn = document.getElementById('loginBtn');

    // Validation
    if (!email || !password) {
        showError('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Äang xá»­ lÃ½...';

        // Call login API
        let response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!response.ok) {
            let error = await response.json().catch(function () { return {}; });
            throw new Error(error.message || 'ÄÄƒng nháº­p tháº¥t báº¡i');
        }

        let data = await response.json();
        
        // Save auth data
        // API returns { accessToken, refreshToken, user: { id, name, email, ... } }
        let userData = data.user || data; // Fallback to data if user is not nested
        let user = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            phone: userData.phone || ''
        };

        let token = data.accessToken || data.token; // Support both accessToken and token
        auth.setAuth(user, token);

        // Redirect based on role
        if (user.role === 'ADMIN') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'customer.html';
        }
    } catch (error) {
        showError(error.message);
        btn.disabled = false;
        btn.innerHTML = 'ÄÄƒng nháº­p';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    clearError();

    let name = document.getElementById('registerName').value;
    let email = document.getElementById('registerEmail').value;
    let password = document.getElementById('registerPassword').value;
    let passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    let phone = document.getElementById('registerPhone').value;
    let btn = document.getElementById('registerBtn');

    // Validation
    if (!name || !email || !password || !passwordConfirm) {
        showError('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin báº¯t buá»™c');
        return;
    }

    if (password !== passwordConfirm) {
        showError('Máº­t kháº©u khÃ´ng khá»›p');
        return;
    }

    if (password.length < 6) {
        showError('Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±');
        return;
    }

    if (phone && !/^[0-9]{10}$/.test(phone)) {
        showError('Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng há»£p lá»‡, vui lÃ²ng nháº­p Ä‘Ãºng 10 chá»¯ sá»‘');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Äang xá»­ lÃ½...';

        // Register user
        let response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone: phone || '',
                password,
                role: 'CUSTOMER',
                active: true
            })
        });

        if (!response.ok) {
            let error = await response.json().catch(function () { return {}; });
            throw new Error(error.message || 'ÄÄƒng kÃ½ tháº¥t báº¡i');
        }

        let data = await response.json();
        
        showAlert('ÄÄƒng kÃ½ thÃ nh cÃ´ng! Vui lÃ²ng Ä‘Äƒng nháº­p.');
        
        // Clear form and switch to login
        document.getElementById('registerForm').reset();
        toggleForm('login');
        btn.disabled = false;
        btn.innerHTML = 'ÄÄƒng kÃ½';
    } catch (error) {
        showError(error.message);
        btn.disabled = false;
        btn.innerHTML = 'ÄÄƒng kÃ½';
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    clearError();
    clearNotice();

    let email = document.getElementById('forgotEmail').value;
    let btn = document.getElementById('forgotBtn');

    if (!email) {
        showError('Vui lòng nhập email để đặt lại mật khẩu');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Đang xử lý...';

        let response = await fetch(`${API_BASE_URL}/auth/forgotpassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            let error = await response.json().catch(function () { return {}; });
            throw new Error(error.message || 'Không gửi được yêu cầu quên mật khẩu');
        }

        showNotice('Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn.');
        let forgotForm = document.getElementById('forgotPasswordForm');
        if (forgotForm) {
            forgotForm.reset();
        }
        backToLoginForm();
    } catch (error) {
        showError(error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Gửi email đặt lại mật khẩu';
    }
}

async function handleResetPassword(event) {
    event.preventDefault();
    clearError();
    clearNotice();

    let token = document.getElementById('resetToken').value;
    let password = document.getElementById('resetPassword').value;
    let passwordConfirm = document.getElementById('resetPasswordConfirm').value;
    let btn = document.getElementById('resetBtn');

    if (!token) {
        showError('Thiếu token đặt lại mật khẩu');
        return;
    }

    if (!password || password.length < 6) {
        showError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }

    if (password !== passwordConfirm) {
        showError('Mật khẩu xác nhận không khớp');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Đang xử lý...';

        let response = await fetch(`${API_BASE_URL}/auth/resetpassword/${encodeURIComponent(token)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            let error = await response.json().catch(function () { return {}; });
            throw new Error(error.message || 'Đặt lại mật khẩu thất bại');
        }

        redirectToResetResult('success', 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
    } catch (error) {
        redirectToResetResult('failed', error.message, token);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Đặt lại mật khẩu';
    }
}

function parseResetTokenFromUrl() {
    let params = new URLSearchParams(window.location.search);
    let token = params.get('token');
    if (token) {
        return token;
    }

    let hash = window.location.hash || '';
    if (hash.startsWith('#token=')) {
        return decodeURIComponent(hash.replace('#token=', ''));
    }

    return '';
}

function tryShowResetPasswordFormFromUrl() {
    let token = parseResetTokenFromUrl();
    if (!token) {
        return;
    }

    let tokenInput = document.getElementById('resetToken');
    if (tokenInput) {
        tokenInput.value = token;
    }

    toggleForm('reset');
    showNotice('Vui lòng nhập mật khẩu mới để hoàn tất đặt lại mật khẩu.');
}

function redirectToResetResult(status, message, token) {
    let params = new URLSearchParams();
    params.set('status', status);
    if (message) {
        params.set('message', message);
    }
    if (token) {
        params.set('token', token);
    }
    window.location.href = `reset-result.html?${params.toString()}`;
}

// For local testing without backend login (remove in production)
function loginAsDemo(email, role) {
    let user = {
        id: '123',
        name: role === 'ADMIN' ? 'Admin User' : 'Customer User',
        email: email,
        role: role,
        phone: '0123456789'
    };
    auth.setAuth(user, 'demo-token');
    
    if (role === 'ADMIN') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'customer.html';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        tryShowResetPasswordFormFromUrl();
    });
} else {
    tryShowResetPasswordFormFromUrl();
}

