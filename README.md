# 🌟 Tăng Tương Tác VIP - Hệ thống tăng tương tác chất lượng hàng đầu Việt Nam

## 📋 Mô tả dự án

Đây là một trang web bán dịch vụ tăng tương tác mạng xã hội với giao diện hiện đại và đầy đủ tính năng. Trang web được thiết kế để cung cấp dịch vụ tăng tương tác cho các nền tảng mạng xã hội như Facebook, Instagram, TikTok, YouTube và nhiều nền tảng khác.

## ✨ Tính năng chính

### 🎨 Giao diện người dùng
- **Thiết kế hiện đại**: Giao diện đẹp mắt với gradient và hiệu ứng glassmorphism
- **Responsive**: Tương thích với mọi thiết bị (desktop, tablet, mobile)
- **Dark Mode**: Chế độ tối với khả năng lưu trữ preference
- **Animations**: Hiệu ứng mượt mà và chuyên nghiệp

### 📊 Dashboard tổng quan
- **Thông tin tài khoản**: Hiển thị thông tin người dùng, số dư, cấp bậc
- **Thống kê**: Số dư, tổng nạp tháng, cấp bậc thành viên
- **Thông báo quan trọng**: Các lưu ý và hướng dẫn cho người dùng
- **Tin nhắn admin**: Thông báo từ quản trị viên

### 🛍️ Quản lý dịch vụ
- **Danh sách dịch vụ**: Facebook, Instagram, TikTok, YouTube, Twitter, v.v.
- **Chọn dịch vụ**: Dropdown để chọn nhanh dịch vụ cần thiết
- **Navigation**: Menu điều hướng đầy đủ chức năng

### 💰 Hệ thống tài chính
- **Nạp tiền**: Giao diện nạp tiền tích hợp
- **Quản lý số dư**: Hiển thị và cập nhật số dư real-time
- **Lịch sử giao dịch**: Theo dõi các giao dịch đã thực hiện

### 🆘 Hỗ trợ khách hàng
- **Chat trực tuyến**: Floating chat icons cho Zalo và Messenger
- **FAQ**: Câu hỏi thường gặp với modal popup
- **Video hướng dẫn**: Video tutorial tích hợp YouTube
- **Liên hệ hỗ trợ**: Nhiều kênh liên hệ khác nhau

## 🚀 Cách sử dụng

### 1. Khởi chạy trang web
```bash
# Mở file index.html trong trình duyệt
# Hoặc sử dụng local server
python -m http.server 8000
# Sau đó truy cập http://localhost:8000
```

### 2. Tính năng chính

#### Dark Mode
- Click vào toggle "Dark Mode" ở góc trên bên phải
- Preference sẽ được lưu trong localStorage

#### Navigation
- Click vào các menu item trong sidebar để chuyển trang
- Hiệu ứng loading sẽ xuất hiện khi chuyển trang

#### Dịch vụ
- Chọn dịch vụ từ dropdown ở top bar
- Click vào các service item trong sidebar để xem chi tiết

#### Hỗ trợ
- Click vào các support item để kết nối
- Click vào FAQ để xem câu trả lời
- Click vào video thumbnail để xem hướng dẫn

#### Chat
- Click vào floating chat icons để mở Zalo/Messenger

## 📁 Cấu trúc file

```
tangtuongtac/
├── index.html          # Trang chính
├── styles.css          # CSS styles
├── script.js           # JavaScript functionality
└── README.md           # Hướng dẫn sử dụng
```

## 🎯 Các trang cần phát triển tiếp

### 1. Trang đăng nhập/đăng ký
- Form đăng nhập với validation
- Form đăng ký tài khoản mới
- Quên mật khẩu
- Xác thực 2FA

### 2. Trang nạp tiền
- Danh sách phương thức thanh toán
- Form nạp tiền với validation
- Lịch sử nạp tiền
- Xác nhận giao dịch

### 3. Trang dịch vụ chi tiết
- Danh sách dịch vụ theo từng nền tảng
- Bảng giá chi tiết
- Form đặt hàng
- Theo dõi đơn hàng

### 4. Trang quản lý tài khoản
- Thông tin cá nhân
- Đổi mật khẩu
- Cài đặt thông báo
- Lịch sử hoạt động

### 5. Trang admin
- Quản lý người dùng
- Quản lý đơn hàng
- Thống kê doanh thu
- Quản lý dịch vụ

## 🛠️ Công nghệ sử dụng

- **HTML5**: Cấu trúc trang web
- **CSS3**: Styling với Flexbox, Grid, Animations
- **JavaScript (ES6+)**: Tương tác và logic
- **Font Awesome**: Icons
- **Google Fonts**: Typography (Inter)

## 🎨 Thiết kế

### Color Scheme
- **Primary**: #667eea (Blue gradient)
- **Secondary**: #764ba2 (Purple gradient)
- **Success**: #28a745 (Green)
- **Warning**: #ffc107 (Yellow)
- **Error**: #dc3545 (Red)
- **Background**: Gradient từ blue đến purple

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Components
- **Cards**: Glassmorphism effect với backdrop-filter
- **Buttons**: Gradient với hover effects
- **Modals**: Responsive với overlay
- **Notifications**: Slide-in animation

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 1200px
- **Tablet**: 768px - 1200px
- **Mobile**: < 768px

### Mobile Features
- Sidebar collapse thành hamburger menu
- Touch-friendly buttons và interactions
- Optimized layout cho màn hình nhỏ

## 🔧 Tùy chỉnh

### Thay đổi màu sắc
Chỉnh sửa CSS variables trong `styles.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --error-color: #dc3545;
}
```

### Thêm dịch vụ mới
Thêm vào HTML trong section service-list:
```html
<div class="service-item">
    <span>Tên dịch vụ mới</span>
    <i class="fas fa-chevron-right"></i>
</div>
```

### Tùy chỉnh thông báo
Sử dụng function `showNotification()`:
```javascript
showNotification('Nội dung thông báo', 'success'); // success, error, warning, info
```

## 🚀 Deployment

### GitHub Pages
1. Push code lên GitHub repository
2. Vào Settings > Pages
3. Chọn source branch (main/master)
4. Truy cập URL được cung cấp

### Netlify
1. Drag & drop folder vào Netlify
2. Hoặc connect với GitHub repository
3. Tự động deploy khi có thay đổi

### Vercel (Frontend)
1. Import project từ GitHub
2. Vercel sẽ tự động deploy frontend (HTML/CSS/JS)
3. Thêm file `config.js` ở gốc và set: `window.API_BASE_URL = 'https://api.your-backend.com'`

### Render/Railway (Backend)
1. Tạo dịch vụ từ thư mục `backend/`
2. Start command: `node server.js`
3. Env cần có: `PORT=4000`, `DATABASE_URL`, `JWT_SECRET`, `WEBHOOK_TOKEN`, `BANK_*`
4. Nếu dùng Postgres: chỉnh `provider = "postgresql"` và chạy `npx prisma generate && npx prisma migrate deploy`

## 📞 Hỗ trợ

Nếu bạn cần hỗ trợ hoặc có câu hỏi:
- **Email**: support@tangtuongtac.com
- **Zalo**: 0123456789
- **Fanpage**: Tăng Tương Tác VIP

## 📄 License

Dự án này được phát triển cho mục đích thương mại. Vui lòng liên hệ để được cấp phép sử dụng.

---

**Tăng Tương Tác VIP** - Hệ thống tăng tương tác chất lượng hàng đầu Việt Nam 🚀
