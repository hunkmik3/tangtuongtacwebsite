// Simple dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Simple dropdown script loaded');
    
    // Initialize service categories
    function initServiceCategories() {
        console.log('Initializing service categories...');
        
        // Category toggle
        const categoryHeaders = document.querySelectorAll('.service-category-header');
        console.log('Found category headers:', categoryHeaders.length);
        
        categoryHeaders.forEach(header => {
            header.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Category header clicked:', this.querySelector('span').textContent);
                
                const category = this.closest('.service-category');
                const submenu = category.querySelector('.service-submenu');
                const toggle = this.querySelector('.category-toggle');
                
                category.classList.toggle('expanded');
                
                if (category.classList.contains('expanded')) {
                    submenu.style.display = 'block';
                    toggle.style.transform = 'rotate(180deg)';
                    console.log('Category expanded');
                } else {
                    submenu.style.display = 'none';
                    toggle.style.transform = 'rotate(0deg)';
                    console.log('Category collapsed');
                }
            });
        });

        // Subcategory toggle
        const subcategoryHeaders = document.querySelectorAll('.service-subcategory-header');
        console.log('Found subcategory headers:', subcategoryHeaders.length);
        
        subcategoryHeaders.forEach(header => {
            header.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Subcategory header clicked:', this.querySelector('span').textContent);
                
                const subcategory = this.closest('.service-subcategory');
                const submenu = subcategory.querySelector('.service-submenu');
                const toggle = this.querySelector('.subcategory-toggle');
                
                subcategory.classList.toggle('active');
                
                if (subcategory.classList.contains('active')) {
                    if (submenu) {
                        submenu.style.display = 'block';
                    }
                    toggle.style.transform = 'rotate(90deg)';
                    console.log('Subcategory expanded');
                } else {
                    if (submenu) {
                        submenu.style.display = 'none';
                    }
                    toggle.style.transform = 'rotate(0deg)';
                    console.log('Subcategory collapsed');
                }
            });
        });

        // Subitem click
        const subitems = document.querySelectorAll('.service-subitem');
        console.log('Found subitems:', subitems.length);
        
        subitems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const serviceName = this.querySelector('span').textContent;
                console.log('Service item clicked:', serviceName);
                
                // Show notification
                showSimpleNotification(`Đã chọn dịch vụ: ${serviceName}`);
            });
        });
    }
    
    // Simple notification function
    function showSimpleNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Initialize
    initServiceCategories();
    
    // Dark mode toggle (simple version)
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', this.checked);
        });
        
        // Load saved preference
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
    }
});
