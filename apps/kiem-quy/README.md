# App Kiểm Quỹ - ThienKim.id.vn

Ứng dụng web kiểm quỹ tiền mặt, tối ưu mobile, có thể cài đặt PWA và dùng offline.

## Tính năng

- Bảng mệnh giá dọc: **Mệnh giá | Số lượng | Thành tiền**
- 9 mệnh giá từ **1.000đ → 500.000đ** (ẩn mệnh giá dưới 1.000đ)
- Hiển thị rút gọn: 500.000 → **500**, 50.000 → **50**, ...
- Nhập số lượng tờ → tự tính thành tiền từng dòng
- Nhập số tiền dự kiến để so sánh chênh lệch
- **Tiền thực tế** + đọc số **bằng chữ tiếng Việt**
- Chênh lệch = 0: nền trắng chữ đậm | Chênh lệch ≠ 0: nền đỏ chữ đậm
- Lưu lịch sử (localStorage), xuất CSV, in, sao chép báo cáo
- PWA: cài app lên màn hình điện thoại, hỗ trợ offline

## Cấu trúc file

```
kiem-quy/
├── index.html          # Giao diện & logic chính
├── manifest.json       # Cấu hình PWA
├── service-worker.js   # Cache & offline
└── README.md           # Hướng dẫn
```

## Upload lên hosting

Upload **cả 4 file** (hoặc tối thiểu 3 file: html, manifest, service-worker) vào thư mục trên server, ví dụ:

`https://thienkim.id.vn/kiem-quy/`

### Sau khi upload

1. Mở trang bằng trình duyệt
2. Nhấn **Ctrl + Shift + R** để tải bản mới (tránh cache cũ)
3. Nếu đã cài PWA trước đó: gỡ app cũ → mở lại → cài lại

## Kiểm tra nhanh

- Bảng có 3 cột: Mệnh giá / Số lượng / Thành tiền
- Không còn mệnh giá 500đ, 200đ, 100đ
- Phần kết quả chỉ hiện **Tiền thực tế** và **Chênh lệch** (không có dòng tiền dự kiến)
- Có dòng bằng chữ tiếng Việt dưới tiền thực tế

## Thông tin kỹ thuật

- Font: Google Roboto
- Lưu trữ: localStorage (`kimquy_history`)
- Không cần backend
- Service Worker cache: `kim-quy-v4` (network-first cho HTML)
