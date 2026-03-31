// ==============================
// ADMIN VALIDATION INTEGRATION MODULE
// ==============================
// This module integrates form validations for admin pages
// Validates book, category, user, and order forms

/**
 * Setup validation for admin book form
 */
function setupAdminBookFormValidation() {
    console.log('Setting up admin book form validation...');
    
    let bookTitle = document.getElementById('bookTitle');
    let bookAuthor = document.getElementById('bookAuthor');
    let bookIsbn = document.getElementById('bookIsbn');
    let bookPrice = document.getElementById('bookPrice');
    let bookQuantity = document.getElementById('bookQuantity');
    let bookDiscount = document.getElementById('bookDiscount');
    
    if (bookTitle) {
        bookTitle.addEventListener('blur', () => {
            let result = validateRequired(bookTitle.value);
            applyFieldValidation(bookTitle, result);
        });
        bookTitle.addEventListener('input', () => {
            let result = validateRequired(bookTitle.value);
            applyFieldValidation(bookTitle, result);
        });
    }
    
    if (bookAuthor) {
        bookAuthor.addEventListener('blur', () => {
            let result = validateRequired(bookAuthor.value);
            applyFieldValidation(bookAuthor, result);
        });
        bookAuthor.addEventListener('input', () => {
            let result = validateRequired(bookAuthor.value);
            applyFieldValidation(bookAuthor, result);
        });
    }
    
    if (bookIsbn) {
        bookIsbn.addEventListener('blur', () => {
            let result = bookIsbn.value ? validateISBN(bookIsbn.value) : { isValid: true, error: null };
            applyFieldValidation(bookIsbn, result);
        });
        bookIsbn.addEventListener('input', () => {
            let result = bookIsbn.value ? validateISBN(bookIsbn.value) : { isValid: true, error: null };
            applyFieldValidation(bookIsbn, result);
        });
    }
    
    if (bookPrice) {
        bookPrice.addEventListener('blur', () => {
            let result = validatePrice(bookPrice.value);
            applyFieldValidation(bookPrice, result);
        });
        bookPrice.addEventListener('input', () => {
            let result = bookPrice.value ? validatePrice(bookPrice.value) : { isValid: true, error: null };
            applyFieldValidation(bookPrice, result);
        });
    }
    
    if (bookQuantity) {
        bookQuantity.addEventListener('blur', () => {
            let result = bookQuantity.value ? validateQuantity(bookQuantity.value) : { isValid: true, error: null };
            applyFieldValidation(bookQuantity, result);
        });
        bookQuantity.addEventListener('input', () => {
            let result = bookQuantity.value ? validateQuantity(bookQuantity.value) : { isValid: true, error: null };
            applyFieldValidation(bookQuantity, result);
        });
    }
    
    if (bookDiscount) {
        bookDiscount.addEventListener('blur', () => {
            let result = bookDiscount.value ? validateDiscount(bookDiscount.value) : { isValid: true, error: null };
            applyFieldValidation(bookDiscount, result);
        });
        bookDiscount.addEventListener('input', () => {
            let result = bookDiscount.value ? validateDiscount(bookDiscount.value) : { isValid: true, error: null };
            applyFieldValidation(bookDiscount, result);
        });
    }
}

/**
 * Setup validation for admin user form
 */
function setupAdminUserFormValidation() {
    console.log('Setting up admin user form validation...');
    
    let userName = document.getElementById('userName');
    let userEmail = document.getElementById('userEmail');
    let userPhone = document.getElementById('userPhone');
    let userRole = document.getElementById('userRole');
    
    if (userName) {
        userName.addEventListener('blur', () => {
            let result = validateName(userName.value);
            applyFieldValidation(userName, result);
        });
        userName.addEventListener('input', () => {
            let result = validateName(userName.value);
            applyFieldValidation(userName, result);
        });
    }
    
    if (userEmail) {
        userEmail.addEventListener('blur', () => {
            let result = validateEmail(userEmail.value);
            applyFieldValidation(userEmail, result);
        });
        userEmail.addEventListener('input', () => {
            let result = validateEmail(userEmail.value);
            applyFieldValidation(userEmail, result);
        });
    }
    
    if (userPhone) {
        userPhone.addEventListener('blur', () => {
            let result = validatePhone(userPhone.value);
            applyFieldValidation(userPhone, result);
        });
        userPhone.addEventListener('input', () => {
            let result = validatePhone(userPhone.value);
            applyFieldValidation(userPhone, result);
        });
    }
    
    if (userRole) {
        userRole.addEventListener('change', () => {
            let result = validateRequired(userRole.value);
            applyFieldValidation(userRole, result);
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
 * Validate admin book form before submission
 */
function validateAdminBookFormFull() {
    let bookTitle = document.getElementById('bookTitle');
    let bookAuthor = document.getElementById('bookAuthor');
    let bookIsbn = document.getElementById('bookIsbn');
    let bookPrice = document.getElementById('bookPrice');
    let bookQuantity = document.getElementById('bookQuantity');
    let bookDiscount = document.getElementById('bookDiscount');
    
    let errors = [];
    
    if (bookTitle) {
        let titleResult = validateRequired(bookTitle.value);
        if (!titleResult.isValid) {
            errors.push('TÃªn sÃ¡ch lÃ  báº¯t buá»™c');
            applyFieldValidation(bookTitle, titleResult);
        }
    }
    
    if (bookAuthor) {
        let authorResult = validateRequired(bookAuthor.value);
        if (!authorResult.isValid) {
            errors.push('TÃ¡c giáº£ lÃ  báº¯t buá»™c');
            applyFieldValidation(bookAuthor, authorResult);
        }
    }
    
    if (bookIsbn && bookIsbn.value) {
        let isbnResult = validateISBN(bookIsbn.value);
        if (!isbnResult.isValid) {
            errors.push(isbnResult.error);
            applyFieldValidation(bookIsbn, isbnResult);
        }
    }
    
    if (bookPrice) {
        let priceResult = validatePrice(bookPrice.value);
        if (!priceResult.isValid) {
            errors.push(priceResult.error);
            applyFieldValidation(bookPrice, priceResult);
        }
    }
    
    if (bookQuantity && bookQuantity.value) {
        let qtyResult = validateQuantity(bookQuantity.value);
        if (!qtyResult.isValid) {
            errors.push(qtyResult.error);
            applyFieldValidation(bookQuantity, qtyResult);
        }
    }
    
    if (bookDiscount && bookDiscount.value) {
        let discountResult = validateDiscount(bookDiscount.value);
        if (!discountResult.isValid) {
            errors.push(discountResult.error);
            applyFieldValidation(bookDiscount, discountResult);
        }
    }
    
    return { isValid: errors.length === 0, errors };
}

/**
 * Validate admin user form before submission
 */
function validateAdminUserFormFull() {
    let userName = document.getElementById('userName');
    let userEmail = document.getElementById('userEmail');
    let userPhone = document.getElementById('userPhone');
    let userRole = document.getElementById('userRole');
    
    let errors = [];
    
    if (userName) {
        let nameResult = validateName(userName.value);
        if (!nameResult.isValid) {
            errors.push(nameResult.error);
            applyFieldValidation(userName, nameResult);
        }
    }
    
    if (userEmail) {
        let emailResult = validateEmail(userEmail.value);
        if (!emailResult.isValid) {
            errors.push(emailResult.error);
            applyFieldValidation(userEmail, emailResult);
        }
    }
    
    if (userPhone) {
        let phoneResult = validatePhone(userPhone.value);
        if (!phoneResult.isValid) {
            errors.push(phoneResult.error);
            applyFieldValidation(userPhone, phoneResult);
        }
    }
    
    if (userRole) {
        let roleResult = validateRequired(userRole.value);
        if (!roleResult.isValid) {
            errors.push('Vui lÃ²ng chá»n vai trÃ²');
            applyFieldValidation(userRole, roleResult);
        }
    }
    
    return { isValid: errors.length === 0, errors };
}

/**
 * Initialize admin form validations on page load
 */
function initializeAdminFormValidations() {
    console.log('Initializing admin form validations...');
    
    // Setup initial validation
    setupAdminBookFormValidation();
    setupAdminUserFormValidation();
    
    // Listen for modal opens
    let setupValidationForModal = () => {
        setTimeout(() => {
            setupAdminBookFormValidation();
            setupAdminUserFormValidation();
        }, 100);
    };
    
    // Hook into modal show events if they exist
    document.addEventListener('show-modal', setupValidationForModal);
}

/**
 * Initialize admin validations on DOM ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminFormValidations);
} else {
    initializeAdminFormValidations();
}

// Watch for dynamically added modal content
let observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Re-initialize validation if forms are added to DOM
            mutations.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    if (node.querySelector('.book-form') || node.querySelector('.user-form')) {
                        setTimeout(() => {
                            setupAdminBookFormValidation();
                            setupAdminUserFormValidation();
                        }, 50);
                    }
                }
            });
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

