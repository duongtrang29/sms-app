# Hướng Dẫn Dùng Chung

Tài liệu này áp dụng cho mọi người dùng trong hệ thống.

## 1. Đăng nhập

Truy cập trang đăng nhập và nhập:

- `Email`
- `Mật khẩu`

Sau khi đăng nhập thành công, hệ thống sẽ tự chuyển đến không gian làm việc theo vai trò:

- quản trị viên vào khu `ADMIN`
- giảng viên vào khu `LECTURER`
- sinh viên vào khu `STUDENT`

## 2. Quên mật khẩu

Nếu quên mật khẩu:

1. Mở trang `Quên mật khẩu`.
2. Nhập email tài khoản.
3. Kiểm tra hộp thư và mở liên kết đặt lại mật khẩu.
4. Nhập mật khẩu mới và xác nhận mật khẩu.

Lưu ý:

- email phải đúng với tài khoản đã tồn tại trong hệ thống
- liên kết đặt lại mật khẩu phụ thuộc vào cấu hình `NEXT_PUBLIC_APP_URL` và `Supabase Auth Redirect URLs`

## 3. Tổng quan

Mọi vai trò đều có menu:

- `Tổng quan`
- `Hồ sơ cá nhân`

Màn hình `Tổng quan` dùng để xem nhanh các chỉ số hoặc công việc nổi bật theo vai trò.

## 4. Hồ sơ cá nhân

Màn hình `Hồ sơ cá nhân` hiển thị:

- họ tên
- email
- vai trò
- số điện thoại

Tại đây, người dùng có thể đổi mật khẩu bằng biểu mẫu `Đổi mật khẩu`.

## 5. Đổi mật khẩu

Tại `Hồ sơ cá nhân`:

1. nhập `Mật khẩu mới`
2. nhập `Xác nhận mật khẩu`
3. bấm `Cập nhật mật khẩu`

Khuyến nghị:

- dùng mật khẩu mạnh
- không dùng lại mật khẩu tạm được cấp lúc bootstrap hoặc seed

## 6. Đăng xuất

Nút `Đăng xuất` xuất hiện ở thanh điều hướng. Sau khi đăng xuất, bạn sẽ quay về màn hình đăng nhập.

## 7. Trạng thái và thông báo

Hệ thống dùng các badge và thông báo trạng thái để giúp người dùng theo dõi luồng xử lý.

Ví dụ:

- `ACTIVE`: đang hoạt động
- `INACTIVE`: tạm ngưng
- `LOCKED`: đã khóa
- `DRAFT`: nháp
- `SUBMITTED`: chờ duyệt
- `APPROVED`: đã duyệt
- `ENROLLED`: đã đăng ký thành công

Nếu thao tác thất bại, hệ thống thường hiện:

- lỗi ngay tại trường nhập liệu
- thông báo cảnh báo ở đầu hoặc cuối form
- thông báo toast ngắn trên giao diện

## 8. Một số lưu ý khi thao tác

- Không mở nhiều tab để sửa cùng một bản ghi nếu không cần thiết.
- Sau khi đổi bộ lọc hoặc chế độ sửa, kiểm tra lại dữ liệu đang hiển thị trước khi bấm lưu.
- Nếu hệ thống báo lỗi nghiệp vụ, đọc kỹ nội dung vì nhiều kiểm tra đang chạy ở phía máy chủ và cơ sở dữ liệu.

## 9. Khi cần hỗ trợ

Khi báo lỗi cho quản trị hệ thống, nên gửi kèm:

- vai trò đang dùng
- màn hình đang thao tác
- dữ liệu đã nhập
- nội dung thông báo lỗi
- thời điểm xảy ra lỗi
