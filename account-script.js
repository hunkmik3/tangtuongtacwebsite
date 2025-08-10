document.addEventListener('DOMContentLoaded', function() {
    // --- API helpers (tái sử dụng base URL và token lưu trong localStorage)
    function getApiBases() {
        const bases = [];
        const stored = localStorage.getItem('api.base');
        if (typeof window !== 'undefined' && window.API_BASE_URL) bases.push(String(window.API_BASE_URL).replace(/\/$/, ''));
        if (stored) bases.push(String(stored).replace(/\/$/, ''));
        const isHttp = location.protocol.startsWith('http');
        if (isHttp) bases.push(`${location.protocol}//${location.hostname}:4000`);
        bases.push('http://localhost:4000', 'http://127.0.0.1:4000');
        return [...new Set(bases)];
    }

    async function getJsonAnyAuth(path) {
        let lastErr = new Error('Không thể kết nối máy chủ');
        const token = localStorage.getItem('auth.token');
        for (const base of getApiBases()) {
            try {
                const res = await fetch(`${base}${path}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    const err = new Error(data?.error || `HTTP ${res.status}`);
                    err.status = res.status;
                    throw err;
                }
                try { localStorage.setItem('api.base', String(base)); } catch {}
                return data;
            } catch (e) { lastErr = e; }
        }
        throw lastErr;
    }

    async function updateProfileAny(path, body) {
        const methods = ['PATCH', 'PUT', 'POST'];
        const token = localStorage.getItem('auth.token');
        let lastErr = new Error('Không thể kết nối máy chủ');
        for (const base of getApiBases()) {
            for (const method of methods) {
                try {
                    const res = await fetch(`${base}${path}`, {
                        method,
                        headers: { 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    const text = await res.text();
                    let data = {};
                    try { data = text ? JSON.parse(text) : {}; } catch { /* may be HTML on proxies */ }
                    if (!res.ok) {
                        const err = new Error(data?.error || `HTTP ${res.status}`);
                        err.status = res.status;
                        throw err;
                    }
                    try { localStorage.setItem('api.base', String(base)); } catch {}
                    return data;
                } catch (e) {
                    lastErr = e;
                }
            }
        }
        throw lastErr;
    }
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

    // Nạp dữ liệu hồ sơ từ API khi vào trang
    (async () => {
        try {
            const me = await getJsonAnyAuth('/api/users/me');
            const username = me?.username || 'User';
            const joinDate = me?.createdAt ? new Date(me.createdAt).toLocaleDateString('vi-VN') : '';
            const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text ?? ''; };
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };

            setText('topbar-username', username);
            setText('sidebar-username', username);
            setText('sidebar-join-date', joinDate);

            setVal('fullname', me.fullName || '');
            setVal('email', me.email || '');
            setVal('phone', me.phone || '');
            if (me.birthday) {
                const d = new Date(me.birthday);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setVal('birthday', `${yyyy}-${mm}-${dd}`);
            } else setVal('birthday', '');
            const addrEl = document.getElementById('address'); if (addrEl) addrEl.value = me.address || '';
            setVal('city', me.city || '');
            setVal('country', me.country || '');
        } catch (e) {
            console.warn('Không thể tải thông tin người dùng', e);
        }
    })();

    // Form Validation and Submission
    const saveProfileBtn = document.getElementById('saveProfile');
    const profileForm = document.querySelector('.profile-form');
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function() {
            const inputs = profileForm.querySelectorAll('input[required], textarea[required]');
            let isValid = true;
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#f44336';
                    setTimeout(() => { input.style.borderColor = '#e1e5e9'; }, 1500);
                }
            });

            if (!isValid) {
                showNotification('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
                return;
            }

            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
            this.disabled = true;

            const profileData = {
                fullName: document.getElementById('fullname').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                birthday: document.getElementById('birthday').value || null,
                address: document.getElementById('address') ? document.getElementById('address').value.trim() : null,
                city: document.getElementById('city') ? document.getElementById('city').value.trim() : null,
                country: document.getElementById('country') ? document.getElementById('country').value.trim() : null
            };

            updateProfileAny('/api/users/me', profileData)
                .then(() => {
                    showNotification('Thông tin đã được cập nhật thành công!', 'success');
                })
                .catch(err => {
                    const msg = (err && err.message) ? err.message : 'Cập nhật thất bại';
                    showNotification(msg, 'error');
                })
                .finally(() => {
                    this.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
                    this.disabled = false;
                });
        });
    }

    // Bỏ nạp từ localStorage vì đã dùng dữ liệu từ API

    // Reset profile button
    const resetBtn = document.getElementById('resetProfile');
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const savedProfileRaw2 = localStorage.getItem('account.profile');
            if (savedProfileRaw2) {
                try {
                    const p = JSON.parse(savedProfileRaw2);
                    document.getElementById('fullname').value = p.fullname || '';
                    document.getElementById('email').value = p.email || '';
                    document.getElementById('phone').value = p.phone || '';
                    document.getElementById('birthday').value = p.birthday || '';
                    const addressEl = document.getElementById('address'); if (addressEl) addressEl.value = p.address || '';
                    const cityEl = document.getElementById('city'); if (cityEl) cityEl.value = p.city || '';
                    const countryEl = document.getElementById('country'); if (countryEl) countryEl.value = p.country || '';
                    showNotification('Đã khôi phục theo dữ liệu đã lưu.', 'info');
                } catch {}
            } else {
                profileForm.reset();
                showNotification('Không có dữ liệu đã lưu để khôi phục.', 'warning');
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
                    localStorage.removeItem('auth.token');
                    localStorage.removeItem('auth.user');
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

    // Load activity list and subscribe realtime
    (function initActivity(){
        const list = document.getElementById('activity-list');
        if (!list) return;
        const render = (items)=>{
            const iconMap = { LOGIN:'sign-in-alt', REGISTER:'user-plus', UPDATE_PROFILE:'cog', CREATE_ORDER:'shopping-cart' };
            list.innerHTML = (items||[]).map(a=>{
                const icon = iconMap[a.action] || 'info-circle';
                const time = new Date(a.createdAt).toLocaleString('vi-VN');
                let title = a.action;
                let desc = '';
                if (a.action === 'CREATE_ORDER' && a.metadata?.orderId) {
                    title = 'Đặt hàng mới';
                    const orderId = a.metadata.orderId;
                    const qty = a.metadata?.quantity;
                    const svc = a.metadata?.serviceName;
                    const info = (qty && svc) ? ` • ${qty.toLocaleString('vi-VN')} ${svc}` : '';
                    desc = `Đơn hàng #${String(orderId).padStart(5,'0')}${info}`;
                } else if (a.action === 'ORDER_STATUS' && a.metadata?.orderId) {
                    const st = String(a.metadata?.status || '').toUpperCase();
                    const map = { PENDING: 'Đang xử lý', PROCESSING: 'Đang xử lý', COMPLETED: 'Đã hoàn thành', CANCELED: 'Đã hủy' };
                    title = `Trạng thái đơn hàng`;
                    const orderId = a.metadata.orderId;
                    const qty = a.metadata?.quantity;
                    const svc = a.metadata?.serviceName;
                    const extra = (qty && svc) ? ` • ${qty.toLocaleString('vi-VN')} ${svc}` : '';
                    desc = `#${String(orderId).padStart(5,'0')} • ${map[st] || st}${extra}`;
                } else if (a.action === 'LOGIN') { title = 'Đăng nhập thành công'; }
                else if (a.action === 'UPDATE_PROFILE') { title = 'Cập nhật thông tin'; }
                return `
                <div class="activity-item">
                  <div class="activity-icon">
                    <i class="fas fa-${icon}"></i>
                  </div>
                  <div class="activity-content">
                    <h4>${title}</h4>
                    <p>${desc}</p>
                    <span class="activity-time">${time}</span>
                  </div>
                </div>`;
            }).join('');
        };
        // initial load
        const filterSelect = document.querySelector('#activity .activity-filters .filter-select');
        const dateInput = document.querySelector('#activity .activity-filters .date-filter');
        async function reloadWithFilter(){
            try {
                const all = await getJsonAnyAuth('/api/activity/recent?limit=50');
                const type = filterSelect ? filterSelect.value : 'Tất cả hoạt động';
                const dateStr = dateInput ? dateInput.value : '';
                let items = all;
                if (type && type !== 'Tất cả hoạt động') {
                    const map = { 'Đăng nhập': 'LOGIN', 'Đơn hàng': 'CREATE_ORDER', 'Giao dịch': 'PAYMENT', 'Cài đặt': 'UPDATE_PROFILE' };
                    const key = map[type] || type;
                    items = items.filter(a => a.action === key || (a.action === 'ORDER_STATUS' && key === 'CREATE_ORDER'));
                }
                if (dateStr) {
                    const day = new Date(dateStr);
                    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                    const end = new Date(start.getTime() + 24*60*60*1000);
                    items = items.filter(a => { const t = new Date(a.createdAt).getTime(); return t>=start && t<end; });
                }
                render(items);
            } catch {}
        }
        reloadWithFilter();
        if (filterSelect) filterSelect.addEventListener('change', reloadWithFilter);
        if (dateInput) dateInput.addEventListener('change', reloadWithFilter);
        // sse
        try {
            const token = localStorage.getItem('auth.token');
            const base = getApiBases()[0];
            const es = new EventSource(`${base}/api/activity/stream?token=${encodeURIComponent(token||'')}`);
            es.addEventListener('activity', async ()=>{ reloadWithFilter(); });
        } catch {}
    })();

    console.log('Account management page loaded successfully!');

    // Topup UI logic
    (function initTopup(){
        const btn = document.getElementById('topup-create');
        const amountEl = document.getElementById('topup-amount');
        const result = document.getElementById('topup-result');
        const listWrap = document.getElementById('topup-list');
        if (!btn) return;
        const fmt = (v)=> `₫${(v||0).toLocaleString('vi-VN')}`;
        async function loadTopups(){
            try{
                const items = await getJsonAnyAuth('/api/topups');
                if (listWrap) {
                    listWrap.innerHTML = (items||[]).map(t=>{
                        const statusMap = { PENDING:'Đang chờ', COMPLETED:'Thành công', FAILED:'Thất bại', CANCELED:'Hủy' };
                        const created = new Date(t.createdAt).toLocaleString('vi-VN');
                        const amount = fmt(t.amountVnd);
                        const statusCls = String(t.status).toLowerCase();
                        return `
                        <div class="transaction-item">
                          <div class="transaction-icon deposit"><i class="fas fa-plus"></i></div>
                          <div class="transaction-content">
                            <h4>Nạp tiền</h4>
                            <p>Mã: ${t.contentCode || '-'} | Ngân hàng: ${t.provider || ''}</p>
                            <span class="transaction-time">${created}</span>
                          </div>
                          <div class="transaction-amount positive">${amount}</div>
                          <div class="transaction-status ${statusCls}">${statusMap[t.status]||t.status}</div>
                        </div>`;
                    }).join('');
                }
            }catch{}
        }
        loadTopups();
        btn.addEventListener('click', async ()=>{
            const amount = Math.max(parseInt(amountEl.value)||0, 10000);
            btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo QR...';
            try{
                const data = await patchJsonAnyAuth('/api/topup/create'.replace('PATCH','POST'), { amountVnd: amount });
                result.style.display = 'flex';
                result.innerHTML = `
                  <img src="${data.qrUrl}" alt="VietQR" style="height:120px;border-radius:10px;border:1px solid #eee" />
                  <div>
                    <div><strong>Nội dung chuyển khoản:</strong> <code style="background:#f1f3f5;padding:2px 6px;border-radius:6px">${data.contentCode}</code></div>
                    <div><strong>Số tiền:</strong> ${fmt(data.amountVnd)}</div>
                    <div><strong>Ngân hàng:</strong> ${data.bank?.name||''} (${data.bank?.account})</div>
                  </div>
                `;
                showNotification('Đã tạo yêu cầu nạp tiền. Vui lòng quét QR và chuyển khoản đúng nội dung.', 'success');
                loadTopups();
            }catch(err){
                showNotification(err.message||'Không tạo được yêu cầu nạp', 'error');
            }finally{
                btn.disabled = false; btn.innerHTML = '<i class="fas fa-qrcode"></i> Tạo QR nạp tiền';
            }
        });
    })();
});
