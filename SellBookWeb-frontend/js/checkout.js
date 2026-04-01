let cartData = null;
let selectedPaymentMethod = 'COD';
let availableCoupons = [];
let selectedCouponCode = null;

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function clearCouponTotals() {
    if (!cartData) return;
    document.getElementById('subtotalAmount').textContent = formatPrice(cartData.totalPrice);
    document.getElementById('couponDiscountRow').style.display = 'none';
    document.getElementById('totalAmount').textContent = formatPrice(cartData.totalPrice);
    const hint = document.getElementById('couponHint');
    if (hint) {
        hint.textContent = availableCoupons.length === 0
            ? 'Chưa có mã giảm giá phù hợp với giỏ hàng hiện tại.'
            : '';
    }
}

function applyCouponPreviewData(preview) {
    document.getElementById('subtotalAmount').textContent = formatPrice(preview.subtotal);
    document.getElementById('couponDiscountRow').style.display = 'block';
    document.getElementById('couponDiscountAmount').textContent = formatPrice(preview.couponDiscount);
    document.getElementById('totalAmount').textContent = formatPrice(preview.totalPrice);
    const hint = document.getElementById('couponHint');
    if (hint) {
        hint.textContent = `Đã chọn mã "${preview.code}" — giảm ${preview.discountPercent}% trên phần đủ điều kiện.`;
    }
}

function updateCouponButtonSelection() {
    document.querySelectorAll('.coupon-btn').forEach((btn) => {
        const c = btn.dataset.code;
        const sel = selectedCouponCode == null || selectedCouponCode === ''
            ? c === ''
            : c === selectedCouponCode;
        btn.classList.toggle('selected', sel);
    });
}

function selectCouponCode(code) {
    selectedCouponCode = code;
    updateCouponButtonSelection();
    if (code == null || code === '') {
        clearCouponTotals();
        return;
    }
    const preview = availableCoupons.find((x) => x.code === code);
    if (preview) {
        applyCouponPreviewData(preview);
    }
}

async function loadCouponOptions() {
    const loading = document.getElementById('couponLoading');
    const wrap = document.getElementById('couponButtons');
    if (!cartData || !cartData.items || cartData.items.length === 0) {
        if (loading) loading.style.display = 'none';
        return;
    }

    loading.style.display = 'block';
    loading.textContent = 'Đang tải mã khả dụng...';
    wrap.style.display = 'none';
    wrap.innerHTML = '';

    try {
        const payload = {
            items: cartData.items.map((item) => ({
                bookId: item.bookId,
                quantity: item.quantity
            }))
        };
        const data = await couponsAPI.availableForCart(payload);
        availableCoupons = data.coupons || [];

        loading.style.display = 'none';
        wrap.style.display = 'flex';

        const noneBtn = document.createElement('button');
        noneBtn.type = 'button';
        noneBtn.className = 'coupon-btn coupon-btn-none';
        noneBtn.dataset.code = '';
        noneBtn.innerHTML =
            '<div class="code">Không dùng mã</div><div class="meta">Đặt hàng không áp dụng coupon</div>';
        noneBtn.addEventListener('click', () => selectCouponCode(null));
        wrap.appendChild(noneBtn);

        if (availableCoupons.length === 0) {
            const hintEl = document.getElementById('couponHint');
            if (hintEl) {
                hintEl.textContent = 'Chưa có mã giảm giá phù hợp với giỏ hàng hiện tại.';
            }
        }

        availableCoupons.forEach((c) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'coupon-btn';
            btn.dataset.code = c.code;
            const desc = c.description ? escapeHtml(c.description) : `Giảm ${c.discountPercent}%`;
            btn.innerHTML =
                `<div class="code">${escapeHtml(c.code)}</div>` +
                `<div class="meta">${desc} · Tiết kiệm ${formatPrice(c.couponDiscount)}</div>`;
            btn.addEventListener('click', () => selectCouponCode(c.code));
            wrap.appendChild(btn);
        });

        selectedCouponCode = null;
        updateCouponButtonSelection();
        clearCouponTotals();
    } catch (error) {
        loading.style.display = 'block';
        loading.textContent = 'Không tải được danh sách mã: ' + (error.message || 'Lỗi');
        wrap.style.display = 'none';
    }
}

async function loadCartData() {
    try {
        cartData = await cartAPI.getMyCart();

        if (!cartData.items || cartData.items.length === 0) {
            showToast('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.', 'warning');
            setTimeout(() => {
                window.location.href = 'customer.html';
            }, 2000);
            return;
        }

        const container = document.getElementById('cartItems');
        container.innerHTML = cartData.items.map(item => `
            <div class="cart-item">
                <div>
                    <strong>${item.title}</strong>
                    <div style="color: #666;">x${item.quantity}</div>
                </div>
                <div style="font-weight: 600; color: #667eea;">${formatPrice(item.price * item.quantity)}</div>
            </div>
        `).join('');

        document.getElementById('subtotalAmount').textContent = formatPrice(cartData.totalPrice);
        document.getElementById('totalAmount').textContent = formatPrice(cartData.totalPrice);
        document.getElementById('couponDiscountRow').style.display = 'none';
        const hint = document.getElementById('couponHint');
        if (hint) hint.textContent = '';

        const user = auth.getUser();
        if (user) {
            document.getElementById('receiverName').value = user.name || '';
            document.getElementById('receiverPhone').value = user.phone || '';
        }

        await loadCouponOptions();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function selectPayment(element, method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    element.querySelector('input').checked = true;
}

async function placeOrder() {
    const receiverName = document.getElementById('receiverName').value.trim();
    const receiverPhone = document.getElementById('receiverPhone').value.trim();
    const shippingAddress = document.getElementById('shippingAddress').value.trim();

    if (!receiverName) {
        showToast('Vui lòng nhập họ tên người nhận', 'error');
        return;
    }

    if (!receiverPhone || !/^[0-9]{10}$/.test(receiverPhone)) {
        showToast('Vui lòng nhập số điện thoại hợp lệ (10 số)', 'error');
        return;
    }

    if (!shippingAddress) {
        showToast('Vui lòng nhập địa chỉ giao hàng', 'error');
        return;
    }

    if (!cartData || !cartData.items || cartData.items.length === 0) {
        showToast('Giỏ hàng trống', 'error');
        return;
    }

    const btn = document.querySelector('.btn-place-order');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Đang xử lý...';

    try {
        const useCode = selectedCouponCode && String(selectedCouponCode).trim();
        const orderData = {
            items: cartData.items.map(item => ({
                bookId: item.bookId,
                quantity: item.quantity
            })),
            shippingAddress: `${receiverName}\n${receiverPhone}\n${shippingAddress}`,
            phone: receiverPhone,
            paymentMethod: selectedPaymentMethod,
            ...(useCode ? { couponCode: useCode } : {})
        };

        await ordersAPI.create(orderData);
        showToast('Đặt hàng thành công! Cảm ơn bạn đã mua sắm.');

        setTimeout(() => {
            window.location.href = 'customer.html';
        }, 2000);
    } catch (error) {
        showToast(error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Đặt hàng';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCartData();
});
