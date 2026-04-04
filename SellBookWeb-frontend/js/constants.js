/**
 * CONSTANTS - Centralized Configuration
 */

const API_CONFIG = {
    BASE_URL: 'http://localhost:8080',
    API_URL: 'http://localhost:8080/api',
    ENDPOINTS: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        PROFILE: '/auth/me',

        BOOKS: '/books',
        BOOKS_SEARCH: '/books/search',
        BOOKS_BY_CATEGORY: '/books/category',

        CATEGORIES: '/categories',

        CART: '/cart',
        CART_ITEMS: '/cart/items',

        ORDERS: '/orders',
        MY_ORDERS: '/orders/my-orders',

        USERS: '/users',
        REVIEWS: '/reviews'
    }
};

const USER_ROLES = {
    CUSTOMER: 'CUSTOMER',
    ADMIN: 'ADMIN'
};

const ORDER_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED'
};

const STORAGE_KEYS = {
    USER_INFO: 'userInfo',
    AUTH_TOKEN: 'authToken',
    CART: 'cart'
};

const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    REGISTER_SUCCESS: 'Đăng ký thành công',
    LOGOUT_SUCCESS: 'Đã đăng xuất',
    ITEM_ADDED_TO_CART: 'Đã thêm vào giỏ hàng',
    ORDER_PLACED: 'Đơn hàng đã được tạo',
    PROFILE_UPDATED: 'Cập nhật hồ sơ thành công'
};

const ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    NETWORK_ERROR: 'Lỗi kết nối mạng',
    SERVER_ERROR: 'Lỗi server. Vui lòng thử lại sau',
    REQUIRED_FIELD: 'Trường này là bắt buộc'
};
