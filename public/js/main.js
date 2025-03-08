// Main JavaScript for Portfolio Website with Enhanced Interactive Effects

document.addEventListener('DOMContentLoaded', function() {
    
    // Add animation to elements on page load
    const animateElements = document.querySelectorAll('.container, h1, .card, .btn');
    animateElements.forEach((element, index) => {
        // Add animation with staggered delay
        element.style.opacity = '0';
        element.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
    });
    
    // Portfolio page - Project filtering with enhanced animations
    const filterButtons = document.querySelectorAll('[data-filter]');
    const projectItems = document.querySelectorAll('.project-item');
    
    if (filterButtons.length > 0 && projectItems.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button with pulse animation
                this.classList.add('active');
                this.classList.add('pulse');
                setTimeout(() => {
                    this.classList.remove('pulse');
                }, 1000);
                
                const filterValue = this.getAttribute('data-filter');
                
                // Show/hide projects based on filter with enhanced animation
                projectItems.forEach(item => {
                    // Store the original display value if not already stored
                    if (!item.dataset.originalDisplay) {
                        item.dataset.originalDisplay = window.getComputedStyle(item).display;
                    }
                    
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        // Reset opacity first
                        item.style.opacity = '0';
                        // Make sure display is set before animating in
                        item.style.display = item.dataset.originalDisplay || 'block';
                        
                        // Add fade-in animation after a small delay to ensure display is set
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transition = 'opacity 0.3s ease-in';
                        }, 10);
                    } else {
                        // Fade out animation before hiding
                        item.style.opacity = '0';
                        item.style.transition = 'opacity 0.3s ease-out';
                        
                        // Hide the element after the transition completes
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
    
    // Interactive button effects
    const allButtons = document.querySelectorAll('.btn');
    allButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.classList.add('pulse');
        });
        
        btn.addEventListener('mouseleave', function() {
            this.classList.remove('pulse');
        });
    });
    
    // Card hover effects
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const cardImage = this.querySelector('.card-img-top');
            if (cardImage) {
                cardImage.style.transform = 'scale(1.05)';
                cardImage.style.transition = 'transform 0.5s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const cardImage = this.querySelector('.card-img-top');
            if (cardImage) {
                cardImage.style.transform = 'scale(1)';
            }
        });
    });
    
    // File upload validation
    const fileInput = document.getElementById('file');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            const fileSize = this.files[0]?.size || 0;
            
            if (fileSize > maxSize) {
                alert('File size exceeds the maximum limit of 10MB. Please select a smaller file.');
                this.value = ''; // Clear the input
            }
        });
    }
    
    // Add visual feedback for document uploads
    const uploadForm = document.querySelector('form[action="/upload"]');
    if (uploadForm) {
        const fileInput = uploadForm.querySelector('input[type="file"]');
        const fileLabel = document.createElement('div');
        fileLabel.className = 'selected-file-name mt-2 text-primary';
        fileLabel.style.display = 'none';
        
        if (fileInput) {
            fileInput.parentNode.appendChild(fileLabel);
            
            fileInput.addEventListener('change', function() {
                if (this.files[0]) {
                    fileLabel.textContent = 'Selected: ' + this.files[0].name;
                    fileLabel.style.display = 'block';
                } else {
                    fileLabel.style.display = 'none';
                }
            });
        }
        
        uploadForm.addEventListener('submit', function(e) {
            // Form validation is handled by HTML5 required attributes
            
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...';
                submitButton.disabled = true;
            }
        });
    }
    
    // Add tooltips for all elements with data-bs-toggle="tooltip"
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    if (tooltipTriggerList.length > 0) {
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // IMMEDIATELY remove any modal backdrops that might be present
    function purgeBackdrops() {
        // Remove all modal backdrops
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.remove();
        });
        
        // Also reset body styles that Bootstrap adds
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
    
    // Run immediately on page load
    purgeBackdrops();
    
    // Also set an interval to check for and remove backdrops
    setInterval(purgeBackdrops, 500);
    
    // Handle document deletion with styled modal instead of browser confirm dialog
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function(event) {
            // Get document details from data attributes
            const docId = this.getAttribute('data-doc-id');
            const docTitle = this.getAttribute('data-doc-title');
            
            // Set the document title in the modal
            const titleElement = document.getElementById('deleteDocumentTitle');
            if (titleElement) {
                titleElement.textContent = docTitle;
            }
            
            // Set the form action to the correct delete endpoint
            const deleteForm = document.getElementById('deleteForm');
            if (deleteForm) {
                deleteForm.action = `/delete/${docId}`;
            }
            
            // Show the deletion confirmation modal
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
            deleteModal.show();
            
            // Make sure we don't have any backdrop issues
            setTimeout(purgeBackdrops, 100);
        });
    });
    
    // Initialize the modals manually but prevent backdrop issues
    document.querySelectorAll('.modal').forEach(modalElement => {
        // Initialize the modal
        new bootstrap.Modal(modalElement, {
            backdrop: false,
            keyboard: false
        });
    });
    
    // Add animation to elements when they come into view
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 50) {
                element.classList.add('fade-in');
            }
        });
    };
    
    // Add animate-on-scroll class to various elements
    const elementsToAnimate = document.querySelectorAll('.card, .project-item, h2, h3');
    elementsToAnimate.forEach(element => {
        element.classList.add('animate-on-scroll');
    });
    
    // Run animation on load and scroll
    if (document.querySelectorAll('.animate-on-scroll').length > 0) {
        window.addEventListener('scroll', animateOnScroll);
        animateOnScroll(); // Run once on load
    }
    
    // Search form validation
    const searchForm = document.querySelector('form[action="/documents"]');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            const searchInput = this.querySelector('input[name="search"]');
            if (searchInput.value.trim() === '') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
    
    // Add keyframe animations for headings
    const addTextAnimation = () => {
        const headings = document.querySelectorAll('.display-4, h1');
        headings.forEach(heading => {
            // Add a subtle color gradient animation to headings
            heading.style.backgroundImage = 'linear-gradient(90deg, #6610f2, #3a86ff)';
            heading.style.backgroundSize = '200% auto';
            heading.style.color = 'transparent';
            heading.style.backgroundClip = 'text';
            heading.style.WebkitBackgroundClip = 'text';
            heading.style.animation = 'gradientFlow 3s ease infinite';
        });
        
        // Add the keyframe animation to the style sheet
        if (!document.getElementById('gradient-animation')) {
            const style = document.createElement('style');
            style.id = 'gradient-animation';
            style.innerHTML = `
                @keyframes gradientFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    addTextAnimation();
    
    // Category filter
    document.querySelectorAll('.category-filter').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = this.href;
        });
    });
    
    // Handle upload document button visibility - only show when user is logged in as admin
    const uploadDocButton = document.querySelector('a[href="/upload-document"]');
    // Check for upload button on the documents page
    if (uploadDocButton) {
        // Check if user is authenticated by looking for the admin dashboard link
        // The server only renders this element for authenticated users
        const adminDashboardLink = document.querySelector('.nav-link.dashboard');
        const isAuthenticated = !!adminDashboardLink;
        if (!isAuthenticated) {
            uploadDocButton.style.display = 'none';
        }
    }
    
    // Live document search functionality
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
        // Keep track of the current timeout
        let searchTimeout;
        
        // Add event listener for real-time search
        searchInput.addEventListener('input', function() {
            // Clear any existing timeout
            clearTimeout(searchTimeout);
            
            // Set a new timeout to avoid too many requests while typing
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim().toLowerCase();
                const currentCategory = document.querySelector('input[name="category"]').value;
                
                // If search box is empty, just load all documents for the current category
                if (searchTerm === '') {
                    window.location.href = `/documents?category=${currentCategory}`;
                    return;
                }
                
                // Redirect to search results with the current term
                window.location.href = `/documents?search=${encodeURIComponent(searchTerm)}&category=${currentCategory}`;
            }, 500); // 500ms delay for better performance
        });
        
        // Clear button functionality
        const searchForm = searchInput.closest('form');
        if (searchForm) {
            const clearButton = document.createElement('button');
            clearButton.type = 'button';
            clearButton.className = 'btn btn-sm btn-outline-secondary clear-search';
            clearButton.innerHTML = '<i class="fas fa-times"></i>';
            clearButton.title = 'Clear search';
            clearButton.style.position = 'absolute';
            clearButton.style.right = '70px'; // Position to the left of the search button
            clearButton.style.top = '0';
            clearButton.style.height = '100%';
            clearButton.style.display = searchInput.value ? 'block' : 'none';
            
            searchInput.parentNode.style.position = 'relative';
            searchInput.parentNode.insertBefore(clearButton, searchInput.nextSibling);
            
            clearButton.addEventListener('click', function() {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                this.style.display = 'none';
            });
            
            // Show/hide clear button based on search input
            searchInput.addEventListener('input', function() {
                clearButton.style.display = this.value ? 'block' : 'none';
            });
        }
    }
    
    // Update the URL without reloading when category is changed
    const categorySelect = document.querySelector('select[name="category"]');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const searchInput = document.querySelector('input[name="search"]');
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            
            window.location.href = `/documents?category=${this.value}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
        });
    }
});
