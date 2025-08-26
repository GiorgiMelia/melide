/**
 * Booking System Integration
 * Handles Setmore integration and internal booking form functionality
 */

(function() {
    'use strict';

    // Configuration object - customize this to change booking behavior
    const BOOKING_CONFIG = {
        provider: "setmore", // "setmore" | "internal"
        setmoreUrl: "https://daixmarededa.setmore.com/book", // Replace with your Setmore URL
        internalRoute: "/pages/booking.html",
        scriptTimeout: 10000, // 10 seconds timeout for script loading
        retryAttempts: 3
    };

    // State management
    let isScriptLoaded = false;
    let scriptLoadAttempts = 0;
    let setmoreWidget = null;

    /**
     * Initialize booking system
     */
    function init() {
        try {
            setupFloatingButtonHandler();
            
            // Only initialize booking widget if we're on the booking page
            if (isBookingPage()) {
                initializeBookingWidget();
            }
        } catch (error) {
            console.error('Error initializing booking system:', error);
        }
    }

    /**
     * Check if current page is the booking page
     */
    function isBookingPage() {
        return window.location.pathname.includes('booking');
    }

    /**
     * Setup floating book button handler
     */
    function setupFloatingButtonHandler() {
        const floatingBtn = document.getElementById('floating-book-btn');
        if (!floatingBtn) return;

        floatingBtn.addEventListener('click', handleBookingClick);
    }

    /**
     * Handle booking button clicks (both floating and regular buttons)
     */
    function handleBookingClick(e) {
        e.preventDefault();
        
        if (BOOKING_CONFIG.provider === 'setmore') {
            openSetmoreBooking();
        } else {
            openInternalBooking();
        }
    }

    /**
     * Initialize booking widget on booking page
     */
    function initializeBookingWidget() {
        if (BOOKING_CONFIG.provider === 'setmore') {
            loadSetmoreWidget();
        } else {
            showInternalBookingForm();
        }
    }

    /**
     * Load Setmore widget
     */
    function loadSetmoreWidget() {
        const setmoreContainer = document.getElementById('setmore-booking-container');
        const internalContainer = document.getElementById('internal-booking-container');
        const fallbackContainer = document.getElementById('booking-fallback');
        
        if (!setmoreContainer) return;

        showLoadingState();

        // Try to load Setmore script
        loadSetmoreScript()
            .then(() => {
                hideLoadingState();
                embedSetmoreWidget();
            })
            .catch((error) => {
                console.error('Failed to load Setmore script:', error);
                hideLoadingState();
                showSetmoreFallback();
            });
    }

    /**
     * Load Setmore script dynamically
     */
    function loadSetmoreScript() {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.getElementById('setmore_script');
            if (existingScript) {
                existingScript.remove();
            }

            const script = document.createElement('script');
            script.id = 'setmore_script';
            script.src = 'https://assets.setmore.com/integration/static/setmoreIframeLive.js';
            script.async = true;

            let timeoutId = setTimeout(() => {
                script.remove();
                reject(new Error('Script loading timeout'));
            }, BOOKING_CONFIG.scriptTimeout);

            script.onload = () => {
                clearTimeout(timeoutId);
                isScriptLoaded = true;
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timeoutId);
                script.remove();
                
                scriptLoadAttempts++;
                if (scriptLoadAttempts < BOOKING_CONFIG.retryAttempts) {
                    // Retry loading script
                    setTimeout(() => {
                        loadSetmoreScript().then(resolve).catch(reject);
                    }, 2000);
                } else {
                    reject(new Error('Failed to load Setmore script after multiple attempts'));
                }
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Embed Setmore widget
     */
    function embedSetmoreWidget() {
        const setmoreContainer = document.getElementById('setmore-booking-container');
        if (!setmoreContainer) return;

        try {
            // Create Setmore iframe
            const iframe = document.createElement('iframe');
            iframe.src = BOOKING_CONFIG.setmoreUrl;
            iframe.width = '100%';
            iframe.height = '800';
            iframe.frameBorder = '0';
            iframe.style.borderRadius = '8px';
            iframe.title = 'Book Appointment';
            iframe.allow = 'camera; microphone; geolocation';
            
            // Clear loading content
            setmoreContainer.innerHTML = '';
            setmoreContainer.appendChild(iframe);

            // Setup fallback link
            setupSetmoreFallbackLink();

            

        } catch (error) {
            showSetmoreFallback();
        }
    }

    /**
     * Setup Setmore fallback link
     */
    function setupSetmoreFallbackLink() {
        const fallbackLink = document.getElementById('setmore-fallback-link');
        if (fallbackLink) {
            fallbackLink.href = BOOKING_CONFIG.setmoreUrl;
        }
    }

    /**
     * Show Setmore fallback
     */
    function showSetmoreFallback() {
        const setmoreContainer = document.getElementById('setmore-booking-container');
        const fallbackContainer = document.getElementById('booking-fallback');
        
        if (setmoreContainer) {
            setmoreContainer.style.display = 'none';
        }
        
        if (fallbackContainer) {
            fallbackContainer.style.display = 'block';
            setupSetmoreFallbackLink();
        }
    }

    /**
     * Show internal booking form
     */
    function showInternalBookingForm() {
        const setmoreContainer = document.getElementById('setmore-booking-container');
        const internalContainer = document.getElementById('internal-booking-container');
        
        if (setmoreContainer) {
            setmoreContainer.style.display = 'none';
        }
        
        if (internalContainer) {
            internalContainer.style.display = 'block';
            setupInternalBookingForm();
        }
    }

    /**
     * Setup internal booking form
     */
    function setupInternalBookingForm() {
        const bookingForm = document.getElementById('booking-form');
        if (!bookingForm) return;

        // Setup form validation and submission
        bookingForm.addEventListener('submit', handleInternalBookingSubmit);

        // Setup date minimum (today)
        const dateInput = document.getElementById('booking-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
        }
    }

    /**
     * Handle internal booking form submission
     */
    function handleInternalBookingSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const bookingData = Object.fromEntries(formData);
        
        // Show loading state
        const submitBtn = document.getElementById('booking-submit');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        // Simulate booking submission (replace with actual API call)
        setTimeout(() => {
            // Hide loading state
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }

            // Show success message
            if (window.MainApp && window.MainApp.showToast) {
                window.MainApp.showToast('Booking request submitted! We\'ll contact you soon to confirm your appointment.');
            }

            // Log booking data (replace with actual submission)
            console.log('Booking submitted:', bookingData);

            // Reset form
            form.reset();

        }, 2000);
    }

    /**
     * Open Setmore booking (for floating button)
     */
    function openSetmoreBooking() {
        // If we're on booking page and widget is loaded, scroll to it
        if (isBookingPage() && isScriptLoaded) {
            const bookingWidget = document.getElementById('setmore-booking-container');
            if (bookingWidget && bookingWidget.style.display !== 'none') {
                bookingWidget.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }

        // Otherwise, open in new window or redirect to booking page
        if (BOOKING_CONFIG.setmoreUrl && BOOKING_CONFIG.setmoreUrl !== 'https://booking.setmore.com/scheduleappointment/services') {
            window.open(BOOKING_CONFIG.setmoreUrl, '_blank', 'width=800,height=600');
        } else {
            window.location.href = BOOKING_CONFIG.internalRoute;
        }
    }

    /**
     * Open internal booking
     */
    function openInternalBooking() {
        window.location.href = BOOKING_CONFIG.internalRoute;
    }

    /**
     * Show loading state
     */
    function showLoadingState() {
        const loadingElement = document.querySelector('.booking-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    /**
     * Hide loading state
     */
    function hideLoadingState() {
        const loadingElement = document.querySelector('.booking-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * Update booking configuration
     */
    function updateConfig(newConfig) {
        Object.assign(BOOKING_CONFIG, newConfig);
        
        // Re-initialize if we're on the booking page
        if (isBookingPage()) {
            initializeBookingWidget();
        }
    }

    /**
     * Get current booking configuration
     */
    function getConfig() {
        return { ...BOOKING_CONFIG };
    }

    // Export public API
    window.BookingManager = {
        openBooking: handleBookingClick,
        updateConfig,
        getConfig,
        openSetmoreBooking,
        openInternalBooking
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle errors gracefully
    window.addEventListener('error', (e) => {
        if (e.filename && e.filename.includes('setmore')) {
            console.error('Setmore script error:', e.error);
            showSetmoreFallback();
        }
    });

})();
