/**
 * CONSTANTS - Centralized Configuration
 * ====================================
 * 
 * All application constants and configuration values
 * in one place for easy maintenance and updates
 */

// ===============================
// API CONFIGURATION
// ===============================
let API_CONFIG = {
    BASE_URL: 'http://localhost:3005/api',
    ENDPOINTS: {
        // Auth
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        REFRESH_TOKEN: '/auth/refresh-token',
        LOGOUT: '/auth/logout',
        
        // Books
        BOOKS: '/books',
        BOOKS_SEARCH: '/books/search',
        BOOKS_BY_CATEGORY: '/books/category',
        BOOK_BY_ID: '/books',
        
        // Categories
        CATEGORIES: '/categories',
        CATEGORY_BY_ID: '/categories',
        
        // Cart
        CART: '/cart',
        CART_ITEMS: '/cart/items',
        
        // Orders
        ORDERS: '/orders',
        ORDER_BY_ID: '/orders',
        
        // Wishlist
        WISHLIST: '/wishlist',
        WISHLIST_ITEMS: '/wishlist/items',
        
        // Reviews
        REVIEWS: '/reviews',
        REVIEW_BY_ID: '/reviews',
        
        // User Profile
        PROFILE: '/users/profile',
        
        // Admin
        ADMIN_USERS: '/admin/users',
        ADMIN_BOOKS: '/admin/books',
        ADMIN_CATEGORIES: '/admin/categories',
        ADMIN_ORDERS: '/admin/orders',
        ADMIN_DASHBOARD: '/admin/dashboard/stats',
    }
};

// ===============================
// PAGINATION & DISPLAY
// ===============================
let PAGE_CONFIG = {
    ITEMS_PER_PAGE: 12,
    MAX_NOTIFICATION_COUNT: 99,
    SEARCH_DEBOUNCE_MS: 300,
    AUTO_DISMISS_TIMEOUT: 3000, // 3 seconds
};

// ===============================
// PASSWORD POLICY
// ===============================
let PASSWORD_CONFIG = {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_DIGITS: true,
    REQUIRE_SPECIAL: true,
    SPECIAL_CHARS: '!@#$%^&*',
};

// ===============================
// VALIDATION PATTERNS
// ===============================
let VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\d\s\+\-\(\)]+$/,
    URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
};

// ===============================
// USER ROLES
// ===============================
let USER_ROLES = {
    CUSTOMER: 'CUSTOMER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
};

// ===============================
// ORDER STATUSES
// ===============================
let ORDER_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
};

// ===============================
// NOTIFICATION TYPES
// ===============================
let NOTIFICATION_TYPE = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
};

// ===============================
// STORAGE KEYS
// ===============================
let STORAGE_KEYS = {
    USER_INFO: 'userInfo',
    AUTH_TOKEN: 'authToken',
    REFRESH_TOKEN: 'refreshToken',
    CART: 'cart',
    WISHLIST: 'wishlist',
    PREFERENCES: 'userPreferences',
    THEME: 'theme', // 'light' or 'dark'
};

// ===============================
// UI SETTINGS
// ===============================
let UI_CONFIG = {
    THEME: 'light',
    ANIMATION_DURATION: 300, // milliseconds
    MODAL_OVERLAY_OPACITY: 0.5,
    DEFAULT_PAGE_SIZE: 12,
    MAX_FILE_SIZE: 5242880, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

// ===============================
// ERROR MESSAGES
// ===============================
let ERROR_MESSAGES = {
    // Auth
    INVALID_EMAIL: 'Email khÃ´ng há»£p lá»‡',
    WEAK_PASSWORD: 'Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 8 kÃ½ tá»±, bao gá»“m chá»¯ hoa, chá»¯ thÆ°á»ng, sá»‘ vÃ  kÃ½ tá»± Ä‘áº·c biá»‡t',
    PASSWORD_MISMATCH: 'Máº­t kháº©u xÃ¡c nháº­n khÃ´ng khá»›p',
    INVALID_CREDENTIALS: 'Email hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng',
    LOGIN_FAILED: 'ÄÄƒng nháº­p tháº¥t báº¡i. Vui lÃ²ng thá»­ láº¡i',
    REGISTER_FAILED: 'ÄÄƒng kÃ½ tháº¥t báº¡i. Vui lÃ²ng thá»­ láº¡i',
    
    // Network
    NETWORK_ERROR: 'Lá»—i káº¿t ná»‘i máº¡ng. Vui lÃ²ng kiá»ƒm tra internet',
    TIMEOUT: 'YÃªu cáº§u háº¿t thá»i gian chá». Vui lÃ²ng thá»­ láº¡i',
    SERVER_ERROR: 'Lá»—i server. Vui lÃ²ng thá»­ láº¡i sau',
    
    // Validation
    REQUIRED_FIELD: 'TrÆ°á»ng nÃ y lÃ  báº¯t buá»™c',
    INVALID_FORMAT: 'Äá»‹nh dáº¡ng khÃ´ng há»£p lá»‡',
};

// ===============================
// SUCCESS MESSAGES
// ===============================
let SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'ÄÄƒng nháº­p thÃ nh cÃ´ng',
    REGISTER_SUCCESS: 'ÄÄƒng kÃ½ thÃ nh cÃ´ng. Vui lÃ²ng Ä‘Äƒng nháº­p',
    LOGOUT_SUCCESS: 'ÄÃ£ Ä‘Äƒng xuáº¥t',
    PROFILE_UPDATED: 'Cáº­p nháº­t há»“ sÆ¡ thÃ nh cÃ´ng',
    ITEM_ADDED_TO_CART: 'ÄÃ£ thÃªm vÃ o giá» hÃ ng',
    ITEM_REMOVED: 'ÄÃ£ xÃ³a má»¥c',
    ORDER_PLACED: 'ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c táº¡o',
};

// ===============================
// DATE & TIME
// ===============================
let DATE_FORMAT = {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd MMMM yyyy',
    WITH_TIME: 'dd/MM/yyyy HH:mm',
};

// ===============================
// CURRENCY
// ===============================
let CURRENCY_CONFIG = {
    SYMBOL: 'â‚«',
    NAME: 'VND',
    DECIMAL_PLACES: 0, // Vietnamese Dong doesn't use decimals
};

// ===============================
// HTTP STATUS CODES
// ===============================
let HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

// ===============================
// FEATURE FLAGS
// ===============================
let FEATURES = {
    ENABLE_WISHLIST: true,
    ENABLE_REVIEWS: true,
    ENABLE_RATINGS: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_NOTIFICATIONS_POLLING: true,
    NOTIFICATIONS_POLL_INTERVAL: 30000, // 30 seconds
    ENABLE_CART: true,
    ENABLE_CHECKOUT: true,
    ENABLE_ORDER_TRACKING: true,
};

// Export for modules (if using ES6 modules)
// export { API_CONFIG, PAGE_CONFIG, PASSWORD_CONFIG, ... };

