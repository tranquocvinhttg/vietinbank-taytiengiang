# Đăng và cập nhật GitHub → Vercel

## Repository và dự án đang có

Tiếp tục dùng repository `https://github.com/tranquocvinhttg/vietinbanktaytiengiang` và dự án Vercel hiện tại. Giữ nguyên tên miền Production được dùng tạo QR; cập nhật nội dung bằng commit vào nhánh Production của cùng dự án. URL của từng bản Preview/deployment riêng có thể khác URL Production.

## Đăng bộ tệp

1. Giải nén ZIP. Mở thư mục có index.html và vercel.json.
2. Trên GitHub mở repository đang dùng → Add file → Upload files.
3. Tải **các tệp/thư mục bên trong** lên repository. index.html và vercel.json phải nằm ở thư mục gốc, cùng cấp source. Không chỉ tải một tệp ZIP và không tạo thêm một lớp thư mục bọc.
4. Commit changes vào nhánh Production đã cấu hình ở Vercel (thường là main).
5. Trong dự án Vercel → Settings → Build and Deployment, kiểm tra:

| Thiết lập | Giá trị cho bộ này |
|---|---|
| Framework Preset | Other |
| Root Directory | ./ — thư mục gốc có index.html |
| Build Command | Để trống / tắt override không cần thiết |
| Install Command | Để trống |
| Output Directory | . |

vercel.json trong bộ tệp đã khai báo website tĩnh và không yêu cầu build/install. Nếu cấu hình giao diện đang trỏ source/docs thì sửa về thư mục gốc. Tên file mô tả cũ source/docs/requirements.txt cần đổi thành loan-tool-specification.txt; bộ mới đã dùng tên này để tránh bị nhận nhầm là ứng dụng Python.

6. Vercel thường tự triển khai sau commit khi Git integration đang bật. Nếu chưa có bản mới, mở Deployments → Redeploy đúng nhánh Production. Đợi Ready và kiểm tra nhãn Production.
7. Mở đường dẫn Production, kiểm tra sản phẩm, hướng dẫn và công cụ tính lãi. Không dùng đường dẫn Preview riêng để thay cho link QR cố định.

## Mỗi lần sửa bằng giao diện

Vào Lưu & xuất bản, tải JSON để giữ dữ liệu, rồi tải index.html. Upload index.html mới thay tệp cùng tên ở thư mục gốc và Commit changes. Những khách khác chỉ nhận thay đổi sau khi Vercel triển khai thành công. Nếu nhánh đang bảo vệ, thực hiện quy trình pull request của repository.

Lưu ý GitHub giới hạn tải bằng trình duyệt 25 MiB mỗi tệp. Khi thêm quá nhiều ảnh khiến index.html vượt giới hạn này, tối ưu dung lượng ảnh hoặc dùng Git/GitHub Desktop để đưa tệp lên; không cần đổi URL website.

## Đối chiếu tài liệu

- GitHub, tải tệp và commit: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- Vercel, Git và Production: https://vercel.com/docs/git
- Vercel, cấu hình build: https://vercel.com/docs/builds/configure-a-build
- Vercel, cấu hình JSON: https://vercel.com/docs/project-configuration/vercel-json
- Vercel, cập nhật tên miền Production: https://vercel.com/docs/deployments/environments

Đã đối chiếu ngày 13/11/2026. Bộ tệp này chưa được đẩy lên repository hay triển khai thay người dùng.
