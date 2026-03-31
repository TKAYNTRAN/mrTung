// ==============================
// LOGIN PAGE VALIDATION INTEGRATION
// ==============================
// This module handles validation for login and register forms

/**
 * Setup validation for login form
 */
function setupLoginFormValidation() {
    console.log('Setting up login form validation...');
    
    let loginEmail = document.getElementById('loginEmail');
    let loginPassword = document.getElementById('loginPassword');
    
    if (loginEmail) {
        loginEmail.addEventListener('blur', () => {
            let result = validateEmail(loginEmail.value);
            applyFieldValidation(loginEmail, result);
        });
        loginEmail.addEventListener('input', () => {
            let result = loginEmail.value ? validateEmail(loginEmail.value) : { isValid: true, error: null };
            applyFieldValidation(loginEmail, result);
        });
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('blur', () => {
            let result = validatePassword(loginPassword.value);
            applyFieldValidation(loginPassword, result);
        });
        loginPassword.addEventListener('input', () => {
            let result = loginPassword.value ? validatePassword(loginPassword.value) : { isValid: true, error: null };
            applyFieldValidation(loginPassword, result);
        });
    }
}

/**
 * Setup validation for register form
 */
function setupRegisterFormValidation() {
    console.log('Setting up register form validation...');
    
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
        registerName.addEventListener('input', () => {
            let result = validateName(registerName.value);
            applyFieldValidation(registerName, result);
        });
    }
    
    if (registerEmail) {
        registerEmail.addEventListener('blur', () => {
            let result = validateEmail(registerEmail.value);
            applyFieldValidation(registerEmail, result);
        });
        registerEmail.addEventListener('input', () => {
            let result = validateEmail(registerEmail.value);
            applyFieldValidation(registerEmail, result);
        });
    }
    
    if (registerPassword) {
        registerPassword.addEventListener('blur', () => {
            let result = validatePassword(registerPassword.value);
            applyFieldValidation(registerPassword, result);
        });
        registerPassword.addEventListener('input', () => {
            let result = validatePassword(registerPassword.value);
            applyFieldValidation(registerPassword, result);
            
            // Also validate confirm password if it has a value
            if (registerPasswordConfirm && registerPasswordConfirm.value) {
                validatePasswordMatch();
            }
        });
    }
    
    if (registerPasswordConfirm) {
        registerPasswordConfirm.addEventListener('blur', validatePasswordMatch);
        registerPasswordConfirm.addEventListener('input', validatePasswordMatch);
    }
    
    if (registerPhone) {
        registerPhone.addEventListener('blur', () => {
            let result = validatePhone(registerPhone.value);
            applyFieldValidation(registerPhone, result);
        });
        registerPhone.addEventListener('input', () => {
            let result = validatePhone(registerPhone.value);
            applyFieldValidation(registerPhone, result);
        });
    }
}

/**
 * Validate password confirmation
 */
function validatePasswordMatch() {
    let registerPassword = document.getElementById('registerPassword');
    let registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
    
    if (!registerPasswordConfirm) return;
    
    let pwd1 = registerPassword?.value || '';
    let pwd2 = registerPasswordConfirm.value;
    
    let result = {
        isValid: pwd1 === pwd2 && pwd1.length >= 6,
        error: pwd1 !== pwd2 ? 'Máº­t kháº©u khÃ´ng khá»›p' : (pwd1.length < 6 ? 'Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±' : null)
    };
    
    applyFieldValidation(registerPasswordConfirm, result);
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
 * Validate login form before submission
 */
function validateLoginFormFull() {
    let loginEmail = document.getElementById('loginEmail');
    let loginPassword = document.getElementById('loginPassword');
    
    let errors = [];
    
    if (loginEmail) {
        let emailResult = validateEmail(loginEmail.value);
        if (!emailResult.isValid) {
            errors.push(emailResult.error);
            applyFieldValidation(loginEmail, emailResult);
        }
    }
    
    if (loginPassword) {
        let passwordResult = validatePassword(loginPassword.value);
        if (!passwordResult.isValid) {
            errors.push(passwordResult.error);
            applyFieldValidation(loginPassword, passwordResult);
        }
    }
    
    return { isValid: errors.length === 0, errors };
}

/**
 * Validate register form before submission
 */
function validateRegisterFormFull() {
    let registerName = document.getElementById('registerName');
    let registerEmail = document.getElementById('registerEmail');
    let registerPassword = document.getElementById('registerPassword');
    let registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
    let registerPhone = document.getElementById('registerPhone');
    
    let errors = [];
    
    if (registerName) {
        let nameResult = validateName(registerName.value);
        if (!nameResult.isValid) {
            errors.push(nameResult.error);
            applyFieldValidation(registerName, nameResult);
        }
    }
    
    if (registerEmail) {
        let emailResult = validateEmail(registerEmail.value);
        if (!emailResult.isValid) {
            errors.push(emailResult.error);
            applyFieldValidation(registerEmail, emailResult);
        }
    }
    
    if (registerPassword) {
        let passwordResult = validatePassword(registerPassword.value);
        if (!passwordResult.isValid) {
            errors.push(passwordResult.error);
            applyFieldValidation(registerPassword, passwordResult);
        }
    }
    
    if (registerPasswordConfirm) {
        let pwd = registerPassword?.value || '';
        let confirmPwd = registerPasswordConfirm.value;
        if (pwd !== confirmPwd) {
            errors.push('Máº­t kháº©u khÃ´ng khá»›p');
            applyFieldValidation(registerPasswordConfirm, { isValid: false, error: 'Máº­t kháº©u khÃ´ng khá»›p' });
        }
    }
    
    if (registerPhone) {
        let phoneResult = validatePhone(registerPhone.value);
        if (!phoneResult.isValid) {
            errors.push(phoneResult.error);
            applyFieldValidation(registerPhone, phoneResult);
        }
    }
    
    return { isValid: errors.length === 0, errors };
}

/**
 * Initialize all login page validations
 */
function initializeLoginPageValidations() {
    console.log('Initializing login page validations...');
    
    setupLoginFormValidation();
    setupRegisterFormValidation();
}

/**
 * Initialize on DOM ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLoginPageValidations);
} else {
    initializeLoginPageValidations();
}

