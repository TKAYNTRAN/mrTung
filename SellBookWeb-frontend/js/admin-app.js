// ==============================
// ADMIN APP - GLOBAL VARIABLES
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
    // Display user info
    let user = auth.getUser();
    document.getElementById('adminName').textContent = `ðŸ‘¤ ${user.name} (${user.role})`;
    
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
        case 'orders':
            loadOrders();
            break;
    }
}

function handleLogout() {
    if (confirm('Báº¡n cháº¯c cháº¯n muá»‘n Ä‘Äƒng xuáº¥t?')) {
        auth.logout();
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
            <td>${book.supplierName || book.publisher || ''}</td>
            <td>${book.coverType || 'BÃ¬a Má»m'}</td>
            <td>${book.translator || 'N/A'}</td>
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
    document.getElementById('bookSupplier').value = '';
    document.getElementById('bookCoverType').value = 'BÃ¬a Má»m';
    document.getElementById('bookTranslator').value = '';
    document.getElementById('bookPublisher').value = '';
    document.getElementById('bookDiscountCode').value = '';
    document.getElementById('bookDiscount').value = '';
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
        document.getElementById('bookSupplier').value = book.supplierName || book.publisher || '';
        document.getElementById('bookCoverType').value = book.coverType || 'BÃ¬a Má»m';
        document.getElementById('bookTranslator').value = book.translator || '';
        document.getElementById('bookPublisher').value = book.publisher || '';
        document.getElementById('bookDiscountCode').value = book.discountCode || '';
        document.getElementById('bookDiscount').value = book.discount || '';
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
    let discountCode = document.getElementById('bookDiscountCode').value.trim();
    let discount = document.getElementById('bookDiscount').value ? parseFloat(document.getElementById('bookDiscount').value) : null;
    let publisherValue = document.getElementById('bookPublisher').value;
    let supplierValue = document.getElementById('bookSupplier').value;
    let supplierName = supplierValue || publisherValue || null;
    let coverTypeValue = document.getElementById('bookCoverType').value || 'BÃ¬a Má»m';
    
    let bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookIsbn').value,
        price: parseFloat(document.getElementById('bookPrice').value),
        quantity: parseInt(document.getElementById('bookQuantity').value),
        categoryId: document.getElementById('bookCategory').value,
        description: document.getElementById('bookDescription').value,
        image: document.getElementById('bookImage').value,
        supplierName: supplierName,
        coverType: coverTypeValue,
        translator: document.getElementById('bookTranslator').value || null,
        publisher: publisherValue || null,
        discountCode: discountCode || null,
        discount: discount || null,
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

    // Separate parent and child categories
    let parentCategories = categories.filter(function (c) {
        return !c.parentId;
    });
    let childCategories = categories.filter(function (c) {
        return c.parentId;
    });

    // Render parent categories first
    parentCategories.forEach(function (category) {
        let card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = '4px solid #667eea';
        card.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                <i class="${category.icon || 'fas fa-book'}"></i>
            </div>
            <h3>${category.name}</h3>
            <p>${category.description || 'KhÃ´ng cÃ³ mÃ´ táº£'}</p>
            <p style="font-size: 0.85rem; color: #999;">
                <span class="badge ${category.active ? 'badge-success' : 'badge-danger'}">
                    ${category.active ? 'Hoáº¡t Ä‘á»™ng' : 'KhÃ´ng hoáº¡t Ä‘á»™ng'}
                </span>
                <span class="badge badge-info" style="margin-left: 0.5rem;">NhÃ³m chÃ­nh</span>
            </p>
            <div class="card-buttons">
                <button class="btn btn-warning btn-sm" onclick="editCategory('${category.id}')">Sá»­a</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCategoryConfirm('${category.id}')">XÃ³a</button>
            </div>
        `;
        container.appendChild(card);

        // Render child categories under this parent
        let children = childCategories.filter(function (c) {
            return c.parentId === category.id;
        });
        if (children.length > 0) {
            let childrenContainer = document.createElement('div');
            childrenContainer.style.marginLeft = '2rem';
            childrenContainer.style.marginTop = '1rem';
            childrenContainer.style.paddingLeft = '1rem';
            childrenContainer.style.borderLeft = '2px solid #e0e0e0';
            
            children.forEach(function (child) {
                let childCard = document.createElement('div');
                childCard.className = 'card';
                childCard.style.marginBottom = '0.75rem';
                childCard.style.backgroundColor = '#f8f9fa';
                childCard.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="${child.icon || 'fas fa-book'}"></i>
                        <span style="font-size: 1rem; color: #666;">â†’</span>
                    </div>
                    <h4 style="font-size: 1rem; margin: 0.5rem 0;">${child.name}</h4>
                    <p style="font-size: 0.85rem; color: #666; margin: 0.25rem 0;">${child.description || 'KhÃ´ng cÃ³ mÃ´ táº£'}</p>
                    <p style="font-size: 0.75rem; color: #999;">
                        <span class="badge ${child.active ? 'badge-success' : 'badge-danger'}">
                            ${child.active ? 'Hoáº¡t Ä‘á»™ng' : 'KhÃ´ng hoáº¡t Ä‘á»™ng'}
                        </span>
                    </p>
                    <div class="card-buttons">
                        <button class="btn btn-warning btn-sm" onclick="editCategory('${child.id}')">Sá»­a</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteCategoryConfirm('${child.id}')">XÃ³a</button>
                    </div>
                `;
                childrenContainer.appendChild(childCard);
            });
            container.appendChild(childrenContainer);
        }
    });

    // Render orphaned child categories (if any)
    let orphaned = childCategories.filter(function (c) {
        let parentExists = categories.some(function (p) {
            return p.id === c.parentId;
        });
        return !parentExists;
    });
    
    if (orphaned.length > 0) {
        orphaned.forEach(function (category) {
            let card = document.createElement('div');
            card.className = 'card';
            card.style.borderLeft = '4px solid #ffc107';
            card.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                    <i class="${category.icon || 'fas fa-book'}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${category.description || 'KhÃ´ng cÃ³ mÃ´ táº£'}</p>
                <p style="font-size: 0.85rem; color: #999;">
                    <span class="badge ${category.active ? 'badge-success' : 'badge-danger'}">
                        ${category.active ? 'Hoáº¡t Ä‘á»™ng' : 'KhÃ´ng hoáº¡t Ä‘á»™ng'}
                    </span>
                    <span class="badge badge-warning" style="margin-left: 0.5rem;">Parent khÃ´ng tá»“n táº¡i</span>
                </p>
                <div class="card-buttons">
                    <button class="btn btn-warning btn-sm" onclick="editCategory('${category.id}')">Sá»­a</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCategoryConfirm('${category.id}')">XÃ³a</button>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

function showAddCategoryForm() {
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
    document.getElementById('categoryIcon').value = '';
    document.getElementById('categoryParentId').value = '';
    document.getElementById('categoryActive').checked = true;
    document.getElementById('categoryFormTitle').textContent = 'ThÃªm danh má»¥c má»›i';
    populateParentCategorySelect();
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
        populateParentCategorySelect(category.id); // Exclude current category from parent list
        document.getElementById('categoryParentId').value = category.parentId || '';
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
    let parentId = document.getElementById('categoryParentId').value;
    let categoryData = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value,
        icon: document.getElementById('categoryIcon').value,
        parentId: parentId || null,
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

function populateParentCategorySelect(excludeId = null) {
    let select = document.getElementById('categoryParentId');
    if (!select) return;
    
    // Keep the first option (empty)
    let firstOption = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (firstOption) {
        select.appendChild(firstOption);
    } else {
        let emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- KhÃ´ng cÃ³ (NhÃ³m chÃ­nh) --';
        select.appendChild(emptyOption);
    }
    
    if (Array.isArray(categoriesData)) {
        // Only show parent categories (those without parentId)
        let parentCategories = categoriesData.filter(function (cat) {
            return !cat.parentId && cat.id !== excludeId;
        });
        parentCategories.forEach(function (cat) {
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

function updateRoleOptions() {
    let currentUser = auth.getUser();
    let superAdminOption = document.querySelector('#userRole option[value="SUPER_ADMIN"]');
    if (superAdminOption) {
        superAdminOption.style.display = currentUser && currentUser.role === 'SUPER_ADMIN' ? '' : 'none';
    }
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
document.addEventListener('click', function (event) {
    let modal = document.getElementById('alertModal');
    if (event.target === modal) {
        closeAlert();
    }
});

// ==============================
// ORDERS MANAGEMENT
// ==============================

let ordersData = [];

function resolveOrderUserInfo(order) {
    if (order.userName || order.userEmail) {
        return {
            name: order.userName || '-',
            email: order.userEmail || '-'
        };
    }

    let matchedUser = usersData.find(function (user) {
        return user && user.id === order.userId;
    });

    return {
        name: matchedUser && matchedUser.name ? matchedUser.name : (order.userId || '-'),
        email: matchedUser && matchedUser.email ? matchedUser.email : '-'
    };
}

async function loadOrders() {
    try {
        showAlert('Äang táº£i danh sÃ¡ch Ä‘Æ¡n hÃ ng...');
        ordersData = await fetchOrders();
        closeAlert(); // Hide the alert after successful load
        renderOrders(ordersData);
    } catch (error) {
        closeAlert();
        showAlert('Lá»—i khi táº£i danh sÃ¡ch Ä‘Æ¡n hÃ ng: ' + error.message);
        console.error('Order loading error:', error);
    }
}

function renderOrders(orders) {
    let tbody = document.querySelector('#ordersList tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(orders) || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">KhÃ´ng cÃ³ Ä‘Æ¡n hÃ ng</td></tr>';
        return;
    }

    orders.forEach(function (order) {
        // Skip if order is null or undefined
        if (!order) {
            return;
        }

        let row = document.createElement('tr');
        // Safely access properties with fallback values
        let orderId = order.id || '';
        let userInfo = resolveOrderUserInfo(order);
        let phone = order.phone || '-';
        let createdAt = order.createdAt ? 
            (new Date(order.createdAt).toLocaleString() || '-') : 
            '-';
        let totalPrice = formatPrice(order.totalPrice || 0);
        let status = order.status || 'UNKNOWN';
        let statusBadgeClass = getOrderStatusBadgeClass(status);
        let statusText = getOrderStatusText(status);
        
        row.innerHTML = `
            <td>${orderId}</td>
            <td>${userInfo.name}</td>
            <td>${phone}</td>
            <td>${createdAt}</td>
            <td>${totalPrice}</td>
            <td>
                <span class="badge ${statusBadgeClass}">
                    ${statusText}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm" onclick="viewOrderDetails('${orderId}')">Chi tiáº¿t</button>
                    <button class="btn btn-warning btn-sm" onclick="showUpdateStatusForm('${orderId}')">Cáº­p nháº­t tráº¡ng thÃ¡i</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getOrderStatusBadgeClass(status) {
    switch(status) {
        case 'PENDING': return 'badge-warning';
        case 'CONFIRMED': return 'badge-info';
        case 'SHIPPED': return 'badge-primary';
        case 'DELIVERED': return 'badge-success';
        case 'CANCELLED': return 'badge-danger';
        default: return 'badge-secondary';
    }
}

function getOrderStatusText(status) {
    switch(status) {
        case 'PENDING': return 'Chá» xÃ¡c nháº­n';
        case 'CONFIRMED': return 'ÄÃ£ xÃ¡c nháº­n';
        case 'SHIPPED': return 'Äang váº­n chuyá»ƒn';
        case 'DELIVERED': return 'ÄÃ£ giao';
        case 'CANCELLED': return 'ÄÃ£ há»§y';
        default: return status;
    }
}

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
        case 'orders':
            loadOrders();
            break;
    }
}

async function viewOrderDetails(orderId) {
    try {
        let response = await getOrderById(orderId);
        // API returns {order: ..., message: "..."}
        let order = response && response.order ? response.order : response;
        showOrderDetailsModal(order);
    } catch (error) {
        showAlert('Lá»—i khi táº£i chi tiáº¿t Ä‘Æ¡n hÃ ng: ' + error.message);
    }
}

function showOrderDetailsModal(order) {
    let userInfo = resolveOrderUserInfo(order);
    let orderItemsHtml = order.items && order.items.length > 0 ?
        order.items.map(function (item) {
            return `
            <div class="item">
                <span>${item.title || ''}</span>
                <span>${item.quantity || 0} Ã— ${formatPrice(item.price)}</span>
            </div>
        `;
        }).join('') :
        '<p>KhÃ´ng cÃ³ thÃ´ng tin sáº£n pháº©m</p>';

    let contentHtml = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Chi tiáº¿t Ä‘Æ¡n hÃ ng #${order.id}</h3>
                <button class="btn btn-close" onclick="closeOrderDetailsModal()">Ã—</button>
            </div>
            <div class="modal-body">
                <div class="order-info">
                    <p><strong>MÃ£ Ä‘Æ¡n hÃ ng:</strong> ${order.id}</p>
                    <p><strong>KhÃ¡ch hÃ ng:</strong> ${userInfo.name}</p>
                    <p><strong>Email:</strong> ${userInfo.email}</p>
                    <p><strong>Sá»‘ Ä‘iá»‡n thoáº¡i:</strong> ${order.phone || '-'}</p>
                    <p><strong>Äá»‹a chá»‰ giao hÃ ng:</strong> ${order.shippingAddress || '-'}</p>
                    <p><strong>NgÃ y Ä‘áº·t:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</p>
                    <p><strong>PhÆ°Æ¡ng thá»©c thanh toÃ¡n:</strong> ${getPaymentMethodText(order.paymentMethod)}</p>
                </div>

                <div class="order-items">
                    <h4>Sáº£n pháº©m trong Ä‘Æ¡n hÃ ng:</h4>
                    <div class="items-list">
                        ${orderItemsHtml}
                    </div>
                </div>

                <div class="order-summary">
                    <p><strong>Táº¡m tÃ­nh:</strong> ${formatPrice(order.totalPrice)}</p>
                    <p><strong>PhÃ­ ship:</strong> ${formatPrice(order.shippingFee || 0)}</p>
                    <p><strong>Tá»•ng cá»™ng:</strong> <strong>${formatPrice(order.totalAmount || order.totalPrice)}</strong></p>
                </div>

                <div class="order-status">
                    <p><strong>Tráº¡ng thÃ¡i hiá»‡n táº¡i:</strong>
                        <span class="badge ${getOrderStatusBadgeClass(order.status)}">
                            ${getOrderStatusText(order.status)}
                        </span>
                    </p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeOrderDetailsModal()">ÄÃ³ng</button>
            </div>
        </div>
    `;

    // Create modal if it doesn't exist
    let modal = document.getElementById('orderDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'orderDetailsModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = contentHtml;
    
    // Show modal
    modal.classList.remove('hidden');
}

function closeOrderDetailsModal() {
    let modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function showUpdateStatusForm(orderId) {
    try {
        let response = await apiCall(`/admin/orders/${orderId}`);
        // API returns {order: ..., message: "..."}
        let order = response && response.order ? response.order : response;
        showUpdateStatusModal(order);
    } catch (error) {
        showAlert('Lá»—i khi táº£i thÃ´ng tin Ä‘Æ¡n hÃ ng: ' + error.message);
    }
}

function showUpdateStatusModal(order) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('updateStatusModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'updateStatusModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng #${order.id}</h3>
                    <button class="btn btn-close" onclick="closeUpdateStatusModal()">Ã—</button>
                </div>
                <div class="modal-body">
                    <div class="order-info">
                        <p><strong>MÃ£ Ä‘Æ¡n hÃ ng:</strong> ${order.id}</p>
                        <p><strong>KhÃ¡ch hÃ ng:</strong> ${order.userName || '-'}</p>
                        <p><strong>Tráº¡ng thÃ¡i hiá»‡n táº¡i:</strong> 
                            <span class="badge ${getOrderStatusBadgeClass(order.status)}">
                                ${getOrderStatusText(order.status)}
                            </span>
                        </p>
                    </div>
                    
                    <form onsubmit="updateOrderStatus(event, '${order.id}')">
                        <div class="form-group">
                            <label>Tráº¡ng thÃ¡i má»›i:</label>
                            <select id="newStatus" required>
                                <option value="PENDING">Chá» xÃ¡c nháº­n</option>
                                <option value="CONFIRMED">ÄÃ£ xÃ¡c nháº­n</option>
                                <option value="SHIPPED">Äang váº­n chuyá»ƒn</option>
                                <option value="DELIVERED">ÄÃ£ giao</option>
                                <option value="CANCELLED">ÄÃ£ há»§y</option>
                            </select>
                        </div>
                        
                        <div class="form-buttons">
                            <button type="submit" class="btn btn-success">Cáº­p nháº­t</button>
                            <button type="button" class="btn btn-secondary" onclick="closeUpdateStatusModal()">Há»§y</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Set current status as selected
    setTimeout(function () {
        let select = document.getElementById('newStatus');
        if (select) {
            select.value = order.status;
        }
    }, 100);
    
    // Show modal
    modal.classList.remove('hidden');
}

async function updateOrderStatus(event, orderId) {
    event.preventDefault();
    
    let newStatus = document.getElementById('newStatus').value;
    
    try {
        let response = await apiCall(`/admin/orders/${orderId}/status?status=${newStatus}`, 'PUT');
        // API returns {order: ..., message: "..."}
        console.log('Update status response:', response);
        showAlert('Cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng thÃ nh cÃ´ng!');
        closeUpdateStatusModal();
        // Refresh orders list
        if (currentSection === 'orders') {
            loadOrders();
        }
    } catch (error) {
        console.error('Update status error:', error);
        showAlert('Lá»—i: ' + error.message);
    }
}

function closeUpdateStatusModal() {
    let modal = document.getElementById('updateStatusModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function getPaymentMethodText(method) {
    switch(method) {
        case 'COD': return 'Thanh toÃ¡n khi nháº­n hÃ ng';
        case 'CARD': return 'Tháº» ngÃ¢n hÃ ng';
        case 'TRANSFER': return 'Chuyá»ƒn khoáº£n';
        default: return method || '-';
    }
}

function searchOrders() {
    let searchTerm = document.getElementById('searchOrder').value.toLowerCase();
    let filtered = ordersData.filter(function (order) {
        return (
        (order.id && order.id.toLowerCase().includes(searchTerm)) ||
        (order.userName && order.userName.toLowerCase().includes(searchTerm)) ||
        (order.phone && order.phone.toLowerCase().includes(searchTerm))
        );
    });
    renderOrders(filtered);
}

function filterByStatus() {
    let status = document.getElementById('statusFilter').value;
    if (status) {
        let filtered = ordersData.filter(function (order) {
            return order.status === status;
        });
        renderOrders(filtered);
    } else {
        renderOrders(ordersData);
    }
}

function refreshOrders() {
    loadOrders();
}


