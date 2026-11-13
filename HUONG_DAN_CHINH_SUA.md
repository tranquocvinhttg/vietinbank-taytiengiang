# Hướng dẫn tự sửa nội dung sản phẩm

## Thêm một sản phẩm

1. Mở Quản trị website → Nội dung → Sản phẩm → Thêm sản phẩm.
2. Nhập tên, chọn nhóm và viết mô tả ngắn khoảng 1–2 câu.
3. Điểm nổi bật: mỗi dòng một ý, nên chọn 2–4 ý cần thiết.
4. Có thể để trống đối tượng/điều kiện, thông tin cần biết hoặc thêm nhiều đoạn riêng theo nhu cầu.
5. Tải ảnh chính; thêm ảnh bổ sung nếu cần. Mỗi ảnh PNG/JPG/WebP/GIF/AVIF tối đa 8 MB. Nên dùng ảnh đã tối ưu dung lượng để trang tải nhanh.
6. Ghi link nguồn, ngày đối chiếu và lưu ý về hiệu lực khi nội dung có lãi suất/biểu phí/ưu đãi.
7. Bật “Hiển thị sản phẩm cho khách”, chọn Lưu & áp dụng.
8. Vào Lưu & xuất bản → Tải bản sao JSON → Tải index.html. Cập nhật index.html lên GitHub đang kết nối Vercel.

## Thay riêng ảnh hoặc riêng chữ

- Chỉ đổi ảnh: tải ảnh mới ở cột Hình ảnh. Các trường nội dung chữ giữ nguyên.
- Chỉ đổi chữ: sửa trường ở cột Nội dung chữ; ảnh giữ nguyên.
- Chữ đã nằm trong ảnh không thể sửa bằng ô nội dung. Khi nội dung trong ảnh thay đổi, thay tệp ảnh mới.
- Mỗi ảnh có mô tả và chú thích riêng. Có thể đưa ảnh bổ sung làm ảnh chính hoặc đổi thứ tự ảnh.
- Trên máy tính ảnh và chữ hiển thị hai bên; trên điện thoại xếp dọc. Nhấn Xem ảnh để đọc ảnh đầy đủ.

## Thêm nhóm, sắp xếp và tạm ẩn

Quản lý nhóm cho phép thêm nhóm, sửa tên/mô tả/biểu tượng, đổi thứ tự và ẩn nhóm. Xóa nhóm chỉ thực hiện khi nhóm không còn sản phẩm. Di chuyển sản phẩm sang nhóm khác trước khi xóa nhóm.

Nút Lên/Xuống thay thứ tự trong cùng nhóm. Nhân bản tạo một mục mới đang ẩn. Lưu trữ ẩn mục khỏi danh sách; bật “Xem các sản phẩm đã lưu trữ” để khôi phục. Hai ngày hiển thị là tùy chọn; nếu để trống mục không bị giới hạn theo lịch.

## Sao lưu và khôi phục

JSON chứa sản phẩm, ảnh, nhóm, bản nháp, hàng chờ duyệt, banner, hướng dẫn và điểm giao dịch. Khôi phục JSON thay nội dung biên tập hiện tại; trước khi khôi phục, ứng dụng tải một bản sao hiện tại để có thể hoàn tác. Dữ liệu trên GitHub/Vercel chỉ đổi khi bạn cập nhật tệp website.

Bản HTML xuất bản dùng nội dung sản phẩm đã Lưu & áp dụng, hướng dẫn đã Duyệt đăng, thông tin trang chủ và mạng lưới đang áp dụng. Bản nháp sản phẩm chưa áp dụng không hiển thị cho khách. Mỗi bản xuất có mã phiên bản riêng để nội dung đã lưu của bản cũ không che bản cập nhật mới.

## Đưa bản chỉnh trên giao diện về mã nguồn

Tại thư mục `source` trong gói full:

```sh
python3 tools/import_content.py /duong-dan/ban-sao.json
```

Ảnh chính và ảnh bổ sung được tách ra `assets/products/`; phần chữ nằm trong `content/products.json`; nội dung trang chủ và hướng dẫn nằm trong `content/site.json`. Thư mục lưu ảnh có thể chứa tệp cũ sau nhiều lần nhập; các tệp không còn được tham chiếu không được nhúng vào website.

Sau đó tại thư mục gốc gói full, chạy `python3 rebuild.py`. Lấy `index.html` vừa dựng để cập nhật GitHub. Giữ bản sao JSON gốc để giữ cả các bản nháp.

## Phần đang chờ nguồn

Bản 13/11/2026 chưa có ảnh nguồn của 7 trang do CAPTCHA và chưa có 8 ảnh đính kèm được nhắc đến trong yêu cầu. Các mục “Ngân hàng số 1–4”, “Thẻ tín dụng 1–4” đang ẩn. Có thể thay tên, tải ảnh, bổ sung nội dung, kiểm tra nguồn rồi bật hiển thị từng mục. Không có khẳng định ưu đãi/lãi suất đang hiệu lực nếu chưa có căn cứ.

## Khám phá địa phương

Nội dung → Khám phá địa phương hỗ trợ Thêm địa điểm, Sửa, Nhân bản, Lên/Xuống, Lưu trữ và Khôi phục; Sửa trang và nhóm thay đổi tiêu đề, lời giới thiệu và danh mục nhóm. Ảnh, nội dung và liên kết đều có trường riêng. Xem LOCAL_EDITING.md để sử dụng sau khi đưa lên website. Các địa điểm đã áp dụng được đưa vào cùng bản xuất index.html; JSON giữ cả bản nháp.
