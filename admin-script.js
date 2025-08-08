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

    // Select All Checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    const userCheckboxes = document.querySelectorAll('.users-table tbody input[type="checkbox"]');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            userCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }

    // Individual checkbox change
    userCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = Array.from(userCheckboxes).every(cb => cb.checked);
            const anyChecked = Array.from(userCheckboxes).some(cb => cb.checked);
            
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = allChecked;
                selectAllCheckbox.indeterminate = anyChecked && !allChecked;
            }
        });
    });

    // Search Functionality
    const searchInputs = document.querySelectorAll('.search-box input');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const table = this.closest('.tab-content').querySelector('table');
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            }
        });
    });

    // Filter Functionality
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            const filterValue = this.value;
            const table = this.closest('.tab-content').querySelector('table');
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const statusCell = row.querySelector('.status, .type');
                    if (statusCell) {
                        const status = statusCell.textContent.trim();
                        row.style.display = filterValue === 'Tất cả trạng thái' || 
                                          filterValue === 'Tất cả loại' || 
                                          status === filterValue ? '' : 'none';
                    }
                });
            }
        });
    });

    // Date Filter
    const dateFilters = document.querySelectorAll('.date-filter');
    dateFilters.forEach(dateFilter => {
        dateFilter.addEventListener('change', function() {
            const selectedDate = this.value;
            showNotification(`Đã lọc theo ngày: ${selectedDate}`, 'info');
        });
    });

    // Action Buttons
    const actionButtons = document.querySelectorAll('.action-buttons .btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.title || this.textContent.trim();
            const row = this.closest('tr');
            
            if (action.includes('Xem chi tiết')) {
                showNotification('Đang mở chi tiết...', 'info');
            } else if (action.includes('Chỉnh sửa')) {
                showNotification('Đang mở form chỉnh sửa...', 'info');
            } else if (action.includes('Khóa')) {
                if (confirm('Bạn có chắc chắn muốn khóa người dùng này?')) {
                    row.style.opacity = '0.5';
                    showNotification('Người dùng đã được khóa!', 'success');
                }
            } else if (action.includes('Xác thực')) {
                if (confirm('Bạn có chắc chắn muốn xác thực người dùng này?')) {
                    const statusCell = row.querySelector('.status');
                    statusCell.textContent = 'Hoạt động';
                    statusCell.className = 'status active';
                    showNotification('Người dùng đã được xác thực!', 'success');
                }
            } else if (action.includes('Mở khóa')) {
                if (confirm('Bạn có chắc chắn muốn mở khóa người dùng này?')) {
                    const statusCell = row.querySelector('.status');
                    statusCell.textContent = 'Hoạt động';
                    statusCell.className = 'status active';
                    showNotification('Người dùng đã được mở khóa!', 'success');
                }
            } else if (action.includes('Hoàn thành')) {
                if (confirm('Bạn có chắc chắn muốn hoàn thành đơn hàng này?')) {
                    const statusCell = row.querySelector('.status');
                    statusCell.textContent = 'Hoàn thành';
                    statusCell.className = 'status completed';
                    showNotification('Đơn hàng đã được hoàn thành!', 'success');
                }
            } else if (action.includes('Hủy bỏ')) {
                if (confirm('Bạn có chắc chắn muốn hủy bỏ đơn hàng này?')) {
                    row.style.opacity = '0.5';
                    showNotification('Đơn hàng đã được hủy bỏ!', 'warning');
                }
            } else if (action.includes('Tạo lại')) {
                showNotification('Đang tạo lại đơn hàng...', 'info');
            } else if (action.includes('Xác nhận')) {
                if (confirm('Bạn có chắc chắn muốn xác nhận giao dịch này?')) {
                    const statusCell = row.querySelector('.status');
                    statusCell.textContent = 'Thành công';
                    statusCell.className = 'status success';
                    showNotification('Giao dịch đã được xác nhận!', 'success');
                }
            } else if (action.includes('Từ chối')) {
                if (confirm('Bạn có chắc chắn muốn từ chối giao dịch này?')) {
                    row.style.opacity = '0.5';
                    showNotification('Giao dịch đã được từ chối!', 'error');
                }
            }
        });
    });

    // Service Management
    const serviceButtons = document.querySelectorAll('.service-actions .btn');
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            const serviceCard = this.closest('.service-card');
            const serviceName = serviceCard.querySelector('h3').textContent;
            
            if (action.includes('Chỉnh sửa')) {
                showNotification(`Đang mở form chỉnh sửa cho ${serviceName}`, 'info');
            } else if (action.includes('Xem chi tiết')) {
                showNotification(`Đang mở chi tiết ${serviceName}`, 'info');
            } else if (action.includes('Kích hoạt')) {
                const statusElement = serviceCard.querySelector('.service-status');
                statusElement.textContent = 'Hoạt động';
                statusElement.className = 'service-status active';
                this.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa';
                this.className = 'btn btn-primary btn-sm';
                showNotification(`${serviceName} đã được kích hoạt!`, 'success');
            }
        });
    });

    // Settings Management
    const settingsToggles = document.querySelectorAll('.toggle-switch input');
    settingsToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const settingName = this.closest('.form-group').querySelector('label').textContent;
            const status = this.checked ? 'bật' : 'tắt';
            showNotification(`${settingName} đã được ${status}!`, 'info');
        });
    });

    // Settings Save Button
    const saveSettingsBtn = document.querySelector('.settings-actions .btn-primary');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
            this.disabled = true;
            
            setTimeout(() => {
                showNotification('Cài đặt đã được lưu thành công!', 'success');
                this.innerHTML = '<i class="fas fa-save"></i> Lưu cài đặt';
                this.disabled = false;
            }, 2000);
        });
    }

    // Add User Button
    const addUserBtn = document.querySelector('.user-filters .btn-primary');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            showNotification('Đang mở form thêm người dùng...', 'info');
        });
    }

    // Pagination
    const pageButtons = document.querySelectorAll('.page-btn');
    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                pageButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                showNotification(`Đã chuyển đến trang ${this.textContent}`, 'info');
            }
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

    // Report Download Buttons
    const downloadButtons = document.querySelectorAll('.report-header .btn');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reportName = this.closest('.report-card').querySelector('h3').textContent;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xuất...';
            this.disabled = true;
            
            setTimeout(() => {
                showNotification(`${reportName} đã được xuất thành công!`, 'success');
                this.innerHTML = '<i class="fas fa-download"></i> Xuất PDF';
                this.disabled = false;
            }, 2000);
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
            const searchInput = document.querySelector('.search-box input');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to go back
        if (e.key === 'Escape') {
            window.location.href = 'index.html';
        }
        
        // Ctrl/Cmd + S to save settings
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveBtn = document.querySelector('.settings-actions .btn-primary');
            if (saveBtn) {
                saveBtn.click();
            }
        }
    });

    // Auto-refresh stats (simulate real-time updates)
    setInterval(() => {
        const statValues = document.querySelectorAll('.stat-content h3');
        statValues.forEach(stat => {
            const currentValue = parseInt(stat.textContent.replace(/[^\d]/g, ''));
            const randomChange = Math.floor(Math.random() * 10) - 5;
            const newValue = Math.max(0, currentValue + randomChange);
            
            if (stat.textContent.includes('₫')) {
                stat.textContent = `₫${newValue.toLocaleString()}`;
            } else {
                stat.textContent = newValue.toLocaleString();
            }
        });
    }, 30000); // Update every 30 seconds

    // Table row hover effects
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
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

    // Simulate real-time activity updates
    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        const activities = [
            {
                icon: 'new-user',
                title: 'Người dùng mới đăng ký',
                description: 'user456 đã đăng ký tài khoản mới',
                time: '1 phút trước'
            },
            {
                icon: 'new-order',
                title: 'Đơn hàng mới',
                description: 'Đơn hàng #ORD-2024-002 - 500 Follow Instagram',
                time: '3 phút trước'
            },
            {
                icon: 'payment',
                title: 'Thanh toán thành công',
                description: 'Người dùng user789 đã nạp 300,000 VNĐ',
                time: '5 phút trước'
            }
        ];

        setInterval(() => {
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
            const newActivity = document.createElement('div');
            newActivity.className = 'activity-item';
            newActivity.innerHTML = `
                <div class="activity-icon ${randomActivity.icon}">
                    <i class="fas fa-${randomActivity.icon === 'new-user' ? 'user-plus' : 
                                      randomActivity.icon === 'new-order' ? 'shopping-cart' : 
                                      'credit-card'}"></i>
                </div>
                <div class="activity-content">
                    <h4>${randomActivity.title}</h4>
                    <p>${randomActivity.description}</p>
                    <span class="activity-time">${randomActivity.time}</span>
                </div>
            `;
            
            activityList.insertBefore(newActivity, activityList.firstChild);
            
            // Remove old activities if too many
            const allActivities = activityList.querySelectorAll('.activity-item');
            if (allActivities.length > 5) {
                allActivities[allActivities.length - 1].remove();
            }
        }, 10000); // Add new activity every 10 seconds
    }

    console.log('Admin dashboard loaded successfully!');
});
