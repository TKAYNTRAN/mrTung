let cartData = null;
let selectedPaymentMethod = 'COD';
let availableCoupons = [];
let selectedCouponCode = null;
let availableBanks = [];
let selectedBankId = null;

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
        availableCoupons = (data.coupons || []).filter((c) => {
            const hasEligibleBooks = Number(c.eligibleBookCount || 0) > 0;
            return hasEligibleBooks && Number(c.couponDiscount || 0) > 0;
        });

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
            const appliesText = Number(c.eligibleBookCount || 0) > 0
                ? `Áp dụng cho ${c.eligibleBookCount} sách trong giỏ`
                : 'Không có sách phù hợp';
            btn.innerHTML =
                `<div class="code">${escapeHtml(c.code)}</div>` +
                `<div class="meta">${desc} · ${appliesText} · Tiết kiệm ${formatPrice(c.couponDiscount)}</div>`;
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
    
    // Show/hide bank selection based on payment method
    const bankSelection = document.getElementById('bankSelection');
    if (method === 'TRANSFER') {
        bankSelection.style.display = 'block';
        loadBanks();
    } else {
        bankSelection.style.display = 'none';
        selectedBankId = null;
    }
}

async function loadBanks() {
    const container = document.getElementById('bankOptions');
    try {
        const banks = await banksAPI.getAll(true);
        availableBanks = banks;
        
        if (!banks || banks.length === 0) {
            container.innerHTML = '<p>Chưa có tài khoản ngân hàng nào được cấu hình.</p>';
            return;
        }
        
        container.innerHTML = banks.map((b, index) => `
            <div class="bank-option ${index === 0 ? 'selected' : ''}" onclick="selectBank('${b._id}', this)">
                ${b.bankLogo ? `<img src="${API_CONFIG.BASE_URL}${b.bankLogo}" alt="${b.bankName}">` : '<div style="width:40px;height:40px;background:#e2e8f0;border-radius:4px;margin-right:1rem;display:flex;align-items:center;justify-content:center;">🏦</div>'}
                <div class="bank-info">
                    <div class="name">${b.bankName}</div>
                    <div class="details">${b.accountNumber} - ${b.accountHolder}</div>
                </div>
            </div>
        `).join('');
        
        // Auto-select first bank
        if (banks.length > 0) {
            selectBank(banks[0]._id, container.querySelector('.bank-option'));
        }
    } catch (error) {
        container.innerHTML = '<p>Không thể tải danh sách ngân hàng.</p>';
    }
}

function selectBank(bankId, element) {
    selectedBankId = bankId;
    document.querySelectorAll('.bank-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    // Show QR code if available
    const bank = availableBanks.find(b => b._id === bankId);
    const qrDisplay = document.getElementById('bankQRDisplay');
    const qrImg = document.getElementById('selectedBankQR');
    
    if (bank && bank.qrCode) {
        qrImg.src = API_CONFIG.BASE_URL + bank.qrCode;
        qrDisplay.style.display = 'block';
    } else {
        qrDisplay.style.display = 'none';
    }
}

async function placeOrder() {
    console.log('=== BẮT ĐẦU ĐẶT HÀNG ===');
    
    const receiverName = document.getElementById('receiverName').value.trim();
    const receiverPhone = document.getElementById('receiverPhone').value.trim();
    const shippingAddress = document.getElementById('shippingAddress').value.trim();
    
    console.log('Thông tin:', { receiverName, receiverPhone, shippingAddress: shippingAddress ? '✓ Đã nhập' : '✗ Rỗng', selectedPaymentMethod, selectedBankId });
    console.log('cartData:', cartData);

    // Kiểm tra từng field và log lỗi cụ thể
    const missingFields = [];
    if (!receiverName) missingFields.push('Họ tên người nhận');
    if (!receiverPhone) missingFields.push('Số điện thoại');
    if (!shippingAddress) missingFields.push('Địa chỉ giao hàng');
    
    if (missingFields.length > 0) {
        console.error('❌ THIẾU THÔNG TIN:', missingFields.join(', '));
        showToast(`Vui lòng điền: ${missingFields.join(', ')}`, 'error');
        return;
    }

    if (!/^\d{10}$/.test(receiverPhone)) {
        console.error('❌ SỐ ĐIỆN THOẠI KHÔNG HỢP LỆ:', receiverPhone);
        showToast('Số điện thoại phải có đúng 10 chữ số', 'error');
        return;
    }

    if (!cartData || !cartData.items || cartData.items.length === 0) {
        console.error('❌ GIỎ HÀNG TRỐNG');
        showToast('Giỏ hàng trống', 'error');
        return;
    }

    if (selectedPaymentMethod === 'TRANSFER' && !selectedBankId) {
        console.error('❌ CHƯA CHỌN NGÂN HÀNG');
        showToast('Vui lòng chọn tài khoản ngân hàng để chuyển khoản', 'error');
        return;
    }

    console.log('✅ Tất cả thông tin hợp lệ, tiến hành đặt hàng...');

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
            ...(useCode ? { couponCode: useCode } : {}),
            ...(selectedPaymentMethod === 'TRANSFER' && selectedBankId ? { bankId: selectedBankId } : {})
        };

        console.log('Gửi orderData:', orderData);

        const result = await ordersAPI.create(orderData);
        console.log('Đặt hàng thành công:', result);
        
        // Xóa giỏ hàng
        await cartAPI.clear();
        
        // Hiển thị modal thông tin đơn hàng
        showOrderSuccessModal(result.order);
        
        // Xóa giỏ hàng local
        if (cartData) {
            cartData.items = [];
            cartData.totalPrice = 0;
        }
    } catch (error) {
        console.error('Lỗi đặt hàng:', error);
        showToast(error.message || 'Có lỗi xảy ra khi đặt hàng', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Đặt hàng';
    }
}

function showOrderSuccessModal(order) {
    const modal = document.getElementById('orderSuccessModal');
    const detailsDiv = document.getElementById('orderDetails');
    
    // Format địa chỉ giao hàng
    const addressParts = order.shippingAddress ? order.shippingAddress.split('\n') : [];
    const receiverName = addressParts[0] || '';
    const receiverPhone = addressParts[1] || '';
    const shippingAddress = addressParts.slice(2).join('\n') || '';
    
    // Format phương thức thanh toán
    const paymentMethodMap = {
        'COD': 'Thanh toán khi nhận hàng (COD)',
        'CARD': 'Thẻ tín dụng/Debit',
        'TRANSFER': 'Chuyển khoản ngân hàng'
    };
    
    // Hiển thị thông tin đơn hàng
    detailsDiv.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong style="color: #667eea;">Mã đơn hàng:</strong> #${order._id.slice(-6)}
        </div>
        <div style="display: grid; gap: 0.5rem; font-size: 0.9rem;">
            <div><strong>Người nhận:</strong> ${receiverName}</div>
            <div><strong>Số điện thoại:</strong> ${receiverPhone}</div>
            <div><strong>Địa chỉ:</strong> ${shippingAddress.replace(/\n/g, ', ')}</div>
            <div><strong>Phương thức thanh toán:</strong> ${paymentMethodMap[order.paymentMethod] || order.paymentMethod}</div>
            <div><strong>Tổng tiền:</strong> <span style="color: #667eea; font-weight: 600;">${formatPrice(order.totalPrice)}</span></div>
            ${order.couponCode ? `<div><strong>Mã giảm giá:</strong> ${order.couponCode} (-${formatPrice(order.couponDiscount)})</div>` : ''}
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
            <strong>Sách đã đặt:</strong>
            <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
                ${order.items.map(item => `
                    <li>${item.title} x${item.quantity} - ${formatPrice(item.price * item.quantity)}</li>
                `).join('')}
            </ul>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
}

function viewMyOrders() {
    window.location.href = 'customer.html?tab=orders';
}

function continueShopping() {
    window.location.href = 'customer.html';
}

document.addEventListener('DOMContentLoaded', () => {
    loadCartData();
});
