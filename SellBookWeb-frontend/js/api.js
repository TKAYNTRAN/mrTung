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

        let errorData = null;
        if (!response.ok) {
            errorData = await response.json().catch(() => ({}));
        }

        const authMessages = ['Authentication required', 'Token expired'];
        if (
            response.status === 401 ||
            (response.status === 403 && authMessages.includes(errorData?.message))
        ) {
            auth.logout();
            throw new Error('Phiên đăng nhập đã hết hạn');
        }

        if (!response.ok) {
            throw new Error(errorData?.message || `Error: ${response.statusText}`);
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
    getMyOrderById: (id) => apiCall(`/orders/my-orders/${id}`),
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
    getAll: async (page = 0, size = 100) => {
        const data = await apiCall(`/coupons?page=${page}&size=${size}`);
        return data.coupons != null ? data.coupons : data;
    },
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

const banksAPI = {
    getAll: (active) => {
        let url = '/banks';
        if (active !== undefined) url += `?active=${active}`;
        return apiCall(url);
    },
    getById: (id) => apiCall(`/banks/${id}`),
    create: (formData) => {
        return fetch(`${API_BASE_URL}/banks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${auth.token}`
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Create bank failed');
            return res.json();
        });
    },
    update: (id, formData) => {
        return fetch(`${API_BASE_URL}/banks/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${auth.token}`
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Update bank failed');
            return res.json();
        });
    },
    delete: (id) => apiCall(`/banks/${id}`, 'DELETE'),
    toggleActive: (id) => apiCall(`/banks/${id}/toggle-active`, 'PUT')
};

const wishlistAPI = {
    getMyWishlist: () => apiCall('/wishlists'),
    check: (bookId) => apiCall(`/wishlists/check/${bookId}`),
    add: (bookId) => apiCall('/wishlists', 'POST', { bookId }),
    remove: (bookId) => apiCall(`/wishlists/${bookId}`, 'DELETE'),
    clear: () => apiCall('/wishlists', 'DELETE')
};

const suppliersAPI = {
    getAll: (page = 0, size = 100, active = '', search = '') => {
        let url = `/suppliers?page=${page}&size=${size}`;
        if (active !== '' && active !== undefined && active !== null) url += `&active=${active}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return apiCall(url);
    },
    getById: (id) => apiCall(`/suppliers/${id}`),
    create: (data) => apiCall('/suppliers', 'POST', data),
    update: (id, data) => apiCall(`/suppliers/${id}`, 'PUT', data),
    delete: (id) => apiCall(`/suppliers/${id}`, 'DELETE'),
    toggleActive: (id) => apiCall(`/suppliers/${id}/toggle-active`, 'PUT')
};

const purchaseOrdersAPI = {
    getAll: (page = 0, size = 100, status = '', supplierId = '') => {
        let url = `/purchase-orders?page=${page}&size=${size}`;
        if (status) url += `&status=${status}`;
        if (supplierId) url += `&supplierId=${supplierId}`;
        return apiCall(url);
    },
    getById: (id) => apiCall(`/purchase-orders/${id}`),
    create: (data) => apiCall('/purchase-orders', 'POST', data),
    update: (id, data) => apiCall(`/purchase-orders/${id}`, 'PUT', data),
    receive: (id) => apiCall(`/purchase-orders/${id}/receive`, 'PUT'),
    cancel: (id) => apiCall(`/purchase-orders/${id}/cancel`, 'PUT'),
    delete: (id) => apiCall(`/purchase-orders/${id}`, 'DELETE')
};

const adminReviewsAPI = {
    getPending: () => apiCall('/reviews/admin/pending'),
    approve: (id) => apiCall(`/reviews/${id}/approve`, 'PUT')
};
