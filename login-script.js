// Đảm bảo khởi tạo chạy kể cả khi DOMContentLoaded đã bắn trước khi script nạp xong
function __initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.toggle-password');
    const loginBtn = document.querySelector('.login-btn');
    const socialBtns = document.querySelectorAll('.social-btn');
    const DEFAULT_API_BASE = (location.protocol.startsWith('http'))
        ? `${location.protocol}//${location.hostname}:4000`
        : 'http://localhost:4000';
    const STORED_API_BASE = localStorage.getItem('api.base');
    const API_BASE = (typeof window !== 'undefined' && window.API_BASE_URL) || STORED_API_BASE || DEFAULT_API_BASE;

    function getApiBases() {
        const bases = [];
        const apiFromWindow = (typeof window !== 'undefined' && window.API_BASE_URL) ? String(window.API_BASE_URL).replace(/\/$/, '') : '';
        let apiFromStorage = STORED_API_BASE ? String(STORED_API_BASE).replace(/\/$/, '') : '';
        const isHttpsPage = (typeof location !== 'undefined') && location.protocol === 'https:';

        // Nếu trang là HTTPS, chỉ nhận API qua HTTPS
        const isHttpsUrl = (u) => /^https:\/\//i.test(u);
        const isHttpUrl = (u) => /^http:\/\//i.test(u);

        if (apiFromWindow && (!isHttpsPage || isHttpsUrl(apiFromWindow))) bases.push(apiFromWindow);
        if (apiFromStorage && (!isHttpsPage || isHttpsUrl(apiFromStorage))) {
            bases.push(apiFromStorage);
        } else if (apiFromStorage && isHttpsPage && isHttpUrl(apiFromStorage)) {
            try { localStorage.removeItem('api.base'); } catch {}
        }

        // Chỉ thêm fallback HTTP cục bộ khi trang đang chạy HTTP (dev). 
        // Nếu trang là HTTPS (Vercel), không thêm HTTP để tránh Mixed Content → Failed to fetch.
        if (!isHttpsPage) {
            const isHttp = location.protocol.startsWith('http');
            if (isHttp) {
                bases.push(`${location.protocol}//${location.hostname}:4000`);
            }
            bases.push('http://localhost:4000');
            bases.push('http://127.0.0.1:4000');
        }

        return [...new Set(bases)];
    }

    async function postJsonAny(path, body) {
        let lastErr = new Error('Không thể kết nối máy chủ');
        for (const base of getApiBases()) {
            try {
                const res = await fetch(`${base}${path}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
                try { localStorage.setItem('api.base', String(base)); } catch {}
                return data;
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr;
    }

    async function getJsonAnyAuth(path) {
        let lastErr = new Error('Không thể kết nối máy chủ');
        const authToken = localStorage.getItem('auth.token');
        for (const base of getApiBases()) {
            try {
                const res = await fetch(`${base}${path}`, {
                    method: 'GET',
                    headers: { 'Authorization': authToken ? `Bearer ${authToken}` : '' }
                });
                const data = await res.json().catch(() => ({}));
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
        throw lastErr;
    }

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Form validation
    function validateForm() {
        let isValid = true;
        
        // Clear previous error states
        clearErrors();
        
        // Username validation
        if (!usernameInput.value.trim()) {
            showError(usernameInput, 'Vui lòng nhập tên đăng nhập');
            isValid = false;
        } else if (usernameInput.value.length < 3) {
            showError(usernameInput, 'Tên đăng nhập phải có ít nhất 3 ký tự');
            isValid = false;
        }
        
        // Password validation
        if (!passwordInput.value.trim()) {
            showError(passwordInput, 'Vui lòng nhập mật khẩu');
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            showError(passwordInput, 'Mật khẩu phải có ít nhất 6 ký tự');
            isValid = false;
        }
        
        return isValid;
    }

    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i>${message}`;
        
        formGroup.appendChild(errorDiv);
    }

    function clearErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        const errorGroups = document.querySelectorAll('.form-group.error');
        
        errorMessages.forEach(msg => msg.remove());
        errorGroups.forEach(group => group.classList.remove('error'));
    }

    // Real-time validation
    usernameInput.addEventListener('blur', function() {
        if (this.value.trim() && this.value.length < 3) {
            showError(this, 'Tên đăng nhập phải có ít nhất 3 ký tự');
        } else {
            clearFieldError(this);
        }
    });

    passwordInput.addEventListener('blur', function() {
        if (this.value.trim() && this.value.length < 6) {
            showError(this, 'Mật khẩu phải có ít nhất 6 ký tự');
        } else {
            clearFieldError(this);
        }
    });

    function clearFieldError(input) {
        const formGroup = input.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');
        
        if (errorMessage) {
            errorMessage.remove();
        }
        formGroup.classList.remove('error');
    }

    // Form submission
    if (loginForm) loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateForm()) return;

        loginBtn.classList.add('loading');
        loginBtn.querySelector('span').textContent = 'Đang đăng nhập...';

        try {
            const data = await postJsonAny('/api/auth/login', {
                usernameOrEmail: usernameInput.value.trim(),
                password: passwordInput.value
            });

            localStorage.setItem('auth.token', data.token);
            if (data.user) localStorage.setItem('auth.user', JSON.stringify(data.user));

            // Xác thực ngay token vừa nhận để tránh điều hướng rồi mới lỗi 401
            try { await getJsonAnyAuth('/api/users/me'); } catch (e) {
                if (e && (e.status === 401)) {
                    localStorage.removeItem('auth.token');
                    localStorage.removeItem('auth.user');
                    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng thử lại.');
                }
            }

            // Hiển thị popup bền vững thay vì toast ngắn
            showSuccessPopup('Đăng nhập thành công', 'Bạn đã đăng nhập thành công. Nhấn để vào trang chính.');
        } catch (err) {
            showNotification(err.message || 'Đăng nhập thất bại', 'error');
        } finally {
            loginBtn.classList.remove('loading');
            loginBtn.querySelector('span').textContent = 'Đăng nhập';
        }
    });

    // Social login buttons
    socialBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const platform = this.classList.contains('facebook') ? 'Facebook' : 'Google';
            
            // Show loading state
            this.style.pointerEvents = 'none';
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Đang kết nối...';
            
            // Simulate social login
            setTimeout(() => {
                showNotification(`Đang kết nối với ${platform}...`, 'info');
                
                // Reset button
                this.innerHTML = originalText;
                this.style.pointerEvents = 'auto';
                
                // Simulate redirect after social login
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            }, 1500);
        });
    });

    // Register link -> open modal
    const registerLink = document.querySelector('.register-link');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            openRegisterModal();
        });
    }

    // Forgot password link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Tính năng quên mật khẩu đang được phát triển...', 'info');
        });
    }

    // Input focus effects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });

    // Remember me checkbox
    const rememberCheckbox = document.getElementById('remember');
    if (rememberCheckbox) {
        // Load saved preference
        const savedRemember = localStorage.getItem('rememberLogin');
        if (savedRemember === 'true') {
            rememberCheckbox.checked = true;
        }
        
        rememberCheckbox.addEventListener('change', function() {
            localStorage.setItem('rememberLogin', this.checked);
        });
    }

    // Auto-fill demo credentials (for demo purposes)
    function fillDemoCredentials() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('demo') === 'true') {
            usernameInput.value = 'hunkmike111';
            passwordInput.value = 'demo123456';
            
            // Trigger validation
            usernameInput.dispatchEvent(new Event('blur'));
            passwordInput.dispatchEvent(new Event('blur'));
        }
    }

    fillDemoCredentials();

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
        
        // Escape to clear form
        if (e.key === 'Escape') {
            loginForm.reset();
            clearErrors();
        }
    });

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
                    z-index: 11000;
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

    // Popup xác nhận đơn giản cho trang đăng ký
    function showSuccessPopup(title = 'Thành công', message = '') {
        // inject styles
        if (!document.getElementById('reg-success-styles')) {
            const s = document.createElement('style');
            s.id = 'reg-success-styles';
            s.textContent = `
              .reg-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:12000}
              .reg-modal{background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.25);width:min(440px,92vw);padding:22px}
              .reg-title{font-weight:700;color:#333;font-size:18px;margin-bottom:8px}
              .reg-body{color:#555;line-height:1.6;margin-bottom:16px}
              .reg-actions{display:flex;gap:10px;justify-content:flex-end}
              .reg-btn{border:none;border-radius:10px;padding:10px 16px;font-weight:600;cursor:pointer}
              .reg-btn.primary{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}
            `;
            document.head.appendChild(s);
        }
        const overlay = document.createElement('div');
        overlay.className = 'reg-overlay';
        overlay.innerHTML = `
          <div class="reg-modal">
            <div class="reg-title">${title}</div>
            <div class="reg-body">${message}</div>
            <div class="reg-actions">
              <button class="reg-btn primary" id="reg-ok" type="button">Vào trang chính</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e)=>{ if(e.target===overlay){ /* không đóng tự động */ } });
        overlay.querySelector('#reg-ok').addEventListener('click', ()=>{ window.location.assign('index.html'); });
        return overlay;
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

    // Add floating shapes animation
    const shapes = document.querySelectorAll('.shape');
    shapes.forEach((shape, index) => {
        shape.style.animationDelay = `${index * 1.5}s`;
    });

    // Add parallax effect to shapes
    document.addEventListener('mousemove', function(e) {
        const shapes = document.querySelectorAll('.shape');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            const x = (mouseX - 0.5) * speed * 50;
            const y = (mouseY - 0.5) * speed * 50;
            
            shape.style.transform = `translate(${x}px, ${y}px) rotate(${x * 0.1}deg)`;
        });
    });

    // Add form field animations
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.animationDelay = `${index * 0.1}s`;
        group.style.animation = 'slideUp 0.6s ease-out forwards';
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
    });

    // Add CSS for form animations
    const animationStyles = document.createElement('style');
    animationStyles.textContent = `
        .form-group {
            animation: slideUp 0.6s ease-out forwards;
        }
        
        @keyframes slideUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .form-group.focused label {
            color: #667eea;
        }
        
        .form-group.focused input {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
    `;
    document.head.appendChild(animationStyles);

    function openRegisterModal() {
        // Inject styles once
        if (!document.getElementById('register-modal-styles')) {
            const s = document.createElement('style');
            s.id = 'register-modal-styles';
            s.textContent = `
                .modal-overlay {position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:10000}
                .modal-card {background:#fff;border-radius:12px;padding:24px;max-width:420px;width:100%;box-shadow:0 10px 30px rgba(0,0,0,.2)}
                .modal-card h3 {margin:0 0 12px 0;font-weight:600;color:#333}
                .modal-row {margin-bottom:12px}
                .modal-row label {display:block;margin-bottom:6px;font-size:14px;color:#333;font-weight:500}
                .modal-row input {width:100%;padding:10px 12px;border:2px solid #e1e5e9;border-radius:8px;font-size:14px}
                .modal-actions {display:flex;gap:10px;justify-content:flex-end;margin-top:8px}
                .btn {border:none;border-radius:8px;padding:10px 14px;font-weight:600;cursor:pointer}
                .btn-primary {background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}
                .btn-secondary {background:#f1f3f5;color:#333}
                .error-text {color:#dc3545;font-size:12px;margin-top:6px}
            `;
            document.head.appendChild(s);
        }

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-card">
                <h3>Tạo tài khoản</h3>
                <div class="modal-row">
                    <label>Tên đăng nhập</label>
                    <input type="text" id="reg-username" placeholder="vd: nguyenanhtuan" />
                </div>
                <div class="modal-row">
                    <label>Email</label>
                    <input type="email" id="reg-email" placeholder="ban@vd.com" />
                </div>
                <div class="modal-row">
                    <label>Mật khẩu</label>
                    <input type="password" id="reg-password" placeholder="Ít nhất 6 ký tự" />
                </div>
                <div class="modal-row">
                    <label>Xác nhận mật khẩu</label>
                    <input type="password" id="reg-password2" placeholder="Nhập lại mật khẩu" />
                    <div class="error-text" id="reg-error" style="display:none"></div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="reg-cancel" type="button">Hủy</button>
                    <button class="btn btn-primary" id="reg-submit" type="button">Đăng ký</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        function closeModal() { overlay.remove(); }
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
        overlay.querySelector('#reg-cancel').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeModal(); });
        overlay.querySelector('#reg-submit').addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            const username = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const password2 = document.getElementById('reg-password2').value;
            const errEl = document.getElementById('reg-error');

            // Basic validation
            errEl.style.display = 'none';
            errEl.textContent = '';
            if (!username || username.length < 3) return showErr('Tên đăng nhập tối thiểu 3 ký tự');
            if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showErr('Email không hợp lệ');
            if (!password || password.length < 6) return showErr('Mật khẩu tối thiểu 6 ký tự');
            if (password !== password2) return showErr('Mật khẩu xác nhận không khớp');

            try {
                const data = await postJsonAny('/api/auth/register', { username, email, password });
                localStorage.setItem('auth.token', data.token);
                if (data.user) localStorage.setItem('auth.user', JSON.stringify(data.user));
                try { await getJsonAnyAuth('/api/users/me'); } catch (e) { /* non-blocking */ }
                // Đóng modal và hiện popup xác nhận rõ ràng
                closeModal();
                showSuccessPopup('Đăng ký thành công', 'Tài khoản đã được tạo. Nhấn vào nút bên dưới để vào trang chính.');
            } catch (err) {
                showErr(err.message || 'Đăng ký thất bại');
            }

            function showErr(msg) {
                errEl.textContent = msg;
                errEl.style.display = 'block';
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __initLoginPage, { once: true });
} else {
    // DOM đã sẵn sàng, khởi chạy ngay
    try { __initLoginPage(); } catch (err) { console.error(err); }
}
