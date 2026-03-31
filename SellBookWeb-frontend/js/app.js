// ==============================
// GLOBAL VARIABLES
// ==============================

let currentSection = 'dashboard';
let booksData = [];
let categoriesData = [];
let usersData = [];
let currentReviewsView = 'pending';

// ==============================
// PAGE INITIALIZATION
// ==============================

document.addEventListener('DOMContentLoaded', function () {
    loadDashboard();
    loadCategories();
});

// ==============================
// SECTION MANAGEMENT
// ==============================

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(function (section) {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    currentSection = sectionId;

    // Load data for the section
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'books':
            loadBooks();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'users':
            loadUsers();
            break;
        case 'reviews':
            loadReviews();
            break;
    }
}

// ==============================
// DASHBOARD
// ==============================

async function loadDashboard() {
    try {
        let books = await fetchBooks();
        let categories = await fetchCategories();
        let users = await fetchUsers();
        let reviews = await getPendingReviews();

        document.getElementById('totalBooks').textContent = Array.isArray(books) ? books.length : 0;
        document.getElementById('totalCategories').textContent = Array.isArray(categories) ? categories.length : 0;
        document.getElementById('totalUsers').textContent = Array.isArray(users) ? users.length : 0;
        document.getElementById('pendingReviews').textContent = Array.isArray(reviews) ? reviews.length : 0;
    } catch (error) {
        showAlert('Lá»—i khi táº£i báº£ng Ä‘iá»u khiá»ƒn: ' + error.message);
    }
}

// ==============================
// BOOKS MANAGEMENT
// ==============================

async function loadBooks() {
    try {
        booksData = await fetchBooks();
        renderBooks(booksData);
        await loadCategoriesForFilter();
    } catch (error) {
        showAlert('Lá»—i khi táº£i danh sÃ¡ch sÃ¡ch: ' + error.message);
    }
}

function renderBooks(books) {
    let tbody = document.querySelector('#booksList tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(books) || books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">KhÃ´ng cÃ³ sÃ¡ch</td></tr>';
        return;
    }

    books.forEach(function (book) {
        let row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.title || ''}</td>
            <td>${book.author || ''}</td>
            <td>${book.isbn || ''}</td>
            <td>${formatPrice(book.price)}</td>
            <td>${book.quantity || 0}</td>
            <td>${getCategoryName(book.categoryId)}</td>
            <td>${book.rating ? book.rating.toFixed(1) : '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm" onclick="editBook('${book.id}')">Sá»­a</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBookConfirm('${book.id}')">XÃ³a</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddBookForm() {
    document.getElementById('bookId').value = '';
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookIsbn').value = '';
    document.getElementById('bookPrice').value = '';
    document.getElementById('bookQuantity').value = '';
    document.getElementById('bookCategory').value = '';
    document.getElementById('bookDescription').value = '';
    document.getElementById('bookImage').value = '';
    document.getElementById('bookActive').checked = true;
    document.getElementById('bookFormTitle').textContent = 'ThÃªm sÃ¡ch má»›i';
    document.getElementById('bookForm').classList.remove('hidden');
}

function hideBookForm() {
    document.getElementById('bookForm').classList.add('hidden');
}

async function editBook(id) {
    try {
        let book = await getBookById(id);
        document.getElementById('bookId').value = book.id;
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookIsbn').value = book.isbn;
        document.getElementById('bookPrice').value = book.price;
        document.getElementById('bookQuantity').value = book.quantity;
        document.getElementById('bookCategory').value = book.categoryId;
        document.getElementById('bookDescription').value = book.description || '';
        document.getElementById('bookImage').value = book.image || '';
        document.getElementById('bookActive').checked = book.active !== false;
        document.getElementById('bookFormTitle').textContent = 'Chá»‰nh sá»­a sÃ¡ch';
        document.getElementById('bookForm').classList.remove('hidden');
    } catch (error) {
        showAlert('Lá»—i khi táº£i thÃ´ng tin sÃ¡ch: ' + error.message);
    }
}

async function saveBook(event) {
    event.preventDefault();

    let bookId = document.getElementById('bookId').value;
    let bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookIsbn').value,
        price: parseFloat(document.getElementById('bookPrice').value),
        quantity: parseInt(document.getElementById('bookQuantity').value),
        categoryId: document.getElementById('bookCategory').value,
        description: document.getElementById('bookDescription').value,
        image: document.getElementById('bookImage').value,
        active: document.getElementById('bookActive').checked
    };

    try {
        if (bookId) {
            await updateBook(bookId, bookData);
            showAlert('Cáº­p nháº­t sÃ¡ch thÃ nh cÃ´ng!');
        } else {
            await createBook(bookData);
            showAlert('ThÃªm sÃ¡ch thÃ nh cÃ´ng!');
        }
        hideBookForm();
        loadBooks();
    } catch (error) {
        showAlert('Lá»—i: ' + error.message);
    }
}

async function deleteBookConfirm(id) {
    if (confirm('Báº¡n cháº¯c cháº¯n muá»‘n xÃ³a sÃ¡ch nÃ y?')) {
        try {
            await deleteBook(id);
            showAlert('XÃ³a sÃ¡ch thÃ nh cÃ´ng!');
            loadBooks();
        } catch (error) {
            showAlert('Lá»—i: ' + error.message);
        }
    }
}

function searchBooks() {
    let searchTerm = document.getElementById('searchBook').value.toLowerCase();
    let filtered = booksData.filter(function (book) {
        return (
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.isbn.includes(searchTerm)
        );
    });
    renderBooks(filtered);
}

async function loadCategoriesForFilter() {
    try {
        let categories = await fetchCategories();
        let select = document.getElementById('categoryFilter');
        select.innerHTML = '<option value="">-- Táº¥t cáº£ danh má»¥c --</option>';
        if (Array.isArray(categories)) {
            categories.forEach(function (cat) {
                let option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function filterByCategory() {
    let categoryId = document.getElementById('categoryFilter').value;
    if (categoryId) {
        try {
            let books = await getBooksByCategory(categoryId);
            renderBooks(books);
        } catch (error) {
            showAlert('Lá»—i khi lá»c sÃ¡ch: ' + error.message);
        }
    } else {
        renderBooks(booksData);
    }
}

function getCategoryName(categoryId) {
    let category = categoriesData.find(function (cat) {
        return cat.id === categoryId;
    });
    return category ? category.name : '-';
}

// ==============================
// CATEGORIES MANAGEMENT
// ==============================

async function loadCategories() {
    try {
        categoriesData = await fetchCategories();
        renderCategories(categoriesData);
        populateCategorySelect();
    } catch (error) {
        showAlert('Lá»—i khi táº£i danh má»¥c: ' + error.message);
    }
}

function renderCategories(categories) {
    let container = document.getElementById('categoriesList');
    container.innerHTML = '';

    if (!Array.isArray(categories) || categories.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">KhÃ´ng cÃ³ danh má»¥c</p>';
        return;
    }

    categories.forEach(function (category) {
        let card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${category.icon || 'ðŸ“š'}</div>
            <h3>${category.name}</h3>
            <p>${category.description || 'KhÃ´ng cÃ³ mÃ´ táº£'}</p>
            <p style="font-size: 0.85rem; color: #999;">
                <span class="badge ${category.active ? 'badge-success' : 'badge-danger'}">
                    ${category.active ? 'Hoáº¡t Ä‘á»™ng' : 'KhÃ´ng hoáº¡t Ä‘á»™ng'}
                </span>
            </p>
            <div class="card-buttons">
                <button class="btn btn-warning btn-sm" onclick="editCategory('${category.id}')">Sá»­a</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCategoryConfirm('${category.id}')">XÃ³a</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function showAddCategoryForm() {
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
    document.getElementById('categoryIcon').value = '';
    document.getElementById('categoryActive').checked = true;
    document.getElementById('categoryFormTitle').textContent = 'ThÃªm danh má»¥c má»›i';
    document.getElementById('categoryForm').classList.remove('hidden');
}

function hideCategoryForm() {
    document.getElementById('categoryForm').classList.add('hidden');
}

async function editCategory(id) {
    try {
        let category = await getCategoryById(id);
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categoryIcon').value = category.icon || '';
        document.getElementById('categoryActive').checked = category.active !== false;
        document.getElementById('categoryFormTitle').textContent = 'Chá»‰nh sá»­a danh má»¥c';
        document.getElementById('categoryForm').classList.remove('hidden');
    } catch (error) {
        showAlert('Lá»—i khi táº£i danh má»¥c: ' + error.message);
    }
}

async function saveCategory(event) {
    event.preventDefault();

    let categoryId = document.getElementById('categoryId').value;
    let categoryData = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value,
        icon: document.getElementById('categoryIcon').value,
        active: document.getElementById('categoryActive').checked
    };

    try {
        if (categoryId) {
            await updateCategory(categoryId, categoryData);
            showAlert('Cáº­p nháº­t danh má»¥c thÃ nh cÃ´ng!');
        } else {
            await createCategory(categoryData);
            showAlert('ThÃªm danh má»¥c thÃ nh cÃ´ng!');
        }
        hideCategoryForm();
        loadCategories();
    } catch (error) {
        showAlert('Lá»—i: ' + error.message);
    }
}

async function deleteCategoryConfirm(id) {
    if (confirm('Báº¡n cháº¯c cháº¯n muá»‘n xÃ³a danh má»¥c nÃ y?')) {
        try {
            await deleteCategory(id);
            showAlert('XÃ³a danh má»¥c thÃ nh cÃ´ng!');
            loadCategories();
        } catch (error) {
            showAlert('Lá»—i: ' + error.message);
        }
    }
}

function populateCategorySelect() {
    let select = document.getElementById('bookCategory');
    select.innerHTML = '<option value="">-- Chá»n danh má»¥c --</option>';
    if (Array.isArray(categoriesData)) {
        categoriesData.forEach(function (cat) {
            let option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    }
}

// ==============================
// USERS MANAGEMENT
// ==============================

async function loadUsers() {
    try {
        usersData = await fetchUsers();
        renderUsers(usersData);
    } catch (error) {
        showAlert('Lá»—i khi táº£i danh sÃ¡ch ngÆ°á»i dÃ¹ng: ' + error.message);
    }
}

function renderUsers(users) {
    let tbody = document.querySelector('#usersList tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(users) || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">KhÃ´ng cÃ³ ngÆ°á»i dÃ¹ng</td></tr>';
        return;
    }

    users.forEach(function (user) {
        let row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name || ''}</td>
            <td>${user.email || ''}</td>
            <td>${user.phone || '-'}</td>
            <td>${user.role || 'CUSTOMER'}</td>
            <td>
                <span class="badge ${user.active ? 'badge-success' : 'badge-danger'}">
                    ${user.active ? 'Hoáº¡t Ä‘á»™ng' : 'KhÃ´ng hoáº¡t Ä‘á»™ng'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm" onclick="editUser('${user.id}')">Sá»­a</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUserConfirm('${user.id}')">XÃ³a</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddUserForm() {
    document.getElementById('userId').value = '';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('userRole').value = 'CUSTOMER';
    document.getElementById('userActive').checked = true;
    document.getElementById('userFormTitle').textContent = 'ThÃªm ngÆ°á»i dÃ¹ng';
    document.getElementById('userForm').classList.remove('hidden');
}

function hideUserForm() {
    document.getElementById('userForm').classList.add('hidden');
}

async function editUser(id) {
    try {
        let user = await getUserById(id);
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userRole').value = user.role;
        document.getElementById('userActive').checked = user.active !== false;
        document.getElementById('userFormTitle').textContent = 'Chá»‰nh sá»­a ngÆ°á»i dÃ¹ng';
        document.getElementById('userForm').classList.remove('hidden');
    } catch (error) {
        showAlert('Lá»—i khi táº£i thÃ´ng tin ngÆ°á»i dÃ¹ng: ' + error.message);
    }
}

async function saveUser(event) {
    event.preventDefault();

    let userId = document.getElementById('userId').value;
    let userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value,
        active: document.getElementById('userActive').checked
    };

    try {
        if (userId) {
            await updateUser(userId, userData);
            showAlert('Cáº­p nháº­t ngÆ°á»i dÃ¹ng thÃ nh cÃ´ng!');
        } else {
            await registerUser(userData);
            showAlert('ThÃªm ngÆ°á»i dÃ¹ng thÃ nh cÃ´ng!');
        }
        hideUserForm();
        loadUsers();
    } catch (error) {
        showAlert('Lá»—i: ' + error.message);
    }
}

async function deleteUserConfirm(id) {
    if (confirm('Báº¡n cháº¯c cháº¯n muá»‘n xÃ³a ngÆ°á»i dÃ¹ng nÃ y?')) {
        try {
            await deleteUser(id);
            showAlert('XÃ³a ngÆ°á»i dÃ¹ng thÃ nh cÃ´ng!');
            loadUsers();
        } catch (error) {
            showAlert('Lá»—i: ' + error.message);
        }
    }
}

// ==============================
// REVIEWS MANAGEMENT
// ==============================

async function loadReviews() {
    try {
        if (currentReviewsView === 'pending') {
            let reviews = await getPendingReviews();
            renderReviews(reviews);
        } else {
            await showAllReviews();
        }
    } catch (error) {
        showAlert('Lá»—i khi táº£i Ä‘Ã¡nh giÃ¡: ' + error.message);
    }
}

function showReviewTab(tab) {
    currentReviewsView = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(function (btn) {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadReviews();
}

async function showAllReviews() {
    try {
        let books = await fetchBooks();
        let allReviews = [];
        
        if (Array.isArray(books)) {
            for (let book of books) {
                let reviews = await getReviewsByBook(book.id);
                if (Array.isArray(reviews)) {
                    allReviews.push(...reviews);
                }
            }
        }
        
        renderReviews(allReviews);
    } catch (error) {
        showAlert('Lá»—i khi táº£i Ä‘Ã¡nh giÃ¡: ' + error.message);
    }
}

function renderReviews(reviews) {
    let container = document.getElementById('reviewsList');
    container.innerHTML = '';

    if (!Array.isArray(reviews) || reviews.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">KhÃ´ng cÃ³ Ä‘Ã¡nh giÃ¡</p>';
        return;
    }

    reviews.forEach(function (review) {
        let card = document.createElement('div');
        card.className = 'review-card';
        
        let stars = 'â­'.repeat(review.rating || 0);
        let statusClass = review.approved ? 'approved' : 'pending';
        let statusText = review.approved ? 'ÄÃ£ duyá»‡t' : 'Chá» duyá»‡t';
        
        let actionButtons = `<button class="btn btn-danger btn-sm" onclick="deleteReviewConfirm('${review.id}')">XÃ³a</button>`;
        if (!review.approved) {
            actionButtons = `
                <button class="btn btn-success btn-sm" onclick="approveReviewConfirm('${review.id}')">Duyá»‡t</button>
                <button class="btn btn-danger btn-sm" onclick="deleteReviewConfirm('${review.id}')">XÃ³a</button>
            `;
        }
        
        card.innerHTML = `
            <div class="review-header">
                <div>
                    <p class="review-book">ðŸ“– ${getBookTitleById(review.bookId)}</p>
                    <p class="review-user">ðŸ‘¤ ${review.userName || 'áº¨n danh'}</p>
                </div>
                <span class="review-status ${statusClass}">${statusText}</span>
            </div>
            <div class="review-rating">${stars}</div>
            <p class="review-comment">${review.comment || 'KhÃ´ng cÃ³ bÃ¬nh luáº­n'}</p>
            <div class="review-buttons">
                ${actionButtons}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function getBookTitleById(bookId) {
    let book = booksData.find(function (b) {
        return b.id === bookId;
    });
    return book ? book.title : 'SÃ¡ch chÆ°a xÃ¡c Ä‘á»‹nh';
}

async function approveReviewConfirm(id) {
    if (confirm('Báº¡n cháº¯c cháº¯n muá»‘n duyá»‡t Ä‘Ã¡nh giÃ¡ nÃ y?')) {
        try {
            await approveReview(id);
            showAlert('Duyá»‡t Ä‘Ã¡nh giÃ¡ thÃ nh cÃ´ng!');
            loadReviews();
        } catch (error) {
            showAlert('Lá»—i: ' + error.message);
        }
    }
}

async function deleteReviewConfirm(id) {
    if (confirm('Báº¡n cháº¯c cháº¯n muá»‘n xÃ³a Ä‘Ã¡nh giÃ¡ nÃ y?')) {
        try {
            await deleteReview(id);
            showAlert('XÃ³a Ä‘Ã¡nh giÃ¡ thÃ nh cÃ´ng!');
            loadReviews();
        } catch (error) {
            showAlert('Lá»—i: ' + error.message);
        }
    }
}

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

function showAlert(message) {
    document.getElementById('alertText').textContent = message;
    document.getElementById('alertModal').classList.remove('hidden');
}

function closeAlert() {
    document.getElementById('alertModal').classList.add('hidden');
}

// Close alert when clicking outside the modal
document.addEventListener('click', function () {
    let modal = document.getElementById('alertModal');
    if (event.target === modal) {
        closeAlert();
    }
});


