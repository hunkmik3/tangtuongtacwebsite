image.pngdocument.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.toggle-password');
    const loginBtn = document.querySelector('.login-btn');
    const socialBtns = document.querySelectorAll('.social-btn');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

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
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            // Show loading state
            loginBtn.classList.add('loading');
            loginBtn.querySelector('span').textContent = 'Đang đăng nhập...';
            
            // Simulate API call
            setTimeout(() => {
                // Simulate successful login
                showNotification('Đăng nhập thành công!', 'success');
                
                setTimeout(() => {
                    // Redirect to dashboard
                    window.location.href = 'index.html';
                }, 1500);
                
            }, 2000);
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

    // Register link
    const registerLink = document.querySelector('.register-link');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Trang đăng ký đang được phát triển...', 'info');
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
});
