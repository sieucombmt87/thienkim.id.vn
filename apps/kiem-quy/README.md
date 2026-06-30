# App Kiểm Quỹ - ThienKim.id.vn

Ứng dụng web kiểm quỹ tiền mặt, có thể cài đặt ra màn hình và sử dụng offline.

## Tính năng

- Đếm tiền theo 12 mệnh giá (500k → 100đ)
- So sánh với số dự kiến, hiển thị chênh lệch
- 2 chế độ nhập: số lượng tờ hoặc thành tiền
- Lưu lịch sử kiểm quỹ (localStorage)
- Xuất Excel
- In/xuất kết quả
- PWA: cài đặt ra màn hình điện thoại
- Hoạt động offline
- Responsive: điện thoại + máy tính

## Upload lên thienkim.id.vn

### Cách 1: FTP / File Manager (nhanh nhất)

1. Upload toàn bộ file trong thư mục này lên thư mục gốc của domain `thienkim.id.vn`:
   - `index.html`
   - `manifest.json`
   - `service-worker.js`

2. Đảm bảo các file được upload đúng vị trí, không bỏ thư mục cha.

### Cách 2: Hosting cPanel

1. Đăng nhập cPanel của thienkim.id.vn
2. Mở **File Manager**
3. Navigate đến thư mục `public_html` hoặc thư mục root của domain
4. Upload 3 file: `index.html`, `manifest.json`, `service-worker.js`
5. Xác nhận ghi đè nếu có file trùng tên

### Cách 3: GitHub Pages + Custom Domain

1. Tạo repository mới trên GitHub
2. Push các file lên repository
3. Settings → Pages → Source: main branch
4. Settings → Pages → Custom domain: thienkim.id.vn
5. Cấu hình DNS trỏ về GitHub Pages

## Kiểm tra

Sau khi upload xong, truy cập `https://thienkim.id.vn`

### Cài đặt app (PWA)

1. Mở app trên trình duyệt Chrome/Safari (điện thoại)
2. Nhấn **"Cài đặt"** (banner hiện ở đầu trang)
3. Hoặc: Menu → "Cài đặt về màn hình chính"

App sẽ xuất hiện như 1 ứng dụng riêng trên điện thoại.

## Cấu trúc file

```
thienkim.id.vn/
├── index.html          # Giao diện chính
├── manifest.json        # PWA manifest
└── service-worker.js    # Offline support
```

## Thông tin thêm

- Font: Google Roboto (tự động tải)
- Lưu trữ: localStorage (trong trình duyệt)
- Không cần server backend
- Chạy được trên mọi trình duyệt hiện đại
