async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (auth.token) {
            options.headers['Authorization'] = `Bearer ${auth.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (response.status === 401) {
            auth.logout();
            throw new Error('Phiên đăng nhập đã hết hạn');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
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

const booksAPI = {
    getAll: (page = 0, size = 12, category = '', search = '') => {
        let url = `/books?page=${page}&size=${size}`;
        if (category) url += `&category=${category}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return apiCall(url);
    },
    getById: (id) => apiCall(`/books/${id}`),
    search: (title) => apiCall(`/books/search?title=${encodeURIComponent(title)}`),
    getByCategory: (categoryId) => apiCall(`/books/category/${categoryId}`),
    create: (data) => apiCall('/books', 'POST', data),
    update: (id, data) => apiCall(`/books/${id}`, 'PUT', data),
    delete: (id) => apiCall(`/books/${id}`, 'DELETE')
};

const categoriesAPI = {
    getAll: () => apiCall('/categories'),
    getById: (id) => apiCall(`/categories/${id}`),
    create: (data) => apiCall('/categories', 'POST', data),
    update: (id, data) => apiCall(`/categories/${id}`, 'PUT', data),
    delete: (id) => apiCall(`/categories/${id}`, 'DELETE')
};

const cartAPI = {
    getMyCart: () => apiCall('/cart'),
    addItem: (bookId, quantity = 1) => apiCall('/cart/items', 'POST', { bookId, quantity }),
    updateItem: (bookId, quantity) => apiCall(`/cart/items/${bookId}`, 'PUT', { quantity }),
    removeItem: (bookId) => apiCall(`/cart/items/${bookId}`, 'DELETE'),
    clear: () => apiCall('/cart', 'DELETE')
};

const ordersAPI = {
    getMyOrders: (page = 0, size = 20) => apiCall(`/orders/my-orders?page=${page}&size=${size}`),
    getAll: (page = 0, size = 20, status = '') => {
        let url = `/orders?page=${page}&size=${size}`;
        if (status) url += `&status=${status}`;
        return apiCall(url);
    },
    getById: (id) => apiCall(`/orders/${id}`),
    create: (data) => apiCall('/orders', 'POST', data),
    updateStatus: (id, status) => apiCall(`/orders/${id}/status`, 'PUT', { status }),
    cancel: (id) => apiCall(`/orders/${id}/cancel`, 'POST')
};

const usersAPI = {
    getAll: () => apiCall('/users'),
    getById: (id) => apiCall(`/users/${id}`),
    getProfile: () => apiCall('/users/profile'),
    create: (data) => apiCall('/users', 'POST', data),
    update: (id, data) => apiCall(`/users/${id}`, 'PUT', data),
    delete: (id) => apiCall(`/users/${id}`, 'DELETE'),
    updateProfile: (data) => apiCall('/users/profile', 'PUT', data)
};

const couponsAPI = {
    getAll: () => apiCall('/coupons'),
    getById: (id) => apiCall(`/coupons/${id}`),
    create: (data) => apiCall('/coupons', 'POST', data),
    update: (id, data) => apiCall(`/coupons/${id}`, 'PUT', data),
    delete: (id) => apiCall(`/coupons/${id}`, 'DELETE'),
    validate: (data) => apiCall('/coupons/validate', 'POST', data),
    availableForCart: (data) => apiCall('/coupons/available-for-cart', 'POST', data)
};

const reviewsAPI = {
    getByBook: (bookId) => apiCall(`/reviews/book/${bookId}`),
    create: (data) => apiCall('/reviews', 'POST', data),
    delete: (id) => apiCall(`/reviews/${id}`, 'DELETE'),
    approve: (id) => apiCall(`/reviews/${id}/approve`, 'PUT')
};
