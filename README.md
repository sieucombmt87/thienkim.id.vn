# TKver3.8 - Mobile Typography Fix

- Sửa App Center mobile: chữ không còn vỡ/xuống dòng tùy tiện.
- Sửa app con: khung nội dung rộng 100%, chữ đọc bình thường.
- Tối ưu header user/role không đè nhau.

# TKver3.8 - Mobile Power Fix

- Card mobile tăng lên 82-84vw.
- 1 card gần tương đương 1 màn hình, lộ nhẹ card kế tiếp.
- Nút Khám phá ngay bám sát mép dưới card.
- Giảm khoảng trống thừa giữa header/card/footer.

# TKver3.8 - Real Mobile Fix

## Đã sửa đúng class thực tế của homepage
- `.page`
- `.hero-line`
- `.welcome-inline`
- `.title-stack`
- `.cards-stage`
- `.card-shell`
- `.value-bar`
- `.value-item`

## Mobile
- Header thu nhỏ thật sự.
- Slogan không chiếm chiều cao.
- 5 card chuyển sang vuốt ngang.
- Card nhỏ hơn.
- Nút khám phá nhỏ hơn.
- Value bar chỉ còn 1 hàng, ẩn mô tả phụ.
- Không còn dàn trang dài gây kéo dọc quá nhiều.

# TKver3.8 - Mobile Optimized

## Cập nhật
- Header nhỏ hơn trên mobile.
- Dòng `5 KHÔNG GIAN • 1 HÀNH TRÌNH • VÔ VÀN GIÁ TRỊ` thu gọn.
- Card giảm khoảng 35% trên mobile.
- Nút `Khám phá ngay` nhỏ hơn.
- 5 card vuốt ngang, không xếp dọc dài.
- Thanh `Kết nối • Học hỏi • Phát triển • Bứt phá • Tỏa sáng` giữ 1 hàng.
- Tối ưu Mobile / Tablet / Desktop 32 inch.
- Kiểm tra thêm các module App Center, Profile, Admin, Store cho mobile.

# TKver3.8 - Production Clean Build

- Đã dọn file debug/tài liệu tạm/thư mục cũ.
- Chi tiết trong `CLEANUP_DETAILS.md`.

# TKver3.8 - App Center Direct / Permission Excel

- App Center chuyển sang `/apps/`.
- Trang cũ `/app/` tự redirect sang `/apps/`.
- Trang chủ card 5 mở `/apps/`.
- Role badge ở trang chủ bấm về Admin nếu là Admin/VIP/0947924444.
- App Manager chỉ hiện cho role VIP hoặc user 0947924444.
- Chuẩn bị Excel phân quyền Google Sheet.

# TKver3.8 - App Center Cleanup + Apps Folder

- Tắt nút Care nổi.
- Tim hồng chỉ nằm sau role/user.
- Xóa nút Trang chủ và Admin login ở cuối module.
- App Manager chỉ hiện cho role VIP hoặc user 0947924444.
- Role/user chip có thể bấm về Admin nếu là Admin/VIP/0947924444.
- Thêm thư mục `/apps/ai-video/` từ file app bạn gửi.
- Tạo sẵn thư mục `/apps/` cho tất cả app để sau này thay file riêng.
- Create Video trỏ về `/apps/ai-video/`.

# TKver3.8 - Full Feature Build

## Hoàn thành trong bản này
- VIP App Engine.
- Thêm app mới: Create Video.
- Thêm app mới: AI Prompt.
- App VIP có badge 👑 VIP.
- Bấm app VIP lần đầu yêu cầu đăng nhập VIP.
- Sau khi đăng nhập VIP, các app VIP khác không yêu cầu đăng nhập lại trong 24 giờ.
- Smart Ranking: app dùng nhiều sẽ tự lên đầu theo từng user/browser.
- App Manager trong Admin để set app VIP/thường.
- Google Sheet gợi ý cột mở rộng và Apps Script trả thêm cột mở rộng nếu có.
- Mood Widget V2: trái tim nhỏ cạnh dòng chào, nhấp nháy, không chiếm diện tích.
- Version tag chuyển sang màu xanh dương nhỏ.
- Giữ Black Gold theme.

## Gợi ý Google Sheet
Xem file:
`GOOGLE_SHEET_TKVER3.1_COLUMNS.md`


# TKver3.8 - Repair Build

- Sửa lỗi JavaScript ở popup Thiên Kim Care khiến web có thể không chạy.
- Giữ theme Black Gold.
- Version tag: TKver3.8.

# TKver3.8 - Black Gold Edition

## Cập nhật
- Thêm version tag nhỏ góc phải dưới: `TKver3.8`.
- Chuyển màu chủ đạo toàn bộ website sang Đen ánh kim vàng.
- Đồng bộ màu chủ đạo cho các trang/domain con:
  - index
  - login
  - admin
  - me
  - academy
  - app
  - store
  - bi
  - vault
  - pages/module.html
- Giữ nguyên toàn bộ chức năng của TKver3.8.


# TKver3.8 - Thiên Kim Care Popup

- Chuyển cụm Thiên Kim Care sang popup bên hông.
- Thêm nút nổi `💜 Care` để người dùng chủ động mở.
- Không còn chiếm diện tích nội dung chính.

# TKver3.8 - Family Role + Profile Sharing

- Thêm role mới: `Family`.
- Family có quyền viết/sửa phần 1 `Flex Profile` và phần 2 `Academy`.
- Flex Profile thêm chế độ chia sẻ:
  - `public`: ai cũng xem
  - `only`: chỉ nhóm Family xem
- Profile Manager thêm chọn `Public / Only`.
- Thêm `Academy Manager` cho Family/Admin viết nội dung học tập.
- Thêm `DNS_PA_VIETNAM_GUIDE.md` hướng dẫn chuyển sang `thienkim.id.vn`.

Trong Google Sheet, user nào thuộc gia đình thì cột `role` nhập đúng: `Family`.


# TKver3.8 - Flex Profile Timeline

- Tạo trang `me/index.html` riêng cho Flex Profile.
- Hỗ trợ bài viết chia theo năm/tháng.
- Hỗ trợ ảnh cover và nhiều ảnh trong một bài viết.
- Có tab: Nhật ký, Thành tích, Mục tiêu, Thư viện ảnh.
- Có lightbox xem ảnh lớn.
- Thêm `admin/profile-manager.html` để Admin thêm bài viết test.
- Dữ liệu mẫu: `data/profile-info.json`, `data/profile-posts.json`.
- Ảnh mẫu: `assets/uploads/profile/2026/06/`.

Bản này quản lý bài test bằng LocalStorage. Khi muốn đưa bài thành dữ liệu thật, copy JSON từ Profile Manager vào `data/profile-posts.json`, hoặc giai đoạn sau nối Google Sheet `profile_posts`.


# TKver3.8 - API Debug Fix

## Cập nhật
- Sửa `apiLogin()` để thử POST trước, nếu lỗi sẽ fallback sang GET.
- Khi API trả về HTML/lỗi quyền, web sẽ báo rõ hơn thay vì chỉ báo không kết nối.
- Thêm `apps-script/Code.gs` là mã Apps Script chuẩn để paste lại vào Google Apps Script.
- Thêm `api-debug.html` để test trực tiếp API sau khi upload GitHub.

## Cách test
Mở:
`api-debug.html`

Nhập user/password trong Google Sheet để kiểm tra API trả về JSON hay lỗi.


# TKver3.8 - Session Identity

## Cập nhật
- Dòng chào hiển thị đúng danh tính người đăng nhập:
  - Full name
  - Role
- Lưu lịch sử đăng nhập bằng LocalStorage.
- Nếu đã đăng nhập, hệ thống giữ phiên đăng nhập.
- Chỉ tự đăng xuất khi:
  - Không sử dụng trong 80 phút
  - Hoặc người dùng chủ động bấm Đăng xuất
- Thêm thẻ lịch sử đăng nhập trong module để người dùng xem các lần đăng nhập gần nhất.


# TKver3.8 - Comfort Interaction

## Cập nhật
- Xóa phần ghi chú/mô tả dư thừa ở module App Center và các module chung.
- Dòng trạng thái đăng nhập đổi thành `✨ Chào User`.
- Thêm widget cảm xúc: vui, buồn, không muốn chia sẻ.
- Thêm lời động viên theo cảm xúc.
- Thêm câu nói hôm nay.
- Thêm ô lưu thành tựu hôm nay bằng LocalStorage.
- Sau 30 phút trong web sẽ nhắc uống nước/vận động nhẹ.
- App Center tối giản: chỉ icon + tên, không mô tả dài.


# TKver3.8 - Linked Modules + Demo Pages + App Center

## Cập nhật
- Menu Admin đã liên kết thật tới các trang/module.
- Thêm module `Kho Dự Trữ` nằm trên `System Setting`.
- Vault chỉ còn user `0947924444` được thấy/truy cập.
- Tạo demo cho:
  - Flex Profile
  - Academy
  - BI/VIP
  - Store bán nước hoa/son/combo
  - App Center dạng lưới giống app center, dùng icon user cung cấp.
- Giữ tài khoản test:
  - Admin: 0947924444 / 0987471471
  - Boss: 0987471471 / 0947924444


# TKver3.8 - Lite Clean Build

- Đã xóa MP4/video cũ, mockup, source ảnh, file backup không dùng.
- Đã tối ưu ảnh card/icon/UI để upload GitHub Pages nhẹ hơn.
- Giữ module/router từ bản trước.
- Giữ tài khoản test offline:
  - Admin: 0947924444 / 0987471471
  - Boss: 0987471471 / 0947924444

Bản tiếp theo mặc định là TKver3.8.


# TKver3.8 - Test Accounts Full Access

## Tài khoản test offline không cần Google Sheet

### Admin full quyền
- Username: `0947924444`
- Password: `0987471471`
- Role: `Admin`
- Quyền: toàn bộ trang/module/admin/vault

### Boss full quyền test
- Username: `0987471471`
- Password: `0947924444`
- Role: `Boss`
- Quyền: toàn bộ trang/module/admin/vault để test tính năng khác

## Ghi chú
Hai tài khoản này chạy offline trong source, không phụ thuộc Google Sheet.


# TKver3.8 - Professional Module Architecture

## Cập nhật chính
- Thêm `config/modules.js` để quản lý cấu hình module tập trung.
- Thêm `assets/js/router.js` để điều hướng và kiểm tra quyền.
- Thêm `pages/module.html` làm template chung cho các trang phụ.
- Từ trang chính, 5 card đã liên kết về:
  - me/index.html
  - academy/index.html
  - bi/index.html
  - store/index.html
  - app/index.html
- Các module tương lai có thể tạo bằng cách:
  1. Thêm cấu hình vào `config/modules.js`
  2. Tạo thư mục mới, ví dụ `newmodule/index.html`
  3. Copy mẫu redirect từ module khác và đổi `module=newmodule`

## Có ảnh hưởng gì không?
Không ảnh hưởng cấu trúc hiện tại. Cách này chuyên nghiệp hơn vì nội dung module được tách khỏi portal chính, dễ copy, dễ đổi tên, dễ mở rộng.


# TKver3.8

## Cập nhật
- Đổi chữ `← Về Portal` thành `← Về trang chủ`.
- Thêm tài khoản Admin offline full quyền, không cần Google Sheet:
  - Username: 0947924444
  - Password: 0987471471
- Tài khoản offline này có role Admin và có quyền vào admin/vault.


# TKver3.8 - Login Position Swap

## Cập nhật
- Ngôi sao được đưa lên vị trí cũ của dòng `KHO BÁU VIP` / `ADMIN GATEWAY`.
- Dòng `KHO BÁU VIP` / `ADMIN GATEWAY` / `TẠP HÓA CHỐT ĐƠN` được đưa xuống vị trí cũ của ngôi sao, ngay dưới chữ `THIENKIM UNIVERSE`.
- Góc trái giữ nút `← Về Portal`.


# TKver3.8 - Small Center Login Star

## Cập nhật
- Ngôi sao trong trang login được thu nhỏ.
- Ngôi sao nằm chính giữa bên dưới chữ `THIENKIM UNIVERSE`.
- Bỏ xoay liên tục để không gây mất tập trung.
- Hiệu ứng mới: thở sáng nhẹ.
- Hover: phóng 115% và nghiêng nhẹ.
- VIP/Sales: bấm vào ngôi sao vẫn chuyển nhanh sang `login.html?mode=admin`.


# TKver3.8 - Unified Login

## Cập nhật
- Đồng bộ giao diện form đăng nhập Admin / Kho Báu VIP / Tạp Hóa Chốt Đơn.
- Logo ngôi sao 8 cánh nằm chính giữa phía trên form.
- Ngôi sao có glow xanh-vàng và xoay chậm 20 giây.
- Hover ngôi sao phóng 115%.
- Ở cổng VIP hoặc Sales, bấm vào logo ngôi sao sẽ chuyển sang `login.html?mode=admin`.
- Đồng hồ hệ thống hiển thị trong form đăng nhập.
- Đã bỏ các dòng mô tả Role và hint không cần thiết.


# TKver3.8

## Sửa lỗi
- Làm sạch nền icon ngôi sao Admin để không còn khung/nền tím tròn phía sau.
- Bỏ dòng: `Admin đăng nhập từ nút góc phải để vào dashboard.`
- Bỏ dòng: `Role: Admin, Boss, Leader, Trưởng ca, TVBH`


# TKver3.8 - THIENKIM UNIVERSE

## Cập nhật chính
- Thay nút Admin góc phải bằng icon ngôi sao 8 cánh mới.
- Hover ngôi sao phóng 115%.
- Click ngôi sao mở `login.html?mode=admin`.
- Không hiển thị chữ Admin, không hiển thị đồng hồ trên Portal.
- Đồng hồ hệ thống chỉ hiển thị trong popup/trang đăng nhập Admin.
- Dòng `5 KHÔNG GIAN • 1 HÀNH TRÌNH • VÔ VÀN GIÁ TRỊ` được căn giữa trực tiếp bên dưới chữ `THIENKIM UNIVERSE`.

## Quy ước version
- Bản hiện tại: TKver3.8
- Bản tiếp theo: TKver3.8
- Sau TKver3.8 sẽ lên TKver3.8


# TKver3.8 - THIENKIM UNIVERSE

## Quy ước phiên bản
- Bản hiện tại: TKver3.8
- Bản tiếp theo: TKver3.8
- Sau TKver3.8 sẽ lên TKver3.8

## Nội dung bản này
- Portal chính GitHub Pages ready.
- Ngôi sao 8 cánh góc phải là cổng Admin ẩn.
- Bấm ngôi sao để vào `login.html?mode=admin`.
- Admin page chỉ dành cho role Admin.
- Vault chỉ dành cho username `htbmt` hoặc `10341`.
- Domain phụ/module đã tạo sẵn trong source: me, academy, bi, store, app, vault, crm, ai, erp, hr, wiki.
- Domain phụ đang được ẩn khỏi trang chủ.


# THIENKIM UNIVERSE v6 Balanced
- Dùng asset card/icon đã tách riêng.
- Tự trim viền đen ngoài card/icon để card hiển thị lớn hơn và đúng bố cục hơn.
- Bố cục dựa theo landing page chuyên nghiệp: hero 22-24%, cards 60%, footer 14%.
- Không logo góc trái, không bảng xếp hạng, chỉ còn đăng nhập góc phải.
- Galaxy + cloud + starfield + sparkle được cân bằng cho laptop và màn lớn.


## V7 GitHub Ready
- Tối ưu lại bố cục theo kinh nghiệm production responsive.
- Laptop: hero gọn hơn, card lớn hơn, footer cân đối.
- Màn lớn 27–32 inch: không bị lọt thỏm.
- Mobile: carousel ngang, dễ xem trên điện thoại.
- Có .nojekyll để upload GitHub Pages dễ hơn.

## Cách upload GitHub Pages
1. Tạo repository mới.
2. Upload toàn bộ file/thư mục trong project.
3. Vào Settings → Pages.
4. Source: Deploy from branch.
5. Branch: main / root.
6. Mở link GitHub Pages được cấp.


## V8 Clean Cards
- Welcome to + THIENKIM UNIVERSE nằm ngang hàng.
- Dòng 5 KHÔNG GIAN / 1 HÀNH TRÌNH / VÔ VÀN GIÁ TRỊ căn giữa bên dưới.
- Bỏ toàn bộ chữ đề mục trên 5 card, chỉ giữ hình card.
- Giữ nút đăng nhập card 03/04 và nút khám phá.


## V9 Clock + Domain Ecosystem
- Nút đăng nhập góc phải đổi thành đồng hồ live theo giờ hệ thống máy tính.
- Bấm đồng hồ mở cổng Admin riêng.
- Cổng Admin chỉ cho role Admin đăng nhập.
- Admin page chỉ role Admin được xem.
- Vault chỉ user username `htbmt` hoặc `10341` được vào.
- Tạo sẵn module page:
  me/, academy/, bi/, store/, app/, vault/, crm/, ai/, erp/, hr/, wiki/


## V10 Star Hidden Login
- Ẩn toàn bộ domain phụ trên trang chủ.
- Dòng `5 KHÔNG GIAN • 1 HÀNH TRÌNH • VÔ VÀN GIÁ TRỊ` căn giữa dưới `THIENKIM UNIVERSE`.
- Nền galaxy tăng glow/sparkle giống ảnh mẫu.
- Góc phải dùng video ngôi sao xoay làm cổng đăng nhập Admin ẩn.
- Module/domain vẫn có sẵn trong source để sau này copy/đổi tên triển khai.
