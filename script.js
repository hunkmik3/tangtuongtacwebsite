// Dark Mode Toggle
document.addEventListener('DOMContentLoaded', function() {
    // API client & auth guard
    const DEFAULT_API_BASE = (location.protocol.startsWith('http'))
        ? `${location.protocol}//${location.hostname}:4000`
        : 'http://localhost:4000';
    const STORED_API_BASE = localStorage.getItem('api.base');
    const PRIMARY_API_BASE = (typeof window !== 'undefined' && window.API_BASE_URL) || STORED_API_BASE || DEFAULT_API_BASE;
    const token = localStorage.getItem('auth.token');

    function getApiBases() {
        const bases = [];
        if (typeof window !== 'undefined' && window.API_BASE_URL) bases.push(String(window.API_BASE_URL).replace(/\/$/, ''));
        if (STORED_API_BASE) bases.push(String(STORED_API_BASE).replace(/\/$/, ''));
        const isHttp = location.protocol.startsWith('http');
        if (isHttp) bases.push(`${location.protocol}//${location.hostname}:4000`);
        bases.push('http://localhost:4000');
        bases.push('http://127.0.0.1:4000');
        return [...new Set(bases)];
    }

    async function apiFetch(path, options = {}) {
        const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        if (token) headers['Authorization'] = `Bearer ${token}`;
        let lastErr = new Error('Không thể kết nối máy chủ');
        for (const base of getApiBases()) {
            try {
                const res = await fetch(`${base}${path}`, { ...options, headers });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    const err = new Error(data?.error || `Lỗi API: ${res.status}`);
                    err.status = res.status;
                    throw err;
                }
                try { localStorage.setItem('api.base', String(base)); } catch {}
                return data;
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr;
    }
    // Xuất ra global để các trang độc lập/inline script có thể dùng chung
    try { window.apiFetch = window.apiFetch || apiFetch; } catch {}

    // Redirect to login nếu đang chạy qua HTTP và chưa có token.
    // Khi chạy file trực tiếp (file://) để dev, cho phép xem UI để không chặn JS init.
    const isLoginPage = /login\.html$/i.test(window.location.pathname);
    const isHttpProtocol = window.location.protocol.startsWith('http');
    if (isHttpProtocol && !isLoginPage && !token) {
        window.location.href = 'login.html';
        return;
    }

    // Helper: bind user fields to UI in any page
    function bindUserToUI(user) {
        if (!user) return;
        const userInfoSpan = document.querySelector('.user-info span');
        if (userInfoSpan && user.username) userInfoSpan.textContent = user.username;
        const emailEl = document.querySelector('.profile-details p');
        if (emailEl && user.email) emailEl.textContent = user.email;
        // Generic bindings: [data-user-field="username"|"email"|"role"]
        document.querySelectorAll('[data-user-field]')
            .forEach(el => {
                const field = el.getAttribute('data-user-field');
                if (field && user[field] != null) el.textContent = String(user[field]);
            });
        // Bind balance on homepage stats if present
        const balanceEl = document.querySelector('.stats-cards .stat-card:nth-child(1) p');
        if (balanceEl && typeof user.balanceVnd === 'number') balanceEl.textContent = `₫${user.balanceVnd.toLocaleString('vi-VN')}`;
    }

    // Fetch current user và bind UI; fallback sang localStorage nếu không thể gọi HTTP
    (async () => {
        const isHttp = window.location.protocol.startsWith('http');
        try {
            if (token && isHttp) {
                const me = await apiFetch('/api/users/me');
                try { localStorage.setItem('auth.user', JSON.stringify(me)); } catch {}
                bindUserToUI(me);
                return;
            }
        } catch (e) {
            if (e && (e.status === 401 || /Unauthorized|Invalid token/i.test(String(e.message)))) {
                localStorage.removeItem('auth.token');
                localStorage.removeItem('auth.user');
                if (isHttp) window.location.href = 'login.html';
            } else {
                console.warn('Fetch /api/users/me failed:', e);
            }
        }

        // Fallback: bind từ localStorage nếu có
        try {
            const cached = JSON.parse(localStorage.getItem('auth.user') || 'null');
            if (cached) bindUserToUI(cached);
        } catch {}
    })();

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

    // Inject mobile toggle buttons if not present
    (function injectMobileToggles(){
        const topBarLeft = document.querySelector('.top-bar-left');
        const topBarRight = document.querySelector('.top-bar-right');
        if (topBarLeft && !topBarLeft.querySelector('.menu-toggle.left')) {
            const btn = document.createElement('button');
            btn.className = 'menu-toggle left';
            btn.setAttribute('aria-label', 'Mở menu');
            btn.innerHTML = '<i class="fas fa-bars"></i>';
            topBarLeft.prepend(btn);
        }
        if (topBarRight && !topBarRight.querySelector('.menu-toggle.right')) {
            const btn = document.createElement('button');
            btn.className = 'menu-toggle right';
            btn.setAttribute('aria-label', 'Mở panel phải');
            btn.innerHTML = '<i class="fas fa-sliders-h"></i>';
            topBarRight.appendChild(btn);
        }
        if (!document.querySelector('.drawer-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'drawer-overlay';
            document.body.appendChild(overlay);
        }
    })();

    // Mobile drawer behavior
    (function setupDrawers(){
        const sidebar = document.querySelector('.sidebar');
        const rightSidebar = document.querySelector('.right-sidebar');
        const overlay = document.querySelector('.drawer-overlay');
        const btnLeft = document.querySelector('.menu-toggle.left');
        const btnRight = document.querySelector('.menu-toggle.right');
        function openSide(which){
            if (which === 'left' && sidebar){ sidebar.classList.add('active'); }
            if (which === 'right' && rightSidebar){ rightSidebar.classList.add('active'); }
            if (overlay){ overlay.classList.add('active'); }
            document.body.classList.add('no-scroll');
        }
        function closeAll(){
            if (sidebar) sidebar.classList.remove('active');
            if (rightSidebar) rightSidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
        if (btnLeft) btnLeft.addEventListener('click', ()=> openSide('left'));
        if (btnRight) btnRight.addEventListener('click', ()=> openSide('right'));
        if (overlay) overlay.addEventListener('click', closeAll);
        // Close on ESC
        document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeAll(); });
        // Close when navigating sidebar links on small screens
        document.querySelectorAll('.sidebar .nav-item, .sidebar a').forEach(a=>{
            a.addEventListener('click', ()=>{
                if (window.innerWidth <= 1024) closeAll();
            });
        });
        // Auto-close when resizing back to desktop
        window.addEventListener('resize', ()=>{
            if (window.innerWidth > 1024) closeAll();
        });
    })();

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
                    window.location.href = 'account.html';
                } else if (navText === 'Nạp Tiền') {
                    window.location.href = 'topup.html';
                } else if (navText === 'Liên Hệ Hỗ Trợ') {
                    showNotification('Chức năng liên hệ hỗ trợ đang được phát triển', 'info');
                }
            }, 1000);
        });
    });

    // Service items click handler + open Topup modal from sidebar "Nạp Tiền"
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

    // Sidebar "Nạp Tiền" button
    const sidebarNavTopup = Array.from(document.querySelectorAll('.main-nav .nav-item')).find(a=>/Nạp Tiền/i.test(a.textContent||''));
    if (sidebarNavTopup) { sidebarNavTopup.addEventListener('click', function(e){ e.preventDefault(); window.location.href = 'topup.html'; }); }

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
                localStorage.removeItem('auth.token');
                localStorage.removeItem('auth.user');
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

    // Service select change (chỉ gắn khi phần tử tồn tại)
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
            e.stopPropagation();

            const spanEl = this.querySelector('span');
            const linkEl = this.querySelector('a');
            const serviceName = spanEl ? spanEl.textContent.trim() : (linkEl ? linkEl.textContent.trim() : '');
            console.log('Service item clicked:', serviceName);

            // Giữ người dùng ở lại trang cho các dịch vụ Instagram/Threads/Facebook và nạp trang con tương ứng
            const isInstagramItem = (serviceName && /Instagram|View Reels/i.test(serviceName)) || (linkEl && /instagram-/.test(linkEl.getAttribute('href') || ''));
            const isThreadsItem = (serviceName && /Threads/i.test(serviceName)) || (linkEl && /threads-/.test(linkEl.getAttribute('href') || ''));
            const isFacebookItem = (serviceName && /Facebook/i.test(serviceName));
            if (isInstagramItem || isThreadsItem) {
                const mapNameToUrl = {
                    'Tăng Like Instagram': 'instagram-like.html',
                    'Tăng Follow Instagram': 'instagram-follow.html',
                    'Tăng Comment Instagram': 'instagram-comment.html',
                    'Tăng View Reels': 'instagram-view-reels.html',
                    'Like Threads': 'threads-like.html',
                    'Follow Threads': 'threads-follow.html'
                };
                const targetUrl = (linkEl && linkEl.getAttribute('href')) || mapNameToUrl[serviceName] || 'instagram-like.html';

                // Nếu đang chạy từ file:// (môi trường local) thì điều hướng trực tiếp để tránh lỗi fetch bị chặn bởi trình duyệt
                const isLocalFile = location.protocol === 'file:';
                if (isLocalFile) {
                    if (e) e.preventDefault();
                    window.location.href = targetUrl;
                    return;
                }

                // Ngược lại, thử nạp động; nếu lỗi sẽ fallback sang điều hướng
                if (e) e.preventDefault();
                showNotification(`Đang tải dịch vụ: ${serviceName}...`, 'info');
                loadExternalServicePage(targetUrl, serviceName).catch(() => {
                    window.location.href = targetUrl;
                });
                return;
            } else if (isFacebookItem) {
                if (e) e.preventDefault();
                // Nạp template trùng tên mục con Facebook
                if (serviceTemplates[serviceName]) {
                    loadServiceContent(serviceName);
                } else {
                    // Fallback: vẫn có thể dùng trang tổng Facebook nếu chưa có template cụ thể
                    if (serviceTemplates['Facebook']) loadServiceContent('Facebook');
                }
                return;
            }

            // Nếu có thẻ <a> với href, ưu tiên điều hướng sang trang riêng
            if (linkEl && linkEl.getAttribute('href')) {
                showNotification(`Đang tải dịch vụ: ${serviceName}...`, 'info');
                window.location.href = linkEl.getAttribute('href');
                return;
            }

            // Fallback: tải template nếu có cấu hình động
            if (serviceTemplates[serviceName]) {
                loadServiceContent(serviceName);
            } else if (serviceName) {
                showNotification(`Dịch vụ ${serviceName} đang được phát triển`, 'info');
            }
        });
    });

    /**
     * Nạp trang con (instagram-*.html) vào khu vực .main-content hiện tại và gắn lại sự kiện tính giá
     */
    async function loadExternalServicePage(url, displayName) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const incomingMain = doc.querySelector('.main-content');
            const mainContent = document.querySelector('.main-content');
            if (incomingMain && mainContent) {
                mainContent.innerHTML = incomingMain.innerHTML;
                hydrateInstagramPage();
                showNotification(`Đã tải dịch vụ: ${displayName}`, 'success');
            } else if (mainContent) {
                mainContent.innerHTML = html;
                hydrateInstagramPage();
                showNotification(`Đã tải dịch vụ: ${displayName}`, 'success');
            }
        } catch (err) {
            console.error('Failed to load external service page', err);
            showNotification('Không thể tải nội dung dịch vụ. Đang chuyển hướng sang trang riêng...', 'warning');
            // Fallback: điều hướng trực tiếp nếu fetch thất bại (ví dụ chạy từ file://)
            try {
                window.location.href = url;
            } catch (_) {
                // bỏ qua
            }
        }
    }

    /**
     * Gắn lại logic tính giá cho các trang Instagram được nạp động
     */
    function hydrateInstagramPage() {
        const container = document.querySelector('.main-content');
        if (!container) return;

        const serverInputs = container.querySelectorAll('input[name="server"]');
        const quantityInput = container.querySelector('#quantity');
        const commentList = container.querySelector('#comment-list');
        const pricePerInteractionInput = container.querySelector('#price-per-interaction');
        const estimatedPriceInput = container.querySelector('#estimated-price');
        const bulkToggle = container.querySelector('#bulk-toggle');
        let bulkGroup = container.querySelector('#bulk-group');
        let bulkList = container.querySelector('#bulk-list');

        // Inject bulk section if toggle exists but group not rendered yet (áp dụng cho Like/Follow/View)
        if (bulkToggle && !bulkGroup && !commentList) {
            bulkGroup = document.createElement('div');
            bulkGroup.id = 'bulk-group';
            bulkGroup.className = 'form-group';
            bulkGroup.style.display = 'none';
            bulkGroup.innerHTML = `
                <label for="bulk-list">Danh sách link (mỗi dòng 1 link)</label>
                <textarea id="bulk-list" rows="4" placeholder="Mỗi dòng 1 link dịch vụ"></textarea>
                <div class="input-hint">Tổng giá = số dòng × số lượng × đơn giá</div>
            `;
            const formSection = container.querySelector('.form-section');
            const firstInputGroup = formSection ? formSection.querySelector('.form-group:nth-child(1)') : null;
            if (firstInputGroup && firstInputGroup.parentElement) {
                firstInputGroup.parentElement.insertBefore(bulkGroup, firstInputGroup.nextSibling);
            } else if (formSection) {
                formSection.appendChild(bulkGroup);
            }
            bulkList = bulkGroup.querySelector('#bulk-list');
        }

        const recalc = () => {
            const selected = container.querySelector('input[name="server"]:checked');
            const rate = selected ? parseFloat(selected.getAttribute('data-rate')) || 0 : 0;

            if (pricePerInteractionInput) {
                const isInteger = Math.abs(rate - Math.round(rate)) < 1e-9;
                pricePerInteractionInput.value = isInteger ? rate.toFixed(0) : rate.toFixed(1).replace('.', ',');
            }

            let qty = 0;
            if (commentList) {
                qty = commentList.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean).length;
                // Update label count if label exists
                const label = container.querySelector('label[for="comment-list"]');
                if (label) {
                    label.textContent = `Danh Sách Bình Luận (${qty}):`;
                }
            } else if (quantityInput) {
                // Bulk mode: tổng số lượng = (số dòng) × (số lượng mỗi đơn)
                const bulkOn = !!(bulkToggle && bulkToggle.checked && bulkList);
                if (bulkOn) {
                    const orders = (bulkList.value || '')
                        .split(/\r?\n/)
                        .map(s => s.trim())
                        .filter(Boolean);
                    const perOrderQty = parseInt(quantityInput.value) || 0;
                    qty = orders.length * perOrderQty;
                } else {
                    qty = parseInt(quantityInput.value) || 0;
                }
            }

            const total = rate > 0 && qty > 0 ? rate * qty : 0;
            if (estimatedPriceInput) {
                estimatedPriceInput.value = total > 0 ? `${total.toLocaleString('vi-VN')} VND` : '0 VND';
            }
        };

        if (quantityInput) quantityInput.addEventListener('input', recalc);
        if (commentList) commentList.addEventListener('input', recalc);
        serverInputs.forEach(i => i.addEventListener('change', recalc));
        if (bulkToggle) bulkToggle.addEventListener('change', () => {
            if (bulkGroup) bulkGroup.style.display = bulkToggle.checked ? '' : 'none';
            recalc();
        });
        if (bulkList) bulkList.addEventListener('input', recalc);

        recalc();

        // Gắn submit tạo đơn hàng (dùng chung cho tất cả dịch vụ được nạp động)
        const submitBtn = container.querySelector('.submit-btn');
        if (submitBtn && !submitBtn.dataset.boundSubmit) {
            submitBtn.dataset.boundSubmit = '1';
            submitBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const headerText = (container.querySelector('.service-header h1')?.textContent || '').trim();
                    // Suy ra tên dịch vụ lưu trong DB
                    const headerToServiceName = (t) => {
                        const s = t.toLowerCase();
                        if (s.includes('tăng like instagram')) return 'Tăng Like Instagram';
                        if (s.includes('tăng follow instagram')) return 'Tăng Follow Instagram';
                        if (s.includes('tăng comment instagram')) return 'Tăng Comment Instagram';
                        if (s.includes('view reels')) return 'Tăng View Reels Instagram';
                        if (s.includes('tăng like facebook')) return 'Tăng Like Facebook';
                        if (s.includes('tăng follow facebook')) return 'Tăng Follow Facebook';
                        if (s.includes('tăng comment facebook')) return 'Tăng Comment Facebook';
                        if (s.includes('tăng share facebook')) return 'Tăng Share Facebook';
                        if (s.includes('like threads')) return 'Like Threads';
                        if (s.includes('follow threads')) return 'Follow Threads';
                        return t;
                    };

                    async function getServiceIdByName(name) {
                        const services = await apiFetch('/api/services');
                        const found = services.find(x => x.name.toLowerCase() === name.toLowerCase());
                        if (found) return found.id;
                        // Fallback: contains
                        const alt = services.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
                        if (!alt) throw new Error('Không tìm thấy dịch vụ phù hợp');
                        return alt.id;
                    }

                    const serviceName = headerToServiceName(headerText);
                    const serviceId = await getServiceIdByName(serviceName);

                    // Tính quantity
                    let quantity = 0;
                    if (commentList) {
                        quantity = (commentList.value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).length;
                        if (quantity <= 0) throw new Error('Vui lòng nhập danh sách bình luận');
                    } else if (quantityInput) {
                        const bulkOn = !!(bulkToggle && bulkToggle.checked && bulkList);
                        if (bulkOn) {
                            const orders = (bulkList.value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                            const perOrderQty = parseInt(quantityInput.value) || 0;
                            quantity = orders.length * perOrderQty;
                        } else {
                            quantity = parseInt(quantityInput.value) || 0;
                        }
                        if (quantity <= 0) throw new Error('Vui lòng nhập số lượng');
                    }

                    const noteEl = container.querySelector('#notes, #note');
                    const note = noteEl ? noteEl.value || '' : '';

                    const order = await apiFetch('/api/orders', {
                        method: 'POST',
                        body: JSON.stringify({ serviceId, quantity, note })
                    });
                    showNotification(`Tạo đơn thành công #${String(order.id).padStart(5,'0')}`, 'success');
                } catch (err) {
                    showNotification(err.message || 'Lỗi tạo đơn', 'error');
                }
            });
        }
    }
    // Xuất ra global để các trang gọi sau khi nạp HTML có thể truy cập
    try { window.hydrateInstagramPage = hydrateInstagramPage; } catch {}
    
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
    
    // Update optional price-per-interaction if present
    const pricePerInteractionInput = activeService.querySelector('#price-per-interaction');
    if (pricePerInteractionInput) {
        const isInteger = Math.abs(rate - Math.round(rate)) < 1e-9;
        pricePerInteractionInput.value = isInteger ? rate.toFixed(0) : rate.toFixed(1).replace('.', ',');
    }

    if (rate > 0 && quantity > 0) {
        const totalPrice = quantity * rate;
        const formattedPrice = `${totalPrice.toLocaleString('vi-VN')} VND`;
        estimatedPriceInput.value = formattedPrice;
        console.log('Updated price to:', formattedPrice);
    } else {
        estimatedPriceInput.value = '0 VND';
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
    
    // Templates for main services
    'Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Dịch Vụ Facebook</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="bulk-toggle" /> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="facebook-link">Link Facebook:</label>
                    <input type="url" id="facebook-link" placeholder="Nhập link Facebook của bạn">
                </div>
                
                <div class="form-group">
                    <label>Chọn Dịch Vụ:</label>
                    <div class="server-options">
                        <div class="server-option">
                            <input type="radio" name="server" value="like" id="fb-like" data-rate="26" checked>
                            <label for="fb-like">
                                <div class="option-header">
                                    <span class="option-name">Tăng Like</span>
                                    <span class="option-price">50₫/tương tác</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Tối thiểu/Tối đa: 50/50k</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="follow" id="fb-follow" data-rate="20.2">
                            <label for="fb-follow">
                                <div class="option-header">
                                    <span class="option-name">Tăng Follow</span>
                                    <span class="option-price">100₫/tương tác</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Tối thiểu/Tối đa: 50/50k</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="share" id="fb-share" data-rate="276">
                            <label for="fb-share">
                                <div class="option-header">
                                    <span class="option-name">Tăng Share</span>
                                    <span class="option-price">276₫/tương tác</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Tối thiểu/Tối đa: 50/50k</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="server-option">
                            <input type="radio" name="server" value="comment" id="fb-comment" data-rate="500">
                            <label for="fb-share">
                                <div class="option-header">
                                    <span class="option-name">Tăng Comment</span>
                                    <span class="option-price">500₫/bình luận</span>
                                </div>
                                <div class="option-details">
                                    <span class="status-badge active">Hoạt động</span>
                                    <p>Tối thiểu/Tối đa: 50/50k</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="quantity">Số lượng:</label>
                    <input type="number" id="quantity" placeholder="Nhập số lượng (với Comment: số dòng bình luận)" value="100" min="1">
                </div>

                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác:</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá:</label>
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
    'Tăng Like Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Tăng Like Facebook</h3>
                <div class="form-group"><label><input type="checkbox" id="bulk-toggle" /> Mua nhiều đơn cùng lúc</label></div>
                <div class="form-group"><label for="facebook-like-link">Link bài viết:</label><input type="url" id="facebook-like-link" placeholder="https://facebook.com/{post}" required></div>
                <div class="form-group"><label>Chọn server:</label><div class="server-options"><div class="server-option"><input type="radio" name="server" id="fb-like-s1" checked data-rate="26"><label for="fb-like-s1"><span class="server-name">Server: Like việt <span class="server-price">26₫</span></span><div class="server-info"><span class="server-details">Tối thiểu/Tối đa: 50/50k</span></div></label></div></div></div>
                <div class="form-group"><label for="quantity">Số lượng:</label><input type="number" id="quantity" value="100" min="1"></div>
                <div class="form-group"><label for="price-per-interaction">Giá Tiền Mỗi Tương Tác:</label><input type="text" id="price-per-interaction" readonly></div>
                <div class="form-group"><label for="estimated-price">Tổng Giá:</label><input type="text" id="estimated-price" readonly></div>
                <div class="action-buttons"><button class="btn-create-request">Mua</button><button class="btn-manage">Quản Lý ID</button></div>
            </div>
        </div>
    `,
    'Tăng Follow Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Tăng Follow Facebook</h3>
                <div class="form-group"><label><input type="checkbox" id="bulk-toggle" /> Mua nhiều đơn cùng lúc</label></div>
                <div class="form-group"><label for="facebook-follow-link">Link profile:</label><input type="url" id="facebook-follow-link" placeholder="https://facebook.com/{username}" required></div>
                <div class="form-group"><label>Chọn server:</label><div class="server-options"><div class="server-option"><input type="radio" name="server" id="fb-follow-s1" checked data-rate="20.2"><label for="fb-follow-s1"><span class="server-name">Server: Follow việt <span class="server-price">20.2₫</span></span><div class="server-info"><span class="server-details">Tối thiểu/Tối đa: 50/50k</span></div></label></div></div></div>
                <div class="form-group"><label for="quantity">Số lượng:</label><input type="number" id="quantity" value="100" min="1"></div>
                <div class="form-group"><label for="price-per-interaction">Giá Tiền Mỗi Tương Tác:</label><input type="text" id="price-per-interaction" readonly></div>
                <div class="form-group"><label for="estimated-price">Tổng Giá:</label><input type="text" id="estimated-price" readonly></div>
                <div class="action-buttons"><button class="btn-create-request">Mua</button><button class="btn-manage">Quản Lý ID</button></div>
            </div>
        </div>
    `,
    'Tăng Comment Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Tăng Comment Facebook</h3>
                <div class="form-group"><label for="facebook-comment-link">Link bài viết:</label><input type="url" id="facebook-comment-link" placeholder="https://facebook.com/{post}" required></div>
                <div class="form-group"><label>Chọn server:</label><div class="server-options"><div class="server-option"><input type="radio" name="server" id="fb-comment-s1" checked data-rate="500"><label for="fb-comment-s1"><span class="server-name">Server: Comment <span class="server-price">500₫</span></span><div class="server-info"><span class="server-details">Tối thiểu/Tối đa: 10/10k</span></div></label></div></div></div>
                <div class="form-group"><label for="comment-list">Danh Sách Bình Luận (0):</label><textarea id="comment-list" rows="5" placeholder="Mỗi dòng 1 bình luận."></textarea></div>
                <div class="form-group"><label for="price-per-interaction">Giá Tiền Mỗi Tương Tác:</label><input type="text" id="price-per-interaction" readonly></div>
                <div class="form-group"><label for="estimated-price">Tổng Giá:</label><input type="text" id="estimated-price" readonly></div>
                <div class="action-buttons"><button class="btn-create-request">Mua</button><button class="btn-manage">Quản Lý ID</button></div>
            </div>
        </div>
    `,
    'Tăng Share Facebook': `
        <div class="content-wrapper">
            <div class="form-section">
                <h3>Tăng Share Facebook</h3>
                <div class="form-group"><label><input type="checkbox" id="bulk-toggle" /> Mua nhiều đơn cùng lúc</label></div>
                <div class="form-group"><label for="facebook-share-link">Link bài viết:</label><input type="url" id="facebook-share-link" placeholder="https://facebook.com/{post}" required></div>
                <div class="form-group"><label>Chọn server:</label><div class="server-options"><div class="server-option"><input type="radio" name="server" id="fb-share-s1" checked data-rate="276"><label for="fb-share-s1"><span class="server-name">Server: Share <span class="server-price">276₫</span></span><div class="server-info"><span class="server-details">Tối thiểu/Tối đa: 50/50k</span></div></label></div></div></div>
                <div class="form-group"><label for="quantity">Số lượng:</label><input type="number" id="quantity" value="100" min="1"></div>
                <div class="form-group"><label for="price-per-interaction">Giá Tiền Mỗi Tương Tác:</label><input type="text" id="price-per-interaction" readonly></div>
                <div class="form-group"><label for="estimated-price">Tổng Giá:</label><input type="text" id="estimated-price" readonly></div>
                <div class="action-buttons"><button class="btn-create-request">Mua</button><button class="btn-manage">Quản Lý ID</button></div>
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
                    <label for="threads-link">Link bài viết:</label>
                    <input type="url" id="threads-link" placeholder="https://www.threads.net/@username/post/id" required>
                </div>

                <div class="form-group">
                    <label>Chọn dịch vụ:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="th-like" checked data-rate="26.2">
                            <label for="th-like">
                                <span class="server-name">Like Thread</span>
                                <span class="server-price">26.2₫</span>
                            </label>
                        </div>
                        <div class="server-option">
                            <input type="radio" name="server" id="th-follow" data-rate="94.8">
                            <label for="th-follow">
                                <span class="server-name">Follow Thread</span>
                                <span class="server-price">94.8₫</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="quantity">Số lượng:</label>
                    <input type="number" id="quantity" value="100" min="1" oninput="calculatePrice()">
                </div>

                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác:</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>

                <div class="form-group">
                    <label for="estimated-price">Tổng Giá:</label>
                    <input type="text" id="estimated-price" readonly>
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
    
    'Like Youtube': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>

                <div class="form-group">
                    <label for="youtube-like-link">Link Video Youtube</label>
                    <input type="url" id="youtube-like-link" placeholder="https://www.youtube.com/watch?v=abc">
                </div>

                <div class="form-group">
                    <label>Chọn server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="yt-like-sv1" checked data-rate="19.4">
                            <label for="yt-like-sv1">
                                <span class="server-name" data-status="Hoạt động">Server 1: Tốc độ trung bình. BH 15 ngày</span>
                                <div class="server-info">
                                    <span class="server-details">Tối thiểu/Tối đa: 50/20k</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="50" min="1">
                </div>

                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác:</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>

                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>

                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>

                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Share TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="tiktok-share-link">Link bài viết</label>
                    <input type="url" id="tiktok-share-link" placeholder="www.tiktok.com/@profile/video/12345">
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="tt-share-sv1" checked data-rate="16.6">
                            <label for="tt-share-sv1">
                                <span class="server-name" data-status="Hoạt động">Server 1: Bảo hành 30 ngày</span>
                                <div class="server-info"><span class="server-details">Tốc độ khá ổn. Tối thiểu/Tối đa: 100/10tr</span></div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="100" min="1">
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    // TikTok Livestream services
    'Tim Livestream Tiktok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="ttlive-like-profile">Link profile</label>
                    <input type="url" id="ttlive-like-profile" placeholder="https://www.tiktok.com/@profile/live">
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="ttlive-like-sv1" checked data-rate="10.6">
                            <label for="ttlive-like-sv1">
                                <span class="server-name" data-status="Hoạt động">Server 1</span>
                                <div class="server-info"><span class="server-details">Tối thiểu/Tối đa: 500/50k</span></div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="500" min="1">
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Like</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Share Livestream TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="ttlive-share-profile">Link profile</label>
                    <input type="url" id="ttlive-share-profile" placeholder="https://www.tiktok.com/@profile/live">
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="ttlive-share-sv2" checked data-rate="24">
                            <label for="ttlive-share-sv2">
                                <span class="server-name" data-status="Hoạt động">Server 2: Share Việt, cấm dồn đơn</span>
                                <div class="server-info"><span class="server-details">Thời gian chạy vài phút, đều và chậm. Tối thiểu/Tối đa: 200/100k</span></div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="200" min="1">
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Share</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Comment Livestream TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="ttlive-cmt-profile">Link profile</label>
                    <input type="url" id="ttlive-cmt-profile" placeholder="https://www.tiktok.com/@profile/live">
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="ttlive-cmt-sv1" checked data-rate="300">
                            <label for="ttlive-cmt-sv1">
                                <span class="server-name" data-status="Hoạt động">Server 1: Icon biểu tượng ngẫu nhiên</span>
                                <div class="server-info"><span class="server-details">Người bình luận là tên Nước Ngoài. Tốc độ tăng rất nhanh. Tối thiểu/Tối đa: 10/100k</span></div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="10" min="1">
                </div>
                <div class="server-info" style="background:#5661ff22">
                    <span class="server-details">Đây là comment Emoji ngẫu nhiên, không nhập nội dung comment.</span>
                </div>
                <div class="form-group" style="margin-top:12px;">
                    <label for="price-per-interaction">Giá Tiền Mỗi Comment</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Mắt LiveStream TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="ttlive-viewer-profile">Link profile</label>
                    <input type="url" id="ttlive-viewer-profile" placeholder="https://www.tiktok.com/@profile/live">
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="ttlive-viewer-sv1" checked data-rate="9.8">
                            <label for="ttlive-viewer-sv1">
                                <span class="server-name" data-status="Hoạt động">Server 1: Ổn định</span>
                                <div class="server-info"><span class="server-details">Không mua cùng lúc 2 server trên 1 link live. Tối thiểu/Tối đa: 50/5k</span></div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="duration-mins">Số phút</label>
                    <select id="duration-mins">
                        <option value="30">30 phút</option>
                        <option value="60">60 phút</option>
                        <option value="90">90 phút</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="50" min="1">
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Điểm chiến đấu (PK) Tiktok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="ttlive-pk-profile">Link profile</label>
                    <input type="url" id="ttlive-pk-profile" placeholder="https://www.tiktok.com/@profile/live">
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="ttlive-pk-sv1" checked data-rate="16.6">
                            <label for="ttlive-pk-sv1">
                                <span class="server-name" data-status="Hoạt động">Server 1: DV không hoàn khi lỗi (mỗi live chỉ mua 1 đơn)</span>
                                <div class="server-info"><span class="server-details">Dịch vụ lên có thể thiếu so với số lượng mua. Thường tăng kèm lượt like (nếu có). Tối thiểu/Tối đa: 500/10k</span></div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="500" min="1">
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Comment TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="tiktok-cmt-link">Link bài viết</label>
                    <input type="url" id="tiktok-cmt-link" placeholder="www.tiktok.com/@profile/video/12345">
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="tt-cmt-sv4" checked data-rate="720">
                            <label for="tt-cmt-sv4">
                                <span class="server-name" data-status="Hoạt động">Server 4: Nick việt, tốc độ chậm (cần tối thiểu 1 bình luận)</span>
                                <div class="server-info">
                                    <span class="server-details">Nội dung có thể bị tiktok ẩn và trùng lặp; Tối thiểu/Tối đa: 10/20</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Nhập nội dung Comment - Mỗi dòng tương đương với 1 Comment (0)</label>
                    <textarea id="comment-list" rows="8" placeholder="Mỗi bình luận 1 dòng, tối thiểu 5 bình luận"></textarea>
                    <div class="server-info" style="margin-top:8px;background:#ff3b7f1a;border-left-color:#ff3b7f">
                        <span class="server-details">Nghiêm cấm bình luận nội dung vi phạm pháp luật, xúc phạm danh phẩm. Nếu vi phạm bạn tự chịu trách nhiệm.</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'View TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="tiktok-view-link">Link bài viết</label>
                    <input type="url" id="tiktok-view-link" placeholder="www.tiktok.com/@profile/video/12345">
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="tt-view-sv3" checked data-rate="0.84">
                            <label for="tt-view-sv3">
                                <span class="server-name" data-status="Hoạt động">Server 3: Ổn định</span>
                                <div class="server-info">
                                    <span class="server-details">Thường lên ngay lập tức, nếu delay sẽ chạy trong 24 giờ. Tối thiểu/Tối đa: 1k/100k</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng (đơn vị: lượt xem)</label>
                    <input type="number" id="quantity" value="1000" min="1">
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi View</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Follow TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="tiktok-follow-profile">Link profile</label>
                    <input type="url" id="tiktok-follow-profile" placeholder="www.tiktok.com/@profile">
                    <small>Tuyệt đối không đổi User trong quá trình chạy</small>
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="tt-follow-sv2" checked data-rate="94.8">
                            <label for="tt-follow-sv2">
                                <span class="server-name" data-status="Hoạt động">Server 2: Sub việt, tốc độ 5k / 24h</span>
                                <div class="server-info">
                                    <span class="server-details">Gói tốc độ nhanh, không nên dồn đơn. Không bảo hành. Tối thiểu/Tối đa: 100/10k</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="100" min="1">
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Like Comment TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="tiktok-likecmt-post">Link bài viết</label>
                    <input type="url" id="tiktok-likecmt-post" placeholder="www.tiktok.com/@profile/video/12345">
                </div>
                <div class="form-group">
                    <label for="tiktok-likecmt-profile">Link/Username profile người comment</label>
                    <input type="text" id="tiktok-likecmt-profile" placeholder="www.tiktok.com/@profile">
                    <small>Ví dụ: https://www.tiktok.com/@profile</small>
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="tt-likecmt-sv2" checked data-rate="20.4">
                            <label for="tt-likecmt-sv2">
                                <span class="server-name" data-status="Hoạt động">Server 2: Tốc độ nhanh</span>
                                <div class="server-info">
                                    <span class="server-details">User có nhiều dấu chấm có thể không nhận diện được. Tối thiểu/Tối đa: 50/10k</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="50" min="1">
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Like (Tim) TikTok': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>
                <div class="form-group">
                    <label for="tiktok-like-link">Link bài viết</label>
                    <input type="url" id="tiktok-like-link" placeholder="www.tiktok.com/@profile/video/12345">
                </div>
                <div class="form-group">
                    <label>Chọn server</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="tt-like-sv1" checked data-rate="14.4">
                            <label for="tt-like-sv1">
                                <span class="server-name" data-status="Hoạt động">Server 1: Like việt, 5k-10k/24h</span>
                                <div class="server-info">
                                    <span class="server-details">Có hỗ trợ hoàn tiền khi chậm. Phù hợp gói dưới 1k, tốc độ rất nhanh. Tối thiểu/Tối đa: 50/10k</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="50" min="1">
                </div>
                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>
                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>
                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>
                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'View Youtube': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>

                <div class="form-group">
                    <label for="youtube-view-link">Link Video Youtube</label>
                    <input type="url" id="youtube-view-link" placeholder="https://www.youtube.com/watch?v=abc">
                </div>

                <div class="form-group">
                    <label>Chọn server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="yt-view-sv1" checked data-rate="41.4">
                            <label for="yt-view-sv1">
                                <span class="server-name" data-status="Hoạt động">Server 1: Min 500. Speed 1k/day</span>
                                <div class="server-info">
                                    <span class="server-details">- Phần lớn là nguồn ngoại và không xác định.<br>- Bảo hành view 30 ngày.<br>- Tối thiểu/Tối đa: 500/từ</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" value="500" min="1">
                </div>

                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác:</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>

                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>

                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>

                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
                </div>
            </div>
        </div>
    `,

    'Subcribe Youtube': `
        <div class="content-wrapper">
            <div class="form-section">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="multiple-orders"> Mua nhiều đơn cùng lúc
                    </label>
                </div>

                <div class="form-group">
                    <label for="youtube-sub-link">Link Kênh Youtube</label>
                    <input type="url" id="youtube-sub-link" placeholder="https://www.youtube.com/channel/abc">
                </div>

                <div class="form-group">
                    <label>Chọn server:</label>
                    <div class="server-options">
                        <div class="server-option selected">
                            <input type="radio" name="server" id="yt-sub-sv1" checked data-rate="372">
                            <label for="yt-sub-sv1">
                                <span class="server-name" data-status="Bảo trì">Server 4: Bảo hành 30 ngày, [500 / 1 ngày]</span>
                                <div class="server-info">
                                    <span class="server-details">Tham khảo: 372₫/sub</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="quantity">Số lượng</label>
                    <input type="number" id="quantity" min="1">
                </div>

                <div class="form-group">
                    <label for="price-per-interaction">Giá Tiền Mỗi Tương Tác:</label>
                    <input type="text" id="price-per-interaction" readonly>
                </div>

                <div class="form-group">
                    <label for="estimated-price">Tổng Giá</label>
                    <input type="text" id="estimated-price" readonly>
                </div>

                <div class="form-group">
                    <label for="notes">Ghi chú</label>
                    <textarea id="notes" placeholder="Nhập ghi chú nếu cần"></textarea>
                </div>

                <div class="action-buttons">
                    <button class="btn-create-request">Mua</button>
                    <button class="btn-manage">Quản Lý ID</button>
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
        // Gắn lại logic tính giá theo format chuẩn (server + quantity hoặc comment-list)
        if (typeof hydrateInstagramPage === 'function') {
            hydrateInstagramPage();
        }
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


