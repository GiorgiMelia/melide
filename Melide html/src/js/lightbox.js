/**
 * Lightbox functionality for gallery images
 * Supports keyboard navigation, focus management, and accessibility
 */

(function() {
    'use strict';

    // DOM elements
    let lightbox = null;
    let lightboxImage = null;
    let lightboxTitle = null;
    let lightboxDescription = null;
    let lightboxCounter = null;
    let lightboxClose = null;
    let lightboxPrev = null;
    let lightboxNext = null;
    let lightboxOverlay = null;

    // State
    let currentIndex = 0;
    let galleryItems = [];
    let isOpen = false;
    let focusedElementBeforeModal = null;

    /**
     * Initialize lightbox functionality
     */
    function init() {
        try {
            setupLightbox();
            setupGalleryItems();
            setupEventListeners();
        } catch (error) {
            console.error('Error initializing lightbox:', error);
        }
    }

    /**
     * Setup lightbox DOM elements
     */
    function setupLightbox() {
        lightbox = document.getElementById('lightbox');
        if (!lightbox) return;

        lightboxImage = document.getElementById('lightbox-image');
        lightboxTitle = document.getElementById('lightbox-title');
        lightboxDescription = document.getElementById('lightbox-description');
        lightboxCounter = document.getElementById('lightbox-counter');
        lightboxClose = document.getElementById('lightbox-close');
        lightboxPrev = document.getElementById('lightbox-prev');
        lightboxNext = document.getElementById('lightbox-next');
        lightboxOverlay = lightbox.querySelector('.lightbox-overlay');
    }

    /**
     * Setup gallery items
     */
    function setupGalleryItems() {
        const galleryContainer = document.querySelector('.gallery-grid');
        if (!galleryContainer) return;

        galleryItems = Array.from(galleryContainer.querySelectorAll('.gallery-item'));
        
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => openLightbox(index));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(index);
                }
            });
        });
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        if (!lightbox) return;

        // Close button
        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeLightbox);
        }

        // Navigation buttons
        if (lightboxPrev) {
            lightboxPrev.addEventListener('click', showPreviousImage);
        }

        if (lightboxNext) {
            lightboxNext.addEventListener('click', showNextImage);
        }

        // Overlay click to close
        if (lightboxOverlay) {
            lightboxOverlay.addEventListener('click', closeLightbox);
        }

        // Keyboard navigation
        document.addEventListener('keydown', handleKeydown);

        // Prevent body scroll when lightbox is open
        lightbox.addEventListener('wheel', (e) => {
            if (isOpen) {
                e.preventDefault();
            }
        }, { passive: false });

        // Handle image load errors
        if (lightboxImage) {
            lightboxImage.addEventListener('error', handleImageError);
        }
    }

    /**
     * Open lightbox with specific image
     */
    function openLightbox(index) {
        if (!lightbox || !galleryItems.length || index < 0 || index >= galleryItems.length) {
            return;
        }

        // Store currently focused element
        focusedElementBeforeModal = document.activeElement;

        currentIndex = index;
        isOpen = true;

        // Show lightbox
        lightbox.setAttribute('aria-hidden', 'false');
        lightbox.style.display = 'flex';

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Load image with animation
        setTimeout(() => {
            loadCurrentImage();
            updateNavigation();
            updateCounter();
            
            // Focus the close button for accessibility
            if (lightboxClose) {
                lightboxClose.focus();
            }
        }, 50);

        // Announce to screen readers
        announceToScreenReader('Gallery image opened');
    }

    /**
     * Close lightbox
     */
    function closeLightbox() {
        if (!lightbox || !isOpen) return;

        isOpen = false;

        // Hide lightbox
        lightbox.setAttribute('aria-hidden', 'true');
        lightbox.style.display = 'none';

        // Restore body scroll
        document.body.style.overflow = '';

        // Restore focus
        if (focusedElementBeforeModal) {
            focusedElementBeforeModal.focus();
            focusedElementBeforeModal = null;
        }

        // Clear image src to prevent flash when reopening
        if (lightboxImage) {
            lightboxImage.src = '';
            lightboxImage.alt = '';
        }

        // Announce to screen readers
        announceToScreenReader('Gallery image closed');
    }

    /**
     * Load current image
     */
    function loadCurrentImage() {
        if (!lightboxImage || !galleryItems[currentIndex]) return;

        const currentItem = galleryItems[currentIndex];
        const img = currentItem.querySelector('img');
        const overlay = currentItem.querySelector('.gallery-overlay');

        if (!img) return;

        // Get full resolution image URL from data attribute or use src
        const fullSrc = img.getAttribute('data-full') || img.src;
        const alt = img.alt || '';

        // Show loading state
        showLoadingState();

        // Create a new image to preload
        const newImage = new Image();
        
        newImage.onload = () => {
            hideLoadingState();
            lightboxImage.src = fullSrc;
            lightboxImage.alt = alt;
            
            // Update title and description
            updateImageInfo(overlay);
        };

        newImage.onerror = () => {
            hideLoadingState();
            handleImageError();
        };

        newImage.src = fullSrc;
    }

    /**
     * Update image information (title and description)
     */
    function updateImageInfo(overlay) {
        let title = '';
        let description = '';

        if (overlay) {
            const titleElement = overlay.querySelector('.gallery-title');
            const descElement = overlay.querySelector('.gallery-description');
            
            title = titleElement ? titleElement.textContent : '';
            description = descElement ? descElement.textContent : '';
        }

        // Fallback to image alt text if no title
        if (!title && lightboxImage) {
            title = lightboxImage.alt || `Image ${currentIndex + 1}`;
        }

        if (lightboxTitle) {
            lightboxTitle.textContent = title;
        }

        if (lightboxDescription) {
            lightboxDescription.textContent = description;
            lightboxDescription.style.display = description ? 'block' : 'none';
        }
    }

    /**
     * Show previous image
     */
    function showPreviousImage() {
        if (!isOpen || galleryItems.length <= 1) return;

        currentIndex = currentIndex > 0 ? currentIndex - 1 : galleryItems.length - 1;
        loadCurrentImage();
        updateNavigation();
        updateCounter();

        // Announce to screen readers
        announceToScreenReader(`Previous image: ${currentIndex + 1} of ${galleryItems.length}`);
    }

    /**
     * Show next image
     */
    function showNextImage() {
        if (!isOpen || galleryItems.length <= 1) return;

        currentIndex = currentIndex < galleryItems.length - 1 ? currentIndex + 1 : 0;
        loadCurrentImage();
        updateNavigation();
        updateCounter();

        // Announce to screen readers
        announceToScreenReader(`Next image: ${currentIndex + 1} of ${galleryItems.length}`);
    }

    /**
     * Update navigation button states
     */
    function updateNavigation() {
        if (galleryItems.length <= 1) {
            // Hide navigation buttons if only one image
            if (lightboxPrev) lightboxPrev.style.display = 'none';
            if (lightboxNext) lightboxNext.style.display = 'none';
        } else {
            // Show navigation buttons
            if (lightboxPrev) lightboxPrev.style.display = 'flex';
            if (lightboxNext) lightboxNext.style.display = 'flex';
        }
    }

    /**
     * Update counter
     */
    function updateCounter() {
        if (!lightboxCounter) return;

        if (galleryItems.length > 1) {
            lightboxCounter.textContent = `${currentIndex + 1} of ${galleryItems.length}`;
            lightboxCounter.style.display = 'block';
        } else {
            lightboxCounter.style.display = 'none';
        }
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeydown(e) {
        if (!isOpen) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                closeLightbox();
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                showPreviousImage();
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                showNextImage();
                break;
                
            case 'Home':
                e.preventDefault();
                if (galleryItems.length > 1) {
                    currentIndex = 0;
                    loadCurrentImage();
                    updateNavigation();
                    updateCounter();
                }
                break;
                
            case 'End':
                e.preventDefault();
                if (galleryItems.length > 1) {
                    currentIndex = galleryItems.length - 1;
                    loadCurrentImage();
                    updateNavigation();
                    updateCounter();
                }
                break;
                
            case 'Tab':
                // Trap focus within lightbox
                handleFocusTrap(e);
                break;
        }
    }

    /**
     * Handle focus trap within lightbox
     */
    function handleFocusTrap(e) {
        const focusableElements = lightbox.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
            }
        }
    }

    /**
     * Show loading state
     */
    function showLoadingState() {
        if (lightboxImage) {
            lightboxImage.style.opacity = '0.5';
        }
    }

    /**
     * Hide loading state
     */
    function hideLoadingState() {
        if (lightboxImage) {
            lightboxImage.style.opacity = '1';
        }
    }

    /**
     * Handle image loading errors
     */
    function handleImageError() {
        if (lightboxImage) {
            lightboxImage.alt = 'Failed to load image';
        }
        
        if (lightboxTitle) {
            lightboxTitle.textContent = 'Image unavailable';
        }
        
        if (lightboxDescription) {
            lightboxDescription.textContent = 'Sorry, this image could not be loaded.';
            lightboxDescription.style.display = 'block';
        }

        if (window.MainApp && window.MainApp.showToast) {
            window.MainApp.showToast('Failed to load image', 'error');
        }
    }

    /**
     * Announce message to screen readers
     */
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.textContent = message;
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.classList.add('sr-only');
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Preload adjacent images for better performance
     */
    function preloadAdjacentImages() {
        if (!isOpen || galleryItems.length <= 1) return;

        const preloadIndexes = [];
        
        // Previous image
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : galleryItems.length - 1;
        preloadIndexes.push(prevIndex);
        
        // Next image
        const nextIndex = currentIndex < galleryItems.length - 1 ? currentIndex + 1 : 0;
        preloadIndexes.push(nextIndex);

        preloadIndexes.forEach(index => {
            const item = galleryItems[index];
            if (!item) return;
            
            const img = item.querySelector('img');
            if (!img) return;
            
            const fullSrc = img.getAttribute('data-full') || img.src;
            const preloadImg = new Image();
            preloadImg.src = fullSrc;
        });
    }

    /**
     * Refresh gallery items (useful if gallery is dynamically updated)
     */
    function refresh() {
        setupGalleryItems();
    }

    /**
     * Get current state
     */
    function getState() {
        return {
            isOpen,
            currentIndex,
            totalImages: galleryItems.length
        };
    }

    // Export public API
    window.LightboxManager = {
        refresh,
        getState,
        openLightbox,
        closeLightbox
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isOpen) {
            closeLightbox();
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (isOpen) {
            // Adjust lightbox layout if needed
            updateNavigation();
        }
    });

})();
