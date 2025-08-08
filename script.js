// Dark Mode Toggle
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Load saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // Toggle dark mode
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    });

    // Navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Get the navigation text
            const navText = this.querySelector('span').textContent;
            
            // Show loading animation
            showLoading();
            
            // Handle different navigation items
            setTimeout(() => {
                hideLoading();
                
                if (navText === 'Trang chủ') {
                    loadOverviewContent();
                    showNotification('Đã chuyển đến trang chủ', 'success');
                } else if (navText === 'Thông tin tài khoản') {
                    showNotification('Chức năng thông tin tài khoản đang được phát triển', 'info');
                } else if (navText === 'Nạp Tiền') {
                    showNotification('Chức năng nạp tiền đang được phát triển', 'info');
                } else if (navText === 'Liên Hệ Hỗ Trợ') {
                    showNotification('Chức năng liên hệ hỗ trợ đang được phát triển', 'info');
                }
            }, 1000);
        });
    });

    // Service items click handler
    const serviceItems = document.querySelectorAll('.service-item');
    serviceItems.forEach(item => {
        item.addEventListener('click', function() {
            const serviceName = this.querySelector('span').textContent;
            
            // Add ripple effect
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(102, 126, 234, 0.3)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = '50%';
            ripple.style.top = '50%';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.marginLeft = '-10px';
            ripple.style.marginTop = '-10px';
            
            this.style.position = 'relative';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
            
            // Handle service content loading
            if (serviceTemplates[serviceName]) {
                loadServiceContent(serviceName);
            } else {
                showNotification(`Dịch vụ ${serviceName} đang được phát triển`, 'info');
            }
        });
    });

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
            showFAQModal(question);
        });
    });

    // Video thumbnail click
    const videoThumbnail = document.querySelector('.video-thumbnail');
    if (videoThumbnail) {
        videoThumbnail.addEventListener('click', function() {
            showVideoModal();
        });
    }

    // Floating chat icons
    const chatIcons = document.querySelectorAll('.chat-icon');
    chatIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const platform = this.classList.contains('zalo') ? 'Zalo' : 'Messenger';
            showNotification(`Đang mở ${platform}...`, 'info');
        });
    });

    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', function() {
        showConfirmDialog('Bạn có chắc chắn muốn đăng xuất?', () => {
            showNotification('Đang đăng xuất...', 'info');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        });
    });

    // Link button
    const linkBtn = document.querySelector('.link-btn');
    if (linkBtn) {
        linkBtn.addEventListener('click', function() {
            showNotification('Đang liên kết Telegram...', 'info');
        });
    }

    // View all notifications button
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            showNotification('Đang tải tất cả thông báo...', 'info');
        });
    }

    // Service select change
    const serviceSelect = document.querySelector('.service-select');
    serviceSelect.addEventListener('change', function() {
        const selectedService = this.value;
        if (selectedService && selectedService !== 'Chọn dịch vụ') {
            if (serviceTemplates[selectedService]) {
                loadServiceContent(selectedService);
            } else {
                showNotification(`Dịch vụ ${selectedService} đang được phát triển`, 'info');
            }
        }
    });

    // Auto update balance (simulation)
    setInterval(() => {
        updateBalance();
    }, 30000); // Update every 30 seconds

    // Initialize tooltips
    initializeTooltips();
    
    // Initialize service categories
    console.log('Calling initializeServiceCategories from main DOMContentLoaded');
    initializeServiceCategories();
    
    // Initialize service pages
    initializeServicePages();
    
    // Initialize dark mode if toggle exists
    const darkModeToggleElement = document.getElementById('darkModeToggle');
    if (darkModeToggleElement) {
        const body = document.body;
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            body.classList.add('dark-mode');
            darkModeToggleElement.checked = true;
        }
    }
    
    // Add click handler for overview menu item
    const overviewItem = document.querySelector('.nav-item a[href="#overview"]');
    if (overviewItem) {
        overviewItem.addEventListener('click', function(e) {
            e.preventDefault();
            loadOverviewContent();
        });
    }
});

// Loading functions
function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Đang tải...</p>
        </div>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.remove();
    }
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

// Confirm dialog
function showConfirmDialog(message, onConfirm) {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <div class="confirm-content">
            <h3>Xác nhận</h3>
            <p>${message}</p>
            <div class="confirm-buttons">
                <button class="btn-cancel">Hủy</button>
                <button class="btn-confirm">Xác nhận</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    const cancelBtn = dialog.querySelector('.btn-cancel');
    const confirmBtn = dialog.querySelector('.btn-confirm');
    
    cancelBtn.addEventListener('click', () => {
        dialog.remove();
    });
    
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        dialog.remove();
    });
}

// FAQ Modal
function showFAQModal(question) {
    const modal = document.createElement('div');
    modal.className = 'faq-modal';
    modal.innerHTML = `
        <div class="faq-content">
            <h3>Câu hỏi thường gặp</h3>
            <h4>${question}</h4>
            <div class="faq-answer">
                <p>Đây là câu trả lời mẫu cho câu hỏi của bạn. Vui lòng liên hệ với chúng tôi để được hỗ trợ chi tiết hơn.</p>
                <div class="faq-contact">
                    <p><strong>Liên hệ hỗ trợ:</strong></p>
                    <ul>
                        <li>Zalo: 0123456789</li>
                        <li>Email: support@tangtuongtac.com</li>
                        <li>Fanpage: Tăng Tương Tác VIP</li>
                    </ul>
                </div>
            </div>
            <button class="faq-close">Đóng</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.faq-close');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Video Modal
function showVideoModal() {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="video-content">
            <div class="video-header">
                <h3>Video hướng dẫn</h3>
                <button class="video-close">&times;</button>
            </div>
            <div class="video-player">
                <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                </iframe>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.video-close');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Update balance simulation
function updateBalance() {
    const balanceElement = document.querySelector('.stat-card:first-child p');
    if (balanceElement) {
        const currentBalance = parseFloat(balanceElement.textContent.replace(/[^\d]/g, ''));
        const newBalance = currentBalance + Math.random() * 1000;
        balanceElement.textContent = `${Math.floor(newBalance).toLocaleString()}₫`;
    }
}

// Tooltips
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.getAttribute('data-tooltip');
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Add CSS for new elements
const additionalStyles = `
    /* Loading Spinner */
    #loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .loading-spinner {
        background: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Notifications */
    .notification {
        position: fixed;
        top: 100px;
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
    
    /* Confirm Dialog */
    .confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .confirm-content {
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .confirm-content h3 {
        margin-bottom: 15px;
        color: #333;
    }
    
    .confirm-content p {
        margin-bottom: 25px;
        color: #666;
    }
    
    .confirm-buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
    }
    
    .btn-cancel, .btn-confirm {
        padding: 10px 25px;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .btn-cancel {
        background: #f8f9fa;
        color: #666;
    }
    
    .btn-confirm {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
    }
    
    .btn-cancel:hover {
        background: #e9ecef;
    }
    
    .btn-confirm:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }
    
    /* FAQ Modal */
    .faq-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .faq-content {
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .faq-content h3 {
        margin-bottom: 20px;
        color: #333;
    }
    
    .faq-content h4 {
        margin-bottom: 15px;
        color: #667eea;
    }
    
    .faq-answer {
        margin-bottom: 25px;
    }
    
    .faq-answer p {
        margin-bottom: 15px;
        color: #666;
        line-height: 1.6;
    }
    
    .faq-contact ul {
        list-style: none;
        padding: 0;
    }
    
    .faq-contact li {
        padding: 5px 0;
        color: #666;
    }
    
    .faq-close {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 10px 25px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .faq-close:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }
    
    /* Video Modal */
    .video-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .video-content {
        background: white;
        border-radius: 15px;
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .video-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 30px;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .video-header h3 {
        margin: 0;
        color: #333;
    }
    
    .video-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
    }
    
    .video-player {
        position: relative;
        width: 100%;
        height: 0;
        padding-bottom: 56.25%; /* 16:9 aspect ratio */
    }
    
    .video-player iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    
    /* Ripple Effect */
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    /* Tooltip */
    .tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
    }
    
    .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

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
            
            // Handle service content loading
            if (serviceTemplates[serviceName]) {
                loadServiceContent(serviceName);
            } else {
                showNotification(`Dịch vụ ${serviceName} đang được phát triển`, 'info');
            }
        });
    });
    
    // Initialize service categories if not already initialized
    if (document.querySelector('.service-category')) {
        // Expand the "Dịch vụ Fanpage" category by default on service pages
        const fanpageCategory = document.querySelector('.service-subcategory.active');
        if (fanpageCategory) {
            const submenu = fanpageCategory.querySelector('.service-submenu');
            if (submenu) {
                submenu.style.display = 'block';
            }
        }
    }
    
    console.log('Service categories initialization complete');
}

// This event listener is now handled in the main DOMContentLoaded above
// Removed duplicate event listener to prevent conflicts

// Service Pages Functionality
function initializeServicePages() {
    // Server option selection
    const serverOptions = document.querySelectorAll('.server-option input[type="radio"]');
    serverOptions.forEach(option => {
        option.addEventListener('change', function() {
            // Remove selected class from all options
            document.querySelectorAll('.server-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to current option
            this.closest('.server-option').classList.add('selected');
            
            // Update estimated price
            updateEstimatedPrice();
        });
    });

    // Navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            navTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const tabName = this.textContent.trim();
            showNotification(`Đã chuyển đến tab: ${tabName}`, 'info');
        });
    });

    // Form submission
    const createRequestBtn = document.querySelector('.btn-create-request');
    if (createRequestBtn) {
        createRequestBtn.addEventListener('click', function() {
            // Check if we're on the unlock service page
            const accountType = document.getElementById('account-type');
            const accountInfo = document.getElementById('account-info');
            
            if (accountType && accountInfo) {
                // This is the unlock service page
                if (!accountType.value) {
                    showNotification('Vui lòng chọn loại tài khoản!', 'error');
                    return;
                }
                if (!accountInfo.value) {
                    showNotification('Vui lòng nhập thông tin tài khoản!', 'error');
                    return;
                }
                
                showNotification('Đang tạo yêu cầu mở khóa...', 'info');
                setTimeout(() => {
                    showNotification('Yêu cầu mở khóa đã được tạo thành công!', 'success');
                }, 2000);
            } else {
                // This is a fanpage service page
                const fanpageLink = document.getElementById('fanpage-link');
                if (!fanpageLink || !fanpageLink.value) {
                    showNotification('Vui lòng nhập Link Fanpage!', 'error');
                    return;
                }
                
                showNotification('Đang tạo yêu cầu...', 'info');
                setTimeout(() => {
                    showNotification('Yêu cầu đã được tạo thành công!', 'success');
                }, 2000);
            }
        });
    }

    // Manage button
    const manageBtn = document.querySelector('.btn-manage');
    if (manageBtn) {
        manageBtn.addEventListener('click', function() {
            showNotification('Đang chuyển đến trang quản lý...', 'info');
        });
    }

    // Service select dropdown
    const serviceSelect = document.querySelector('.service-select');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            const selectedService = this.value;
            if (selectedService && selectedService !== 'Chọn dịch vụ') {
                if (serviceTemplates[selectedService]) {
                    loadServiceContent(selectedService);
                } else {
                    showNotification(`Dịch vụ ${selectedService} đang được phát triển`, 'info');
                }
            }
        });
    }
}

// Update estimated price based on selected server
function updateEstimatedPrice() {
    const selectedOption = document.querySelector('.server-option.selected');
    if (selectedOption) {
        const priceElement = selectedOption.querySelector('.option-price');
        const estimatedPriceInput = document.getElementById('estimated-price');
        
        if (priceElement && estimatedPriceInput) {
            const price = priceElement.textContent;
            estimatedPriceInput.value = price;
        }
    }
}

// Function to calculate price based on server and quantity
function calculatePrice() {
    // Try to find the active service container or any visible form
    let activeService = document.querySelector('.service-content.active') || 
                       document.querySelector('.content-wrapper') ||
                       document.querySelector('.form-section') ||
                       document.querySelector('.main-content');
    
    if (!activeService) {
        console.log('No active service container found, trying document body');
        activeService = document.body;
    }
    
    // Find elements within the active service container
    const selectedServer = activeService.querySelector('input[name="server"]:checked');
    const quantityInput = activeService.querySelector('#quantity');
    const estimatedPriceInput = activeService.querySelector('#estimated-price');
    
    console.log('calculatePrice called');
    console.log('activeService:', activeService);
    console.log('selectedServer:', selectedServer);
    console.log('quantityInput:', quantityInput);
    console.log('estimatedPriceInput:', estimatedPriceInput);
    
    if (!selectedServer || !quantityInput || !estimatedPriceInput) {
        console.log('Missing required elements');
        return;
    }
    
    const rate = parseFloat(selectedServer.getAttribute('data-rate')) || 0;
    const quantity = parseInt(quantityInput.value) || 0;
    
    console.log('rate:', rate, 'quantity:', quantity);
    
    if (rate > 0 && quantity > 0) {
        const totalPrice = quantity * rate;
        const formattedPrice = `${totalPrice.toLocaleString('vi-VN')}₫`;
        estimatedPriceInput.value = formattedPrice;
        console.log('Updated price to:', formattedPrice);
    } else {
        estimatedPriceInput.value = '';
    }
}

// Function to initialize price calculation for all services
function initializePriceCalculation() {
    console.log('Initializing price calculation...');
    
    // Use event delegation for better reliability
    document.addEventListener('change', function(e) {
        if (e.target.name === 'server') {
            console.log('Server changed to:', e.target.id);
            calculatePrice();
        }
    });
    
    document.addEventListener('input', function(e) {
        if (e.target.id === 'quantity') {
            console.log('Quantity changed to:', e.target.value);
            calculatePrice();
        }
    });
    
    // Add event listeners for all quantity inputs
    document.addEventListener('DOMContentLoaded', function() {
        const quantityInputs = document.querySelectorAll('#quantity');
        quantityInputs.forEach(input => {
            input.addEventListener('input', calculatePrice);
        });
        
        const serverInputs = document.querySelectorAll('input[name="server"]');
        serverInputs.forEach(input => {
            input.addEventListener('change', calculatePrice);
        });
    });
    
    // Calculate initial price
    calculatePrice();
}

// Service content templates
const serviceTemplates = {
    'Tăng Like page SLL': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Thông Tin Dịch Vụ</h3>
                <div class="form-group">
                    <label for="fanpage-link">Link Fanpage:</label>
                    <input type="url" id="fanpage-link" placeholder="Nhập link fanpage của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Gói Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="service-package" value="basic" id="basic">
                            <label for="basic">
                                <div class="option-header">
                                    <span class="option-name">Gói Cơ Bản</span>
                                    <span class="option-price">50.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 like trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="standard" id="standard">
                            <label for="standard">
                                <div class="option-header">
                                    <span class="option-name">Gói Tiêu Chuẩn</span>
                                    <span class="option-price">100.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>2500 like trong 48h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="premium" id="premium">
                            <label for="premium">
                                <div class="option-header">
                                    <span class="option-name">Gói Cao Cấp</span>
                                    <span class="option-price">200.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>5000 like trong 72h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="vip" id="vip">
                            <label for="vip">
                                <div class="option-header">
                                    <span class="option-name">Gói VIP</span>
                                    <span class="option-price">500.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>10000 like trong 5 ngày</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Like thật 100%, không drop</li>
                            <li>Thời gian hoàn thành: 24h - 5 ngày</li>
                            <li>Hỗ trợ 24/7</li>
                            <li>Hoàn tiền nếu không đạt cam kết</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Đổi Tên Fanpage': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Thông Tin Dịch Vụ</h3>
                <div class="form-group">
                    <label for="fanpage-link">Link Fanpage:</label>
                    <input type="url" id="fanpage-link" placeholder="Nhập link fanpage của bạn">
                </div>
                
                <div class="form-group">
                    <label for="new-name">Tên Mới:</label>
                    <input type="text" id="new-name" placeholder="Nhập tên mới cho fanpage">
                </div>
                
                <div class="form-group">
                    <label>Chọn Gói Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="service-package" value="basic" id="basic">
                            <label for="basic">
                                <div class="option-header">
                                    <span class="option-name">Gói Cơ Bản</span>
                                    <span class="option-price">200.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Đổi tên trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="standard" id="standard">
                            <label for="standard">
                                <div class="option-header">
                                    <span class="option-name">Gói Tiêu Chuẩn</span>
                                    <span class="option-price">300.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Đổi tên trong 12h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="premium" id="premium">
                            <label for="premium">
                                <div class="option-header">
                                    <span class="option-name">Gói Cao Cấp</span>
                                    <span class="option-price">500.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Đổi tên trong 6h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="vip" id="vip">
                            <label for="vip">
                                <div class="option-header">
                                    <span class="option-name">Gói VIP</span>
                                    <span class="option-price">1.000.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Đổi tên ngay lập tức</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Đổi tên an toàn, không ảnh hưởng đến fanpage</li>
                            <li>Thời gian hoàn thành: 6h - 24h</li>
                            <li>Hỗ trợ 24/7</li>
                            <li>Hoàn tiền nếu không đạt cam kết</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Kháng Gậy Fanpage': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Thông Tin Dịch Vụ</h3>
                <div class="form-group">
                    <label for="fanpage-link">Link Fanpage:</label>
                    <input type="url" id="fanpage-link" placeholder="Nhập link fanpage của bạn">
                </div>
                
                <div class="form-group">
                    <label for="ban-reason">Lý Do Bị Gậy:</label>
                    <select id="ban-reason">
                        <option value="">Chọn lý do</option>
                        <option value="spam">Spam</option>
                        <option value="copyright">Vi phạm bản quyền</option>
                        <option value="inappropriate">Nội dung không phù hợp</option>
                        <option value="fake">Tài khoản giả mạo</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Chọn Gói Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="service-package" value="basic" id="basic">
                            <label for="basic">
                                <div class="option-header">
                                    <span class="option-name">Gói Cơ Bản</span>
                                    <span class="option-price">500.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Kháng gậy trong 3-5 ngày</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="standard" id="standard">
                            <label for="standard">
                                <div class="option-header">
                                    <span class="option-name">Gói Tiêu Chuẩn</span>
                                    <span class="option-price">800.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Kháng gậy trong 2-3 ngày</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="premium" id="premium">
                            <label for="premium">
                                <div class="option-header">
                                    <span class="option-name">Gói Cao Cấp</span>
                                    <span class="option-price">1.500.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Kháng gậy trong 1-2 ngày</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="vip" id="vip">
                            <label for="vip">
                                <div class="option-header">
                                    <span class="option-name">Gói VIP</span>
                                    <span class="option-price">3.000.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Kháng gậy trong 24h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Tỷ lệ thành công cao 95%</li>
                            <li>Thời gian hoàn thành: 1-5 ngày</li>
                            <li>Hỗ trợ 24/7</li>
                            <li>Hoàn tiền nếu không thành công</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'DV Nuôi Thuê Fanpage': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Thông Tin Dịch Vụ</h3>
                <div class="form-group">
                    <label for="fanpage-link">Link Fanpage:</label>
                    <input type="url" id="fanpage-link" placeholder="Nhập link fanpage của bạn">
                </div>
                
                <div class="form-group">
                    <label for="rental-period">Thời Gian Thuê:</label>
                    <select id="rental-period">
                        <option value="">Chọn thời gian</option>
                        <option value="1-month">1 tháng</option>
                        <option value="3-months">3 tháng</option>
                        <option value="6-months">6 tháng</option>
                        <option value="1-year">1 năm</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Chọn Gói Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="service-package" value="basic" id="basic">
                            <label for="basic">
                                <div class="option-header">
                                    <span class="option-name">Gói Cơ Bản</span>
                                    <span class="option-price">2.000.000đ/tháng</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Quản lý cơ bản, tăng like tự nhiên</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="standard" id="standard">
                            <label for="standard">
                                <div class="option-header">
                                    <span class="option-name">Gói Tiêu Chuẩn</span>
                                    <span class="option-price">5.000.000đ/tháng</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Quản lý chuyên nghiệp, tăng tương tác</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="premium" id="premium">
                            <label for="premium">
                                <div class="option-header">
                                    <span class="option-name">Gói Cao Cấp</span>
                                    <span class="option-price">10.000.000đ/tháng</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Quản lý VIP, tăng doanh thu</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="vip" id="vip">
                            <label for="vip">
                                <div class="option-header">
                                    <span class="option-name">Gói VIP</span>
                                    <span class="option-price">20.000.000đ/tháng</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Quản lý toàn diện, tối ưu hóa</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Quản lý chuyên nghiệp 24/7</li>
                            <li>Tăng like, comment tự nhiên</li>
                            <li>Báo cáo hàng tuần</li>
                            <li>Hỗ trợ tối ưu hóa nội dung</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'DV Mở Khóa MXH': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Thông Tin Dịch Vụ</h3>
                <div class="form-group">
                    <label for="account-type">Loại Tài Khoản:</label>
                    <select id="account-type">
                        <option value="">Chọn loại tài khoản</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitter">Twitter</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="account-info">Thông Tin Tài Khoản:</label>
                    <input type="text" id="account-info" placeholder="Nhập username/email/phone">
                </div>
                
                <div class="form-group">
                    <label for="ban-reason">Lý Do Khóa:</label>
                    <select id="ban-reason">
                        <option value="">Chọn lý do</option>
                        <option value="spam">Spam</option>
                        <option value="copyright">Vi phạm bản quyền</option>
                        <option value="inappropriate">Nội dung không phù hợp</option>
                        <option value="fake">Tài khoản giả mạo</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ban-duration">Thời Gian Khóa:</label>
                    <select id="ban-duration">
                        <option value="">Chọn thời gian</option>
                        <option value="temporary">Tạm thời</option>
                        <option value="permanent">Vĩnh viễn</option>
                        <option value="unknown">Không rõ</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="additional-info">Thông Tin Bổ Sung:</label>
                    <textarea id="additional-info" placeholder="Mô tả chi tiết về tình trạng tài khoản"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Chọn Gói Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="service-package" value="basic" id="basic">
                            <label for="basic">
                                <div class="option-header">
                                    <span class="option-name">Gói Basic</span>
                                    <span class="option-price">500.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Mở khóa trong 3-7 ngày</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="standard" id="standard">
                            <label for="standard">
                                <div class="option-header">
                                    <span class="option-name">Gói Standard</span>
                                    <span class="option-price">1.000.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Mở khóa trong 2-5 ngày</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="premium" id="premium">
                            <label for="premium">
                                <div class="option-header">
                                    <span class="option-name">Gói Premium</span>
                                    <span class="option-price">2.000.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Mở khóa trong 1-3 ngày</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="vip" id="vip">
                            <label for="vip">
                                <div class="option-header">
                                    <span class="option-name">Gói VIP</span>
                                    <span class="option-price">5.000.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Mở khóa trong 24h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Tỷ lệ thành công cao 90%</li>
                            <li>Thời gian hoàn thành: 1-7 ngày</li>
                            <li>Hỗ trợ 24/7</li>
                            <li>Hoàn tiền nếu không thành công</li>
                            <li>Bảo mật thông tin tuyệt đối</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Voucher STK': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Thông Tin Dịch Vụ</h3>
                <div class="form-group">
                    <label for="voucher-type">Loại Voucher:</label>
                    <select id="voucher-type">
                        <option value="">Chọn loại voucher</option>
                        <option value="shopee">Shopee</option>
                        <option value="lazada">Lazada</option>
                        <option value="tiki">Tiki</option>
                        <option value="amazon">Amazon</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="voucher-value">Giá Trị Voucher:</label>
                    <input type="number" id="voucher-value" placeholder="Nhập giá trị voucher">
                </div>
                
                <div class="form-group">
                    <label>Chọn Gói Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="service-package" value="basic" id="basic">
                            <label for="basic">
                                <div class="option-header">
                                    <span class="option-name">Gói Cơ Bản</span>
                                    <span class="option-price">100.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Voucher 50.000đ</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="standard" id="standard">
                            <label for="standard">
                                <div class="option-header">
                                    <span class="option-name">Gói Tiêu Chuẩn</span>
                                    <span class="option-price">200.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Voucher 100.000đ</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="premium" id="premium">
                            <label for="premium">
                                <div class="option-header">
                                    <span class="option-name">Gói Cao Cấp</span>
                                    <span class="option-price">500.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Voucher 250.000đ</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="service-package" value="vip" id="vip">
                            <label for="vip">
                                <div class="option-header">
                                    <span class="option-name">Gói VIP</span>
                                    <span class="option-price">1.000.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Voucher 500.000đ</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Voucher chính hãng 100%</li>
                            <li>Thời gian giao: 5-15 phút</li>
                            <li>Hỗ trợ 24/7</li>
                            <li>Hoàn tiền nếu không hợp lệ</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    // Templates for main services
    'Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Facebook</h3>
                <div class="form-group">
                    <label for="facebook-link">Link Facebook:</label>
                    <input type="url" id="facebook-link" placeholder="Nhập link Facebook của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="facebook-service" value="like" id="fb-like">
                            <label for="fb-like">
                                <div class="option-header">
                                    <span class="option-name">Tăng Like</span>
                                    <span class="option-price">50.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 like trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="facebook-service" value="follow" id="fb-follow">
                            <label for="fb-follow">
                                <div class="option-header">
                                    <span class="option-name">Tăng Follow</span>
                                    <span class="option-price">100.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>500 follow trong 48h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="facebook-service" value="share" id="fb-share">
                            <label for="fb-share">
                                <div class="option-header">
                                    <span class="option-name">Tăng Share</span>
                                    <span class="option-price">75.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>200 share trong 24h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Tương tác thật 100%</li>
                            <li>Không drop, bảo hành trọn đời</li>
                            <li>Thời gian giao: 24-72h</li>
                            <li>Hỗ trợ 24/7</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Instagram': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Instagram</h3>
                <div class="form-group">
                    <label for="instagram-link">Link Instagram:</label>
                    <input type="url" id="instagram-link" placeholder="Nhập link Instagram của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="instagram-service" value="follow" id="ig-follow">
                            <label for="ig-follow">
                                <div class="option-header">
                                    <span class="option-name">Tăng Follow</span>
                                    <span class="option-price">80.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 follow trong 48h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="instagram-service" value="like" id="ig-like">
                            <label for="ig-like">
                                <div class="option-header">
                                    <span class="option-name">Tăng Like</span>
                                    <span class="option-price">60.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>500 like trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="instagram-service" value="comment" id="ig-comment">
                            <label for="ig-comment">
                                <div class="option-header">
                                    <span class="option-name">Tăng Comment</span>
                                    <span class="option-price">40.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>100 comment trong 12h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Follow thật 100%</li>
                            <li>Không drop, bảo hành trọn đời</li>
                            <li>Thời gian giao: 12-48h</li>
                            <li>Hỗ trợ 24/7</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-instagram"></i> Instagram: @support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ TikTok</h3>
                <div class="form-group">
                    <label for="tiktok-link">Link TikTok:</label>
                    <input type="url" id="tiktok-link" placeholder="Nhập link TikTok của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="tiktok-service" value="follow" id="tt-follow">
                            <label for="tt-follow">
                                <div class="option-header">
                                    <span class="option-name">Tăng Follow</span>
                                    <span class="option-price">120.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>2000 follow trong 72h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="tiktok-service" value="like" id="tt-like">
                            <label for="tt-like">
                                <div class="option-header">
                                    <span class="option-name">Tăng Like</span>
                                    <span class="option-price">90.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 like trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="tiktok-service" value="view" id="tt-view">
                            <label for="tt-view">
                                <div class="option-header">
                                    <span class="option-name">Tăng View</span>
                                    <span class="option-price">50.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>5000 view trong 12h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Tương tác thật 100%</li>
                            <li>Không drop, bảo hành trọn đời</li>
                            <li>Thời gian giao: 12-72h</li>
                            <li>Hỗ trợ 24/7</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-tiktok"></i> TikTok: @support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Youtube': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ YouTube</h3>
                <div class="form-group">
                    <label for="youtube-link">Link YouTube:</label>
                    <input type="url" id="youtube-link" placeholder="Nhập link YouTube của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="youtube-service" value="sub" id="yt-sub">
                            <label for="yt-sub">
                                <div class="option-header">
                                    <span class="option-name">Tăng Subscribe</span>
                                    <span class="option-price">200.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 sub trong 7 ngày</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="youtube-service" value="view" id="yt-view">
                            <label for="yt-view">
                                <div class="option-header">
                                    <span class="option-name">Tăng View</span>
                                    <span class="option-price">150.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>10000 view trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="youtube-service" value="like" id="yt-like">
                            <label for="yt-like">
                                <div class="option-header">
                                    <span class="option-name">Tăng Like</span>
                                    <span class="option-price">80.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>500 like trong 12h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Sub thật 100%</li>
                            <li>Không drop, bảo hành trọn đời</li>
                            <li>Thời gian giao: 24h-7 ngày</li>
                            <li>Hỗ trợ 24/7</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-youtube"></i> YouTube: @support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Threads': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Threads</h3>
                <div class="form-group">
                    <label for="threads-link">Link Threads:</label>
                    <input type="url" id="threads-link" placeholder="Nhập link Threads của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="threads-service" value="follow" id="th-follow">
                            <label for="th-follow">
                                <div class="option-header">
                                    <span class="option-name">Tăng Follow</span>
                                    <span class="option-price">150.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 follow trong 72h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="threads-service" value="like" id="th-like">
                            <label for="th-like">
                                <div class="option-header">
                                    <span class="option-name">Tăng Like</span>
                                    <span class="option-price">100.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>500 like trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="threads-service" value="repost" id="th-repost">
                            <label for="th-repost">
                                <div class="option-header">
                                    <span class="option-name">Tăng Repost</span>
                                    <span class="option-price">80.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>200 repost trong 48h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Tương tác thật 100%</li>
                            <li>Không drop, bảo hành trọn đời</li>
                            <li>Thời gian giao: 24-72h</li>
                            <li>Hỗ trợ 24/7</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-twitter"></i> Threads: @support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Shopee': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Shopee</h3>
                <div class="form-group">
                    <label for="shopee-link">Link Shopee:</label>
                    <input type="url" id="shopee-link" placeholder="Nhập link Shopee của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="shopee-service" value="view" id="sp-view">
                            <label for="sp-view">
                                <div class="option-header">
                                    <span class="option-name">Tăng View</span>
                                    <span class="option-price">50.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 view trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="shopee-service" value="like" id="sp-like">
                            <label for="sp-like">
                                <div class="option-header">
                                    <span class="option-name">Tăng Like</span>
                                    <span class="option-price">80.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>500 like trong 12h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="shopee-service" value="follow" id="sp-follow">
                            <label for="sp-follow">
                                <div class="option-header">
                                    <span class="option-name">Tăng Follow</span>
                                    <span class="option-price">120.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 follow trong 48h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Tương tác thật 100%</li>
                            <li>Không drop, bảo hành trọn đời</li>
                            <li>Thời gian giao: 12-48h</li>
                            <li>Hỗ trợ 24/7</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fas fa-shopping-cart"></i> Shopee: @support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Telegram': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Telegram</h3>
                <div class="form-group">
                    <label for="telegram-link">Link Telegram:</label>
                    <input type="url" id="telegram-link" placeholder="Nhập link Telegram của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="telegram-service" value="member" id="tg-member">
                            <label for="tg-member">
                                <div class="option-header">
                                    <span class="option-name">Tăng Thành Viên</span>
                                    <span class="option-price">200.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 member trong 7 ngày</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="telegram-service" value="view" id="tg-view">
                            <label for="tg-view">
                                <div class="option-header">
                                    <span class="option-name">Tăng View</span>
                                    <span class="option-price">100.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>5000 view trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="telegram-service" value="channel" id="tg-channel">
                            <label for="tg-channel">
                                <div class="option-header">
                                    <span class="option-name">Tăng Kênh</span>
                                    <span class="option-price">150.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>500 channel trong 48h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Member thật 100%</li>
                            <li>Không drop, bảo hành trọn đời</li>
                            <li>Thời gian giao: 24h-7 ngày</li>
                            <li>Hỗ trợ 24/7</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-telegram"></i> Telegram: @support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Twitter': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Twitter</h3>
                <div class="form-group">
                    <label for="twitter-link">Link Twitter:</label>
                    <input type="url" id="twitter-link" placeholder="Nhập link Twitter của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="twitter-service" value="follow" id="tw-follow">
                            <label for="tw-follow">
                                <div class="option-header">
                                    <span class="option-name">Tăng Follow</span>
                                    <span class="option-price">180.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>2000 follow trong 72h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="twitter-service" value="like" id="tw-like">
                            <label for="tw-like">
                                <div class="option-header">
                                    <span class="option-name">Tăng Like</span>
                                    <span class="option-price">120.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 like trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="twitter-service" value="retweet" id="tw-retweet">
                            <label for="tw-retweet">
                                <div class="option-header">
                                    <span class="option-name">Tăng Retweet</span>
                                    <span class="option-price">90.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>500 retweet trong 48h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Follow thật 100%</li>
                            <li>Không drop, bảo hành trọn đời</li>
                            <li>Thời gian giao: 24-72h</li>
                            <li>Hỗ trợ 24/7</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-twitter"></i> Twitter: @support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Tăng Like Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Tăng Like Facebook</h3>
                <div class="form-group">
                    <label for="facebook-link">Link Facebook:</label>
                    <input type="url" id="facebook-link" placeholder="Nhập link Facebook của bạn">
                </div>
                
                <div class="form-group">
                    <label for="quantity">Số lượng:</label>
                    <input type="number" id="quantity" placeholder="Nhập số lượng like cần tăng" value="100" oninput="calculatePrice()">
                </div>
                
                <div class="form-group">
                    <label>Chọn Server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" value="server1" id="server1" checked data-rate="26.2" onchange="calculatePrice()">
                            <label for="server1">
                                <div class="option-header">
                                    <span class="option-title">Server 12: Sub Via Việt nam, tốc độ 5k-10k/1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">26.2₫/like</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server2" id="server2" data-rate="65.8" onchange="calculatePrice()">
                            <label for="server2">
                                <div class="option-header">
                                    <span class="option-title">Server 15: Sub Via Việt nam, tốc độ 20k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">65.8₫/like</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server3" id="server3" data-rate="89.8" onchange="calculatePrice()">
                            <label for="server3">
                                <div class="option-header">
                                    <span class="option-title">Server 16: Sub Via Việt nam, tốc độ 30k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">89.8₫/like</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server4" id="server4" data-rate="113.8" onchange="calculatePrice()">
                            <label for="server4">
                                <div class="option-header">
                                    <span class="option-title">Server 17: Sub Via Việt nam, tốc độ 50k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">113.8₫/like</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá:</label>
                    <input type="text" id="estimated-price" readonly placeholder="Chọn server và nhập số lượng">
                </div>
                
                <div class="form-group">
                    <label for="notes">Ghi chú:</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Like thật 100%, không drop</li>
                            <li>Thời gian hoàn thành: 24h - 72h</li>
                            <li>Hỗ trợ 24/7</li>
                            <li>Hoàn tiền nếu không đạt cam kết</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Tăng Follow Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Tăng Follow Facebook</h3>
                <div class="form-group">
                    <label for="facebook-link">Link Facebook:</label>
                    <input type="url" id="facebook-link" placeholder="Nhập link Facebook của bạn">
                </div>
                
                <div class="form-group">
                    <label for="quantity">Số lượng:</label>
                    <input type="number" id="quantity" placeholder="Nhập số lượng follow cần tăng" value="100" oninput="calculatePrice()">
                </div>
                
                <div class="form-group">
                    <label>Chọn Server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" value="server1" id="server1" checked data-rate="35.5" onchange="calculatePrice()">
                            <label for="server1">
                                <div class="option-header">
                                    <span class="option-title">Server 12: Sub Via Việt nam, tốc độ 5k-10k/1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">35.5₫/follow</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server2" id="server2" data-rate="75.2" onchange="calculatePrice()">
                            <label for="server2">
                                <div class="option-header">
                                    <span class="option-title">Server 15: Sub Via Việt nam, tốc độ 20k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">75.2₫/follow</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server3" id="server3" data-rate="95.8" onchange="calculatePrice()">
                            <label for="server3">
                                <div class="option-header">
                                    <span class="option-title">Server 16: Sub Via Việt nam, tốc độ 30k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">95.8₫/follow</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server4" id="server4" data-rate="125.5" onchange="calculatePrice()">
                            <label for="server4">
                                <div class="option-header">
                                    <span class="option-title">Server 17: Sub Via Việt nam, tốc độ 50k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">125.5₫/follow</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá:</label>
                    <input type="text" id="estimated-price" readonly placeholder="Chọn server và nhập số lượng">
                </div>
                
                <div class="form-group">
                    <label for="notes">Ghi chú:</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Follow thật 100%, không drop</li>
                            <li>Thời gian hoàn thành: 24h - 72h</li>
                            <li>Hỗ trợ 24/7</li>
                            <li>Hoàn tiền nếu không đạt cam kết</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Tăng Comment Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Tăng Comment Facebook</h3>
                <div class="form-group">
                    <label for="facebook-link">Link Facebook:</label>
                    <input type="url" id="facebook-link" placeholder="Nhập link Facebook của bạn">
                </div>
                
                <div class="form-group">
                    <label for="quantity">Số lượng:</label>
                    <input type="number" id="quantity" placeholder="Nhập số lượng comment cần tăng" value="100" oninput="calculatePrice()">
                </div>
                
                <div class="form-group">
                    <label for="comment-content">Nội Dung Comment:</label>
                    <textarea id="comment-content" placeholder="Nhập nội dung comment (để trống để tự động)"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Chọn Server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" value="server1" id="server1" checked data-rate="45.2" onchange="calculatePrice()">
                            <label for="server1">
                                <div class="option-header">
                                    <span class="option-title">Server 12: Sub Via Việt nam, tốc độ 5k-10k/1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">45.2₫/comment</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server2" id="server2" data-rate="85.5" onchange="calculatePrice()">
                            <label for="server2">
                                <div class="option-header">
                                    <span class="option-title">Server 15: Sub Via Việt nam, tốc độ 20k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">85.5₫/comment</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server3" id="server3" data-rate="105.8" onchange="calculatePrice()">
                            <label for="server3">
                                <div class="option-header">
                                    <span class="option-title">Server 16: Sub Via Việt nam, tốc độ 30k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">105.8₫/comment</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server4" id="server4" data-rate="135.2" onchange="calculatePrice()">
                            <label for="server4">
                                <div class="option-header">
                                    <span class="option-title">Server 17: Sub Via Việt nam, tốc độ 50k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">135.2₫/comment</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá:</label>
                    <input type="text" id="estimated-price" readonly placeholder="Chọn server và nhập số lượng">
                </div>
                
                <div class="form-group">
                    <label for="notes">Ghi chú:</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Comment thật 100%, không spam</li>
                            <li>Thời gian hoàn thành: 24h - 72h</li>
                            <li>Hỗ trợ 24/7</li>
                            <li>Hoàn tiền nếu không đạt cam kết</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Tăng Share Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Tăng Share Facebook</h3>
                <div class="form-group">
                    <label for="facebook-link">Link Facebook:</label>
                    <input type="url" id="facebook-link" placeholder="Nhập link Facebook của bạn">
                </div>
                
                <div class="form-group">
                    <label for="quantity">Số lượng:</label>
                    <input type="number" id="quantity" placeholder="Nhập số lượng share cần tăng" value="100" oninput="calculatePrice()">
                </div>
                
                <div class="form-group">
                    <label>Chọn Server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" value="server1" id="server1" checked data-rate="55.8" onchange="calculatePrice()">
                            <label for="server1">
                                <div class="option-header">
                                    <span class="option-title">Server 12: Sub Via Việt nam, tốc độ 5k-10k/1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">55.8₫/share</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server2" id="server2" data-rate="95.5" onchange="calculatePrice()">
                            <label for="server2">
                                <div class="option-header">
                                    <span class="option-title">Server 15: Sub Via Việt nam, tốc độ 20k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">95.5₫/share</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server3" id="server3" data-rate="115.8" onchange="calculatePrice()">
                            <label for="server3">
                                <div class="option-header">
                                    <span class="option-title">Server 16: Sub Via Việt nam, tốc độ 30k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">115.8₫/share</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="server4" id="server4" data-rate="145.2" onchange="calculatePrice()">
                            <label for="server4">
                                <div class="option-header">
                                    <span class="option-title">Server 17: Sub Via Việt nam, tốc độ 50k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">145.2₫/share</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá:</label>
                    <input type="text" id="estimated-price" readonly placeholder="Chọn server và nhập số lượng">
                </div>
                
                <div class="form-group">
                    <label for="notes">Ghi chú:</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Share thật 100%, không fake</li>
                            <li>Thời gian hoàn thành: 24h - 72h</li>
                            <li>Hỗ trợ 24/7</li>
                            <li>Hoàn tiền nếu không đạt cam kết</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fab fa-facebook"></i> Facebook: fb.com/support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    

    

    
    'Lazada': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Lazada</h3>
                <div class="form-group">
                    <label for="lazada-link">Link Lazada:</label>
                    <input type="url" id="lazada-link" placeholder="Nhập link Lazada của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="lazada-service" value="view" id="lz-view">
                            <label for="lz-view">
                                <div class="option-header">
                                    <span class="option-name">Tăng View</span>
                                    <span class="option-price">60.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 view trong 24h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="lazada-service" value="like" id="lz-like">
                            <label for="lazada-like">
                                <div class="option-header">
                                    <span class="option-name">Tăng Like</span>
                                    <span class="option-price">100.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>500 like trong 12h</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="lazada-service" value="follow" id="lz-follow">
                            <label for="lazada-follow">
                                <div class="option-header">
                                    <span class="option-name">Tăng Follow</span>
                                    <span class="option-price">150.000đ</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>1000 follow trong 48h</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Giá Dự Kiến:</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Tạo Yêu Cầu</button>
                    <button class="btn-manage">Quản Lý</button>
                </div>
            </div>
            
            <div class="notes-section">
                <div class="notes-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Lưu Ý Quan Trọng</span>
                </div>
                <div class="service-info">
                    <div class="info-section">
                        <h4>Thông Tin Dịch Vụ</h4>
                        <ul>
                            <li>Tương tác thật 100%</li>
                            <li>Không drop, bảo hành trọn đời</li>
                            <li>Thời gian giao: 12-48h</li>
                            <li>Hỗ trợ 24/7</li>
                        </ul>
                    </div>
                    
                    <div class="contact-info">
                        <h4>Liên Hệ Hỗ Trợ</h4>
                        <p><i class="fas fa-phone"></i> Hotline: 0123 456 789</p>
                        <p><i class="fas fa-envelope"></i> Email: support@example.com</p>
                        <p><i class="fas fa-shopping-cart"></i> Lazada: @support</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'Tăng Like Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders">
                        Mua nhiều đơn cùng lúc
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="post-link">ID hoặc link bài viết cần chạy:</label>
                    <input type="text" id="post-link" placeholder="Hãy nhập đúng link, sai k có hoàn tiền">
                </div>
                
                <div class="form-group">
                    <label>Chọn server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="like-server" value="server6" id="server6" checked>
                            <label for="server6">
                                <div class="option-header">
                                    <span class="option-title">Server 6: Like việt. 26.2 ₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                                <div class="option-details">
                                    <ul>
                                        <li>Được phép dồn sĩ, mua 10k có thể mua 5 lần 2k cùng 1 lúc cho nhanh</li>
                                        <li>Có hỗ trợ mua cùng lúc nhiều cảm xúc, số lượng sẽ được phân chia ngẫu nhiên.</li>
                                        <li>Không hỗ trợ like bài video trong album( vì server này sẽ nhảy like lên bài album)</li>
                                        <li>Không hỗ trợ cảm xúc cho bài reels (có tính mua sẽ hoàn thành gói không hoàn tiền)</li>
                                        <li>Tối thiểu/Tối đa: 50/200k</li>
                                    </ul>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="like-server" value="server1" id="server1">
                            <label for="server1">
                                <div class="option-header">
                                    <span class="option-title">Server 1: Like việt. tốc độ chậm 14.2 ₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="like-server" value="server3" id="server3">
                            <label for="server3">
                                <div class="option-header">
                                    <span class="option-title">Server 3: Like việt. Tốc độ ổn 25 ₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="like-server" value="server5" id="server5">
                            <label for="server5">
                                <div class="option-header">
                                    <span class="option-title">Server 5: Like việt, tốc độ trung bình 16 ₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="like-server" value="server15" id="server15">
                            <label for="server15">
                                <div class="option-header">
                                    <span class="option-title">Server 15: Like việt 38.2 ₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="like-server" value="server16" id="server16">
                            <label for="server16">
                                <div class="option-header">
                                    <span class="option-title">Server 16: Like việt 62.2 ₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="like-server" value="server17" id="server17">
                            <label for="server17">
                                <div class="option-header">
                                    <span class="option-title">Server 17: Like việt 112.6 ₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Chọn loại cảm xúc:</label>
                    <div class="reaction-options">
                        <div class="reaction-item">
                            <i class="fas fa-thumbs-up"></i>
                            <input type="checkbox" id="like-reaction" checked>
                            <label for="like-reaction">Like</label>
                        </div>
                        <div class="reaction-item">
                            <i class="fas fa-heart"></i>
                            <input type="checkbox" id="love-reaction">
                            <label for="love-reaction">Love</label>
                        </div>
                        <div class="reaction-item">
                            <i class="fas fa-laugh"></i>
                            <input type="checkbox" id="haha-reaction">
                            <label for="haha-reaction">Haha</label>
                        </div>
                        <div class="reaction-item">
                            <i class="fas fa-surprise"></i>
                            <input type="checkbox" id="wow-reaction">
                            <label for="wow-reaction">Wow</label>
                        </div>
                        <div class="reaction-item">
                            <i class="fas fa-sad-tear"></i>
                            <input type="checkbox" id="sad-reaction">
                            <label for="sad-reaction">Sad</label>
                        </div>
                        <div class="reaction-item">
                            <i class="fas fa-angry"></i>
                            <input type="checkbox" id="angry-reaction">
                            <label for="angry-reaction">Angry</label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="quantity">Số lượng:</label>
                    <input type="number" id="quantity" value="50" min="50" max="200000">
                </div>
                
                <div class="form-group">
                    <label for="speed">Tốc độ:</label>
                    <select id="speed">
                        <option value="fast">Nhanh</option>
                        <option value="normal">Bình thường</option>
                        <option value="slow">Chậm</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="price-per-like">Giá tiền:</label>
                    <input type="text" id="price-per-like" value="26,2" readonly>
                </div>
                
                <div class="form-group">
                    <label for="total-price">Tổng Giá:</label>
                    <input type="text" id="total-price" value="1.310 VND" readonly>
                </div>
                
                <div class="form-group">
                    <label for="notes">Ghi chú:</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,
    
    'Tăng Follow Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders">
                        Mua nhiều đơn cùng lúc
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="account-link">ID hoặc link tài khoản cần tăng sub:</label>
                    <input type="text" id="account-link" placeholder="https://www.facebook.com/username">
                </div>
                
                <div class="form-group">
                    <label for="account-name">Tên tài khoản:</label>
                    <input type="text" id="account-name" placeholder="Tên tài khoản cần chạy vip">
                </div>
                
                <div class="form-group">
                    <label>Chọn server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="follow-server" value="server5" id="follow-server5" checked>
                            <label for="follow-server5">
                                <div class="option-header">
                                    <span class="option-title">Server 5: Sub Tên Việt Nam, tốc độ 10k /1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">20.2 đ</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                                <div class="option-details">
                                    <ul>
                                        <li>Phần lớn là sub beta</li>
                                        <li>tối đa tổng 40k /1 uid. mua vượt quá số lượng sẽ chạy thiếu.</li>
                                        <li>Tối thiểu/Tối đa: 1k/40k</li>
                                    </ul>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="follow-server" value="server6" id="follow-server6">
                            <label for="follow-server6">
                                <div class="option-header">
                                    <span class="option-title">Server 6: Sub tên ngẫu nhiên, tốc độ 20k /1 ngày, bảo hành 7 ngày.</span>
                                    <span class="option-price">36 đ</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="follow-server" value="server7" id="follow-server7">
                            <label for="follow-server7">
                                <div class="option-header">
                                    <span class="option-title">Server 7: Sub Tây, tốc độ 10k / 1 ngày, bảo hành 7 ngày</span>
                                    <span class="option-price">29.9 đ</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="follow-server" value="server11" id="follow-server11">
                            <label for="follow-server11">
                                <div class="option-header">
                                    <span class="option-title">Server 11: Sub Via Việt nam, tốc độ 5k / 1 ngày, bảo hành 7 ngày. (đang tụt cao)</span>
                                    <span class="option-price">25.8 đ</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="follow-server" value="server12" id="follow-server12">
                            <label for="follow-server12">
                                <div class="option-header">
                                    <span class="option-title">Server 12: Sub Via Việt nam, tốc độ 5k-10k/1 ngày, bảo hành 7 ngày. (đang tụt cao)</span>
                                    <span class="option-price">50.4 đ</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="follow-server" value="server15" id="follow-server15">
                            <label for="follow-server15">
                                <div class="option-header">
                                    <span class="option-title">Server 15: Sub Via Việt nam, tốc độ 20k / 1 ngày, bảo hành 7 ngày.</span>
                                    <span class="option-price">65.8 đ</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="follow-server" value="server16" id="follow-server16">
                            <label for="follow-server16">
                                <div class="option-header">
                                    <span class="option-title">Server 16: Sub Via Việt nam, tốc độ 30k / 1 ngày, bảo hành 7 ngày.</span>
                                    <span class="option-price">89.8 đ</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="follow-server" value="server17" id="follow-server17">
                            <label for="follow-server17">
                                <div class="option-header">
                                    <span class="option-title">Server 17: Sub Via Việt nam, tốc độ 50k / 1 ngày, bảo hành 7 ngày.</span>
                                    <span class="option-price">113.8 đ</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="follow-quantity">Số lượng:</label>
                    <input type="number" id="follow-quantity" value="1000" min="1000" max="40000">
                </div>
                
                <div class="form-group">
                    <label for="follow-price-per">Giá Tiền Mỗi Tương Tác:</label>
                    <input type="text" id="follow-price-per" value="20,2" readonly>
                </div>
                
                <div class="form-group">
                    <label for="follow-total-price">Tổng Giá:</label>
                    <input type="text" id="follow-total-price" value="20.200 VND" readonly>
                </div>
                
                <div class="form-group">
                    <label for="follow-notes">Ghi chú:</label>
                    <textarea id="follow-notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,
    
    'Tăng Comment Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders">
                        Mua nhiều đơn cùng lúc
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="comment-post-link">ID hoặc link bài viết cần chạy:</label>
                    <input type="text" id="comment-post-link" placeholder="https://www.facebook.com/username/posts/idfb">
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="get-uid-reply">
                        Get UID reply cmt
                    </label>
                </div>
                
                <div class="form-group">
                    <label>Chọn server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="comment-server" value="server4" id="comment-server4" checked>
                            <label for="comment-server4">
                                <div class="option-header">
                                    <span class="option-title">Server 4: Việt Nam. Tốc độ ổn</span>
                                    <span class="option-price">468₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                                <div class="option-details">
                                    <ul>
                                        <li>Có tỉ lệ nhỏ nick bình luận không có ảnh đại diện</li>
                                        <li>Không hỗ trợ các nội dung lừa đảo, vi phạm chính trị, đạo đức, kí tự đặc biệt, nội dung chứa SĐT hoặc link Https://</li>
                                        <li>Bình luận lên chậm thường lên sau vài chục phút, không hỗ trợ hoàn khi mua livestream</li>
                                        <li>Tối thiểu/Tối đa: 10/2.5k</li>
                                    </ul>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="comment-server" value="server5" id="comment-server5">
                            <label for="comment-server5">
                                <div class="option-header">
                                    <span class="option-title">Server 5: Việt Nam. Tốc độ nhanh</span>
                                    <span class="option-price">588₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="comment-server" value="server6" id="comment-server6">
                            <label for="comment-server6">
                                <div class="option-header">
                                    <span class="option-title">Server 6: Việt Nam. Tốc độ ổn</span>
                                    <span class="option-price">420₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="comment-server" value="server7" id="comment-server7">
                            <label for="comment-server7">
                                <div class="option-header">
                                    <span class="option-title">Server 7: Việt Nam. Tốc độ nhanh</span>
                                    <span class="option-price">588₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="comment-server" value="server8" id="comment-server8">
                            <label for="comment-server8">
                                <div class="option-header">
                                    <span class="option-title">Server 8: Nick tích xanh Tên Việt Nam.</span>
                                    <span class="option-price">8.400₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Danh Sách Bình Luận (0)</label>
                    <p style="color: red; font-size: 12px;">(Không hỗ trợ bài viết vi phạm pháp luật đạo đức, đòi nợ, lô đề, cờ bạc)</p>
                    <textarea id="comment-list" placeholder="Mỗi bình luận 1 dòng, tối thiểu 5 bình luận" rows="10"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="comment-price-per">Giá Tiền Mỗi Bình Luận:</label>
                    <input type="text" id="comment-price-per" value="468" readonly>
                </div>
                
                <div class="form-group">
                    <label for="comment-total-price">Tổng Giá:</label>
                    <input type="text" id="comment-total-price" value="0 VND" readonly>
                </div>
                
                <div class="form-group">
                    <label for="comment-notes">Ghi chú:</label>
                    <textarea id="comment-notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,
    
    'Tăng Share Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders">
                        Mua nhiều đơn cùng lúc
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="share-post-link">ID hoặc link bài viết cần chạy:</label>
                    <input type="text" id="share-post-link" placeholder="https://www.facebook.com/username/posts/idfb">
                </div>
                
                <div class="form-group">
                    <label>Chọn server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="share-server" value="server2" id="share-server2" checked>
                            <label for="share-server2">
                                <div class="option-header">
                                    <span class="option-title">Server 2: Chia sẻ việt, tốc độ nhanh</span>
                                    <span class="option-price">276₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                                <div class="option-details">
                                    <ul>
                                        <li>Hỗ trợ tất cả các link trên nền tảng FB</li>
                                        <li>Tối thiểu/Tối đa: 30/10k</li>
                                    </ul>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="share-server" value="server6" id="share-server6">
                            <label for="share-server6">
                                <div class="option-header">
                                    <span class="option-title">Server 6: Share việt, tốc độ siêu tốc</span>
                                    <span class="option-price">348₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="share-server" value="server7" id="share-server7">
                            <label for="share-server7">
                                <div class="option-header">
                                    <span class="option-title">Server 7: Kèm nội dung khi share</span>
                                    <span class="option-price">360₫</span>
                                    <span class="status-badge slow">Chậm</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="share-server" value="server8" id="share-server8">
                            <label for="share-server8">
                                <div class="option-header">
                                    <span class="option-title">Server 8: Share ảo [chỉ lên post, không chạy video]</span>
                                    <span class="option-price">18₫</span>
                                    <span class="status-badge stopped">Ngừng nhận đơn</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="share-server" value="server5" id="share-server5">
                            <label for="share-server5">
                                <div class="option-header">
                                    <span class="option-title">Server 5: Share ảo [ Lên Siêu Tốc - Chạy video, livestream]</span>
                                    <span class="option-price">24₫</span>
                                    <span class="status-badge active">Hoạt động</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="share-quantity">Số lượng:</label>
                    <input type="number" id="share-quantity" value="30" min="30" max="10000">
                </div>
                
                <div class="form-group">
                    <label for="share-price-per">Giá Tiền Mỗi Tương Tác:</label>
                    <input type="text" id="share-price-per" value="276" readonly>
                </div>
                
                <div class="form-group">
                    <label for="share-total-price">Tổng Giá:</label>
                    <input type="text" id="share-total-price" value="8.280 VND" readonly>
                </div>
                
                <div class="form-group">
                    <label for="share-notes">Ghi chú:</label>
                    <textarea id="share-notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `
};

// Function to load service content
function loadServiceContent(serviceName) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent && serviceTemplates[serviceName]) {
        mainContent.innerHTML = serviceTemplates[serviceName];
        initializeServicePages();
        initializePriceCalculation();
        showNotification(`Đã tải dịch vụ: ${serviceName}`, 'success');
    }
}

// Function to load overview content
function loadOverviewContent() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <h1>Trang Chủ</h1>
            
            <!-- User Profile Section -->
            <div class="user-profile">
                <div class="profile-info">
                    <div class="profile-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="profile-details">
                        <h3>hunkmike111 <i class="fas fa-check-circle verified"></i></h3>
                        <p>hungmai16.work@gmail.com</p>
                        <span class="status">Thành Viên</span>
                    </div>
                </div>
                
                <div class="stats-cards">
                    <div class="stat-card">
                        <i class="fas fa-wallet"></i>
                        <div>
                            <h4>Số Dư</h4>
                            <p>0₫</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-dollar-sign"></i>
                        <div>
                            <h4>Tổng nạp tháng</h4>
                            <p>0₫</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-star"></i>
                        <div>
                            <h4>Cấp bậc</h4>
                            <p>Thành Viên</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Important Notices -->
            <div class="notices-section">
                <div class="notice-item">
                    <i class="fas fa-gem"></i>
                    <span>Khách hàng mới: Liên kết Telegram để nhận tất cả thông báo và bảo mật tài khoản</span>
                    <button class="link-btn">Liên kết ngay</button>
                </div>
                <div class="notice-item">
                    <i class="fas fa-gem"></i>
                    <span>Lưu ý: Tài khoản sẽ bị xoá nếu sau 5 ngày không phát sinh giao dịch.</span>
                </div>
            </div>

            <!-- Admin Message -->
            <div class="admin-message">
                <div class="admin-header">
                    <i class="fas fa-user-shield"></i>
                    <span>Quản Trị Viên</span>
                    <span class="timestamp">01/08 lúc 09:56</span>
                </div>
                <div class="admin-content">
                    <p>Thời gian từ : 10:00 ngày 01/8 đến 15:00 ngày 02/8 năm 2025</p>
                    <p>Chúc cộng tác viên và đại lý tháng mới gặp nhiều may mắn</p>
                    <p>==> Nhóm zalo 2: link nhóm 3</p>
                    <p>==> Nhóm zalo 1 (đã full): link nhóm 2</p>
                </div>
            </div>

            <!-- Promotion Banner -->
            <div class="promotion-banner">
                <div class="promo-badge">KHUYẾN MÃI NẠP TIỀN 10%</div>
                <div class="promo-content">
                    <h2>KHUYẾN MÃI THÁNG 8</h2>
                    <p>Ưu đãi đặc biệt cho khách hàng mới</p>
                </div>
            </div>
        `;
    }
}


