# VietinBank Tây Tiền Giang — Super App

Bản mã nguồn cập nhật ngày 13/11/2026. Website tĩnh, mở bằng `dist/super-app.html`; không cần máy chủ Python hoặc cài thư viện để chạy. `dist/index.html` chỉ là công cụ tính lãi vay độc lập. Khi triển khai toàn bộ ứng dụng, dùng **super-app.html** hoặc `index.html` ở gói GitHub/Vercel.

Có trang chủ, banner, mạng lưới giao dịch, hướng dẫn iPay, hướng dẫn nộp thuế, tính lãi tiền gửi, tính lãi vay và danh mục sản phẩm. Phần biên tập hỗ trợ lưu trên trình duyệt, xuất/khôi phục JSON và xuất trang HTML để đăng.

## Khám phá địa phương

Đã bổ sung Quản trị → Nội dung → Khám phá địa phương: thêm/sửa địa điểm, ảnh riêng, phần chữ, điện thoại, địa chỉ, giờ hoạt động, Facebook, Maps, website, nhiều đoạn thuyết minh; quản lý nhóm, nhân bản, sắp xếp, lưu trữ/khôi phục. Nội dung có trong tự lưu, JSON sao lưu và HTML xuất bản. Hướng dẫn dùng khi đưa ra sử dụng: `docs/LOCAL_EDITING.md`.

## Nội dung sản phẩm của bản này

- 4 mục vay vốn, 2 mục tiền gửi, 1 mục mở tài khoản doanh nghiệp online theo các liên kết được cung cấp.
- Mô tả rút gọn; có liên kết nguồn, ghi chú đối chiếu và công cụ tính lãi liên quan.
- Ảnh eFAST minh họa được lấy nguyên tệp từ API Portal chính thức. Không thay chữ trong ảnh.
- **Chưa lấy được ảnh gốc của 7 liên kết** vì trang yêu cầu CAPTCHA. Mô tả khoản vay chỉ giới thiệu mục đích trong tên liên kết; không tự thêm hạn mức, kỳ hạn, mức lãi hay ưu đãi chưa kiểm chứng.
- **Chưa nhận được ảnh “ngan hang so 1–4”, “the 1–4”**. Có 8 mục ẩn chuẩn bị sẵn; chưa có nội dung 4 sản phẩm thẻ để đưa ra danh mục khách hàng.
- Liên kết có tiêu đề mức lãi từ 7,8%/năm được ghi rõ cần kiểm tra hiệu lực, không coi là báo giá đang áp dụng.

Chi tiết nguồn và phần còn thiếu: `docs/product-sources.json`.

## Tự chỉnh sửa

Mở website → biểu tượng bánh răng **Quản trị website** → **Nội dung → Sản phẩm**. Có thể:

1. Sửa tên, mô tả ngắn, điểm nổi bật và các đoạn nội dung.
2. Thay ảnh chính, thêm nhiều ảnh, sửa chú thích riêng. Ảnh luôn giữ nguyên tỷ lệ, không cắt chữ.
3. Thêm nhóm, thêm sản phẩm, nhân bản, đổi thứ tự, ẩn/hẹn ngày, lưu trữ và khôi phục.
4. **Lưu nháp** để làm tiếp hoặc **Lưu & áp dụng** để đưa sản phẩm vào bản website đang biên tập.
5. Vào **Lưu & xuất bản** để tải bản sao JSON hoặc `index.html` cập nhật cho GitHub/Vercel.

Lưu trên trình duyệt chỉ áp dụng cho thiết bị đó. Tải JSON trước khi chuyển máy, xóa dữ liệu trình duyệt hoặc thay bản website mới. Website tĩnh chưa có đăng nhập quản trị và phân quyền trên máy chủ.

## Chỉnh mã nguồn và dựng lại

| Tệp / thư mục | Nội dung |
|---|---|
| `content/local.json` | Trang giới thiệu, nhóm và địa điểm khám phá |
| `assets/local/` | Ảnh địa điểm tách riêng |
| `content/products.json` | Nhóm, sản phẩm và phần chữ; mỗi mục có mã riêng |
| `assets/products/` | Ảnh riêng, có thể thay tệp giữ nguyên tên |
| `content/site.json` | Tùy chọn: trang chủ, banner, hướng dẫn, điểm giao dịch nhập từ bản sao |
| `src/products-ui.js` | Giao diện sản phẩm và biên tập |
| `src/content-core.mjs` | Chuẩn hóa dữ liệu, kiểm tra và xuất HTML |
| `src/content-manager.js` | Tự lưu, sao lưu, khôi phục và xuất bản |
| `src/product-styles.css` | Kiểu trình bày sản phẩm |
| `src/deposit-ui.mjs` | Công cụ tiền gửi, công thức giữ theo nguồn gốc |
| `src/engine.mjs`, `src/reports.mjs`, `src/ui.mjs` | Công cụ tiền vay và xuất báo cáo |
| `reference/website-v12.fragment.html` | Khung ứng dụng và các phần hướng dẫn có sẵn |
| `tools/import_content.py` | Nhập bản sao JSON/HTML về mã nguồn; tách ảnh ra tệp |

Dựng lại bằng Python 3.10 trở lên, không cần cài thư viện:

```sh
python3 build.py
```

Nếu đã sửa bằng giao diện và muốn đưa dữ liệu đó trở lại mã nguồn trước khi dựng:

```sh
python3 tools/import_content.py /duong-dan/ban-sao-noi-dung.json
python3 build.py
```

Có thể đưa `index.html` đã xuất vào lệnh nhập thay JSON. Lệnh nhập chỉ lấy nội dung đã áp dụng; bản nháp vẫn nằm trong JSON gốc để khôi phục trong giao diện. Sau đó có thể sửa `content/products.json`, thay ảnh trong `assets/products/`, rồi dựng lại. Không chạy dựng lại từ dữ liệu cũ nếu chưa nhập những thay đổi muốn giữ.

## Kiểm tra

Có Node.js thì chạy `npm test`; không cần `npm install`. Bộ kiểm tra gồm tính toán tiền gửi đối chiếu nguồn, tiền vay, báo cáo XLSX/HTML, chỉnh sửa nội dung, lịch hiển thị và vòng xuất/nhập dữ liệu. Ghi nhận kiểm tra thực tế ở `docs/product-verification.json`.
