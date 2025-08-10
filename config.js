// Global frontend config for API endpoint.
// Tự động áp dụng cho mọi trình duyệt/thiết bị, không cần ?api=
(function setGlobalApiBase() {
  var api = 'https://tangtuongtacwebsite.onrender.com';
  try {
    window.API_BASE_URL = api;
    // Ghi vào localStorage để tất cả script dùng cùng một giá trị
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('api.base', api);
    }
  } catch (_) {
    window.API_BASE_URL = api;
  }
  // Log nhẹ để kiểm tra
  try { console.log('🚀 API_BASE_URL =', window.API_BASE_URL); } catch {}
})();
