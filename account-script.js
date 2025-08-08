document.addEventListener('DOMContentLoaded', function() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    });

    // Tab Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items and tab contents
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Show corresponding tab content
            const targetTab = this.getAttribute('data-tab');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Password Visibility Toggle
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Form Validation and Submission
    const saveProfileBtn = document.getElementById('saveProfile');
    const profileForm = document.querySelector('.profile-form');
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function() {
            // Simulate form validation
            const inputs = profileForm.querySelectorAll('input[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#f44336';
                    setTimeout(() => {
                        input.style.borderColor = '#e1e5e9';
                    }, 3000);
                }
            });
            
            if (isValid) {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
                this.disabled = true;
                
                setTimeout(() => {
                    showNotification('Thông tin đã được cập nhật thành công!', 'success');
                    this.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
                    this.disabled = false;
                }, 2000);
            } else {
                showNotification('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            }
        });
    }

    // Password Change Form
    const passwordForm = document.querySelector('.password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('Mật khẩu xác nhận không khớp!', 'error');
                return;
            }
            
            if (newPassword.length < 8) {
                showNotification('Mật khẩu phải có ít nhất 8 ký tự!', 'error');
                return;
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                showNotification('Mật khẩu đã được thay đổi thành công!', 'success');
                this.reset();
                submitBtn.innerHTML = '<i class="fas fa-key"></i> Đổi mật khẩu';
                submitBtn.disabled = false;
            }, 2000);
        });
    }

    // Two Factor Authentication Toggle
    const twoFactorToggle = document.getElementById('twoFactorToggle');
    if (twoFactorToggle) {
        twoFactorToggle.addEventListener('change', function() {
            if (this.checked) {
                showNotification('Xác thực hai lớp đã được bật!', 'success');
            } else {
                showNotification('Xác thực hai lớp đã được tắt!', 'warning');
            }
        });
    }

    // Notification Settings
    const notificationToggles = document.querySelectorAll('.notification-card .toggle-switch input');
    notificationToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const cardHeader = this.closest('.card-header').querySelector('h3').textContent;
            const status = this.checked ? 'bật' : 'tắt';
            showNotification(`${cardHeader} đã được ${status}!`, 'info');
        });
    });

    // Device Management
    const deviceRemoveBtns = document.querySelectorAll('.device-item .btn-danger');
    deviceRemoveBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const deviceItem = this.closest('.device-item');
            const deviceName = deviceItem.querySelector('strong').textContent;
            
            if (confirm(`Bạn có chắc chắn muốn xóa thiết bị "${deviceName}" khỏi danh sách đăng nhập?`)) {
                deviceItem.style.opacity = '0.5';
                deviceItem.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    deviceItem.remove();
                    showNotification('Thiết bị đã được xóa khỏi danh sách!', 'success');
                }, 300);
            }
        });
    });

    // API Key Management
    const generateApiKeyBtn = document.getElementById('generateApiKey');
    if (generateApiKeyBtn) {
        generateApiKeyBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';
            this.disabled = true;
            
            setTimeout(() => {
                const newApiKey = 'sk_live_' + Math.random().toString(36).substr(2, 15);
                const apiKeyList = document.querySelector('.api-key-list');
                
                const newApiKeyItem = document.createElement('div');
                newApiKeyItem.className = 'api-key-item';
                newApiKeyItem.innerHTML = `
                    <div class="key-info">
                        <h4>API Key mới</h4>
                        <div class="key-value">
                            <input type="text" value="${newApiKey}" readonly>
                            <button class="copy-btn" data-clipboard-text="${newApiKey}">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <p>Tạo ngày: ${new Date().toLocaleDateString('vi-VN')} | Sử dụng: 0 lần</p>
                    </div>
                    <div class="key-actions">
                        <button class="btn btn-secondary btn-sm">
                            <i class="fas fa-eye"></i>
                            Xem logs
                        </button>
                        <button class="btn btn-danger btn-sm">
                            <i class="fas fa-trash"></i>
                            Xóa
                        </button>
                    </div>
                `;
                
                apiKeyList.appendChild(newApiKeyItem);
                showNotification('API Key mới đã được tạo thành công!', 'success');
                this.innerHTML = '<i class="fas fa-plus"></i> Tạo API Key mới';
                this.disabled = false;
                
                // Add event listeners to new buttons
                const newCopyBtn = newApiKeyItem.querySelector('.copy-btn');
                const newDeleteBtn = newApiKeyItem.querySelector('.btn-danger');
                
                newCopyBtn.addEventListener('click', function() {
                    copyToClipboard(this.getAttribute('data-clipboard-text'));
                });
                
                newDeleteBtn.addEventListener('click', function() {
                    if (confirm('Bạn có chắc chắn muốn xóa API Key này?')) {
                        newApiKeyItem.remove();
                        showNotification('API Key đã được xóa!', 'success');
                    }
                });
            }, 1500);
        });
    }

    // Copy to Clipboard Function
    const copyBtns = document.querySelectorAll('.copy-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-clipboard-text');
            copyToClipboard(textToCopy);
        });
    });

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Đã sao chép vào clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Đã sao chép vào clipboard!', 'success');
        });
    }

    // Activity and Transaction Filters
    const filterSelects = document.querySelectorAll('.filter-select');
    const dateFilters = document.querySelectorAll('.date-filter');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            // Simulate filtering
            showNotification(`Đã lọc theo: ${this.value}`, 'info');
        });
    });
    
    dateFilters.forEach(dateFilter => {
        dateFilter.addEventListener('change', function() {
            // Simulate date filtering
            showNotification(`Đã lọc theo ngày: ${this.value}`, 'info');
        });
    });

    // Logout Button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                showNotification('Đang đăng xuất...', 'info');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        });
    }

    // Floating Chat Icons
    const chatIcons = document.querySelectorAll('.chat-icon');
    chatIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const iconType = this.querySelector('i').classList.contains('fa-comments') ? 'chat' : 'support';
            showNotification(`Đang mở ${iconType === 'chat' ? 'chat' : 'hỗ trợ'}...`, 'info');
        });
    });

    // Notification System
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
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

    function getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            error: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            warning: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            info: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
        };
        return colors[type] || colors.info;
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            margin-left: auto;
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // Keyboard Shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="search"]');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to close modals or go back
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal.active');
            if (activeModals.length > 0) {
                activeModals.forEach(modal => {
                    modal.classList.remove('active');
                });
            } else {
                // Go back to dashboard
                window.location.href = 'index.html';
            }
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Form field animations
    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });

    // Loading states for buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled && !this.classList.contains('loading')) {
                this.classList.add('loading');
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 2000);
            }
        });
    });

    // Initialize tooltips for better UX
    const tooltipElements = document.querySelectorAll('[title]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('title');
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 1000;
                pointer-events: none;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
            
            this.addEventListener('mouseleave', () => {
                tooltip.remove();
            }, { once: true });
        });
    });

    console.log('Account management page loaded successfully!');
});
