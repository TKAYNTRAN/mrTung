let currentPage = 0;
let currentCategory = '';
let currentSearch = '';
let lastWishlistSync = localStorage.getItem('wishlistUpdatedAt') || '0';

function getActiveSectionId() {
    const active = document.querySelector('.section.active');
    return active ? active.id.replace('-section', '') : '';
}

function refreshWishlistIfChanged() {
    const updatedAt = localStorage.getItem('wishlistUpdatedAt') || '0';
    if (updatedAt !== lastWishlistSync) {
        lastWishlistSync = updatedAt;
        if (getActiveSectionId() === 'wishlist') {
            loadWishlist();
        }
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionId}-section`).classList.add('active');

    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    if (typeof event !== 'undefined' && event.target) {
        event.target.classList.add('active');
    }

    if (sectionId === 'books') loadBooks();
    if (sectionId === 'cart') loadCart();
    if (sectionId === 'wishlist') loadWishlist();
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
            <div class="book-card" onclick="viewBookDetail('${book._id}')" style="cursor:pointer;">
                <img src="${book.image || 'https://via.placeholder.com/250x250?text=No+Image'}" alt="${book.title}" class="book-image">
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author}</div>
                    <div class="book-price">${formatPrice(book.price)}</div>
                    <div class="book-actions">
                        <button class="submit-btn btn-sm" onclick="event.stopPropagation(); addToCart('${book._id}')">Thêm vào giỏ</button>
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

async function loadWishlist() {
    try {
        const wishlist = await wishlistAPI.getMyWishlist();
        const container = document.getElementById('wishlistContent');
        const books = wishlist.bookIds || [];

        if (!books.length) {
            container.innerHTML = '<div class="empty-state"><h3>Danh sách yêu thích đang trống</h3></div>';
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="cart-item">
                <img src="${book.image || 'https://via.placeholder.com/80x80?text=No+Image'}" alt="${book.title}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${book.title}</div>
                    <div class="book-author">${book.author || ''}</div>
                    <div class="cart-item-price">${formatPrice(book.price)}</div>
                </div>
                <button class="btn-edit" onclick="viewBookDetail('${book._id}')">Xem</button>
                <button class="btn-delete" onclick="removeWishlistItem('${book._id}')">Xóa</button>
            </div>
        `).join('');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function viewBookDetail(bookId) {
    window.location.href = `book-detail.html?id=${bookId}`;
}

async function removeWishlistItem(bookId) {
    try {
        await wishlistAPI.remove(bookId);
        showToast('Đã xóa sách khỏi danh sách yêu thích');
        loadWishlist();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function clearWishlist() {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ danh sách yêu thích?')) return;
    try {
        await wishlistAPI.clear();
        showToast('Đã xóa toàn bộ danh sách yêu thích');
        loadWishlist();
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
            <div class="cart-item order-item" onclick="viewOrderDetail('${order._id}')" style="cursor: pointer;">
                <div class="cart-item-info">
                    <div class="cart-item-title">Đơn hàng #${order._id.slice(-6)}</div>
                    <div class="cart-item-price">${formatPrice(order.totalPrice)}</div>
                    <div>${order.items?.length || 0} sản phẩm</div>
                    <div style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">${new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="badge badge-${order.status.toLowerCase()}">${formatStatus(order.status)}</span>
                    ${order.status === 'PENDING' ? `<button class="btn-delete" onclick="event.stopPropagation(); cancelOrder('${order._id}')">Hủy</button>` : ''}
                </div>
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

async function viewOrderDetail(orderId) {
    try {
        const result = await ordersAPI.getMyOrderById(orderId);
        const order = result.order;
        const modal = document.getElementById('orderDetailModal');
        const contentDiv = document.getElementById('orderDetailContent');
        
        document.getElementById('detailOrderId').textContent = '#' + orderId.slice(-6);
        
        // Parse shipping address
        const addressParts = order.shippingAddress ? order.shippingAddress.split('\n') : [];
        const receiverName = addressParts[0] || '';
        const receiverPhone = addressParts[1] || '';
        const shippingAddress = addressParts.slice(2).join(', ') || '';
        
        // Payment method mapping
        const paymentMethodMap = {
            'COD': 'Thanh toán khi nhận hàng (COD)',
            'CARD': 'Thẻ tín dụng/Debit',
            'TRANSFER': 'Chuyển khoản ngân hàng'
        };
        
        contentDiv.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <strong style="color: #667eea;">Ngày đặt:</strong><br>
                        ${new Date(order.createdAt).toLocaleString('vi-VN')}
                    </div>
                    <div>
                        <strong style="color: #667eea;">Trạng thái:</strong><br>
                        <span class="badge badge-${order.status.toLowerCase()}">${formatStatus(order.status)}</span>
                    </div>
                </div>
                <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <strong style="color: #667eea; display: block; margin-bottom: 0.5rem;">Thông tin giao hàng:</strong>
                    <div style="font-size: 0.95rem; line-height: 1.6;">
                        <div><strong>Người nhận:</strong> ${receiverName}</div>
                        <div><strong>Số điện thoại:</strong> ${receiverPhone}</div>
                        <div><strong>Địa chỉ:</strong> ${shippingAddress}</div>
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong style="color: #667eea;">Phương thức thanh toán:</strong> ${paymentMethodMap[order.paymentMethod] || order.paymentMethod}
                </div>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                <strong style="color: #667eea; display: block; margin-bottom: 0.75rem;">Sản phẩm (${order.items?.length || 0}):</strong>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${order.items?.map(item => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                            <div>
                                <div style="font-weight: 600;">${item.title}</div>
                                <div style="font-size: 0.85rem; color: #666;">${formatPrice(item.price)} x ${item.quantity}</div>
                            </div>
                            <div style="font-weight: 600; color: #667eea;">${formatPrice(item.price * item.quantity)}</div>
                        </div>
                    `).join('') || '<p>Không có sản phẩm</p>'}
                </div>
            </div>
            
            <div style="border-top: 2px solid #e2e8f0; margin-top: 1rem; padding-top: 1rem; text-align: right;">
                ${order.couponCode ? `<div style="color: #48bb78; margin-bottom: 0.5rem;">Giảm giá (${order.couponCode}): -${formatPrice(order.couponDiscount)}</div>` : ''}
                <div style="font-size: 1.25rem; font-weight: 700; color: #667eea;">
                    Tổng thanh toán: ${formatPrice(order.totalPrice)}
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
    } catch (error) {
        showToast('Không thể tải chi tiết đơn hàng: ' + error.message, 'error');
    }
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').style.display = 'none';
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
        (r === 'ADMIN' ? 'role-admin' : 'role-customer');
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

    const activeSection = sessionStorage.getItem('activeSection');
    if (activeSection && ['books', 'cart', 'wishlist', 'orders', 'profile'].includes(activeSection)) {
        sessionStorage.removeItem('activeSection');
        showSection(activeSection);
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'wishlistUpdatedAt') {
            refreshWishlistIfChanged();
        }
    });

    window.addEventListener('focus', refreshWishlistIfChanged);
    window.addEventListener('pageshow', refreshWishlistIfChanged);
});
