// API Base URL is already defined in auth.js (loaded before this file)
// We just use it directly - no need to redeclare

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        let options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Add authorization token if available
        if (typeof auth !== 'undefined' && auth.token) {
            options.headers['Authorization'] = `Bearer ${auth.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        // Use API_BASE_URL from auth.js, or fallback to default
        let baseUrl = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:3005/api');
        let response = await fetch(`${baseUrl}${endpoint}`, options);
        
        if (response.status === 401) {
            // Token expired or invalid
            if (typeof auth !== 'undefined') {
                auth.logout();
            }
            throw new Error('PhiÃªn Ä‘Äƒng nháº­p Ä‘Ã£ háº¿t háº¡n');
        }

        if (!response.ok) {
            let errorData = await response.json().catch(function () { return {}; });
            throw new Error(errorData.message || `Error: ${response.statusText}`);
        }

        let contentType = response.headers.get('content-type');
        if (response.status === 204 || !contentType) {
            return null;
        }
        if (contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function getNestedValue(payload, key, fallbackValue) {
    if (!payload || typeof payload !== 'object') {
        return fallbackValue;
    }
    return payload[key] ?? fallbackValue;
}

// ==============================
// BOOKS API
// ==============================

async function fetchBooks(page = 0, size = 10) {
    return apiCall(`/books?page=${page}&size=${size}`);
}

async function getBookById(id) {
    return apiCall(`/books/${id}`);
}

async function createBook(bookData) {
    return apiCall('/books', 'POST', bookData);
}

async function updateBook(id, bookData) {
    return apiCall(`/books/${id}`, 'PUT', bookData);
}

async function deleteBook(id) {
    return apiCall(`/books/${id}`, 'DELETE');
}

async function searchBooks(title) {
    return apiCall(`/books/search?title=${encodeURIComponent(title)}`);
}

async function getBooksByCategory(categoryId) {
    return apiCall(`/books/category/${categoryId}`);
}

// ==============================
// CATEGORIES API
// ==============================

async function fetchCategories() {
    return apiCall('/categories');
}

async function getCategoryById(id) {
    return apiCall(`/categories/${id}`);
}

async function createCategory(categoryData) {
    return apiCall('/categories', 'POST', categoryData);
}

async function updateCategory(id, categoryData) {
    return apiCall(`/categories/${id}`, 'PUT', categoryData);
}

async function deleteCategory(id) {
    return apiCall(`/categories/${id}`, 'DELETE');
}

// ==============================
// USERS API
// ==============================

async function fetchUsers() {
    return apiCall('/users');
}

async function getUserById(id) {
    return apiCall(`/users/${id}`);
}

async function registerUser(userData) {
    return apiCall('/admin/users', 'POST', userData);
}

async function updateUser(id, userData) {
    return apiCall(`/users/${id}`, 'PUT', userData);
}

async function deleteUser(id) {
    return apiCall(`/users/${id}`, 'DELETE');
}

// ==============================
// REVIEWS API
// ==============================

async function createReview(reviewData) {
    return apiCall('/reviews', 'POST', reviewData);
}

async function getReviewsByBook(bookId) {
    return apiCall(`/reviews/book/${bookId}`);
}

async function getUserReviews(userId) {
    return apiCall(`/reviews/user/${userId}`);
}

async function getPendingReviews() {
    return apiCall('/reviews/pending');
}

async function approveReview(id) {
    return apiCall(`/reviews/${id}/approve`, 'PUT');
}

async function deleteReview(id) {
    return apiCall(`/reviews/${id}`, 'DELETE');
}

// ==============================
// ORDERS API
// ==============================

async function fetchOrders(page = 0, size = 20) {
    let response = await apiCall(`/admin/orders?page=${page}&size=${size}`);
    return getNestedValue(response, 'orders', []);
}

async function getOrderById(id) {
    let response = await apiCall(`/admin/orders/${id}`);
    return getNestedValue(response, 'order', null);
}

async function updateOrderStatus(id, status) {
    let response = await apiCall(`/admin/orders/${id}/status?status=${status}`, 'PUT');
    return getNestedValue(response, 'order', null);
}

// ==============================
// NOTIFICATIONS API
// ==============================

async function getNotifications(userId) {
    return apiCall(`/notifications?userId=${userId}`);
}

async function getUnreadNotifications(userId) {
    return apiCall(`/notifications/unread?userId=${userId}`);
}

async function getUnreadCount(userId) {
    try {
        let response = await apiCall(`/notifications/unread-count?userId=${userId}`);
        return getNestedValue(response, 'count', 0);
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

async function markNotificationAsRead(id) {
    return apiCall(`/notifications/${id}/read`, 'PUT');
}

async function markAllNotificationsAsRead(userId) {
    return apiCall(`/notifications/mark-all-read?userId=${userId}`, 'PUT');
}

// Expose all API functions to global scope for use in other scripts
if (typeof window !== 'undefined') {
    window.fetchBooks = fetchBooks;
    window.getBookById = getBookById;
    window.createBook = createBook;
    window.updateBook = updateBook;
    window.deleteBook = deleteBook;
    window.searchBooks = searchBooks;
    window.getBooksByCategory = getBooksByCategory;
    window.fetchCategories = fetchCategories;
    window.getCategoryById = getCategoryById;
    window.createCategory = createCategory;
    window.updateCategory = updateCategory;
    window.deleteCategory = deleteCategory;
    window.fetchUsers = fetchUsers;
    window.getUserById = getUserById;
    window.registerUser = registerUser;
    window.updateUser = updateUser;
    window.deleteUser = deleteUser;
    window.createReview = createReview;
    window.getReviewsByBook = getReviewsByBook;
    window.getUserReviews = getUserReviews;
    window.getPendingReviews = getPendingReviews;
    window.approveReview = approveReview;
    window.deleteReview = deleteReview;
    window.fetchOrders = fetchOrders;
    window.getOrderById = getOrderById;
    window.updateOrderStatus = updateOrderStatus;
    window.getNotifications = getNotifications;
    window.getUnreadNotifications = getUnreadNotifications;
    window.getUnreadCount = getUnreadCount;
    window.markNotificationAsRead = markNotificationAsRead;
    window.markAllNotificationsAsRead = markAllNotificationsAsRead;
    window.apiCall = apiCall;
}

