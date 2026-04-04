let currentBook = null;
let currentBookId = null;

function getBookIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadBookDetail() {
    currentBookId = getBookIdFromUrl();
    
    if (!currentBookId) {
        showError();
        return;
    }

    try {
        const book = await booksAPI.getById(currentBookId);
        currentBook = book;
        renderBookDetail(book);
        loadReviews(book._id);
        checkWishlistStatus();
        hideLoading();
    } catch (error) {
        console.error('Error loading book:', error);
        showError();
    }
}

function renderBookDetail(book) {
    document.getElementById('bookImage').src = book.image || 'https://via.placeholder.com/400x500?text=No+Image';
    document.getElementById('bookImage').alt = book.title;
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookAuthor').textContent = book.author;
    document.getElementById('bookCategory').textContent = book.categoryId?.name || 'Chưa phân loại';
    
    // Publisher
    if (book.publisher) {
        document.getElementById('bookPublisher').textContent = book.publisher;
        document.getElementById('publisherRow').style.display = 'block';
    } else {
        document.getElementById('publisherRow').style.display = 'none';
    }

    // Rating
    if (book.rating > 0) {
        const stars = '★'.repeat(Math.floor(book.rating)) + '☆'.repeat(5 - Math.floor(book.rating));
        document.getElementById('bookStars').textContent = stars;
        document.getElementById('bookRating').textContent = `(${book.rating}/5)`;
        document.getElementById('ratingRow').style.display = 'flex';
    } else {
        document.getElementById('ratingRow').style.display = 'none';
    }

    // Price
    const priceEl = document.getElementById('bookPrice');
    const originalPriceEl = document.getElementById('originalPrice');
    const discountBadge = document.getElementById('discountBadge');

    if (book.discount > 0) {
        const discountedPrice = book.price * (1 - book.discount / 100);
        priceEl.textContent = formatPrice(discountedPrice);
        originalPriceEl.textContent = formatPrice(book.price);
        discountBadge.textContent = `-${book.discount}%`;
        originalPriceEl.style.display = 'inline';
        discountBadge.style.display = 'inline';
    } else {
        priceEl.textContent = formatPrice(book.price);
        originalPriceEl.style.display = 'none';
        discountBadge.style.display = 'none';
    }

    // Stock
    const stockRow = document.getElementById('stockRow');
    const stockStatus = document.getElementById('stockStatus');
    if (book.quantity > 0) {
        stockStatus.textContent = `Còn hàng (${book.quantity} sản phẩm)`;
        stockStatus.className = 'in-stock';
        stockRow.style.display = 'block';
        document.querySelector('.btn-add-cart').disabled = false;
    } else {
        stockStatus.textContent = 'Hết hàng';
        stockStatus.className = 'out-of-stock';
        stockRow.style.display = 'block';
        document.querySelector('.btn-add-cart').disabled = true;
        document.querySelector('.btn-add-cart').textContent = 'Hết hàng';
    }

    // Description
    document.getElementById('bookDescription').textContent = book.description || 'Chưa có mô tả cho sách này.';

    // Update page title
    document.title = `${book.title} - SellBookWeb`;
}

async function loadReviews(bookId) {
    try {
        const reviews = await reviewsAPI.getByBook(bookId);
        const container = document.getElementById('reviewsList');

        if (!reviews || reviews.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Chưa có đánh giá nào</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${review.userId?.name || 'Ẩn danh'}</span>
                    <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    <span class="review-date">${new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <p class="review-comment">${review.comment || ''}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

function changeQuantity(delta) {
    const input = document.getElementById('quantity');
    const newValue = parseInt(input.value) + delta;
    const max = currentBook ? currentBook.quantity : 99;
    
    if (newValue >= 1 && newValue <= max) {
        input.value = newValue;
    }
}

async function addToCartFromDetail() {
    if (!currentBook) return;
    
    const quantity = parseInt(document.getElementById('quantity').value);
    
    try {
        await cartAPI.addItem(currentBook._id, quantity);
        showToast('Đã thêm vào giỏ hàng');
        updateCartCount();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function checkWishlistStatus() {
    if (!currentBookId) return;

    try {
        const response = await wishlistAPI.check(currentBookId);
        const btn = document.getElementById('wishlistBtn');
        if (response.isInWishlist) {
            btn.classList.add('active');
            btn.innerHTML = '💔 Bỏ yêu thích';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '❤️ Yêu thích';
        }
    } catch (error) {
        console.error('Error checking wishlist:', error);
    }
}

async function toggleWishlist() {
    if (!currentBookId) return;

    try {
        const btn = document.getElementById('wishlistBtn');
        if (btn.classList.contains('active')) {
            await wishlistAPI.remove(currentBookId);
            showToast('Đã xóa khỏi danh sách yêu thích');
        } else {
            await wishlistAPI.add(currentBookId);
            showToast('Đã thêm vào danh sách yêu thích');
        }
        localStorage.setItem('wishlistUpdatedAt', String(Date.now()));
        checkWishlistStatus();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function submitReview(event) {
    event.preventDefault();

    if (!currentBookId) return;

    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value.trim();

    if (!rating || rating < 1 || rating > 5) {
        showToast('Vui lòng chọn điểm đánh giá hợp lệ', 'error');
        return;
    }

    try {
        await reviewsAPI.create({ bookId: currentBookId, rating, comment });
        showToast('Đã gửi đánh giá, chờ quản trị viên duyệt');
        document.getElementById('reviewForm').reset();
        await loadReviews(currentBookId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('bookContent').style.display = 'block';
}

function showError() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
}

function goToSection(section) {
    sessionStorage.setItem('activeSection', section);
    window.location.href = 'customer.html';
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

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// Load on page start
document.addEventListener('DOMContentLoaded', () => {
    loadBookDetail();
    updateCartCount();
});
