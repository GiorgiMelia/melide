/**
 * Main JavaScript functionality for the website
 * Handles navigation, mobile menu, sticky header, and global interactions
 */

(function() {
    'use strict';

    // DOM elements
    const header = document.querySelector('.header');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const floatingBookBtn = document.getElementById('floating-book-btn');

    // State
    let isMenuOpen = false;
    let focusableElements = [];
    let firstFocusableElement = null;
    let lastFocusableElement = null;

    /**
     * Initialize all functionality when DOM is loaded
     */
    function init() {
        setupStickyHeader();
        setupMobileMenu();
        setupNavigation();
        setupFloatingBookButton();
        setupKeyboardNavigation();
        setupSmoothScrolling();
        
        // Initialize with animation delay for better UX
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    }

    /**
     * Setup sticky header functionality
     */
    function setupStickyHeader() {
        if (!header) return;

        let lastScrollY = window.scrollY;
        let ticking = false;

        function updateHeader() {
            const scrollY = window.scrollY;
            
            // Add/remove scrolled class based on scroll position
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            lastScrollY = scrollY;
            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }

        // Throttled scroll event
        window.addEventListener('scroll', requestTick, { passive: true });
        
        // Initial check
        updateHeader();
    }

    /**
     * Setup mobile menu functionality
     */
    function setupMobileMenu() {
        if (!mobileMenuBtn || !mobileMenu) return;

        // Toggle mobile menu
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (isMenuOpen && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                closeMobileMenu();
                mobileMenuBtn.focus();
            }
        });

        // Close menu when clicking on links
        const mobileNavLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    /**
     * Toggle mobile menu state
     */
    function toggleMobileMenu() {
        if (isMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    /**
     * Open mobile menu
     */
    function openMobileMenu() {
        isMenuOpen = true;
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileMenu.setAttribute('aria-hidden', 'false');
        
        // Setup focus trap
        setupFocusTrap();
        
        // Focus first link
        setTimeout(() => {
            if (firstFocusableElement) {
                firstFocusableElement.focus();
            }
        }, 100);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close mobile menu
     */
    function closeMobileMenu() {
        isMenuOpen = false;
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    /**
     * Setup focus trap for mobile menu
     */
    function setupFocusTrap() {
        focusableElements = Array.from(mobileMenu.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        )).filter(el => !el.disabled && !el.hidden);

        firstFocusableElement = focusableElements[0];
        lastFocusableElement = focusableElements[focusableElements.length - 1];

        mobileMenu.addEventListener('keydown', handleFocusTrap);
    }

    /**
     * Handle focus trap keyboard navigation
     */
    function handleFocusTrap(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    }

    /**
     * Setup navigation active state
     */
    function setupNavigation() {
        const currentPath = window.location.pathname;
        
        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            
            // Remove existing active classes
            link.classList.remove('active');
            link.removeAttribute('aria-current');
            
            // Check if this is the current page
            if (linkPath === currentPath || 
                (currentPath === '/' && linkPath === '/') ||
                (currentPath !== '/' && linkPath !== '/' && currentPath.includes(linkPath))) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    /**
     * Setup floating book button
     */
    function setupFloatingBookButton() {
        if (!floatingBookBtn) return;

        floatingBookBtn.addEventListener('click', handleFloatingBookClick);

        // Show/hide based on scroll position
        let hideTimeout;
        
        function handleScroll() {
            floatingBookBtn.style.opacity = '1';
            floatingBookBtn.style.transform = 'scale(1)';
            
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                if (window.scrollY > 100) {
                    floatingBookBtn.style.opacity = '0.8';
                    floatingBookBtn.style.transform = 'scale(0.9)';
                }
            }, 2000);
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Initial state
        if (window.scrollY <= 100) {
            floatingBookBtn.style.opacity = '0.8';
        }
    }

    /**
     * Handle floating book button click
     */
    function handleFloatingBookClick(e) {
        e.preventDefault();
        
        // Check if we have booking integration
        if (window.BookingManager && window.BookingManager.openBooking) {
            window.BookingManager.openBooking();
        } else {
            // Fallback to booking page
            window.location.href = '/pages/booking.html';
        }
    }

    /**
     * Setup keyboard navigation improvements
     */
    function setupKeyboardNavigation() {
        // Skip to main content functionality
        const skipLink = document.querySelector('.skip-to-content');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const main = document.getElementById('main');
                if (main) {
                    main.focus();
                    main.scrollIntoView();
                }
            });
        }

        // Improve focus visibility for keyboard users
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    /**
     * Setup smooth scrolling for anchor links
     */
    function setupSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = target.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Focus the target for accessibility
                    setTimeout(() => {
                        target.focus();
                    }, 500);
                }
            });
        });
    }

    /**
     * Utility function to show toast notification
     */
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close notification">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Setup close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            closeToast(toast);
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
            closeToast(toast);
        }, 5000);
    }

    /**
     * Close toast notification
     */
    function closeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    /**
     * Handle errors gracefully
     */
    function handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        if (process.env.NODE_ENV === 'development') {
            showToast(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Debounce utility function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle utility function
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Export utilities for other scripts to use
    window.MainApp = {
        showToast,
        debounce,
        throttle,
        handleError
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is now hidden
            if (isMenuOpen) {
                closeMobileMenu();
            }
        }
    });

})();
