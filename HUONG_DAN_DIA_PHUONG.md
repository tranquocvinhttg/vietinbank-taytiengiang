# Quản trị Khám phá địa phương

## Sử dụng sau khi website được đưa lên mạng

1. Mở website → biểu tượng bánh răng Quản trị website → Nội dung → **Khám phá địa phương**.
2. Chọn **Thêm địa điểm** hoặc **Sửa** một địa điểm có sẵn.
3. Nhập tên, nhóm và mô tả ngắn. Tùy nhu cầu, thêm phần giới thiệu, địa chỉ, điện thoại, giờ hoạt động, Facebook, Google Maps, website và ưu đãi.
4. Tải ảnh chính và ảnh bổ sung. Ảnh và phần chữ là các trường độc lập; thay một phần không làm thay đổi phần còn lại. Mỗi ảnh tối đa 8 MB; nên dùng ảnh gọn để website tải nhanh.
5. Có thể thêm nhiều đoạn thuyết minh, đổi thứ tự ảnh, đổi ảnh chính, sửa chú thích hoặc mô tả ảnh.
6. Bật **Hiển thị địa điểm cho khách**, chọn **Lưu & áp dụng**. Nếu chưa hoàn thiện, dùng Lưu nháp hoặc để địa điểm ở trạng thái ẩn.
7. Vào **Lưu & xuất bản**, tải JSON để sao lưu rồi tải `index.html`.
8. Tải `index.html` mới lên thay tệp cùng tên tại thư mục gốc repository GitHub đang nối với Vercel. Sau khi triển khai Production thành công, khách truy cập sẽ nhận nội dung mới.

**Lưu & áp dụng chỉ cập nhật bản biên tập trên trình duyệt đang sử dụng.** Website này là bộ HTML tĩnh, chưa có đăng nhập quản trị trên máy chủ hay cơ chế bấm Lưu để tự ghi dữ liệu lên mạng. Quyền thay đổi website công khai nằm ở tài khoản có quyền cập nhật repository. Không tạo dự án Vercel mới nếu muốn tiếp tục dùng link QR đang in.

## Nhóm địa điểm và trang giới thiệu

**Sửa trang và nhóm** cho phép đổi tiêu đề, lời giới thiệu trang, tên/mô tả/biểu tượng nhóm, thứ tự và hiển thị nhóm. Có thể thêm nhiều nhóm. Ba nhóm ban đầu là Ăn uống, Khách sạn & lưu trú và Vui chơi & khám phá.

Ẩn nhóm sẽ ẩn các địa điểm thuộc nhóm khỏi khách truy cập nhưng vẫn giữ dữ liệu để biên tập. Xóa nhóm chỉ thực hiện khi nhóm không còn địa điểm, kể cả bản nháp hoặc địa điểm lưu trữ. Cần giữ ít nhất một nhóm.

## Sắp xếp, nhân bản và lưu trữ

- Lên/Xuống thay thứ tự địa điểm trong cùng nhóm.
- Nhân bản tạo bản nháp mới đang ẩn, giữ ảnh và phần chữ để chỉnh riêng.
- Lưu trữ ẩn địa điểm. Bật “Xem địa điểm đã lưu trữ” để tìm và Khôi phục.
- Hai ngày hiển thị là tùy chọn; để trống nếu muốn hiển thị liên tục.
- Google Maps có thể dùng link do bạn nhập. Nếu để trống link nhưng đã nhập địa chỉ, nút Chỉ đường dùng địa chỉ đó.

Khách có thể lọc theo nhóm, tìm theo tên/địa chỉ, mở ảnh đầy đủ, gọi điện và mở Facebook/website/Maps.

## Sao lưu và chuyển máy

Tệp JSON giữ nội dung đã áp dụng, các bản nháp, ảnh và nhóm địa phương cùng các nội dung cũ của ứng dụng. Tải JSON trước khi xóa dữ liệu trình duyệt, chuyển máy hoặc cập nhật phiên bản mới. Để làm tiếp trên máy khác, mở bản website mới, vào Lưu & xuất bản và khôi phục JSON.

Bản sao cũ chưa có trường địa phương vẫn nhập được; các địa điểm đang có trong bản đang biên tập được giữ lại. Bản HTML xuất bản chỉ dùng địa điểm đã Lưu & áp dụng, không dùng những chỉnh sửa còn ở bản nháp.

## Chỉnh mã nguồn

| Tệp / thư mục | Nội dung |
|---|---|
| content/local.json | Tiêu đề trang, lời giới thiệu, các nhóm và danh sách địa điểm |
| assets/local/ | Ảnh tách riêng |
| src/local-ui.js | Giao diện khách xem và giao diện biên tập |
| src/local-styles.css | Kiểu trình bày địa phương |
| tests/local.test.mjs | Kiểm tra dữ liệu, hiển thị và sao lưu |

Dùng `python3 rebuild.py --backup /duong-dan/ban-sao.json` tại thư mục gốc gói đầy đủ để đưa bản chỉnh bằng giao diện về mã nguồn rồi dựng lại. Ảnh được tách ra assets/local/, phần chữ và liên kết nằm trong content/local.json. Dữ liệu kiểm thử không được đưa vào gói bàn giao; danh sách địa điểm ban đầu để trống để bạn nhập cơ sở thực tế.
