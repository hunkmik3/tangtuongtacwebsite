document.addEventListener('DOMContentLoaded', function() {
    // API client & admin guard
    const DEFAULT_API_BASE = `${location.protocol}//${location.hostname}:4000`;
    function getApiBases() {
        const bases = [];
        if (window.API_BASE_URL) bases.push(window.API_BASE_URL);
        bases.push(`${location.protocol}//${location.hostname}:4000`);
        bases.push(`${location.protocol}//localhost:4000`);
        bases.push(`${location.protocol}//127.0.0.1:4000`);
        return [...new Set(bases)];
    }
    const token = localStorage.getItem('auth.token');
    if (!token) { window.location.href = 'login.html'; return; }
    async function apiFetchAny(path, options = {}) {
        let lastErr = new Error('Không thể kết nối máy chủ');
        for (const base of getApiBases()) {
            try {
                const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
                headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch(`${base}${path}`, { ...options, headers });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
                return data;
            } catch (e) { lastErr = e; }
        }
        throw lastErr;
    }
    (async () => {
        try {
            const me = await apiFetchAny('/api/users/me');
            if (me?.role !== 'ADMIN') { alert('Chỉ quản trị viên mới được truy cập'); window.location.href = 'index.html'; return; }
            await loadUsers();
            bindUserTableActions();
        } catch (e) {
            console.error(e);
        }
    })();

    async function loadUsers() {
        const tbody = document.querySelector('.users-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="8">Đang tải...</td></tr>';
        try {
            const users = await apiFetchAny('/api/admin/users');
            const rows = users.map((u) => {
                const createdAt = u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '';
                const initials = (u.username || 'U').substring(0,2).toUpperCase();
                return `
                <tr data-id="${u.id}">
                  <td><input type="checkbox"></td>
                  <td>
                    <div class="user-info">
                      <img src="https://via.placeholder.com/40x40/667eea/ffffff?text=${initials}" alt="Avatar">
                      <div>
                        <strong>${u.username}</strong>
                        <span>ID: ${u.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>${u.email || ''}</td>
                  <td><span class="badge ${u.role === 'ADMIN' ? 'vip' : 'user'}">${u.role}</span></td>
                  <td><span class="status active">Hoạt động</span></td>
                  <td>${createdAt}</td>
                  <td>-</td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn btn-sm btn-primary" data-action="edit" data-id="${u.id}" title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
                      <button class="btn btn-sm btn-danger" data-action="delete" data-id="${u.id}" title="Xóa"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>`;
            }).join('\n');
            tbody.innerHTML = rows || '<tr><td colspan="8">Chưa có người dùng</td></tr>';
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="8">Lỗi tải danh sách người dùng</td></tr>';
        }
    }

    function bindUserTableActions() {
        const tbody = document.querySelector('.users-table tbody');
        if (!tbody) return;
        tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const id = Number(btn.getAttribute('data-id'));
            const action = btn.getAttribute('data-action');
            if (action === 'edit') {
                openEditUserModal(id);
            } else if (action === 'delete') {
                if (confirm('Bạn có chắc muốn xóa người dùng này? Hành động không thể hoàn tác.')) {
                    try {
                        await apiFetchAny(`/api/admin/users/${id}`, { method: 'DELETE' });
                        const row = tbody.querySelector(`tr[data-id="${id}"]`);
                        if (row) row.remove();
                        showNotification('Đã xóa người dùng', 'success');
                    } catch (err) {
                        showNotification(err.message || 'Xóa người dùng thất bại', 'error');
                    }
                }
            }
        });
    }

    function openEditUserModal(userId) {
        const row = document.querySelector(`tr[data-id="${userId}"]`);
        const currentUsername = row?.querySelector('strong')?.textContent || '';
        const currentEmail = row?.children[2]?.textContent || '';
        const currentRole = row?.querySelector('.badge')?.textContent || 'USER';

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
          <div class="modal-card">
            <h3>Chỉnh sửa người dùng</h3>
            <div class="modal-row">
              <label>Tên đăng nhập</label>
              <input id="edit-username" type="text" value="${currentUsername}">
            </div>
            <div class="modal-row">
              <label>Email</label>
              <input id="edit-email" type="email" value="${currentEmail}">
            </div>
            <div class="modal-row">
              <label>Vai trò</label>
              <select id="edit-role">
                <option value="USER" ${currentRole==='USER'?'selected':''}>USER</option>
                <option value="ADMIN" ${currentRole==='ADMIN'?'selected':''}>ADMIN</option>
              </select>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" id="edit-cancel">Hủy</button>
              <button class="btn btn-primary" id="edit-save">Lưu</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e)=>{ if(e.target===overlay) overlay.remove(); });
        overlay.querySelector('#edit-cancel').addEventListener('click', ()=> overlay.remove());
        overlay.querySelector('#edit-save').addEventListener('click', async ()=>{
            const payload = {
                username: overlay.querySelector('#edit-username').value.trim(),
                email: overlay.querySelector('#edit-email').value.trim(),
                role: overlay.querySelector('#edit-role').value
            };
            try {
                const updated = await apiFetchAny(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) });
                if (row) {
                    row.querySelector('strong').textContent = updated.username;
                    row.children[2].textContent = updated.email || '';
                    const badge = row.querySelector('.badge');
                    badge.textContent = updated.role;
                    badge.className = `badge ${updated.role === 'ADMIN' ? 'vip' : 'user'}`;
                }
                overlay.remove();
                showNotification('Cập nhật người dùng thành công', 'success');
            } catch (err) {
                showNotification(err.message || 'Cập nhật thất bại', 'error');
            }
        });
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

    // Action Buttons (delegate)
    document.body.addEventListener('click', async function(e) {
        const targetBtn = e.target.closest('.action-buttons .btn');
        if (!targetBtn) return;
        const action = targetBtn.getAttribute('data-action') || targetBtn.title || targetBtn.textContent.trim();
        const row = targetBtn.closest('tr');
            
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
            } else if (action === 'order-complete') {
                if (confirm('Xác nhận hoàn thành đơn hàng?')) {
                    try {
                        const id = Number(targetBtn.getAttribute('data-id'));
                        await apiFetchAny(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) });
                        const statusCell = row.querySelector('.status');
                        statusCell.textContent = 'Hoàn thành';
                        statusCell.className = 'status completed';
                        showNotification('Đơn hàng đã được hoàn thành!', 'success');
                    } catch(err){ showNotification(err.message || 'Lỗi cập nhật', 'error'); }
                }
            } else if (action === 'order-processing') {
                try {
                    const id = Number(targetBtn.getAttribute('data-id'));
                    await apiFetchAny(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'PROCESSING' }) });
                    const statusCell = row.querySelector('.status');
                    statusCell.textContent = 'Đang xử lý';
                    statusCell.className = 'status processing';
                    showNotification('Đã chuyển sang Đang xử lý', 'info');
                } catch(err){ showNotification(err.message || 'Lỗi cập nhật', 'error'); }
            } else if (action === 'order-cancel') {
                if (confirm('Xác nhận hủy đơn hàng?')) {
                    try {
                        const id = Number(targetBtn.getAttribute('data-id'));
                        await apiFetchAny(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELED' }) });
                        const statusCell = row.querySelector('.status');
                        statusCell.textContent = 'Hủy bỏ';
                        statusCell.className = 'status canceled';
                        showNotification('Đơn hàng đã được hủy!', 'warning');
                    } catch(err){ showNotification(err.message || 'Lỗi cập nhật', 'error'); }
                }
            } else if (action.includes('Tạo lại')) {
                showNotification('Đang tạo lại đơn hàng...', 'info');
            } else if (action === 'topup-confirm') {
                const id = Number(targetBtn.getAttribute('data-id'));
                if (confirm('Xác nhận cộng tiền cho giao dịch này?')) {
                    try {
                        await apiFetchAny(`/api/admin/topups/${id}/confirm`, { method: 'PATCH', body: JSON.stringify({}) });
                        showNotification('Đã xác nhận giao dịch!', 'success');
                        loadTransactions();
                    } catch (err) { showNotification(err.message || 'Lỗi xác nhận', 'error'); }
                }
            } else if (action === 'topup-cancel') {
                const id = Number(targetBtn.getAttribute('data-id'));
                const reason = prompt('Lý do hủy (tùy chọn):', '');
                if (confirm('Xác nhận hủy giao dịch này?')) {
                    try {
                        await apiFetchAny(`/api/admin/topups/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) });
                        showNotification('Đã hủy giao dịch!', 'warning');
                        loadTransactions();
                    } catch (err) { showNotification(err.message || 'Lỗi hủy', 'error'); }
                }
            }
    });

    // Load Orders (admin view)
    async function loadOrders() {
        const table = document.querySelector('#orders table.orders-table tbody');
        if (!table) return;
        table.innerHTML = '<tr><td colspan="8">Đang tải...</td></tr>';
        try {
            const orders = await apiFetchAny('/api/orders');
            const rows = orders.map(o => {
                const statusMap = { PENDING: 'Chờ xử lý', PROCESSING: 'Đang xử lý', COMPLETED: 'Hoàn thành', CANCELED: 'Hủy bỏ' };
                const created = o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '';
                return `
                <tr data-id="${o.id}">
                    <td><strong>#${String(o.id).padStart(5,'0')}</strong></td>
                    <td>${o.user?.username || '-'}</td>
                    <td>${o.service?.name || '-'}</td>
                    <td>${o.quantity}</td>
                    <td>₫${(o.amountVnd||0).toLocaleString('vi-VN')}</td>
                    <td><span class="status ${String(o.status).toLowerCase()}">${statusMap[o.status]||o.status}</span></td>
                    <td>${created}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-success" data-action="order-complete" data-id="${o.id}" title="Hoàn thành"><i class="fas fa-check"></i></button>
                            <button class="btn btn-sm btn-warning" data-action="order-processing" data-id="${o.id}" title="Đang xử lý"><i class="fas fa-play"></i></button>
                            <button class="btn btn-sm btn-danger" data-action="order-cancel" data-id="${o.id}" title="Hủy"><i class="fas fa-times"></i></button>
                        </div>
                    </td>
                </tr>`;
            }).join('\n');
            table.innerHTML = rows || '<tr><td colspan="8">Chưa có đơn hàng</td></tr>';
        } catch (e) {
            table.innerHTML = '<tr><td colspan="8">Lỗi tải danh sách đơn hàng</td></tr>';
        }
    }

    // Load Services list into Services tab
    async function loadServices() {
        const container = document.querySelector('#services .services-grid');
        if (!container) return;
        try {
            const services = await apiFetchAny('/api/services');
            if (!Array.isArray(services)) return;
            container.innerHTML = services.map(s => `
                <div class="service-card">
                    <div class="service-header">
                        <h3>${s.name}</h3>
                        <div class="service-status ${s.active ? 'active' : 'inactive'}">${s.active ? 'Hoạt động' : 'Tạm ngưng'}</div>
                    </div>
                    <div class="service-stats">
                        <div class="stat-item">
                            <span class="stat-label">Giá/Đơn vị</span>
                            <span class="stat-value">₫${(s.rateVnd||0).toLocaleString('vi-VN')}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Đơn hàng</span>
                            <span class="stat-value">${s._count?.orders || 0}</span>
                        </div>
                    </div>
                </div>`).join('\n');
        } catch (e) {
            // giữ nguyên giao diện tĩnh nếu lỗi
        }
    }

    // Load Transactions (Topups) từ API và hỗ trợ xác nhận/hủy thủ công
    async function loadTransactions() {
        const table = document.querySelector('#transactions table.transactions-table tbody');
        if (!table) return;
        table.innerHTML = '<tr><td colspan="8">Đang tải...</td></tr>';
        try {
            const topups = await apiFetchAny('/api/topups');
            const rows = (topups || []).map(t => {
                const created = t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '';
                const statusMap = { PENDING: 'Đang chờ', COMPLETED: 'Thành công', FAILED: 'Thất bại', CANCELED: 'Hủy' };
                const statusCls = String(t.status || '').toLowerCase();
                const amount = `₫${(t.amountVnd || 0).toLocaleString('vi-VN')}`;
                const username = t.user?.username || '-';
                const provider = t.provider || '-';
                const actions = t.status === 'PENDING'
                  ? `<div class="action-buttons">
                        <button class="btn btn-sm btn-success" data-action="topup-confirm" data-id="${t.id}" title="Xác nhận"><i class="fas fa-check"></i></button>
                        <button class="btn btn-sm btn-danger" data-action="topup-cancel" data-id="${t.id}" title="Hủy"><i class="fas fa-times"></i></button>
                     </div>`
                  : `<div class="action-buttons"><button class="btn btn-sm btn-secondary" data-action="topup-view" data-id="${t.id}" title="Xem"><i class="fas fa-eye"></i></button></div>`;
                return `
                <tr data-id="${t.id}">
                    <td><strong>#${String(t.id).padStart(5,'0')}</strong></td>
                    <td>${username}</td>
                    <td><code>${t.contentCode || ''}</code></td>
                    <td>${amount}</td>
                    <td>${provider}</td>
                    <td><span class="status ${statusCls}">${statusMap[t.status] || t.status}</span></td>
                    <td>${created}</td>
                    <td>${actions}</td>
                </tr>`;
            }).join('\n');
            table.innerHTML = rows || '<tr><td colspan="8">Chưa có giao dịch</td></tr>';
        } catch (e) {
            table.innerHTML = '<tr><td colspan="8">Lỗi tải giao dịch</td></tr>';
        }
    }

    // Load Reports overview numbers
    async function loadReports() {
        const usersEl = document.querySelector('#dashboard .stats-grid .stat-card:nth-child(1) h3');
        const ordersTodayEl = document.querySelector('#dashboard .stats-grid .stat-card:nth-child(2) h3');
        const revenueEl = document.querySelector('#dashboard .stats-grid .stat-card:nth-child(3) h3');
        const activeUsersEl = document.querySelector('#dashboard .stats-grid .stat-card:nth-child(4) h3');
        try {
            const o = await apiFetchAny('/api/stats/overview');
            if (usersEl) usersEl.textContent = (o.users||0).toLocaleString('vi-VN');
            if (ordersTodayEl) ordersTodayEl.textContent = (o.todayOrders||0).toLocaleString('vi-VN');
            if (revenueEl) revenueEl.textContent = `₫${(o.revenueVnd||0).toLocaleString('vi-VN')}`;
            if (activeUsersEl) activeUsersEl.textContent = (o.activeUsers||0).toLocaleString('vi-VN');
        } catch (e) {
            // giữ nguyên nếu lỗi
        }
    }

    // Gọi load theo tab khi mở
    loadOrders();
    loadServices();
    loadTransactions();
    loadReports();
    loadRecentActivities();

    async function loadRecentActivities() {
        const list = document.querySelector('#dashboard .recent-activity .activity-list');
        if (!list) return;
        try {
            const acts = await apiFetchAny('/api/admin/activity/recent?limit=5');
            list.innerHTML = acts.map(a => {
                const mapIcon = {
                    REGISTER: 'user-plus',
                    LOGIN: 'check-circle',
                    CREATE_ORDER: 'shopping-cart'
                };
                const icon = mapIcon[a.action] || 'info-circle';
                const time = new Date(a.createdAt).toLocaleTimeString('vi-VN');
                const content = a.action === 'CREATE_ORDER' && a.metadata?.orderId ? `Tạo đơn hàng #${String(a.metadata.orderId).padStart(5,'0')}` : a.action;
                return `
                    <div class="activity-item">
                        <i class="fas fa-${icon}"></i>
                        <div>
                            <span class="activity-date">${time}</span>
                            <p>${a.user?.username || 'Hệ thống'} - ${content}</p>
                        </div>
                    </div>`;
            }).join('\n');
        } catch (e) {
            // không hiển thị nếu lỗi
        }
    }

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

    // Auto-refresh số liệu từ API (không sử dụng số ảo)
    setInterval(() => { loadReports(); }, 60000); // mỗi 60s cập nhật tổng quan

    // Realtime đơn hàng mới qua SSE
    (function initOrderStream(){
        try {
            const srcToken = localStorage.getItem('auth.token');
            if (!srcToken) return;
            const base = getApiBases()[0];
            const es = new EventSource(`${base}/api/admin/orders/stream?token=${encodeURIComponent(srcToken)}`);
            es.addEventListener('order.created', (ev) => {
                try {
                    const data = JSON.parse(ev.data);
                    showNotification(`Đơn hàng mới #${String(data.id).padStart(5,'0')} • ${data.user?.username||'-'} • ${data.service?.name||'-'}`, 'info');
                    // prepend vào bảng đơn hàng nếu đang mở
                    const tbody = document.querySelector('#orders table.orders-table tbody');
                    if (tbody) {
                        const created = data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '';
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><strong>#${String(data.id).padStart(5,'0')}</strong></td>
                            <td>${data.user?.username || '-'}</td>
                            <td>${data.service?.name || '-'}</td>
                            <td>${data.quantity}</td>
                            <td>₫${(data.amountVnd||0).toLocaleString('vi-VN')}</td>
                            <td><span class="status pending">Chờ xử lý</span></td>
                            <td>${created}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-success" title="Hoàn thành"><i class="fas fa-check"></i></button>
                                    <button class="btn btn-sm btn-danger" title="Hủy bỏ"><i class="fas fa-times"></i></button>
                                </div>
                            </td>`;
                        tbody.prepend(row);
                    }
                } catch {}
            });
        } catch {}
    })();

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

    // Làm mới hoạt động gần đây từ API (không tạo dữ liệu giả)
    setInterval(() => { try { if (typeof loadRecentActivities === 'function') loadRecentActivities(); } catch {} }, 15000);

    console.log('Admin dashboard loaded successfully!');
});
