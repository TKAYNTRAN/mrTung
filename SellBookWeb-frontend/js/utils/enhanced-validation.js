/**
 * ENHANCED FORM VALIDATION UTILITIES
 * ==================================
 * 
 * Comprehensive form validation with real-time feedback
 * and constraint checking for all application forms
 */

// ===============================
// FIELD-LEVEL VALIDATORS
// ===============================

// Email: Standard email format
function validateEmail(email) {
    let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
        isValid: regex.test(email),
        error: regex.test(email) ? null : 'Email khÃ´ng há»£p lá»‡'
    };
}

// Phone: Vietnamese 10-digit phone
function validatePhone(phone) {
    if (!phone) return { isValid: true, error: null }; // Optional field
    let regex = /^[0-9]{10}$/;
    return {
        isValid: regex.test(phone),
        error: regex.test(phone) ? null : 'Sá»‘ Ä‘iá»‡n thoáº¡i pháº£i lÃ  10 chá»¯ sá»‘'
    };
}

// ISBN: 10 or 13 digits
function validateISBN(isbn) {
    let regex = /^(\d{10}|\d{13})$/;
    return {
        isValid: regex.test(isbn),
        error: regex.test(isbn) ? null : 'ISBN pháº£i lÃ  10 hoáº·c 13 chá»¯ sá»‘'
    };
}

// Price: Must be positive number
function validatePrice(price) {
    let num = parseFloat(price);
    return {
        isValid: num > 0 && !isNaN(num),
        error: (num > 0 && !isNaN(num)) ? null : 'GiÃ¡ pháº£i lá»›n hÆ¡n 0'
    };
}

// Quantity: Must be positive integer, not zero
function validateQuantity(quantity) {
    let num = parseInt(quantity, 10);
    return {
        isValid: num > 0 && !isNaN(num),
        error: (num > 0 && !isNaN(num)) ? null : 'Sá»‘ lÆ°á»£ng pháº£i lá»›n hÆ¡n 0'
    };
}

// Discount: 0-100 percent
function validateDiscount(discount) {
    let num = parseFloat(discount);
    return {
        isValid: num >= 0 && num <= 100 && !isNaN(num),
        error: (num >= 0 && num <= 100 && !isNaN(num)) ? null : 'Giáº£m giÃ¡ pháº£i tá»« 0 Ä‘áº¿n 100%'
    };
}

// Password: Min 6 characters
function validatePassword(password) {
    return {
        isValid: password && password.length >= 6,
        error: (password && password.length >= 6) ? null : 'Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±'
    };
}

// Name: Min 2 characters, not empty
function validateName(name) {
    let trimmed = (name || '').trim();
    return {
        isValid: trimmed.length >= 2,
        error: trimmed.length >= 2 ? null : 'TÃªn pháº£i cÃ³ Ã­t nháº¥t 2 kÃ½ tá»±'
    };
}

// Required field (not empty)
function validateRequired(value, fieldName = 'TrÆ°á»ng') {
    let isValid = value && (typeof value === 'string' ? value.trim() : value) ? true : false;
    return {
        isValid: isValid,
        error: isValid ? null : `${fieldName} lÃ  báº¯t buá»™c`
    };
}

// ===============================
// REAL-TIME VALIDATION FEEDBACK
// ===============================

/**
 * Add real-time validation to an input field
 * @param {HTMLElement} inputElement - Input element to validate
 * @param {Function} validationFn - Validation function
 * @param {Object} options - Display options
 */
function setupFieldValidator(inputElement, validationFn, options = {}) {
    let feedbackElement = options.feedbackElement || inputElement.nextElementSibling;
    let containerClass = options.containerClass || 'form-group';
    let container = inputElement.closest(`.${containerClass}`);
    
    function showValidation() {
        let result = validationFn(inputElement.value);
        
        // Remove previous feedback classes
        if (feedbackElement) {
            feedbackElement.classList.remove('valid', 'invalid', 'hidden');
            feedbackElement.textContent = result.error || 'âœ“ Há»£p lá»‡';
        }
        
        if (result.isValid) {
            inputElement.classList.remove('is-invalid');
            inputElement.classList.add('is-valid');
            if (feedbackElement) feedbackElement.classList.add('valid');
        } else {
            inputElement.classList.remove('is-valid');
            inputElement.classList.add('is-invalid');
            if (feedbackElement) feedbackElement.classList.add('invalid');
        }
        
        return result.isValid;
    }
    
    // Validate on input, blur, and change
    inputElement.addEventListener('input', showValidation);
    inputElement.addEventListener('blur', showValidation);
    inputElement.addEventListener('change', showValidation);
    
    // Initial validation if value exists
    if (inputElement.value) {
        showValidation();
    }
}

// ===============================
// VALIDATION FEEDBACK SYSTEM
// ===============================

/**
 * Create and append validation feedback element
 */
function createValidationFeedback(inputElement) {
    let feedback = document.createElement('small');
    feedback.className = 'validation-feedback hidden';
    inputElement.after(feedback);
    return feedback;
}

/**
 * Show validation error on element
 */
function showValidationError(inputElement, message) {
    inputElement.classList.add('is-invalid');
    inputElement.classList.remove('is-valid');
    
    let feedback = inputElement.nextElementSibling?.classList?.contains('validation-feedback') 
        ? inputElement.nextElementSibling 
        : createValidationFeedback(inputElement);
    
    feedback.textContent = message;
    feedback.classList.remove('hidden');
    feedback.classList.add('invalid');
}

/**
 * Show validation success on element
 */
function showValidationSuccess(inputElement) {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.add('is-valid');
    
    let feedback = inputElement.nextElementSibling?.classList?.contains('validation-feedback') 
        ? inputElement.nextElementSibling 
        : createValidationFeedback(inputElement);
    
    feedback.textContent = 'âœ“ Há»£p lá»‡';
    feedback.classList.remove('hidden', 'invalid');
    feedback.classList.add('valid');
}

/**
 * Clear validation feedback
 */
function clearValidationFeedback(inputElement) {
    inputElement.classList.remove('is-invalid', 'is-valid');
    
    let feedback = inputElement.nextElementSibling?.classList?.contains('validation-feedback');
    if (feedback) {
        feedback.classList.add('hidden');
    }
}

// ===============================
// FORM-LEVEL VALIDATORS
// ===============================

// Login Form
function validateLoginForm(email, password) {
    let errors = [];
    
    let emailVal = validateEmail(email);
    if (!emailVal.isValid) errors.push(emailVal.error);
    
    let passwordVal = validateRequired(password, 'Máº­t kháº©u');
    if (!passwordVal.isValid) errors.push(passwordVal.error);
    
    return { isValid: errors.length === 0, errors };
}

// Register Form
function validateRegisterForm(name, email, password, confirmPassword, phone = '') {
    let errors = [];
    
    let nameVal = validateName(name);
    if (!nameVal.isValid) errors.push(nameVal.error);
    
    let emailVal = validateEmail(email);
    if (!emailVal.isValid) errors.push(emailVal.error);
    
    let passwordVal = validatePassword(password);
    if (!passwordVal.isValid) errors.push(passwordVal.error);
    
    if (password !== confirmPassword) {
        errors.push('Máº­t kháº©u khÃ´ng khá»›p');
    }
    
    let phoneVal = validatePhone(phone);
    if (!phoneVal.isValid) errors.push(phoneVal.error);
    
    return { isValid: errors.length === 0, errors };
}

// Checkout Recipient Info Form
function validateCheckoutRecipientInfo(name, phone, email) {
    let errors = [];
    
    let nameVal = validateName(name);
    if (!nameVal.isValid) errors.push(nameVal.error);
    
    let phoneVal = validatePhone(phone);
    if (!phoneVal.isValid) errors.push(phoneVal.error);
    
    let emailVal = validateEmail(email);
    if (!emailVal.isValid) errors.push(emailVal.error);
    
    return { isValid: errors.length === 0, errors };
}

// Checkout Address Form
function validateCheckoutAddress(province, address) {
    let errors = [];
    
    let provinceVal = validateRequired(province, 'Tá»‰nh/ThÃ nh phá»‘');
    if (!provinceVal.isValid) errors.push(provinceVal.error);
    
    let addressVal = validateRequired(address, 'Äá»‹a chá»‰ cá»¥ thá»ƒ');
    if (!addressVal.isValid) errors.push(addressVal.error);
    
    return { isValid: errors.length === 0, errors };
}

// Admin Book Form
function validateAdminBookForm(title, author, isbn, price, quantity, category) {
    let errors = [];
    
    let titleVal = validateRequired(title, 'TiÃªu Ä‘á»');
    if (!titleVal.isValid) errors.push(titleVal.error);
    
    let authorVal = validateRequired(author, 'TÃ¡c giáº£');
    if (!authorVal.isValid) errors.push(authorVal.error);
    
    let isbnVal = validateISBN(isbn);
    if (!isbnVal.isValid) errors.push(isbnVal.error);
    
    let priceVal = validatePrice(price);
    if (!priceVal.isValid) errors.push(priceVal.error);
    
    let quantityVal = validateQuantity(quantity);
    if (!quantityVal.isValid) errors.push(quantityVal.error);
    
    let categoryVal = validateRequired(category, 'Danh má»¥c');
    if (!categoryVal.isValid) errors.push(categoryVal.error);
    
    return { isValid: errors.length === 0, errors };
}

// Admin User Form
function validateAdminUserForm(name, email, role) {
    let errors = [];
    
    let nameVal = validateName(name);
    if (!nameVal.isValid) errors.push(nameVal.error);
    
    let emailVal = validateEmail(email);
    if (!emailVal.isValid) errors.push(emailVal.error);
    
    let roleVal = validateRequired(role, 'Vai trÃ²');
    if (!roleVal.isValid) errors.push(roleVal.error);
    
    return { isValid: errors.length === 0, errors };
}

// Profile Edit Form
function validateProfileEditForm(name, email, phone = '') {
    let errors = [];
    
    let nameVal = validateName(name);
    if (!nameVal.isValid) errors.push(nameVal.error);
    
    let emailVal = validateEmail(email);
    if (!emailVal.isValid) errors.push(emailVal.error);
    
    let phoneVal = validatePhone(phone);
    if (!phoneVal.isValid) errors.push(phoneVal.error);
    
    return { isValid: errors.length === 0, errors };
}

// ===============================
// CART VALIDATION
// ===============================

/**
 * Check if cart item quantity doesn't exceed available stock
 */
function validateCartItemQuantity(quantity, availableStock) {
    return quantity > 0 && quantity <= availableStock;
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Display form validation errors
 */
function displayFormErrors(form, errors) {
    // Clear previous errors
    let errorContainer = form.querySelector('.error-messages');
    if (errorContainer) {
        errorContainer.innerHTML = '';
        errorContainer.style.display = 'none';
    }
    
    if (errors.length > 0) {
        let errorDiv = form.querySelector('.error-messages') || createErrorContainer(form);
        
        errors.forEach(error => {
            let errorItem = document.createElement('div');
            errorItem.className = 'error-item';
            errorItem.textContent = error;
            errorDiv.appendChild(errorItem);
        });
        
        errorDiv.style.display = 'block';
    }
}

/**
 * Create error container if doesn't exist
 */
function createErrorContainer(form) {
    let container = document.createElement('div');
    container.className = 'error-messages';
    form.insertBefore(container, form.firstChild);
    return container;
}

/**
 * Calculate discount price in real-time
 */
function calculateDiscountedPrice(originalPrice, discountPercent) {
    let discount = (originalPrice * discountPercent) / 100;
    return Math.max(0, originalPrice - discount);
}

/**
 * Format currency (VND)
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

