// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeNavigation();
    initializeSmoothScrolling();
    initializeAnimations();
    initializeContactForm();
    initializeScrollEffects();
});

// Navigation Functionality
function initializeNavigation() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Active link highlighting
    window.addEventListener('scroll', updateActiveLink);
}

// Update active navigation link based on scroll position
function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            current = sectionId;
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Smooth Scrolling for Navigation Links
function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize Scroll Animations
function initializeAnimations() {
    // Create intersection observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Add animation classes based on element type
                if (element.classList.contains('animate__animated')) {
                    // Element already has animation class, just trigger it
                    element.style.visibility = 'visible';
                } else {
                    // Add appropriate animation class
                    element.classList.add('animate__animated');
                    
                    if (element.classList.contains('section-header')) {
                        element.classList.add('animate__fadeInUp');
                    } else if (element.classList.contains('blog-card')) {
                        element.classList.add('animate__fadeInUp');
                    } else if (element.classList.contains('about-text')) {
                        element.classList.add('animate__fadeInLeft');
                    } else if (element.classList.contains('about-image')) {
                        element.classList.add('animate__fadeInRight');
                    } else if (element.classList.contains('contact-info')) {
                        element.classList.add('animate__fadeInLeft');
                    } else if (element.classList.contains('contact-form')) {
                        element.classList.add('animate__fadeInRight');
                    } else {
                        element.classList.add('animate__fadeInUp');
                    }
                }
                
                // Unobserve the element after animation
                observer.unobserve(element);
            }
        });
    }, observerOptions);

    // Observe all animatable elements
    const animatableElements = document.querySelectorAll(
        '.section-header, .blog-card, .about-text, .about-image, .contact-info, .contact-form'
    );
    
    animatableElements.forEach(element => {
        observer.observe(element);
    });
}

// Contact Form Handling
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Basic validation
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all fields.', 'error');
                return;
            }
            
            // Email validation
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Simulate form submission
            showNotification('Thank you for your message! I\'ll get back to you soon.', 'success');
            
            // Reset form
            this.reset();
        });
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
    });
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = 'hsl(120, 50%, 50%)';
    } else if (type === 'error') {
        notification.style.backgroundColor = 'hsl(0, 50%, 50%)';
    } else {
        notification.style.backgroundColor = 'hsl(210, 100%, 45%)';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Scroll Effects
function initializeScrollEffects() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', function() {
        // Navbar background opacity on scroll
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'hsla(0, 0%, 100%, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.backgroundColor = 'hsl(0, 0%, 100%)';
            navbar.style.backdropFilter = 'none';
        }
    });
}

// Utility Functions

// Debounce function for scroll events
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

// Throttle function for scroll events
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

// Add hover effects to cards
document.addEventListener('DOMContentLoaded', function() {
    const blogCards = document.querySelectorAll('.blog-card');
    
    blogCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        const mobileMenu = document.getElementById('mobile-menu');
        const navMenu = document.getElementById('nav-menu');
        
        if (navMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
});

// Add loading animation for images (if any are added later)
function addImageLoadingEffects() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
    });
}

// Performance optimization: Lazy loading for animations
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (reducedMotion.matches) {
    // Disable animations for users who prefer reduced motion
    const animatedElements = document.querySelectorAll('.animate__animated');
    animatedElements.forEach(element => {
        element.classList.remove('animate__animated');
    });
}

// Add click handlers for social media links (placeholder functionality)
document.addEventListener('DOMContentLoaded', function() {
    const socialLinks = document.querySelectorAll('.social-link');
    
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the icon class to determine which social media platform
            const icon = this.querySelector('i');
            let platform = 'social media';
            
            if (icon.classList.contains('fa-twitter')) {
                platform = 'Twitter';
            } else if (icon.classList.contains('fa-linkedin-in')) {
                platform = 'LinkedIn';
            } else if (icon.classList.contains('fa-github')) {
                platform = 'GitHub';
            } else if (icon.classList.contains('fa-instagram')) {
                platform = 'Instagram';
            }
            
            showNotification(`${platform} link clicked! (Add your actual profile URL)`, 'info');
        });
    });
});

// Blog post link handlers
document.addEventListener('DOMContentLoaded', function() {
    const blogLinks = document.querySelectorAll('.blog-link');
    
    blogLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const blogTitle = this.closest('.blog-card').querySelector('.blog-title').textContent;
            showNotification(`Opening "${blogTitle}" - Add your blog post URL!`, 'info');
        });
    });
});

// Back to top functionality (can be added if needed)
function addBackToTopButton() {
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.className = 'back-to-top';
    backToTopButton.setAttribute('aria-label', 'Back to top');
    
    Object.assign(backToTopButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: 'hsl(210, 100%, 45%)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
        display: 'none',
        zIndex: '1000',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
    });
    
    document.body.appendChild(backToTopButton);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    // Scroll to top on click
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effects
    backToTopButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.backgroundColor = 'hsl(210, 75%, 35%)';
    });
    
    backToTopButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.backgroundColor = 'hsl(210, 100%, 45%)';
    });
}

// Initialize back to top button
document.addEventListener('DOMContentLoaded', addBackToTopButton);
