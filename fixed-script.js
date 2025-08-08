// Fixed version of script.js - Main functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fixed script loaded');
    
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Load saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // Toggle dark mode
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }

    // Initialize service categories
    initializeServiceCategories();
    
    // Initialize other functionality
    initializeOtherFeatures();
});

// Service Category Toggle Functionality
function initializeServiceCategories() {
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
            showNotification(`Đã chọn dịch vụ: ${serviceName}`, 'info');
        });
    });
    
    console.log('Service categories initialization complete');
}

// Initialize other features
function initializeOtherFeatures() {
    // Navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                window.location.href = 'login.html';
            }
        });
    }

    // Support items click
    const supportItems = document.querySelectorAll('.support-item');
    supportItems.forEach(item => {
        item.addEventListener('click', function() {
            const service = this.querySelector('span').textContent;
            showNotification(`Đang kết nối đến ${service}...`, 'info');
        });
    });

    // FAQ items click
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', function() {
            const question = this.querySelector('span').textContent;
            showNotification(`Câu hỏi: ${question}`, 'info');
        });
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 10px;
                padding: 15px 20px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 300px;
                transform: translateX(100%);
                animation: slideIn 0.3s ease forwards;
            }
            
            .notification-success {
                border-left: 4px solid #28a745;
            }
            
            .notification-error {
                border-left: 4px solid #dc3545;
            }
            
            .notification-warning {
                border-left: 4px solid #ffc107;
            }
            
            .notification-info {
                border-left: 4px solid #667eea;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            
            .notification-content i {
                font-size: 18px;
            }
            
            .notification-success .notification-content i {
                color: #28a745;
            }
            
            .notification-error .notification-content i {
                color: #dc3545;
            }
            
            .notification-warning .notification-content i {
                color: #ffc107;
            }
            
            .notification-info .notification-content i {
                color: #667eea;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #999;
            }
            
            .notification.fade-out {
                animation: slideOut 0.3s ease forwards;
            }
            
            @keyframes slideIn {
                to { transform: translateX(0); }
            }
            
            @keyframes slideOut {
                to { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}
