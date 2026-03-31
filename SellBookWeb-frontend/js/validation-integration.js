// ==============================
// VALIDATION INTEGRATION MODULE
// ==============================
// This module integrates enhanced-validation.js with the customer app
// Provides form submission validation and real-time feedback

/**
 * Initialize all form validations on page load
 */
function initializeFormValidations() {
    console.log('Initializing form validations...');
    
    // Listen for show section events to initialize validation for newly visible forms
    let setupValidationForSection = (sectionId) => {
        if (sectionId === 'checkout') {
            setupCheckoutValidation();
        } else if (sectionId === 'login') {
            setupLoginValidation();
        }
    };

    // Override original showSection to add validation setup
    if (window.originalShowSection === undefined) {
        window.originalShowSection = window.showSection;
        window.showSection = function(sectionId) {
            window.originalShowSection(sectionId);
            setupValidationForSection(sectionId);
        };
    }
}

/**
 * Setup validation for checkout form
 */
function setupCheckoutValidation() {
    console.log('Setting up checkout validation...');
    
    // Recipient Info Fields
    let checkoutName = document.getElementById('checkoutName');
    let checkoutPhone = document.getElementById('checkoutPhone');
    let checkoutEmail = document.getElementById('checkoutEmail');
    
    if (checkoutName) {
        checkoutName.addEventListener('blur', () => {
            let result = validateName(checkoutName.value);
            applyFieldValidation(checkoutName, result);
        });
        checkoutName.addEventListener('input', () => {
            let result = validateName(checkoutName.value);
            applyFieldValidation(checkoutName, result);
        });
    }
    
    if (checkoutPhone) {
        checkoutPhone.addEventListener('blur', () => {
            let result = validatePhone(checkoutPhone.value);
            applyFieldValidation(checkoutPhone, result);
        });
        checkoutPhone.addEventListener('input', () => {
            let result = validatePhone(checkoutPhone.value);
            applyFieldValidation(checkoutPhone, result);
        });
    }
    
    if (checkoutEmail) {
        checkoutEmail.addEventListener('blur', () => {
            let result = validateEmail(checkoutEmail.value);
            applyFieldValidation(checkoutEmail, result);
        });
        checkoutEmail.addEventListener('input', () => {
            let result = validateEmail(checkoutEmail.value);
            applyFieldValidation(checkoutEmail, result);
        });
    }
    
    // Address Fields
    let checkoutProvince = document.getElementById('checkoutProvince');
    let checkoutAddress = document.getElementById('checkoutAddress');
    
    if (checkoutProvince) {
        checkoutProvince.addEventListener('change', () => {
            let result = validateRequired(checkoutProvince.value);
            applyFieldValidation(checkoutProvince, result);
        });
    }
    
    if (checkoutAddress) {
        checkoutAddress.addEventListener('blur', () => {
            let result = validateRequired(checkoutAddress.value);
            applyFieldValidation(checkoutAddress, result);
        });
        checkoutAddress.addEventListener('input', () => {
            let result = validateRequired(checkoutAddress.value);
            applyFieldValidation(checkoutAddress, result);
        });
    }
}

/**
 * Setup validation for login form
 */
function setupLoginValidation() {
    console.log('Setting up login validation...');
    
    // Login Form
    let loginEmail = document.getElementById('loginEmail');
    let loginPassword = document.getElementById('loginPassword');
    
    if (loginEmail) {
        loginEmail.addEventListener('blur', () => {
            let result = validateEmail(loginEmail.value);
            applyFieldValidation(loginEmail, result);
        });
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('blur', () => {
            let result = validatePassword(loginPassword.value);
            applyFieldValidation(loginPassword, result);
        });
    }
    
    // Register Form
    let registerName = document.getElementById('registerName');
    let registerEmail = document.getElementById('registerEmail');
    let registerPassword = document.getElementById('registerPassword');
    let registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
    let registerPhone = document.getElementById('registerPhone');
    
    if (registerName) {
        registerName.addEventListener('blur', () => {
            let result = validateName(registerName.value);
            applyFieldValidation(registerName, result);
        });
    }
    
    if (registerEmail) {
        registerEmail.addEventListener('blur', () => {
            let result = validateEmail(registerEmail.value);
            applyFieldValidation(registerEmail, result);
        });
    }
    
    if (registerPassword) {
        registerPassword.addEventListener('blur', () => {
            let result = validatePassword(registerPassword.value);
            applyFieldValidation(registerPassword, result);
        });
    }
    
    if (registerPasswordConfirm) {
        registerPasswordConfirm.addEventListener('blur', function() {
            let pwd = registerPassword?.value || '';
            let isValid = pwd === this.value && pwd.length >= 6;
            this.classList.toggle('is-valid', isValid);
            this.classList.toggle('is-invalid', !isValid);
        });
    }
    
    if (registerPhone) {
        registerPhone.addEventListener('blur', () => {
            let result = validatePhone(registerPhone.value);
            applyFieldValidation(registerPhone, result);
        });
    }
}

/**
 * Apply validation CSS classes to a field
 */
function applyFieldValidation(field, validationResult) {
    if (!field) return;
    
    let isEmpty = !field.value || field.value.trim() === '';
    
    if (isEmpty && !field.hasAttribute('required')) {
        // Optional field and empty, remove validation classes
        field.classList.remove('is-valid', 'is-invalid');
    } else if (validationResult.isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        showFieldError(field, validationResult.error);
    }
}

/**
 * Show field error message
 */
function showFieldError(field, errorMessage) {
    let feedbackEl = field.nextElementSibling;
    if (!feedbackEl || !feedbackEl.classList.contains('validation-feedback')) {
        feedbackEl = document.createElement('div');
        feedbackEl.className = 'validation-feedback';
        field.parentElement.insertBefore(feedbackEl, field.nextElementSibling);
    }
    feedbackEl.textContent = errorMessage;
    feedbackEl.classList.add('invalid');
    feedbackEl.classList.remove('hidden');
}

/**
 * Validate entire checkout form before submission
 */
function validateCheckoutForm() {
    let checkoutName = document.getElementById('checkoutName');
    let checkoutPhone = document.getElementById('checkoutPhone');
    let checkoutEmail = document.getElementById('checkoutEmail');
    let checkoutProvince = document.getElementById('checkoutProvince');
    let checkoutAddress = document.getElementById('checkoutAddress');
    
    let errors = [];
    
    // Validate recipient info
    if (checkoutName) {
        let nameResult = validateName(checkoutName.value);
        if (!nameResult.isValid) {
            errors.push(nameResult.error);
            applyFieldValidation(checkoutName, nameResult);
        }
    }
    
    if (checkoutPhone) {
        let phoneResult = validatePhone(checkoutPhone.value);
        if (!phoneResult.isValid) {
            errors.push(phoneResult.error);
            applyFieldValidation(checkoutPhone, phoneResult);
        }
    }
    
    if (checkoutEmail) {
        let emailResult = validateEmail(checkoutEmail.value);
        if (!emailResult.isValid) {
            errors.push(emailResult.error);
            applyFieldValidation(checkoutEmail, emailResult);
        }
    }
    
    // Validate address
    if (checkoutProvince) {
        let provinceResult = validateRequired(checkoutProvince.value);
        if (!provinceResult.isValid) {
            errors.push('Vui lÃ²ng chá»n tá»‰nh/thÃ nh phá»‘');
            applyFieldValidation(checkoutProvince, provinceResult);
        }
    }
    
    if (checkoutAddress) {
        let addressResult = validateRequired(checkoutAddress.value);
        if (!addressResult.isValid) {
            errors.push('Vui lÃ²ng nháº­p Ä‘á»‹a chá»‰ giao hÃ ng');
            applyFieldValidation(checkoutAddress, addressResult);
        }
    }
    
    return { isValid: errors.length === 0, errors };
}

/**
 * Enhanced checkout function with validation
 */
let originalCheckout = window.checkout;
if (originalCheckout) {
    window.checkout = function() {
        // Validate form first
        let validation = validateCheckoutForm();
        
        if (!validation.isValid) {
            showAlert('Vui lÃ²ng kiá»ƒm tra cÃ¡c trÆ°á»ng sau:\\n\\n' + validation.errors.join('\\n'));
            return;
        }
        
        // Call original checkout function
        originalCheckout.call(this);
    };
}

/**
 * Setup admin form validation
 */
function setupAdminFormValidation() {
    console.log('Setting up admin form validation...');
    
    // Book Form
    let bookIsbn = document.getElementById('bookIsbn');
    let bookPrice = document.getElementById('bookPrice');
    let bookQuantity = document.getElementById('bookQuantity');
    let bookDiscount = document.getElementById('bookDiscount');
    
    if (bookIsbn) {
        bookIsbn.addEventListener('blur', () => {
            let result = validateISBN(bookIsbn.value);
            applyFieldValidation(bookIsbn, result);
        });
    }
    
    if (bookPrice) {
        bookPrice.addEventListener('blur', () => {
            let result = validatePrice(bookPrice.value);
            applyFieldValidation(bookPrice, result);
        });
    }
    
    if (bookQuantity) {
        bookQuantity.addEventListener('blur', () => {
            let result = validateQuantity(bookQuantity.value);
            applyFieldValidation(bookQuantity, result);
        });
    }
    
    if (bookDiscount) {
        bookDiscount.addEventListener('blur', () => {
            let result = validateDiscount(bookDiscount.value);
            applyFieldValidation(bookDiscount, result);
        });
    }
}

/**
 * Initialize admin form validation listener
 */
function initializeAdminFormValidation() {
    // Check if admin page is being shown
    if (document.getElementById('admin')) {
        setupAdminFormValidation();
    } else {
        // Listen for section changes
        if (window.originalShowSection === undefined) {
            window.originalShowSection = window.showSection;
            window.showSection = function(sectionId) {
                window.originalShowSection(sectionId);
                if (sectionId === 'admin' || sectionId === 'adminBooks' || sectionId === 'adminUsers') {
                    setupAdminFormValidation();
                }
            };
        }
    }
}

/**
 * Cart quantity validation helper
 */
function validateCartQuantityInput(quantity, availableStock) {
    let val = parseInt(quantity);
    
    if (isNaN(val) || val < 1) {
        return {
            isValid: false,
            error: 'Sá»‘ lÆ°á»£ng pháº£i â‰¥ 1'
        };
    }
    
    if (availableStock !== null && availableStock !== undefined && val > availableStock) {
        return {
            isValid: false,
            error: `Chá»‰ cÃ²n ${availableStock} sáº£n pháº©m trong kho`
        };
    }
    
    return { isValid: true, error: null };
}

/**
 * Format and display price with discount calculation
 */
function displayPriceWithDiscount(originalPrice, discountPercent) {
    let discounted = calculateDiscountedPrice(originalPrice, discountPercent);
    return {
        original: formatCurrency(originalPrice),
        discounted: formatCurrency(discounted),
        saved: formatCurrency(originalPrice - discounted)
    };
}

/**
 * Initialize all validations on page ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFormValidations);
} else {
    initializeFormValidations();
}

// Also initialize for dynamically added content
let observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            // Re-initialize validation if forms are added to DOM
            if (mutation.addedNodes.length > 0) {
                // Check if section content was added
                let checkoutCard = document.querySelector('.checkout-card');
                if (checkoutCard) {
                    setupCheckoutValidation();
                }
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

