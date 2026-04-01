let currentPage = 0;
let currentCategory = '';
let currentSearch = '';

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionId}-section`).classList.add('active');
    
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    event.target.classList.add('active');

    if (sectionId === 'books') loadBooks();
    if (sectionId === 'cart') loadCart();
    if (sectionId === 'orders') loadMyOrders();
    if (sectionId === 'profile') loadProfile();
}

async function loadBooks() {
    try {
        const data = await booksAPI.getAll(currentPage, 12, currentCategory, currentSearch);
        const grid = document.getElementById('booksGrid');
        
        if (!data.books || data.books.length === 0) {
            grid.innerHTML = '<div class="empty-state"><h3>Không tìm thấy sách nào</h3></div>';
            return;
        }

        grid.innerHTML = data.books.map(book => `
            <div class="book-card">
                <img src="${book.image || 'https://via.placeholder.com/250x250?text=No+Image'}" alt="${book.title}" class="book-image">
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author}</div>
                    <div class="book-price">${formatPrice(book.price)}</div>
                    <div class="book-actions">
                        <button class="submit-btn btn-sm" onclick="addToCart('${book._id}')">Thêm vào giỏ</button>
                    </div>
                </div>
            </div>
        `).join('');

        renderPagination(data.pagination);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 0; i < pagination.totalPages; i++) {
        html += `<button class="${i === pagination.page ? 'active' : ''}" onclick="goToPage(${i})">${i + 1}</button>`;
    }
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadBooks();
}

function searchBooks() {
    currentSearch = document.getElementById('searchInput').value;
    currentCategory = document.getElementById('categoryFilter').value;
    currentPage = 0;
    loadBooks();
}

async function loadCategories() {
    try {
        const categories = await categoriesAPI.getAll();
        const select = document.getElementById('categoryFilter');
        select.innerHTML = '<option value="">Tất cả danh mục</option>' +
            categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function addToCart(bookId) {
    try {
        await cartAPI.addItem(bookId, 1);
        showToast(SUCCESS_MESSAGES.ITEM_ADDED_TO_CART);
        updateCartCount();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function updateCartCount() {
    try {
        const cart = await cartAPI.getMyCart();
        const count = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        document.getElementById('cartCount').textContent = count;
    } catch (error) {
        console.error('Failed to update cart count:', error);
    }
}

async function loadCart() {
    try {
        const cart = await cartAPI.getMyCart();
        const container = document.getElementById('cartContent');
        
        if (!cart.items || cart.items.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>Giỏ hàng trống</h3></div>';
            return;
        }

        const itemsHtml = cart.items.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartItem('${item.bookId}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartItem('${item.bookId}', ${item.quantity + 1})">+</button>
                </div>
                <button class="btn-delete" onclick="removeCartItem('${item.bookId}')">Xóa</button>
            </div>
        `).join('');

        container.innerHTML = itemsHtml + `
            <div class="cart-total">
                <h3>Tổng: ${formatPrice(cart.totalPrice)}</h3>
                <button class="submit-btn" onclick="checkout()" style="margin-top: 1rem;">Đặt hàng</button>
            </div>
        `;
        
        updateCartCount();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function updateCartItem(bookId, quantity) {
    try {
        if (quantity <= 0) {
            await removeCartItem(bookId);
        } else {
            await cartAPI.updateItem(bookId, quantity);
            loadCart();
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function removeCartItem(bookId) {
    try {
        await cartAPI.removeItem(bookId);
        loadCart();
        showToast('Đã xóa khỏi giỏ hàng');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function checkout() {
    try {
        const cart = await cartAPI.getMyCart();
        if (!cart.items || cart.items.length === 0) {
            showToast('Giỏ hàng trống', 'error');
            return;
        }
        window.location.href = 'checkout.html';
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadMyOrders() {
    try {
        const data = await ordersAPI.getMyOrders();
        const container = document.getElementById('ordersList');
        
        if (!data.orders || data.orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>Chưa có đơn hàng nào</h3></div>';
            return;
        }

        container.innerHTML = data.orders.map(order => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">Đơn hàng #${order._id.slice(-6)}</div>
                    <div class="cart-item-price">${formatPrice(order.totalPrice)}</div>
                    <div>${order.items?.length || 0} sản phẩm</div>
                </div>
                <span class="badge badge-${order.status.toLowerCase()}">${formatStatus(order.status)}</span>
                ${order.status === 'PENDING' ? `<button class="btn-delete" onclick="cancelOrder('${order._id}')">Hủy</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    
    try {
        await ordersAPI.cancel(orderId);
        showToast('Đã hủy đơn hàng');
        loadMyOrders();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function formatProfileDate(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
}

function initialsFromName(name) {
    if (!name || !String(name).trim()) return 'U';
    return String(name)
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function setProfileRoleBadge(el, role) {
    if (!el) return;
    const r = role || 'CUSTOMER';
    el.textContent = r;
    el.className =
        'profile-role-badge ' +
        (r === 'ADMIN' || r === 'SUPER_ADMIN' ? 'role-admin' : 'role-customer');
}

function renderProfileAvatar(container, name, avatarUrl) {
    if (!container) return;
    const url = avatarUrl && String(avatarUrl).trim();
    if (url && /^https?:\/\//i.test(url)) {
        container.innerHTML = '';
        const img = document.createElement('img');
        img.src = url;
        img.alt = name || '';
        img.onerror = () => {
            container.textContent = initialsFromName(name);
        };
        container.appendChild(img);
    } else {
        container.textContent = initialsFromName(name);
    }
}

function applyProfileToUI(p) {
    if (!p) return;
    const name = p.name || '';
    const email = p.email || '';
    const phone = p.phone || '';
    const role = p.role || 'CUSTOMER';
    const active = p.active !== false;

    const dn = document.getElementById('profileDisplayName');
    if (dn) dn.textContent = name || '—';

    renderProfileAvatar(document.getElementById('profileAvatar'), name, p.avatar);

    const em = document.getElementById('profileEmailDisplay');
    if (em) em.textContent = email || '—';

    const ph = document.getElementById('profilePhoneDisplay');
    if (ph) ph.textContent = phone || 'Chưa cập nhật';

    setProfileRoleBadge(document.getElementById('profileRoleBadge'), role);

    const ca = document.getElementById('profileCreatedAt');
    if (ca) ca.textContent = formatProfileDate(p.createdAt);

    const st = document.getElementById('profileStatus');
    if (st) {
        st.textContent = active ? 'Đang hoạt động' : 'Đã khóa';
        st.className = 'profile-status-pill ' + (active ? 'is-active' : 'is-inactive');
    }

    const nameIn = document.getElementById('profileName');
    const emIn = document.getElementById('profileEmail');
    const phIn = document.getElementById('profilePhone');
    if (nameIn) nameIn.value = name;
    if (emIn) emIn.value = email;
    if (phIn) phIn.value = phone;
}

async function loadProfile() {
    try {
        const profile = await usersAPI.getProfile();
        applyProfileToUI(profile);
        const prev = auth.getUser() || {};
        const merged = {
            ...prev,
            id: profile.id || profile._id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            phone: profile.phone || '',
            avatar: profile.avatar,
            active: profile.active,
            createdAt: profile.createdAt
        };
        auth.setAuth(merged, auth.token);
    } catch (e) {
        const user = auth.getUser();
        if (user) applyProfileToUI(user);
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    try {
        const data = {
            name: document.getElementById('profileName').value,
            phone: document.getElementById('profilePhone').value
        };
        
        const updated = await usersAPI.updateProfile(data);
        
        const user = auth.getUser() || {};
        const merged = {
            ...user,
            id: updated.id || updated._id || user.id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
            phone: updated.phone || '',
            avatar: updated.avatar,
            active: updated.active !== undefined ? updated.active : user.active,
            createdAt: updated.createdAt || user.createdAt
        };
        auth.setAuth(merged, auth.token);
        applyProfileToUI(merged);
        
        showToast(SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
}

function formatStatus(status) {
    const map = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'SHIPPED': 'Đang giao',
        'DELIVERED': 'Đã giao',
        'CANCELLED': 'Đã hủy',
        'REFUNDED': 'Hoàn tiền'
    };
    return map[status] || status;
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadBooks();
    updateCartCount();
});
