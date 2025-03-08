// Script specifically for handling document uploads
document.addEventListener('DOMContentLoaded', function() {
    // Override category select behavior to prevent navigation
    const categorySelect = document.getElementById('uploadCategory');
    
    if (categorySelect) {
        // Disable click event completely - this is a more aggressive approach
        categorySelect.addEventListener('click', function(e) {
            // Allow the dropdown to open but prevent navigation
            e.stopPropagation();
        });
        
        // Override the change event to prevent navigation but still allow value change
        categorySelect.addEventListener('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Log for debugging
            console.log('Category selected: ' + this.value);
        });
        
        // Make extra sure no other handlers are adding navigation
        const categoryOptions = categorySelect.querySelectorAll('option');
        categoryOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
            });
        });
    }
    
    // File upload preview
    const fileInput = document.getElementById('document-file');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // Validate file size (max 10MB)
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    alert('File size exceeds the maximum limit of 10MB. Please select a smaller file.');
                    this.value = ''; // Clear the input
                    filePreview.classList.add('d-none');
                    return;
                }
                
                // Show file preview
                fileName.textContent = file.name;
                filePreview.classList.remove('d-none');
            } else {
                filePreview.classList.add('d-none');
            }
        });
    }
    
    // Form submission
    const uploadForm = document.getElementById('uploadForm');
    const uploadButton = document.getElementById('uploadButton');
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', function() {
            // Show loading state
            if (uploadButton) {
                uploadButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...';
                uploadButton.disabled = true;
            }
        });
    }
});
