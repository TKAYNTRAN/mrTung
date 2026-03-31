// ==============================
// CUSTOMER APP - GLOBAL VARIABLES
// ==============================

let allBooks = [];
let filteredBooks = [];
let cart = [];
let currentBook = null;
let selectedCategories = [];
let selectedPriceRange = 'all';
let allCategoriesData = [];
let selectedCartItems = new Set();
let myReviews = [];
let currentPage = 0;
let productsPerPage = 12;
let totalPages = 1;
let notifications = [];
let unreadNotificationCount = 0;
let notificationPollingInterval = null;

// API_BASE_URL is defined in api.js, don't redeclare it here

// ==============================
// PAGE INITIALIZATION
// ==============================

// HÃ m cáº­p nháº­t tÃªn ngÆ°á»i dÃ¹ng trong header
function updateAccountName() {
    try {
        let user = auth.getUser();
        let accountNameEl = document.getElementById('accountName');
        
        if (accountNameEl) {
            if (user && user.name) {
                // Hiá»ƒn thá»‹ tÃªn ngÆ°á»i dÃ¹ng thay vÃ¬ "TÃ i Khoáº£n"
                accountNameEl.textContent = user.name;
            } else {
                // Náº¿u chÆ°a Ä‘Äƒng nháº­p, hiá»ƒn thá»‹ "TÃ i Khoáº£n"
                accountNameEl.textContent = 'TÃ i Khoáº£n';
            }
        }
        
        // Cáº­p nháº­t userName cho cÃ¡c pháº§n khÃ¡c
        let userNameEl = document.getElementById('userName');
        if (userNameEl && user && user.name) {
            userNameEl.textContent = user.name;
        }
    } catch (error) {
        console.error('Error updating account name:', error);
    }
}

// Äá»£i cáº£ DOM vÃ  auth.js load xong
function initializeApp() {
    // Cáº­p nháº­t tÃªn ngÆ°á»i dÃ¹ng
    updateAccountName();
    
    // Load dá»¯ liá»‡u
    loadBooks();
    loadProfile();
    loadCart();
    initializeCategories(); // Load categories for filter
    loadNotifBadge(); // Load notification badge count
    startNotificationPolling(); // Start notification polling
    
    // Search functionality
    let searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function (event) {
            let searchTerm = event.target.value.toLowerCase();
            if (searchTerm === '') {
                filteredBooks = [...allBooks];
            } else {
                filteredBooks = allBooks.filter(function (book) {
                    return book.title.toLowerCase().includes(searchTerm) ||
                        (book.author && book.author.toLowerCase().includes(searchTerm));
                });
            }
            currentPage = 0; // Reset to first page when searching
            renderBooks(filteredBooks);
        });
        
        // Hide search bar when clicking outside
        searchInput.addEventListener('blur', function () {
            // Delay to allow click events to fire first
            setTimeout(function () {
                let searchBar = document.getElementById('searchBar');
                if (searchBar && !searchBar.contains(document.activeElement)) {
                    if (!searchInput.value) {
                        searchBar.classList.add('hidden');
                    }
                }
            }, 200);
        });
        
        // Show search bar on Escape key
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                let searchBar = document.getElementById('searchBar');
                if (searchBar) {
                    searchBar.classList.add('hidden');
                    searchInput.value = '';
                    filteredBooks = [...allBooks];
                    currentPage = 0;
                    renderBooks(filteredBooks);
                }
            }
        });
    }
}

// Chá» cáº£ DOM vÃ  auth.js sáºµn sÃ ng
function waitForAuth() {
    if (typeof auth !== 'undefined' && auth !== null) {
        initializeApp();
    } else {
        // Náº¿u auth chÆ°a sáºµn sÃ ng, Ä‘á»£i thÃªm
        setTimeout(waitForAuth, 50);
    }
}

// Khá»Ÿi táº¡o khi DOM sáºµn sÃ ng
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        waitForAuth();
    });
} else {
    // DOM Ä‘Ã£ sáºµn sÃ ng
    waitForAuth();
}

// CÅ©ng cáº­p nháº­t khi window load hoÃ n toÃ n (fallback)
window.addEventListener('load', function () {
    setTimeout(updateAccountName, 200);
});

// ==============================
// SECTION MANAGEMENT
// ==============================

function showSection(sectionId) {
    try {
        document.querySelectorAll('.section').forEach(function (section) {
            section.classList.remove('active');
        });
        let targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        } else {
            console.error('Section not found:', sectionId);
        }

        if (sectionId === 'myReviews') {
            loadMyReviews();
        }

        if (sectionId === 'myOrders') {
            loadMyOrders();
        }

        if (sectionId === 'notifications') {
            loadNotifications();
        }
        
        if (sectionId === 'cart') {
            loadCart(); // Reload cart when switching to cart section
        }
    } catch (error) {
        console.error('Error in showSection:', error);
    }
}

// Expose to window immediately for onclick handlers
if (typeof window !== 'undefined') {
    window.showSection = showSection;
    window.toggleFilterPanel = toggleFilterPanel;
    window.closeFilterPanel = closeFilterPanel;
    window.filterByPrice = filterByPrice;
}

// ==============================
// BOOKS LOADING & DISPLAY
// ==============================

async function loadBooks() {
    try {
        // Fetch all books (you can adjust page size if needed)
        let response = await fetchBooks(0, 1000); // Get a large number of books
        if (Array.isArray(response)) {
            allBooks = response;
        } else if (response && Array.isArray(response.content)) {
            // If it's a paginated response
            allBooks = response.content;
        } else {
            allBooks = [];
        }
        filteredBooks = [...allBooks];
        currentPage = 0;
        renderBooks(filteredBooks);
    } catch (error) {
        console.error('Error loading books:', error);
        showAlert('Lá»—i khi táº£i sÃ¡ch: ' + error.message);
        allBooks = [];
        filteredBooks = [];
        renderBooks([]);
    }
}

function renderBooks(books) {
    let container = document.getElementById('booksList');
    container.innerHTML = '';

    if (!Array.isArray(books) || books.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1; padding: 3rem;">KhÃ´ng tÃ¬m tháº¥y sÃ¡ch</p>';
        return;
    }

    // Calculate pagination
    totalPages = Math.ceil(books.length / productsPerPage);
    let startIndex = currentPage * productsPerPage;
    let endIndex = startIndex + productsPerPage;
    let booksToShow = books.slice(startIndex, endIndex);

    booksToShow.forEach(function (book) {
        let card = document.createElement('div');
        card.className = 'book-card';
        card.onclick = function () {
            showBookDetail(book.id);
        };
        
        // Giáº£m giÃ¡ badge: dá»±a vÃ o pháº§n trÄƒm giáº£m trá»±c tiáº¿p tá»« giÃ¡ gá»‘c
        let hasDiscount = book.discount && book.discount > 0;
        let discount = hasDiscount ? book.discount : 0;
        let originalPrice = book.price;
        let finalPrice = hasDiscount
            ? originalPrice * (1 - discount / 100)
            : originalPrice;
        
        card.innerHTML = `
            <div class="book-image">
                ${book.image ? `<img src="${book.image}" alt="${book.title}">` : '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #999; font-size: 3rem;">ðŸ“š</div>'}
                ${hasDiscount ? `<div class="discount-badge">-${discount}%</div>` : ''}
            </div>
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-rating">${renderStars(book.rating || 0)}</div>
                <div class="book-price-container">
                    <span class="book-price">${formatPrice(finalPrice)}</span>
                    ${hasDiscount ? `<span class="book-original-price">${formatPrice(originalPrice)}</span>` : ''}
                </div>
                <div class="book-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showBookDetail('${book.id}')">Chi tiáº¿t</button>
                    <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); addToCart('${book.id}')">ThÃªm ðŸ›’</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Render pagination
    renderPagination();
}

let currentReviews = [];
let reviewSortType = 'newest';

async function showBookDetail(bookId) {
    try {
        currentBook = await getBookById(bookId);
        productQuantity = 1; // Reset quantity
        renderBookDetail(currentBook);
        await loadProductReviews(bookId);
        showSection('bookDetail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        showAlert('Lá»—i khi táº£i chi tiáº¿t sÃ¡ch: ' + error.message);
    }
}

function renderBookDetail(book) {
    // Giáº£m giÃ¡ badge: dá»±a vÃ o pháº§n trÄƒm giáº£m trá»±c tiáº¿p tá»« giÃ¡ gá»‘c
    let hasDiscount = book.discount && book.discount > 0;
    let discount = hasDiscount ? book.discount : 0;
    let originalPrice = book.price;
    let finalPrice = hasDiscount
        ? originalPrice * (1 - discount / 100)
        : originalPrice;
    
    // Get category name for breadcrumbs
    let categoryName = getCategoryName(book.categoryId);
    
    // Render breadcrumbs
    let breadcrumbs = document.getElementById('breadcrumbs');
    breadcrumbs.innerHTML = `
        <a href="#" onclick="showSection('home'); return false;">Trang chá»§</a>
        <span>></span>
        <span>${categoryName || 'SÃ¡ch'}</span>
        <span>></span>
        <span>${book.title}</span>
    `;
    
    // Render main image
    let mainImage = document.getElementById('mainProductImage');
    if (mainImage) {
        mainImage.src = book.image || '';
        mainImage.alt = book.title;
        mainImage.onerror = function() {
            this.style.display = 'none';
            this.parentElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #999; font-size: 3rem;">ðŸ“š</div>';
        };
    }
    
    // Render promo banner
    let promoBanner = document.getElementById('promoBanner');
    if (promoBanner && hasDiscount) {
        promoBanner.textContent = `FREESHIP 20K CHO ÄÆ N 120K`;
        promoBanner.style.display = 'block';
    } else if (promoBanner) {
        promoBanner.style.display = 'none';
    }
    
    // Render thumbnails
    let thumbnailContainer = document.getElementById('thumbnailContainer');
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        // Add main image as first thumbnail
        let thumb1 = createThumbnail(book.image, 0, true);
        thumbnailContainer.appendChild(thumb1);
        // Add more thumbnails (simulate)
        for (let i = 1; i < 3; i++) {
            let thumb = createThumbnail(book.image, i, false);
            thumbnailContainer.appendChild(thumb);
        }
        // Add "+8" indicator
        let moreThumbs = document.createElement('div');
        moreThumbs.className = 'thumbnail-more';
        moreThumbs.textContent = '+8';
        thumbnailContainer.appendChild(moreThumbs);
    }
    
    // Render product title
    let productTitle = document.getElementById('productTitle');
    if (productTitle) {
        productTitle.textContent = book.title;
    }
    
    // Render basic info
    let basicInfo = document.getElementById('productBasicInfo');
    if (basicInfo) {
        basicInfo.innerHTML = `
            <div class="basic-info-item">
                <span class="basic-info-label">NhÃ  cung cáº¥p:</span>
                <span>${book.supplierName || 'Äinh Tá»‹'}</span>
            </div>
            <div class="basic-info-item">
                <span class="basic-info-label">NhÃ  xuáº¥t báº£n:</span>
                <span>${book.publisher || 'VÄƒn Há»c'}</span>
            </div>
            <div class="basic-info-item">
                <span class="basic-info-label">TÃ¡c giáº£:</span>
                <span>${book.author || 'ChÆ°a cÃ³'}</span>
            </div>
            <div class="basic-info-item">
                <span class="basic-info-label">HÃ¬nh thá»©c bÃ¬a:</span>
                <span>${book.coverType || 'BÃ¬a Má»m'}</span>
            </div>
        `;
    }
    
    // Render rating and sales
    let ratingSales = document.getElementById('productRatingSales');
    if (ratingSales) {
        let reviewCount = book.reviewCount || 1;
        let salesCount = book.salesCount || 0; // Use actual sales count from book
        ratingSales.innerHTML = `
            <div class="rating-display">
                <div class="rating-stars">${renderStars(book.rating || 0)}</div>
                <span>(${reviewCount} Ä‘Ã¡nh giÃ¡)</span>
            </div>
            <div class="sales-count">ÄÃ£ bÃ¡n ${formatNumber(salesCount)}</div>
        `;
    }
    
    // Render trend badge - only show if salesCount > 50
    let trendBadge = document.getElementById('trendBadge');
    if (trendBadge) {
        let salesCount = book.salesCount || 0;
        if (salesCount > 50) {
            trendBadge.style.display = 'inline-block';
            trendBadge.textContent = 'Xu hÆ°á»›ng';
        } else {
            trendBadge.style.display = 'none';
        }
    }
    
    // Render pricing
    let pricing = document.getElementById('productPricing');
    if (pricing) {
        pricing.innerHTML = `
            <div class="price-container">
                <span class="current-price">${formatPrice(finalPrice)}</span>
                ${hasDiscount ? `<span class="original-price">${formatPrice(originalPrice)}</span>` : ''}
                ${hasDiscount ? `<span class="discount-badge-large">-${discount}%</span>` : ''}
            </div>
            ${hasDiscount ? `<div class="promo-note">ChÃ­nh sÃ¡ch khuyáº¿n mÃ£i trÃªn chá»‰ Ã¡p dá»¥ng táº¡i sellbookweb.com ></div>` : ''}
        `;
    }
    
    // Render availability - "cÃ²n hÃ ng" if quantity > 0, "háº¿t hÃ ng" if quantity = 0
    let availability = document.getElementById('productAvailability');
    if (availability) {
        let quantity = book.quantity || 0;
        if (quantity > 0) {
            availability.textContent = 'CÃ²n hÃ ng';
            availability.style.color = '#28a745'; // Green color for in stock
        } else {
            availability.textContent = 'Háº¿t hÃ ng';
            availability.style.color = '#dc3545'; // Red color for out of stock
        }
    }
    
    // Render related offers / coupons
    let relatedOffersSection = document.querySelector('.related-offers');
    let offerBadges = document.getElementById('offerBadges');
    if (relatedOffersSection && offerBadges) {
        // Parse discountCode: split by comma if multiple coupons
        let discountCodes = book.discountCode 
            ? book.discountCode.split(',').map(function (code) {
                return code.trim();
            }).filter(function (code) {
                return code.length > 0;
            })
            : [];
        
        // Build badges HTML
        let badgesHTML = '';
        
        // Add discount percentage badge if exists
        if (hasDiscount && discount > 0) {
            badgesHTML += `<span class="offer-badge">Giáº£m ${discount}% tá»« giÃ¡ gá»‘c</span>`;
        }
        
        // Add coupon badges
        discountCodes.forEach(function (code) {
            // Format coupon text based on common patterns
            let couponText = code;
            // If code looks like "SALE10", "FREESHIP20", etc., format it nicely
            if (code.match(/^[A-Z]+\d+$/i)) {
                let match = code.match(/^([A-Z]+)(\d+)$/i);
                if (match) {
                    let name = match[1];
                    let amount = match[2];
                    couponText = `MÃ£ giáº£m ${amount}k - ${name}`;
                }
            }
            badgesHTML += `<span class="offer-badge">${couponText}</span>`;
        });
        
        // Show/hide section based on whether there are any offers
        if (badgesHTML.trim() !== '') {
            offerBadges.innerHTML = badgesHTML;
            relatedOffersSection.style.display = 'block';
        } else {
            offerBadges.innerHTML = '';
            relatedOffersSection.style.display = 'none';
        }
    }
    
    // Render info table
    let infoTable = document.getElementById('infoTable');
    if (infoTable) {
        infoTable.innerHTML = `
            <tr>
                <td>MÃ£ hÃ ng</td>
                <td>${book.isbn || book.id || 'N/A'}</td>
            </tr>
            <tr>
                <td>TÃªn NhÃ  Cung Cáº¥p</td>
                <td>${book.supplierName || 'Äinh Tá»‹'}</td>
            </tr>
            <tr>
                <td>TÃ¡c giáº£</td>
                <td>${book.author || 'ChÆ°a cÃ³'}</td>
            </tr>
            <tr>
                <td>NgÆ°á»i Dá»‹ch</td>
                <td>${book.translator || 'N/A'}</td>
            </tr>
            <tr>
                <td>NXB</td>
                <td>${book.publisher || 'VÄƒn Há»c'}</td>
            </tr>
            <tr>
                <td>Sá»‘ lÆ°á»£ng</td>
                <td>${book.quantity || 0} quyá»ƒn</td>
            </tr>
        `;
    }
    
    // Reset quantity input
    let quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
        quantityInput.value = productQuantity;
    }
    
    // Hide login prompt if user is logged in
    let reviewLoginPrompt = document.getElementById('reviewLoginPrompt');
    if (reviewLoginPrompt) {
        let user = auth.getUser();
        if (user && user.id) {
            reviewLoginPrompt.style.display = 'none';
        } else {
            reviewLoginPrompt.style.display = 'block';
        }
    }
}

function createThumbnail(imageSrc, index, isActive) {
    let thumb = document.createElement('div');
    thumb.className = `thumbnail-item ${isActive ? 'active' : ''}`;
    thumb.onclick = function () {
        document.querySelectorAll('.thumbnail-item').forEach(function (t) {
            t.classList.remove('active');
        });
        thumb.classList.add('active');
        let mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.src = imageSrc || '';
        }
    };
    
    let img = document.createElement('img');
    img.src = imageSrc || '';
    img.alt = `Thumbnail ${index + 1}`;
    img.onerror = function() {
        this.parentElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #999;">ðŸ“š</div>';
    };
    thumb.appendChild(img);
    
    return thumb;
}

function getCategoryName(categoryId) {
    // This would normally fetch from API, but for now return a default
    return 'SÃ¡ch Tiáº¿ng Viá»‡t';
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// Parse coupon value (vÃ­ dá»¥: "SALE 10", "MÃ£ giáº£m 10k" -> 10)
function parseCouponValue(code) {
    if (!code) return 0;
    let match = String(code).match(/(\d+(\.\d+)?)/);
    if (!match) return 0;
    return parseFloat(match[1]);
}

let productQuantity = 1;

function increaseQuantity() {
    let maxQuantity = currentBook?.quantity || 99;
    if (productQuantity < maxQuantity) {
        productQuantity++;
        document.getElementById('productQuantity').value = productQuantity;
    }
}

function decreaseQuantity() {
    if (productQuantity > 1) {
        productQuantity--;
        document.getElementById('productQuantity').value = productQuantity;
    }
}

function addToCartFromDetail() {
    if (!currentBook) return;
    
    for (let i = 0; i < productQuantity; i++) {
        addToCart(currentBook.id);
    }
    showAlert(`ÄÃ£ thÃªm ${productQuantity} sáº£n pháº©m vÃ o giá» hÃ ng!`);
}

function buyNow() {
    if (!currentBook) return;
    addToCartFromDetail();
    // Navigate to checkout (you can implement this later)
    showSection('cart');
}

function changeShippingAddress() {
    showAlert('TÃ­nh nÄƒng thay Ä‘á»•i Ä‘á»‹a chá»‰ sáº½ Ä‘Æ°á»£c cáº­p nháº­t!');
}

// ==============================
// PRODUCT REVIEWS
// ==============================

async function loadProductReviews(bookId) {
    try {
        let reviews = await getReviewsByBook(bookId);
        if (Array.isArray(reviews)) {
            // Only show approved reviews
            currentReviews = reviews.filter(function (r) {
                return r.approved !== false;
            });
        } else {
            currentReviews = [];
        }
        renderReviewsSummary();
        filterReviews(reviewSortType);
    } catch (error) {
        console.error('Error loading reviews:', error);
        currentReviews = [];
        renderReviewsSummary();
        renderReviewsList([]);
    }
}

function renderReviewsSummary() {
    let avgRatingEl = document.getElementById('averageRating');
    let starsEl = document.getElementById('ratingStarsLarge');
    let countEl = document.getElementById('reviewCount');
    let distEl = document.getElementById('ratingDistribution');
    
    if (!avgRatingEl || !starsEl || !countEl || !distEl) return;
    
    if (currentReviews.length === 0) {
        avgRatingEl.textContent = '0';
        starsEl.innerHTML = renderStars(0);
        countEl.textContent = '(0 Ä‘Ã¡nh giÃ¡)';
        distEl.innerHTML = [5, 4, 3, 2, 1].map(function (star) {
            return `
            <div class="rating-bar-item">
                <span class="rating-bar-label">${star} sao</span>
                <div class="rating-bar-container">
                    <div class="rating-bar-fill" style="width: 0%"></div>
                </div>
                <span class="rating-bar-percentage">0%</span>
            </div>
        `;
        }).join('');
        return;
    }
    
    // Calculate average rating
    let totalRating = currentReviews.reduce(function (sum, r) {
        return sum + (r.rating || 0);
    }, 0);
    let averageRating = totalRating / currentReviews.length;
    
    document.getElementById('averageRating').textContent = averageRating.toFixed(1);
    document.getElementById('ratingStarsLarge').innerHTML = renderStars(averageRating);
    document.getElementById('reviewCount').textContent = `(${currentReviews.length} Ä‘Ã¡nh giÃ¡)`;
    
    // Calculate rating distribution
    let distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    currentReviews.forEach(function (r) {
        let rating = r.rating || 0;
        if (rating >= 5) distribution[5]++;
        else if (rating >= 4) distribution[4]++;
        else if (rating >= 3) distribution[3]++;
        else if (rating >= 2) distribution[2]++;
        else if (rating >= 1) distribution[1]++;
    });
    
    let distributionHTML = [5, 4, 3, 2, 1].map(function (star) {
        let count = distribution[star];
        let percentage = currentReviews.length > 0 ? (count / currentReviews.length * 100).toFixed(0) : 0;
        return `
            <div class="rating-bar-item">
                <span class="rating-bar-label">${star} sao</span>
                <div class="rating-bar-container">
                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="rating-bar-percentage">${percentage}%</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('ratingDistribution').innerHTML = distributionHTML;
}

function filterReviews(sortType) {
    reviewSortType = sortType;
    
    // Update tabs
    document.querySelectorAll('.review-tab').forEach(function (tab) {
        tab.classList.remove('active');
        if (tab.textContent.trim() === (sortType === 'newest' ? 'Má»›i nháº¥t' : 'YÃªu thÃ­ch nháº¥t')) {
            tab.classList.add('active');
        }
    });
    
    // Sort reviews
    let sortedReviews = [...currentReviews];
    
    if (sortType === 'newest') {
        sortedReviews.sort(function (a, b) {
            let dateA = new Date(a.createdAt || 0);
            let dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
    } else if (sortType === 'mostLiked') {
        // Sort by likes (we'll add likes field later, for now sort by rating)
        sortedReviews.sort(function (a, b) {
            let ratingA = a.rating || 0;
            let ratingB = b.rating || 0;
            if (ratingB !== ratingA) return ratingB - ratingA;
            let dateA = new Date(a.createdAt || 0);
            let dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
    }
    
    renderReviewsList(sortedReviews);
}

function renderReviewsList(reviews) {
    let container = document.getElementById('reviewsList');
    if (!container) return;
    
    if (reviews.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">ChÆ°a cÃ³ Ä‘Ã¡nh giÃ¡ nÃ o</p>';
        return;
    }
    
    container.innerHTML = reviews.map(function (review) {
        let date = review.createdAt ? formatDate(review.createdAt) : 'ChÆ°a cÃ³ ngÃ y';
        let rating = review.rating || 0;
        let likes = review.likes || 0;
        
        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-user-info">
                        <div class="review-user-name">${review.userName || 'áº¨n danh'}</div>
                        <div class="review-date">${date}</div>
                    </div>
                    <div class="review-rating-stars">${renderStars(rating)}</div>
                </div>
                <div class="review-comment">${review.comment || 'KhÃ´ng cÃ³ bÃ¬nh luáº­n'}</div>
                <div class="review-actions">
                    <button class="review-action-btn" onclick="likeReview('${review.id}')">
                        <i class="fas fa-thumbs-up"></i>
                        <span>ThÃ­ch (${likes})</span>
                    </button>
                    <button class="review-action-btn" onclick="reportReview('${review.id}')">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>BÃ¡o cÃ¡o</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'ChÆ°a cÃ³ ngÃ y';
    try {
        let date = new Date(dateString);
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return 'ChÆ°a cÃ³ ngÃ y';
    }
}

function likeReview(reviewId) {
    // This would normally call an API to like a review
    showAlert('TÃ­nh nÄƒng thÃ­ch Ä‘Ã¡nh giÃ¡ sáº½ Ä‘Æ°á»£c cáº­p nháº­t!');
}

function reportReview(reviewId) {
    if (confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n bÃ¡o cÃ¡o Ä‘Ã¡nh giÃ¡ nÃ y?')) {
        // This would normally call an API to report a review
        showAlert('Cáº£m Æ¡n báº¡n Ä‘Ã£ bÃ¡o cÃ¡o. ChÃºng tÃ´i sáº½ xem xÃ©t Ä‘Ã¡nh giÃ¡ nÃ y.');
    }
}

function showLoginPrompt() {
    showAlert('Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ viáº¿t Ä‘Ã¡nh giÃ¡!');
}

// ==============================
// ACCOUNT DROPDOWN
// ==============================

function toggleAccountDropdown(event) {
    try {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        let dropdown = document.getElementById('accountDropdown');
        let accountDropdownContainer = document.querySelector('.account-dropdown');
        
        console.log('toggleAccountDropdown called', { dropdown, accountDropdownContainer });
        
        if (!dropdown) {
            console.error('Dropdown element not found!');
            return;
        }
        
        if (!accountDropdownContainer) {
            console.error('Account dropdown container not found!');
            return;
        }
        
        let isShowing = dropdown.classList.contains('show');
        console.log('Current state:', { isShowing });
        
        // ÄÃ³ng táº¥t cáº£ dropdown khÃ¡c
        document.querySelectorAll('.dropdown-menu.show').forEach(function (menu) {
            if (menu !== dropdown) {
                menu.classList.remove('show');
            }
        });
        
        // Toggle dropdown hiá»‡n táº¡i
        if (isShowing) {
            dropdown.classList.remove('show');
            accountDropdownContainer.classList.remove('active');
            console.log('Dropdown closed');
        } else {
            dropdown.classList.add('show');
            accountDropdownContainer.classList.add('active');
            console.log('Dropdown opened');
        }
    } catch (error) {
        console.error('Error in toggleAccountDropdown:', error);
    }
}

// Expose to window immediately for onclick handlers
if (typeof window !== 'undefined') {
    window.toggleAccountDropdown = toggleAccountDropdown;
}

function closeAccountDropdown() {
    try {
        let dropdown = document.getElementById('accountDropdown');
        let accountDropdown = document.querySelector('.account-dropdown');
        
        if (dropdown) {
            dropdown.classList.remove('show');
        }
        if (accountDropdown) {
            accountDropdown.classList.remove('active');
        }
    } catch (error) {
        console.error('Error in closeAccountDropdown:', error);
    }
}

// Expose to window for onclick handlers
window.closeAccountDropdown = closeAccountDropdown;

// ÄÃ³ng dropdown khi click bÃªn ngoÃ i (sáº½ Ä‘Æ°á»£c gá»™p vá»›i event listener khÃ¡c á»Ÿ cuá»‘i file)

function applyFilters() {
    let result = [...allBooks];

    // Filter by selected categories
    if (selectedCategories.length > 0) {
        result = result.filter(function (book) {
            return selectedCategories.includes(book.categoryId);
        });
    }

    // Filter by price range
    if (selectedPriceRange !== 'all') {
        result = result.filter(function (book) {
            let price = book.price || 0;
            switch (selectedPriceRange) {
                case 'under50': return price < 50000;
                case '50to100': return price >= 50000 && price <= 100000;
                case '100to200': return price >= 100000 && price <= 200000;
                case 'over200': return price > 200000;
                default: return true;
            }
        });
    }

    filteredBooks = result;
    currentPage = 0;
    sortBooks();
}

function filterByPrice(range) {
    selectedPriceRange = range;
    // Update active button
    document.querySelectorAll('.price-range-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });
    let clickedBtn = document.querySelector(`.price-range-btn[onclick="filterByPrice('${range}')"]`);
    if (clickedBtn) clickedBtn.classList.add('active');
    applyFilters();
}

function toggleFilterPanel(event) {
    if (event) event.stopPropagation();
    let sidebar = document.getElementById('filterSidebar');
    let overlay = document.getElementById('filterOverlay');
    let toggle = document.querySelector('.navbar-menu-toggle');
    if (sidebar && overlay) {
        let isShowing = sidebar.classList.contains('show');
        if (isShowing) {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
            if (toggle) toggle.classList.remove('active');
        } else {
            sidebar.classList.add('show');
            overlay.classList.add('show');
            if (toggle) toggle.classList.add('active');
        }
    }
}

function closeFilterPanel() {
    let sidebar = document.getElementById('filterSidebar');
    let overlay = document.getElementById('filterOverlay');
    let toggle = document.querySelector('.navbar-menu-toggle');
    if (sidebar) sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
    if (toggle) toggle.classList.remove('active');
}

function showNotifications() {
    showSection('notifications');
}

// Expose to window for onclick handlers
window.showNotifications = showNotifications;

function sortBooks() {
    let sortType = document.getElementById('sortSelect').value;
    
    switch(sortType) {
        case 'priceLow':
            filteredBooks.sort(function (a, b) {
                return (a.price || 0) - (b.price || 0);
            });
            break;
        case 'priceHigh':
            filteredBooks.sort(function (a, b) {
                return (b.price || 0) - (a.price || 0);
            });
            break;
        case 'ratingHigh':
            filteredBooks.sort(function (a, b) {
                return (b.rating || 0) - (a.rating || 0);
            });
            break;
        case 'bestselling':
            // Sort by rating and quantity (simulate best selling)
            filteredBooks.sort(function (a, b) {
                let scoreA = (a.rating || 0) * 10 + (a.quantity || 0);
                let scoreB = (b.rating || 0) * 10 + (b.quantity || 0);
                return scoreB - scoreA;
            });
            break;
        default: // newest
            filteredBooks.sort(function (a, b) {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
    }
    
    currentPage = 0; // Reset to first page when sorting
    renderBooks(filteredBooks);
}

function changeProductCount() {
    productsPerPage = parseInt(document.getElementById('productCountSelect').value);
    currentPage = 0; // Reset to first page
    renderBooks(filteredBooks);
}

// Load categories for filter sidebar
async function loadCategories() {
    try {
        let categories = await fetchCategories();
        if (!Array.isArray(categories)) return;
        allCategoriesData = categories;
        renderFilterCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function renderFilterCategories(categories) {
    let container = document.getElementById('filterCategoryList');
    if (!container) return;

    container.innerHTML = '';

    // "Táº¥t cáº£" option
    let allItem = document.createElement('label');
    allItem.className = 'filter-category-item' + (selectedCategories.length === 0 ? ' active' : '');
    allItem.innerHTML = `
        <input type="checkbox" ${selectedCategories.length === 0 ? 'checked' : ''} onchange="toggleAllCategories(this)">
        <span class="custom-checkbox"></span>
        <span>Táº¥t cáº£</span>
    `;
    container.appendChild(allItem);

    categories.forEach(function (cat) {
        let item = document.createElement('label');
        let isChecked = selectedCategories.includes(cat.id);
        item.className = 'filter-category-item' + (isChecked ? ' active' : '');
        item.innerHTML = `
            <input type="checkbox" value="${cat.id}" ${isChecked ? 'checked' : ''} onchange="toggleCategoryFilter(this, '${cat.id}')">
            <span class="custom-checkbox"></span>
            <span>${cat.name}</span>
        `;
        container.appendChild(item);
    });
}

function toggleAllCategories(checkbox) {
    selectedCategories = [];
    renderFilterCategories(allCategoriesData);
    applyFilters();
}

function toggleCategoryFilter(checkbox, categoryId) {
    if (checkbox.checked) {
        if (!selectedCategories.includes(categoryId)) {
            selectedCategories.push(categoryId);
        }
    } else {
        selectedCategories = selectedCategories.filter(function (id) {
            return id !== categoryId;
        });
    }
    renderFilterCategories(allCategoriesData);
    applyFilters();
}

// Expose filter functions to window
window.toggleAllCategories = toggleAllCategories;
window.toggleCategoryFilter = toggleCategoryFilter;

// Initialize category filter - call after DOM and books are loaded
function initializeCategories() {
    loadCategories();
}

// ==============================
// CART MANAGEMENT
// ==============================

async function addToCart(bookId) {
    try {
        // Try to find book in allBooks first
        let book = allBooks.find(function (b) {
            return b.id === bookId;
        });
        
        // If not found, fetch from API
        if (!book) {
            book = await getBookById(bookId);
        }
        
        if (!book) {
            showAlert('KhÃ´ng tÃ¬m tháº¥y sÃ¡ch!');
            return;
        }

        let existingItem = cart.find(function (item) {
            return item.id === bookId;
        });
        // Giáº£m giÃ¡ pháº§n trÄƒm (badge) + giÃ¡ trá»‹ coupon riÃªng
        let hasDiscount = book.discount && book.discount > 0;
        let discount = hasDiscount ? book.discount : 0; // %
        let couponValue = parseCouponValue(book.discountCode); // sá»‘ tiá»n giáº£m thÃªm tá»« coupon

        if (existingItem) {
            existingItem.quantity += 1;
            // Cáº­p nháº­t láº¡i thÃ´ng tin giáº£m giÃ¡ náº¿u sÃ¡ch Ä‘Ã£ Ä‘Æ°á»£c chá»‰nh trong admin
            existingItem.discount = discount;
            existingItem.discountCode = book.discountCode || null;
            existingItem.couponValue = couponValue || 0;
        } else {
            cart.push({
                id: bookId,
                title: book.title,
                price: book.price,                     // GiÃ¡ gá»‘c
                discount: discount,                    // % giáº£m giÃ¡ (badge)
                discountCode: book.discountCode || null, // MÃ£ coupon admin nháº­p
                couponValue: couponValue || 0,         // Sá»‘ tiá»n giáº£m thÃªm tá»« coupon
                couponApplied: true,                   // Máº·c Ä‘á»‹nh tá»± Ã¡p dá»¥ng coupon
                image: book.image,
                quantity: 1
            });
        }

        saveCart();
        loadCart(); // Reload cart to update display
        updateCartCount();
        showAlert('ÄÃ£ thÃªm vÃ o giá» hÃ ng!');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showAlert('Lá»—i khi thÃªm vÃ o giá» hÃ ng: ' + error.message);
    }
}

function removeFromCart(bookId) {
    cart = cart.filter(function (item) {
        return item.id !== bookId;
    });
    saveCart();
    updateCartCount();
    loadCart();
}

function updateCartQuantity(bookId, quantity) {
    let item = cart.find(function (i) {
        return i.id === bookId;
    });
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart();
        loadCart();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    renderCart();
    updateCartCount();
}

function updateCartCount() {
    let count = cart.reduce(function (sum, item) {
        return sum + item.quantity;
    }, 0);
    document.getElementById('cartCount').textContent = count;
}

function renderCart() {
    let container = document.getElementById('cartContent');
    if (!container) {
        console.error('cartContent element not found');
        return;
    }
    
    if (!cart || cart.length === 0) {
        selectedCartItems.clear();
        container.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.2rem; color: #666; margin-bottom: 1rem;">Giá» hÃ ng cá»§a báº¡n trá»‘ng</p>
                <button class="btn btn-primary" onclick="showSection('home')">Tiáº¿p tá»¥c mua sáº¯m</button>
            </div>
        `;
        return;
    }

    // Clean up selectedCartItems - remove items no longer in cart
    let cartIds = new Set(cart.map(function (item) {
        return item.id;
    }));
    selectedCartItems.forEach(function (id) {
        if (!cartIds.has(id)) selectedCartItems.delete(id);
    });

    let allSelected = cart.length > 0 && cart.every(function (item) {
        return selectedCartItems.has(item.id);
    });

    let html = '<div class="cart-items-list">';

    // Select all row
    html += `
        <div class="cart-select-all">
            <label class="cart-checkbox-label">
                <input type="checkbox" ${allSelected ? 'checked' : ''} onchange="toggleSelectAllCart(this)">
                <span class="cart-custom-checkbox"></span>
                <span>Chá»n táº¥t cáº£ (${selectedCartItems.size}/${cart.length})</span>
            </label>
        </div>
    `;

    let subtotalOriginal = 0;
    let subtotalFinal = 0;

    cart.forEach(function (item) {
        let isSelected = selectedCartItems.has(item.id);
        let originalPrice = item.price || 0;
        let percentDiscount = item.discount || 0; // %

        // GiÃ¡ sau khi Ã¡p dá»¥ng giáº£m giÃ¡ pháº§n trÄƒm (badge)
        let priceAfterPercent = percentDiscount > 0
            ? originalPrice * (1 - percentDiscount / 100)
            : originalPrice;

        // GiÃ¡ trá»‹ coupon (sá»‘ tiá»n) â€“ náº¿u chÆ°a cÃ³ thÃ¬ tÃ­nh láº¡i tá»« mÃ£
        if (item.couponValue == null || typeof item.couponValue === 'undefined') {
            item.couponValue = parseCouponValue(item.discountCode);
        }
        let couponValue = item.couponValue || 0;
        let hasCoupon = !!item.discountCode && couponValue > 0;
        let couponApplied = hasCoupon && (item.couponApplied !== false);

        // GiÃ¡ cuá»‘i cÃ¹ng: sau pháº§n trÄƒm + trá»« thÃªm coupon (náº¿u Ä‘ang Ã¡p dá»¥ng)
        let finalPrice = couponApplied
            ? Math.max(priceAfterPercent - couponValue, 0)
            : priceAfterPercent;

        let originalItemTotal = originalPrice * item.quantity;
        let finalItemTotal = finalPrice * item.quantity;

        if (isSelected) {
            subtotalOriginal += originalItemTotal;
            subtotalFinal += finalItemTotal;
        }

        // Try to get image from item, or fetch from allBooks if not available
        let imageUrl = item.image || '';
        if (!imageUrl) {
            let book = allBooks.find(function (b) {
                return b.id === item.id;
            });
            if (book && book.image) {
                imageUrl = book.image;
                item.image = book.image;
                saveCart();
            }
        }

        html += `
            <div class="cart-item ${isSelected ? 'cart-item-selected' : ''}">
                <div class="cart-item-checkbox">
                    <label class="cart-checkbox-label">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleCartItemSelect('${item.id}', this)">
                        <span class="cart-custom-checkbox"></span>
                    </label>
                </div>
                <div class="cart-item-image" style="width: 100px; height: 120px; flex-shrink: 0; background: #f5f5f5; border-radius: 4px; overflow: hidden;">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${item.title || 'SÃ¡ch'}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#999;font-size:2rem;\\'>ðŸ“š</div>'">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#999;font-size:2rem;">ðŸ“š</div>'}
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title || 'SÃ¡ch'}</div>
                    <div class="cart-item-price">
                        <span class="cart-item-current-price">${formatPrice(finalPrice)}</span>
                        ${percentDiscount > 0 ? `<span class="cart-item-original-price">${formatPrice(originalPrice)}</span><span class="cart-item-discount-badge">-${percentDiscount}%</span>` : ''}
                    </div>
                    <div class="quantity-control">
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" readonly>
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    ${hasCoupon ? `
                        <div class="cart-item-coupon">
                            <button type="button" class="coupon-toggle ${couponApplied ? 'applied' : 'not-applied'}" onclick="toggleCartItemCoupon('${item.id}')">
                                ${couponApplied ? 'Äang Ã¡p dá»¥ng' : 'KhÃ´ng Ã¡p dá»¥ng'}: ${item.discountCode} (-${formatPrice(couponValue)})
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="cart-item-total">
                    <div class="cart-item-total-price">${formatPrice(finalItemTotal)}</div>
                    ${percentDiscount > 0 ? `<div class="cart-item-total-original">${formatPrice(originalItemTotal)}</div>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.id}')">XÃ³a</button>
                </div>
            </div>
        `;
    });

    let discountTotal = subtotalOriginal - subtotalFinal;
    let selectedCount = selectedCartItems.size;

    html += `
        <div class="cart-summary">
            <div class="summary-row">
                <span>Táº¡m tÃ­nh (${selectedCount} sáº£n pháº©m):</span>
                <span>${formatPrice(subtotalOriginal)}</span>
            </div>
            ${discountTotal > 0 ? `
            <div class="summary-row">
                <span>Giáº£m giÃ¡ (mÃ£ giáº£m giÃ¡):</span>
                <span>- ${formatPrice(discountTotal)}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
                <span>Tá»•ng cá»™ng:</span>
                <span>${formatPrice(subtotalFinal)}</span>
            </div>
            <div class="cart-actions">
                <button class="btn btn-secondary" onclick="showSection('home')">Tiáº¿p tá»¥c mua sáº¯m</button>
                <button class="btn btn-primary" onclick="checkout()" ${selectedCount === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Thanh toÃ¡n (${selectedCount})</button>
            </div>
        </div>
    </div>`;

    container.innerHTML = html;
}

function toggleCartItemSelect(bookId, checkbox) {
    if (checkbox.checked) {
        selectedCartItems.add(bookId);
    } else {
        selectedCartItems.delete(bookId);
    }
    renderCart();
}

function toggleSelectAllCart(checkbox) {
    if (checkbox.checked) {
        cart.forEach(function (item) {
            selectedCartItems.add(item.id);
        });
    } else {
        selectedCartItems.clear();
    }
    renderCart();
}

// Expose to window
window.toggleCartItemSelect = toggleCartItemSelect;
window.toggleSelectAllCart = toggleSelectAllCart;

function toggleCartItemCoupon(bookId) {
    let item = cart.find(function (i) {
        return i.id === bookId;
    });
    if (!item) return;
    // Chá»‰ cho phÃ©p toggle khi cÃ³ coupon há»£p lá»‡
    let couponValue = item.couponValue != null ? item.couponValue : parseCouponValue(item.discountCode);
    if (!item.discountCode || !couponValue || couponValue <= 0) return;

    item.couponApplied = item.couponApplied === false ? true : false;
    saveCart();
    renderCart();
}

function checkout() {
    if (cart.length === 0) {
        showAlert('Giá» hÃ ng trá»‘ng');
        return;
    }
    if (selectedCartItems.size === 0) {
        showAlert('Vui lÃ²ng chá»n Ã­t nháº¥t má»™t sáº£n pháº©m Ä‘á»ƒ thanh toÃ¡n');
        return;
    }
    showSection('checkout');
    renderCheckoutPage();
}

function renderCheckoutPage() {
    let user = auth.getUser();

    // Pre-fill user info
    let nameInput = document.getElementById('checkoutName');
    let emailInput = document.getElementById('checkoutEmail');
    let phoneInput = document.getElementById('checkoutPhone');
    if (nameInput && user) nameInput.value = user.name || '';
    if (emailInput && user) emailInput.value = user.email || '';
    if (phoneInput && user) phoneInput.value = user.phone || '';

    // Render order items in sidebar
    let itemsList = document.getElementById('checkoutItemsList');
    let selectedItems = cart.filter(function (item) {
        return selectedCartItems.has(item.id);
    });

    document.getElementById('checkoutItemCount').textContent = selectedItems.length + ' sáº£n pháº©m';

    let subtotal = 0;
    let totalOriginal = 0;
    let itemsHtml = '';

    selectedItems.forEach(function (item) {
        let originalPrice = item.price || 0;
        let percentDiscount = item.discount || 0;
        let priceAfterPercent = percentDiscount > 0
            ? originalPrice * (1 - percentDiscount / 100)
            : originalPrice;

        let couponValue = item.couponValue || 0;
        let hasCoupon = !!item.discountCode && couponValue > 0;
        let couponApplied = hasCoupon && (item.couponApplied !== false);
        let finalPrice = couponApplied
            ? Math.max(priceAfterPercent - couponValue, 0)
            : priceAfterPercent;

        subtotal += finalPrice * item.quantity;
        totalOriginal += originalPrice * item.quantity;

        let imageUrl = item.image || '';
        itemsHtml += `
            <div class="checkout-order-item">
                ${imageUrl ? `<img src="${imageUrl}" alt="${item.title || ''}">` : '<div style="width:50px;height:65px;background:#f5f5f5;border-radius:4px;display:flex;align-items:center;justify-content:center;">ðŸ“š</div>'}
                <div class="checkout-order-item-info">
                    <div class="checkout-order-item-title">${item.title || 'SÃ¡ch'}</div>
                    <div class="checkout-order-item-qty">x${item.quantity}</div>
                    <div class="checkout-order-item-price">${formatPrice(finalPrice * item.quantity)}</div>
                </div>
            </div>
        `;
    });

    itemsList.innerHTML = itemsHtml;

    let shippingFee = 30000;
    let savings = totalOriginal - subtotal;

    document.getElementById('checkoutSubtotal').textContent = formatPrice(subtotal);
    document.getElementById('checkoutShipping').textContent = formatPrice(shippingFee);
    document.getElementById('checkoutSavings').textContent = '-' + formatPrice(savings);
    document.getElementById('checkoutTotal').textContent = formatPrice(subtotal + shippingFee);

    // Reset payment method
    selectPaymentMethod('COD', document.querySelector('.payment-method-option.selected'));
}

function selectPaymentMethod(method, element) {
    document.querySelectorAll('.payment-method-option').forEach(function (opt) {
        opt.classList.remove('selected');
    });
    if (element) element.classList.add('selected');
    let radio = document.querySelector(`input[name="paymentMethod"][value="${method}"]`);
    if (radio) radio.checked = true;

    let bankInfo = document.getElementById('bankInfo');
    let momoInfo = document.getElementById('momoInfo');
    if (bankInfo) bankInfo.style.display = method === 'BANK' ? 'block' : 'none';
    if (momoInfo) momoInfo.style.display = method === 'MOMO' ? 'block' : 'none';
}

function applyCheckoutCoupon() {
    let code = document.getElementById('checkoutCouponInput').value.trim();
    if (!code) {
        showAlert('Vui lÃ²ng nháº­p mÃ£ giáº£m giÃ¡');
        return;
    }

    let baseUrl = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:8080/api');
    fetch(`${baseUrl}/coupons/code/${encodeURIComponent(code)}`)
        .then(function () {
            if (!res.ok) throw new Error('MÃ£ giáº£m giÃ¡ khÃ´ng tá»“n táº¡i');
            return res.json();
        })
        .then(function () {
            if (!coupon || !coupon.active) {
                showAlert('MÃ£ giáº£m giÃ¡ khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n');
                return;
            }
            // Store applied coupon
            window.appliedCheckoutCoupon = coupon;
            // Recalculate checkout totals
            updateCheckoutWithCoupon(coupon);
            showAlert(`Ãp dá»¥ng mÃ£ ${coupon.code} thÃ nh cÃ´ng! Giáº£m ${coupon.discountType === 'PERCENTAGE' ? coupon.discountValue + '%' : formatPrice(coupon.discountValue)}`);
        })
        .catch(function () {
            window.appliedCheckoutCoupon = null;
            showAlert('Lá»—i: ' + err.message);
        });
}

function updateCheckoutWithCoupon(coupon) {
    let selectedItems = cart.filter(function (item) {
        return selectedCartItems.has(item.id);
    });
    let subtotal = 0;
    let totalOriginal = 0;

    selectedItems.forEach(function (item) {
        let originalPrice = item.price || 0;
        let percentDiscount = item.discount || 0;
        let priceAfterPercent = percentDiscount > 0
            ? originalPrice * (1 - percentDiscount / 100)
            : originalPrice;

        let couponValue = item.couponValue || 0;
        let hasCoupon = !!item.discountCode && couponValue > 0;
        let couponApplied = hasCoupon && (item.couponApplied !== false);
        let finalPrice = couponApplied
            ? Math.max(priceAfterPercent - couponValue, 0)
            : priceAfterPercent;

        subtotal += finalPrice * item.quantity;
        totalOriginal += originalPrice * item.quantity;
    });

    let couponDiscount = 0;
    if (coupon) {
        if (coupon.discountType === 'PERCENTAGE') {
            couponDiscount = subtotal * (coupon.discountValue / 100);
        } else {
            couponDiscount = coupon.discountValue;
        }
        couponDiscount = Math.min(couponDiscount, subtotal);
    }

    let afterCoupon = subtotal - couponDiscount;
    let shippingFee = 30000;
    let savings = totalOriginal - afterCoupon;

    document.getElementById('checkoutSubtotal').textContent = formatPrice(afterCoupon);
    document.getElementById('checkoutShipping').textContent = formatPrice(shippingFee);
    document.getElementById('checkoutSavings').textContent = '-' + formatPrice(savings);
    document.getElementById('checkoutTotal').textContent = formatPrice(afterCoupon + shippingFee);
}

async function placeOrder() {
    let name = document.getElementById('checkoutName').value.trim();
    let phone = document.getElementById('checkoutPhone').value.trim();
    let email = document.getElementById('checkoutEmail').value.trim();
    let province = document.getElementById('checkoutProvince').value;
    let district = document.getElementById('checkoutDistrict').value.trim();
    let ward = document.getElementById('checkoutWard').value.trim();
    let address = document.getElementById('checkoutAddress').value.trim();
    let note = document.getElementById('checkoutNote').value.trim();
    let paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'COD';

    // Validate
    if (!name) { showAlert('Vui lÃ²ng nháº­p há» vÃ  tÃªn'); return; }
    if (!phone) { showAlert('Vui lÃ²ng nháº­p sá»‘ Ä‘iá»‡n thoáº¡i'); return; }
    if (!/^[0-9]{10}$/.test(phone)) { showAlert('Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng há»£p lá»‡, vui lÃ²ng nháº­p Ä‘Ãºng 10 chá»¯ sá»‘'); return; }
    if (!email) { showAlert('Vui lÃ²ng nháº­p email'); return; }
    if (!province) { showAlert('Vui lÃ²ng chá»n tá»‰nh/thÃ nh phá»‘'); return; }
    if (!address) { showAlert('Vui lÃ²ng nháº­p Ä‘á»‹a chá»‰ cá»¥ thá»ƒ'); return; }

    let selectedItems = cart.filter(function (item) {
        return selectedCartItems.has(item.id);
    });
    if (selectedItems.length === 0) {
        showAlert('KhÃ´ng cÃ³ sáº£n pháº©m nÃ o Ä‘Æ°á»£c chá»n');
        return;
    }

    // Build full address
    let provinceText = document.getElementById('checkoutProvince').selectedOptions[0]?.text || '';
    let fullAddress = [address, ward, district, provinceText].filter(Boolean).join(', ');

    // Calculate total
    let totalPrice = 0;
    let orderItems = selectedItems.map(function (item) {
        let originalPrice = item.price || 0;
        let percentDiscount = item.discount || 0;
        let priceAfterPercent = percentDiscount > 0
            ? originalPrice * (1 - percentDiscount / 100)
            : originalPrice;
        let couponValue = item.couponValue || 0;
        let hasCoupon = !!item.discountCode && couponValue > 0;
        let couponApplied = hasCoupon && (item.couponApplied !== false);
        let finalPrice = couponApplied
            ? Math.max(priceAfterPercent - couponValue, 0)
            : priceAfterPercent;

        totalPrice += finalPrice * item.quantity;

        return {
            bookId: item.id,
            title: item.title,
            price: finalPrice,
            quantity: item.quantity
        };
    });

    let shippingFee = 30000;
    totalPrice += shippingFee;

    let user = auth.getUser();

    let orderData = {
        userId: user?.id,
        items: orderItems,
        totalPrice: totalPrice,
        status: 'PENDING',
        paymentMethod: paymentMethod,
        shippingAddress: fullAddress + (note ? ' | Ghi chÃº: ' + note : ''),
        phone: phone
    };

    let placeOrderBtn = document.querySelector('.btn-place-order');
    try {
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Äang xá»­ lÃ½...';

        let result = await apiCall('/orders', 'POST', orderData);

        // Remove purchased items from cart
        cart = cart.filter(function (item) {
            return !selectedCartItems.has(item.id);
        });
        selectedCartItems.clear();
        saveCart();
        updateCartCount();

        // Show success
        document.getElementById('successOrderId').textContent = result.id || 'N/A';
        showSection('orderSuccess');

    } catch (error) {
        showAlert('Äáº·t hÃ ng tháº¥t báº¡i: ' + error.message);
    } finally {
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<i class="fas fa-check"></i> Äáº·t hÃ ng';
    }
}

// Expose checkout functions to window
window.checkout = checkout;
window.selectPaymentMethod = selectPaymentMethod;
window.applyCheckoutCoupon = applyCheckoutCoupon;
window.placeOrder = placeOrder;

// ==============================
// MY ORDERS
// ==============================

async function loadMyOrders() {
    let user = auth.getUser();
    if (!user || !user.id) return;
    let container = document.getElementById('myOrdersList');
    container.innerHTML = '<p style="text-align:center;color:#999;">Äang táº£i...</p>';
    try {
        let orders = await apiCall(`/orders?userId=${user.id}`);
        if (!orders || orders.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;">Báº¡n chÆ°a cÃ³ Ä‘Æ¡n hÃ ng nÃ o.</p>';
            return;
        }
        let statusMap = { PENDING: 'Chá» xÃ¡c nháº­n', CONFIRMED: 'ÄÃ£ xÃ¡c nháº­n', SHIPPED: 'Äang giao', DELIVERED: 'ÄÃ£ giao', CANCELLED: 'ÄÃ£ há»§y' };
        let statusColor = { PENDING: '#f0ad4e', CONFIRMED: '#5bc0de', SHIPPED: '#0275d8', DELIVERED: '#5cb85c', CANCELLED: '#d9534f' };
        let html = '';
        orders.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        orders.forEach(function (order) {
            let date = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '';
            let color = statusColor[order.status] || '#999';
            let label = statusMap[order.status] || order.status;
            let itemsHtml = '';
            if (order.items) {
                order.items.forEach(function (item) {
                    itemsHtml += `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
                        <span>${item.title || 'SÃ¡ch'} x${item.quantity}</span>
                        <span>${formatPrice(item.price * item.quantity)}</span>
                    </div>`;
                });
            }
            html += `
            <div style="background:#fff;border:1px solid #e0e0e0;border-radius:10px;padding:16px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div>
                        <span style="font-weight:600;">MÃ£ ÄH:</span> <span style="font-size:0.9em;color:#555;">${order.id}</span>
                        <span style="margin-left:12px;font-size:0.85em;color:#888;">${date}</span>
                    </div>
                    <span style="padding:4px 12px;border-radius:20px;font-size:0.85em;color:#fff;background:${color};">${label}</span>
                </div>
                <div style="margin-bottom:10px;">${itemsHtml}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:0.9em;color:#666;"><i class="fas fa-map-marker-alt"></i> ${order.shippingAddress || ''}</div>
                    <div style="font-weight:700;color:#e74c3c;font-size:1.1em;">${formatPrice(order.totalPrice)}</div>
                </div>
                ${order.status === 'PENDING' ? `<div style="text-align:right;margin-top:8px;"><button class="btn btn-danger btn-sm" onclick="cancelMyOrder('${order.id}')">Há»§y Ä‘Æ¡n</button></div>` : ''}
            </div>`;
        });
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p style="text-align:center;color:red;">Lá»—i khi táº£i Ä‘Æ¡n hÃ ng: ' + error.message + '</p>';
    }
}

async function cancelMyOrder(orderId) {
    if (!confirm('Báº¡n cháº¯c cháº¯n muá»‘n há»§y Ä‘Æ¡n hÃ ng nÃ y?')) return;
    try {
        await apiCall(`/orders/${orderId}/cancel`, 'PUT');
        showAlert('ÄÃ£ há»§y Ä‘Æ¡n hÃ ng thÃ nh cÃ´ng!');
        loadMyOrders();
    } catch (error) {
        showAlert('Lá»—i: ' + error.message);
    }
}

window.loadMyOrders = loadMyOrders;
window.cancelMyOrder = cancelMyOrder;

// ==============================
// NOTIFICATION SYSTEM
// ==============================

// Start polling for notifications
function startNotificationPolling() {
    let user = auth.getUser();
    if (!user || !user.id) return;
    
    // Initial load
    loadNotifBadge();
    
    // Poll every 30 seconds
    notificationPollingInterval = setInterval(async function () {
        await loadNotifBadge();
    }, 30000);
}

// Stop polling for notifications
function stopNotificationPolling() {
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }
}

// Load notification badge count
async function loadNotifBadge() {
    let user = auth.getUser();
    if (!user || !user.id) return;
    
    try {
        let count = await getUnreadCount(user.id);
        unreadNotificationCount = count;
        updateNotificationBadge();
    } catch (error) {
        console.error('Error loading notification badge:', error);
    }
}

// Update notification badge display
function updateNotificationBadge() {
    let badge = document.getElementById('notifBadge');
    if (badge) {
        if (unreadNotificationCount > 0) {
            badge.textContent = unreadNotificationCount > 99 ? '99+' : unreadNotificationCount;
            badge.style.display = 'inline-block';
            badge.classList.add('has-notifications');
        } else {
            badge.style.display = 'none';
            badge.classList.remove('has-notifications');
        }
    }
}

// Load and display notifications
async function loadNotifications() {
    let user = auth.getUser();
    if (!user || !user.id) return;
    
    try {
        notifications = await getNotifications(user.id);
        renderNotifications();
    } catch (error) {
        console.error('Error loading notifications:', error);
        showAlert('Lá»—i khi táº£i thÃ´ng bÃ¡o');
    }
}

// Render notifications list
function renderNotifications() {
    let container = document.getElementById('notificationsList');
    if (!container) return;
    
    if (!Array.isArray(notifications) || notifications.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">KhÃ´ng cÃ³ thÃ´ng bÃ¡o</p>';
        return;
    }
    
    container.innerHTML = notifications.map(function (notification) {
        return `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" onclick="handleNotificationClick('${notification.id}')">
            <div class="notification-header">
                <h4>${notification.title || 'ThÃ´ng bÃ¡o'}</h4>
                <span class="notification-time">${formatDate(notification.createdAt)}</span>
            </div>
            <p class="notification-message">${notification.message || ''}</p>
            ${!notification.read ? '<div class="unread-indicator"></div>' : ''}
        </div>
    `;
    }).join('');
}

// Handle notification click
async function handleNotificationClick(notificationId) {
    // Mark as read
    try {
        await markNotificationAsRead(notificationId);
        
        // Update local data
        let notification = notifications.find(function (n) {
            return n.id === notificationId;
        });
        if (notification) {
            notification.read = true;
        }
        
        // Update badge
        unreadNotificationCount = Math.max(0, unreadNotificationCount - 1);
        updateNotificationBadge();
        
        // Re-render notifications
        renderNotifications();
        
        // If it's an order notification, maybe refresh orders
        let notif = notifications.find(function (n) {
            return n.id === notificationId;
        });
        if (notif && notif.type === 'ORDER_STATUS_CHANGED' && notif.orderId) {
            // Refresh orders if user is on orders page
            let currentSection = document.querySelector('.section.active');
            if (currentSection && currentSection.id === 'myOrders') {
                loadMyOrders();
            }
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark all notifications as read
async function markAllAsRead() {
    let user = auth.getUser();
    if (!user || !user.id) return;
    
    try {
        await markAllNotificationsAsRead(user.id);
        
        // Update local data
        notifications.forEach(function (n) {
            n.read = true;
        });
        unreadNotificationCount = 0;
        updateNotificationBadge();
        renderNotifications();
        
        showAlert('ÄÃ£ Ä‘Ã¡nh dáº¥u táº¥t cáº£ thÃ´ng bÃ¡o lÃ  Ä‘Ã£ Ä‘á»c');
    } catch (error) {
        console.error('Error marking all as read:', error);
        showAlert('Lá»—i khi Ä‘Ã¡nh dáº¥u Ä‘Ã£ Ä‘á»c');
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    
    let date = new Date(dateString);
    let now = new Date();
    let diffMs = now - date;
    let diffMins = Math.floor(diffMs / 60000);
    let diffHours = Math.floor(diffMs / 3600000);
    let diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vá»«a xong';
    if (diffMins < 60) return `${diffMins} phÃºt trÆ°á»›c`;
    if (diffHours < 24) return `${diffHours} giá» trÆ°á»›c`;
    if (diffDays < 7) return `${diffDays} ngÃ y trÆ°á»›c`;
    
    return date.toLocaleDateString('vi-VN');
}

// Expose notification functions
window.loadNotifications = loadNotifications;
window.handleNotificationClick = handleNotificationClick;
window.markAllAsRead = markAllAsRead;
window.startNotificationPolling = startNotificationPolling;
window.stopNotificationPolling = stopNotificationPolling;

// ==============================
// PROFILE MANAGEMENT
// ==============================

async function loadProfile() {
    let user = auth.getUser();
    if (!user || !user.id) {
        console.error('User not found or missing ID', user);
        // Try to reload from localStorage
        let storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (storedUser && storedUser.id) {
            console.log('Found user in localStorage, updating auth');
            auth.setAuth(storedUser, localStorage.getItem('token'));
            // Retry with stored user
            let retryUser = auth.getUser();
            if (retryUser && retryUser.id) {
                // Continue with retryUser
                return await loadProfileWithUser(retryUser);
            }
        }
        return;
    }
    
    return await loadProfileWithUser(user);
}

async function loadProfileWithUser(user) {
    if (!user || !user.id) {
        console.error('Invalid user provided to loadProfileWithUser', user);
        return;
    }
    
    try {
        // Load full user information from backend
        let fullUserData = await getUserById(user.id);
        
        // Update profile display with full data
        let profileNameEl = document.getElementById('profileName');
        let profileNameDisplayEl = document.getElementById('profileNameDisplay');
        let profileEmailEl = document.getElementById('profileEmail');
        let profilePhoneEl = document.getElementById('profilePhone');
        let profileRoleEl = document.getElementById('profileRole');
        let profileRoleBadgeEl = document.getElementById('profileRoleBadge');
        let profileCreatedAtEl = document.getElementById('profileCreatedAt');
        let profileStatusEl = document.getElementById('profileStatus');
        let profileAvatarEl = document.getElementById('profileAvatar');
        
        if (profileNameEl) profileNameEl.textContent = fullUserData.name || user.name || 'ChÆ°a cÃ³';
        if (profileNameDisplayEl) profileNameDisplayEl.textContent = fullUserData.name || user.name || 'NgÆ°á»i dÃ¹ng';
        if (profileEmailEl) profileEmailEl.textContent = fullUserData.email || user.email || 'ChÆ°a cÃ³';
        if (profilePhoneEl) profilePhoneEl.textContent = fullUserData.phone || user.phone || '-';
        if (profileRoleEl) profileRoleEl.textContent = fullUserData.role || user.role || 'CUSTOMER';
        if (profileRoleBadgeEl) {
            profileRoleBadgeEl.textContent = fullUserData.role || user.role || 'CUSTOMER';
            profileRoleBadgeEl.className = 'profile-role-badge ' + (fullUserData.role === 'ADMIN' ? 'role-admin' : 'role-customer');
        }
        
        // Format and display created date
        if (profileCreatedAtEl && fullUserData.createdAt) {
            profileCreatedAtEl.textContent = formatProfileDate(fullUserData.createdAt);
        } else if (profileCreatedAtEl) {
            profileCreatedAtEl.textContent = 'ChÆ°a cÃ³ thÃ´ng tin';
        }
        
        // Display status
        if (profileStatusEl) {
            let isActive = fullUserData.active !== false;
            profileStatusEl.innerHTML = isActive 
                ? '<span class="status-active"><i class="fas fa-check-circle"></i> Äang hoáº¡t Ä‘á»™ng</span>'
                : '<span class="status-inactive"><i class="fas fa-times-circle"></i> ÄÃ£ khÃ³a</span>';
        }
        
        // Display avatar if available
        if (profileAvatarEl && fullUserData.avatar) {
            profileAvatarEl.innerHTML = `<img src="${fullUserData.avatar}" alt="${fullUserData.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'">`;
        } else if (profileAvatarEl) {
            // Show initials if no avatar
            let initials = (fullUserData.name || user.name || 'U').split(' ').map(function (n) {
                return n[0];
            }).join('').toUpperCase().substring(0, 2);
            profileAvatarEl.innerHTML = `<span class="avatar-initials">${initials}</span>`;
        }
        
        // Update local auth with full data
        let updatedUser = {
            ...user,
            ...fullUserData,
            phone: fullUserData.phone || user.phone || ''
        };
        auth.setAuth(updatedUser, auth.token);
        
        // Cáº­p nháº­t tÃªn trong header
        updateAccountName();
    } catch (error) {
        console.error('Error loading full profile:', error);
        // Fallback to basic user data
        let profileNameEl = document.getElementById('profileName');
        let profileNameDisplayEl = document.getElementById('profileNameDisplay');
        let profileEmailEl = document.getElementById('profileEmail');
        let profilePhoneEl = document.getElementById('profilePhone');
        let profileRoleEl = document.getElementById('profileRole');
        let profileRoleBadgeEl = document.getElementById('profileRoleBadge');
        
        if (profileNameEl) profileNameEl.textContent = user.name || '';
        if (profileNameDisplayEl) profileNameDisplayEl.textContent = user.name || 'NgÆ°á»i dÃ¹ng';
        if (profileEmailEl) profileEmailEl.textContent = user.email || '';
        if (profilePhoneEl) profilePhoneEl.textContent = user.phone || '-';
        if (profileRoleEl) profileRoleEl.textContent = user.role || '';
        if (profileRoleBadgeEl) {
            profileRoleBadgeEl.textContent = user.role || 'CUSTOMER';
            profileRoleBadgeEl.className = 'profile-role-badge ' + (user.role === 'ADMIN' ? 'role-admin' : 'role-customer');
        }
        
        updateAccountName();
    }
}

function formatProfileDate(date) {
    if (!date) return 'ChÆ°a cÃ³ thÃ´ng tin';
    try {
        let d = new Date(date);
        let day = String(d.getDate()).padStart(2, '0');
        let month = String(d.getMonth() + 1).padStart(2, '0');
        let year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return 'ChÆ°a cÃ³ thÃ´ng tin';
    }
}

function showProfile() {
    try {
        loadProfile();
        showSection('profile');
    } catch (error) {
        console.error('Error in showProfile:', error);
    }
}

// Expose to window for onclick handlers
window.showProfile = showProfile;

function showEditProfile() {
    let user = auth.getUser();
    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPhone').value = user.phone || '';
    
    let profileInfo = document.getElementById('profileInfo');
    if (profileInfo) {
        profileInfo.style.display = 'none';
    }
    let changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.classList.add('hidden');
    }
    document.getElementById('editProfileForm').classList.remove('hidden');
}

function hideEditProfile() {
    document.getElementById('editProfileForm').classList.add('hidden');
    let profileInfo = document.getElementById('profileInfo');
    if (profileInfo) {
        profileInfo.style.display = 'block';
    }
}

function showChangePasswordForm() {
    let profileInfo = document.getElementById('profileInfo');
    if (profileInfo) {
        profileInfo.style.display = 'none';
    }

    let editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.classList.add('hidden');
    }

    let changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.classList.remove('hidden');
    }
}

function hideChangePasswordForm() {
    let changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.classList.add('hidden');
        changePasswordForm.reset();
    }

    let profileInfo = document.getElementById('profileInfo');
    if (profileInfo) {
        profileInfo.style.display = 'block';
    }
}

async function changePassword(event) {
    event.preventDefault();

    let oldPassword = document.getElementById('oldPassword').value;
    let newPassword = document.getElementById('newPassword').value;
    let confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
        showAlert('Vui lòng điền đầy đủ thông tin mật khẩu');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showAlert('Xác nhận mật khẩu mới không khớp');
        return;
    }

    try {
        await apiCall('/auth/changepassword', 'POST', {
            oldPassword: oldPassword,
            newPassword: newPassword
        });

        showAlert('Đổi mật khẩu thành công!');
        hideChangePasswordForm();
    } catch (error) {
        showAlert('Lỗi khi đổi mật khẩu: ' + error.message);
    }
}

async function saveProfile(event) {
    event.preventDefault();
    
    let user = auth.getUser();
    if (!user || !user.id) {
        showAlert('Lá»—i: KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin ngÆ°á»i dÃ¹ng. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i.');
        return;
    }
    
    let userData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        role: user.role,
        active: true
    };

    try {
        await updateUser(user.id, userData);
        
        // Update local auth
        user.name = userData.name;
        user.email = userData.email;
        user.phone = userData.phone;
        auth.setAuth(user, auth.token);
        
        // Update account name in header
        updateAccountName();
        
        showAlert('Cáº­p nháº­t thÃ´ng tin thÃ nh cÃ´ng!');
        hideEditProfile();
        loadProfile();
    } catch (error) {
        console.error('Error saving profile:', error);
        showAlert('Lá»—i: ' + error.message);
    }
}

// ==============================
// REVIEWS
// ==============================

let reviewingBookId = null;

function openReviewModal(bookId) {
    reviewingBookId = bookId;
    document.getElementById('reviewModal').classList.remove('hidden');
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.add('hidden');
    document.getElementById('reviewComment').value = '';
    document.querySelectorAll('input[name="rating"]').forEach(function (input) {
        input.checked = false;
    });
    reviewingBookId = null;
}

async function submitReview(event) {
    event.preventDefault();

    let rating = document.querySelector('input[name="rating"]:checked');
    let comment = document.getElementById('reviewComment').value;

    if (!rating) {
        showAlert('Vui lÃ²ng chá»n xáº¿p háº¡ng');
        return;
    }

    let reviewData = {
        bookId: reviewingBookId,
        userId: auth.getUser().id,
        userName: auth.getUser().name,
        rating: parseInt(rating.value),
        comment: comment,
        approved: false
    };

    try {
        await createReview(reviewData);
        showAlert('ÄÃ¡nh giÃ¡ cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c gá»­i!');
        closeReviewModal();
        showBookDetail(reviewingBookId);
    } catch (error) {
        showAlert('Lá»—i: ' + error.message);
    }
}

async function loadMyReviews() {
    try {
        let userId = auth.getUser().id;
        myReviews = await getUserReviews(userId);
        renderMyReviews(myReviews);
    } catch (error) {
        showAlert('Lá»—i khi táº£i Ä‘Ã¡nh giÃ¡: ' + error.message);
    }
}

function renderMyReviews(reviews) {
    let container = document.getElementById('myReviewsList');
    
    if (!Array.isArray(reviews) || reviews.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: #999;">Báº¡n chÆ°a cÃ³ Ä‘Ã¡nh giÃ¡ nÃ o</p>
        `;
        return;
    }

    container.innerHTML = '';
    reviews.forEach(function (review) {
        let item = document.createElement('div');
        item.className = 'review-item';
        item.innerHTML = `
            <div class="review-header">
                <div>
                    <div class="review-book">ðŸ“– ${getBookTitle(review.bookId)}</div>
                    <div class="review-rating">${makeStars(review.rating)}</div>
                </div>
                <span style="font-size: 0.85rem; color: ${review.approved ? '#48bb78' : '#f56565'};">
                    ${review.approved ? 'âœ“ ÄÃ£ duyá»‡t' : 'â³ Chá» duyá»‡t'}
                </span>
            </div>
            <div class="review-comment">${review.comment}</div>
        `;
        container.appendChild(item);
    });
}

function getBookTitle(bookId) {
    let book = allBooks.find(function (b) {
        return b.id === bookId;
    });
    return book ? book.title : 'SÃ¡ch chÆ°a xÃ¡c Ä‘á»‹nh';
}

// ==============================
// LOGOUT
// ==============================

function handleLogout() {
    try {
        if (confirm('Báº¡n cháº¯c cháº¯n muá»‘n Ä‘Äƒng xuáº¥t?')) {
            cart = [];
            localStorage.removeItem('cart');
            auth.logout();
        }
    } catch (error) {
        console.error('Error in handleLogout:', error);
    }
}

// Expose to window for onclick handlers
window.handleLogout = handleLogout;

// ==============================
// UTILITY FUNCTIONS
// ==============================

function formatPrice(price) {
    if (!price) return '0 â‚«';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function makeStars(rating) {
    let fullStars = Math.floor(rating || 0);
    let hasHalf = (rating || 0) % 1 >= 0.5;
    let stars = 'â­'.repeat(fullStars);
    if (hasHalf) stars += 'âœ¨';
    return stars || 'ChÆ°a cÃ³ Ä‘Ã¡nh giÃ¡';
}

function renderStars(rating) {
    let numRating = rating || 0;
    let fullStars = Math.floor(numRating);
    let hasHalf = numRating % 1 >= 0.5;
    let html = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fas fa-star star"></i>';
        } else if (i === fullStars && hasHalf) {
            html += '<i class="fas fa-star-half-alt star"></i>';
        } else {
            html += '<i class="far fa-star star empty"></i>';
        }
    }
    
    return html || '<span style="color: #999; font-size: 0.85rem;">ChÆ°a cÃ³ Ä‘Ã¡nh giÃ¡</span>';
}

// ==============================
// PAGINATION
// ==============================

function renderPagination() {
    let container = document.getElementById('pagination');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    let prevBtn = document.createElement('button');
    prevBtn.textContent = 'â€¹';
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = function () {
        goToPage(currentPage - 1);
    };
    container.appendChild(prevBtn);
    
    // Page numbers
    let maxVisible = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }
    
    // First page
    if (startPage > 0) {
        let firstBtn = document.createElement('button');
        firstBtn.textContent = '1';
        firstBtn.onclick = function () {
            goToPage(0);
        };
        container.appendChild(firstBtn);
        
        if (startPage > 1) {
            let ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'ellipsis';
            container.appendChild(ellipsis);
        }
    }
    
    // Page range
    for (let i = startPage; i <= endPage; i++) {
        let pageBtn = document.createElement('button');
        pageBtn.textContent = (i + 1).toString();
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.onclick = function () {
            goToPage(i);
        };
        container.appendChild(pageBtn);
    }
    
    // Last page
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            let ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'ellipsis';
            container.appendChild(ellipsis);
        }
        
        let lastBtn = document.createElement('button');
        lastBtn.textContent = totalPages.toString();
        lastBtn.onclick = function () {
            goToPage(totalPages - 1);
        };
        container.appendChild(lastBtn);
    }
    
    // Next button
    let nextBtn = document.createElement('button');
    nextBtn.textContent = 'â€º';
    nextBtn.disabled = currentPage >= totalPages - 1;
    nextBtn.onclick = function () {
        goToPage(currentPage + 1);
    };
    container.appendChild(nextBtn);
}

function goToPage(page) {
    if (page < 0 || page >= totalPages) return;
    currentPage = page;
    renderBooks(filteredBooks);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function focusSearch() {
    try {
        let searchBar = document.getElementById('searchBar');
        if (searchBar) {
            searchBar.classList.remove('hidden');
            let searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
    } catch (error) {
        console.error('Error in focusSearch:', error);
    }
}

// Expose to window for onclick handlers
window.focusSearch = focusSearch;

function showAlert(message) {
    document.getElementById('alertText').textContent = message;
    document.getElementById('alertModal').classList.remove('hidden');
}

function closeAlert() {
    document.getElementById('alertModal').classList.add('hidden');
}

// Expose all necessary functions to window for onclick handlers
window.sortBooks = sortBooks;
window.changeProductCount = changeProductCount;
window.addToCart = addToCart;
window.showBookDetail = showBookDetail;
window.addToCartFromDetail = addToCartFromDetail;
window.buyNow = buyNow;
window.decreaseQuantity = decreaseQuantity;
window.increaseQuantity = increaseQuantity;
window.changeShippingAddress = changeShippingAddress;
window.filterReviews = filterReviews;
window.showEditProfile = showEditProfile;
window.hideEditProfile = hideEditProfile;
window.showChangePasswordForm = showChangePasswordForm;
window.hideChangePasswordForm = hideChangePasswordForm;
window.changePassword = changePassword;
window.closeAlert = closeAlert;
window.closeReviewModal = closeReviewModal;
window.showLoginPrompt = showLoginPrompt;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.toggleCartItemCoupon = toggleCartItemCoupon;
window.checkout = checkout;
window.submitReview = submitReview;
window.openReviewModal = openReviewModal;

// Event listener tá»•ng há»£p cho cÃ¡c click events
document.addEventListener('click', function (event) {
    // Xá»­ lÃ½ modal clicks
    let modal = document.getElementById('alertModal');
    if (event.target === modal) {
        closeAlert();
    }
    
    let reviewModal = document.getElementById('reviewModal');
    if (event.target === reviewModal) {
        closeReviewModal();
    }
    
    // Xá»­ lÃ½ Ä‘Ã³ng dropdown khi click bÃªn ngoÃ i
    let accountDropdown = document.getElementById('accountDropdown');
    let accountDropdownContainer = document.querySelector('.account-dropdown');
    
    if (accountDropdown && accountDropdownContainer) {
        if (!accountDropdownContainer.contains(event.target)) {
            closeAccountDropdown();
        }
    }
    
    // Xá»­ lÃ½ Ä‘Ã³ng filter panel khi click bÃªn ngoÃ i
    let filterSidebar = document.getElementById('filterSidebar');
    let filterToggle = document.querySelector('.navbar-menu-toggle');
    
    if (filterSidebar && filterToggle) {
        if (!filterToggle.contains(event.target) && !filterSidebar.contains(event.target)) {
            closeFilterPanel();
        }
    }
});


