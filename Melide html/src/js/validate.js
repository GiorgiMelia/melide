/**
 * Form validation functionality
 * Provides client-side validation for contact and booking forms
 */

(function() {
    'use strict';

    // Validation rules
    const VALIDATION_RULES = {
        required: {
            test: (value) => value && value.trim().length > 0,
            message: 'This field is required'
        },
        email: {
            test: (value) => {
                if (!value) return true; // Let required rule handle empty values
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            },
            message: 'Please enter a valid email address'
        },
        phone: {
            test: (value) => {
                if (!value) return true; // Phone is optional
                const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
                return phoneRegex.test(value.replace(/\s/g, ''));
            },
            message: 'Please enter a valid phone number'
        },
        minLength: {
            test: (value, min = 2) => {
                if (!value) return true; // Let required rule handle empty values
                return value.trim().length >= min;
            },
            message: (min) => `Must be at least ${min} characters long`
        },
        maxLength: {
            test: (value, max = 1000) => {
                if (!value) return true;
                return value.trim().length <= max;
            },
            message: (max) => `Must be no more than ${max} characters long`
        },
        date: {
            test: (value) => {
                if (!value) return true; // Let required rule handle empty values
                const date = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date >= today;
            },
            message: 'Please select a date from today onwards'
        }
    };

    // Form configurations
    const FORM_CONFIGS = {
        'contact-form': {
            'contact-name': ['required', 'minLength:2', 'maxLength:100'],
            'contact-email': ['required', 'email'],
            'contact-subject': ['maxLength:200'],
            'contact-message': ['required', 'minLength:10', 'maxLength:1000']
        },
        'booking-form': {
            'booking-name': ['required', 'minLength:2', 'maxLength:100'],
            'booking-email': ['required', 'email'],
            'booking-phone': ['phone'],
            'booking-service': ['required'],
            'booking-date': ['required', 'date'],
            'booking-time': ['required'],
            'booking-notes': ['maxLength:500']
        }
    };

    /**
     * Initialize form validation
     */
    function init() {
        try {
            setupFormValidation();
            setupRealTimeValidation();
        } catch (error) {
            console.error('Error initializing form validation:', error);
        }
    }

    /**
     * Setup form validation for all configured forms
     */
    function setupFormValidation() {
        Object.keys(FORM_CONFIGS).forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                setupFormSubmitValidation(form, FORM_CONFIGS[formId]);
            }
        });
    }

    /**
     * Setup form submit validation
     */
    function setupFormSubmitValidation(form, config) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const isValid = validateForm(form, config);
            
            if (isValid) {
                handleFormSubmission(form);
            } else {
                // Focus first invalid field
                const firstInvalidField = form.querySelector('.form-input:invalid, .form-select:invalid, .form-textarea:invalid');
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
                
                if (window.MainApp && window.MainApp.showToast) {
                    window.MainApp.showToast('Please correct the errors below', 'error');
                }
            }
        });

        // Disable HTML5 validation to use custom validation
        form.setAttribute('novalidate', 'true');
    }

    /**
     * Setup real-time validation
     */
    function setupRealTimeValidation() {
        Object.keys(FORM_CONFIGS).forEach(formId => {
            const form = document.getElementById(formId);
            if (!form) return;

            const config = FORM_CONFIGS[formId];
            
            Object.keys(config).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (!field) return;

                // Validate on blur for better UX
                field.addEventListener('blur', () => {
                    validateField(field, config[fieldId]);
                });

                // Clear errors on input for immediate feedback
                field.addEventListener('input', () => {
                    clearFieldError(field);
                });
            });
        });
    }

    /**
     * Validate entire form
     */
    function validateForm(form, config) {
        let isValid = true;
        
        Object.keys(config).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                const fieldValid = validateField(field, config[fieldId]);
                if (!fieldValid) {
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    /**
     * Validate individual field
     */
    function validateField(field, rules) {
        const value = field.value;
        let isValid = true;
        let errorMessage = '';

        // Clear existing errors
        clearFieldError(field);

        // Run validation rules
        for (const rule of rules) {
            const [ruleName, ...params] = rule.split(':');
            const ruleConfig = VALIDATION_RULES[ruleName];
            
            if (!ruleConfig) {
                console.warn(`Unknown validation rule: ${ruleName}`);
                continue;
            }

            let ruleValid;
            if (params.length > 0) {
                // Rule has parameters (e.g., minLength:5)
                const param = params[0];
                ruleValid = ruleConfig.test(value, param);
                if (!ruleValid) {
                    errorMessage = typeof ruleConfig.message === 'function' 
                        ? ruleConfig.message(param)
                        : ruleConfig.message;
                }
            } else {
                // Simple rule
                ruleValid = ruleConfig.test(value);
                if (!ruleValid) {
                    errorMessage = ruleConfig.message;
                }
            }

            if (!ruleValid) {
                isValid = false;
                break; // Stop at first validation error
            }
        }

        // Show error if validation failed
        if (!isValid) {
            showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Show field error
     */
    function showFieldError(field, message) {
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }

        field.setAttribute('aria-invalid', 'true');
        field.classList.add('error');

        // Add error styling to form group
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('has-error');
        }
    }

    /**
     * Clear field error
     */
    function clearFieldError(field) {
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }

        field.setAttribute('aria-invalid', 'false');
        field.classList.remove('error');

        // Remove error styling from form group
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('has-error');
        }
    }

    /**
     * Handle form submission
     */
    function handleFormSubmission(form) {
        const formId = form.id;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Show loading state
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            // Hide loading state
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }

            if (formId === 'contact-form') {
                handleContactFormSuccess(form, data);
            } else if (formId === 'booking-form') {
                handleBookingFormSuccess(form, data);
            }

        }, 2000); // Simulate network delay
    }

    /**
     * Handle contact form success
     */
    function handleContactFormSuccess(form, data) {
        if (window.MainApp && window.MainApp.showToast) {
            window.MainApp.showToast('Message sent successfully! We\'ll get back to you soon.');
        }

        // Log form data (replace with actual submission to your backend)
        console.log('Contact form submitted:', data);

        // Reset form
        form.reset();
        
        // Clear any remaining error states
        const errorElements = form.querySelectorAll('.form-error.show');
        errorElements.forEach(el => el.classList.remove('show'));
        
        const errorFields = form.querySelectorAll('.form-input.error, .form-select.error, .form-textarea.error');
        errorFields.forEach(field => {
            field.classList.remove('error');
            field.setAttribute('aria-invalid', 'false');
        });
    }

    /**
     * Handle booking form success
     */
    function handleBookingFormSuccess(form, data) {
        if (window.MainApp && window.MainApp.showToast) {
            window.MainApp.showToast('Booking request submitted! We\'ll contact you to confirm your appointment.');
        }

        // Log form data (replace with actual submission to your backend)
        console.log('Booking form submitted:', data);

        // Reset form
        form.reset();
        
        // Reset date minimum to today
        const dateInput = form.querySelector('#booking-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
        }
    }

    /**
     * Add custom validation rule
     */
    function addValidationRule(name, testFunction, message) {
        VALIDATION_RULES[name] = {
            test: testFunction,
            message: message
        };
    }

    /**
     * Validate specific field programmatically
     */
    function validateSpecificField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return false;

        // Find the form and config for this field
        let fieldConfig = null;
        let formConfig = null;
        
        Object.keys(FORM_CONFIGS).forEach(formId => {
            if (FORM_CONFIGS[formId][fieldId]) {
                fieldConfig = FORM_CONFIGS[formId][fieldId];
                formConfig = FORM_CONFIGS[formId];
            }
        });

        if (!fieldConfig) {
            console.warn(`No validation config found for field: ${fieldId}`);
            return true;
        }

        return validateField(field, fieldConfig);
    }

    /**
     * Validate specific form programmatically
     */
    function validateSpecificForm(formId) {
        const form = document.getElementById(formId);
        const config = FORM_CONFIGS[formId];
        
        if (!form || !config) {
            console.warn(`Form or config not found: ${formId}`);
            return false;
        }

        return validateForm(form, config);
    }

    /**
     * Reset form validation state
     */
    function resetFormValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Clear all error states
        const errorElements = form.querySelectorAll('.form-error.show');
        errorElements.forEach(el => el.classList.remove('show'));
        
        const errorFields = form.querySelectorAll('.form-input.error, .form-select.error, .form-textarea.error');
        errorFields.forEach(field => {
            field.classList.remove('error');
            field.setAttribute('aria-invalid', 'false');
        });

        const errorGroups = form.querySelectorAll('.form-group.has-error');
        errorGroups.forEach(group => group.classList.remove('has-error'));
    }

    // Export public API
    window.FormValidator = {
        addValidationRule,
        validateField: validateSpecificField,
        validateForm: validateSpecificForm,
        resetValidation: resetFormValidation
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
