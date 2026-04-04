# Hướng Dẫn Cho Quản Trị Viên

Tài liệu này dành cho người dùng vai trò `ADMIN`.

## 1. Phạm vi quyền

Quản trị viên có thể thao tác các nhóm chức năng sau:

- quản lý sinh viên
- quản lý giảng viên
- quản lý khoa, ngành, lớp sinh hoạt
- quản lý học kỳ, môn học, học phần mở
- quản lý phòng học, lịch học
- duyệt điểm, khóa điểm, mở khóa điểm
- theo dõi phúc khảo
- xem báo cáo
- xem nhật ký hệ thống

## 2. Menu quản trị

Các mục menu chính:

- `Tổng quan`
- `Hồ sơ cá nhân`
- `Sinh viên`
- `Giảng viên`
- `Khoa`
- `Ngành`
- `Lớp sinh hoạt`
- `Học kỳ`
- `Môn học`
- `Học phần mở`
- `Phòng học`
- `Lịch học`
- `Duyệt điểm`
- `Phúc khảo`
- `Báo cáo`
- `Nhật ký hệ thống`

## 3. Trình tự sử dụng khuyến nghị

Nếu bạn đang cấu hình hệ thống mới, nên thao tác theo thứ tự sau:

1. tạo `Khoa`
2. tạo `Ngành`
3. tạo `Lớp sinh hoạt`
4. tạo `Học kỳ`
5. tạo `Phòng học`
6. tạo `Môn học`
7. tạo `Giảng viên`
8. tạo `Sinh viên`
9. tạo `Học phần mở`
10. gán `Lịch học`
11. để sinh viên đăng ký hoặc seed dữ liệu phục vụ demo

## 4. Quản lý sinh viên

Màn hình `Sinh viên` gồm:

- khối thống kê nhanh
- bộ lọc theo mã, họ tên, lớp, trạng thái
- bảng danh sách sinh viên
- khu nhập CSV
- form tạo mới hoặc cập nhật ở cùng trang

### 4.1 Tạo sinh viên mới

1. vào `Sinh viên`
2. điền biểu mẫu `Tạo sinh viên mới`
3. nhập đầy đủ thông tin hồ sơ và học tập
4. nhập mật khẩu khởi tạo
5. bấm lưu

Lưu ý:

- tạo sinh viên sẽ đồng thời tạo tài khoản đăng nhập
- `MSSV` và `Email` phải duy nhất

### 4.2 Cập nhật sinh viên

1. tìm sinh viên trong bảng
2. chọn thao tác sửa
3. biểu mẫu bên phải sẽ nạp sẵn dữ liệu
4. cập nhật thông tin cần thiết và lưu

### 4.3 Nhập sinh viên từ CSV

1. chuẩn bị file CSV theo mẫu hệ thống
2. vào thẻ `Nhập sinh viên từ CSV`
3. chọn file và thực hiện import
4. kiểm tra lại danh sách sau khi import

## 5. Quản lý giảng viên

Màn hình `Giảng viên` có cấu trúc tương tự sinh viên:

- thống kê nhanh
- bộ lọc
- bảng danh sách
- form tạo hoặc cập nhật

Khi tạo giảng viên:

- cần email duy nhất
- cần mã giảng viên duy nhất
- cần mật khẩu khởi tạo

## 6. Quản lý dữ liệu nền

### 6.1 Khoa

Dùng để tạo đơn vị quản lý học thuật ở cấp cao nhất.

### 6.2 Ngành

Ngành gắn với một khoa. Cần tạo khoa trước khi tạo ngành.

### 6.3 Lớp sinh hoạt

Lớp sinh hoạt gắn với ngành và khóa học. Sinh viên sẽ tham chiếu đến lớp này.

### 6.4 Học kỳ

Học kỳ quyết định:

- khoảng thời gian học
- khoảng thời gian đăng ký học phần
- khoảng thời gian phúc khảo
- giới hạn tín chỉ

### 6.5 Phòng học

Dùng cho việc gán lịch học và kiểm tra trùng phòng.

## 7. Quản lý môn học và học phần mở

### 7.1 Môn học

Tại màn hình `Môn học`, quản trị viên có thể:

- tạo môn học mới
- cập nhật tên, mã, số tín chỉ
- cấu hình môn tiên quyết
- xóa môn học nếu không vi phạm ràng buộc dữ liệu

### 7.2 Học phần mở

Tại màn hình `Học phần mở`, quản trị viên có thể:

- chọn môn học
- chọn học kỳ
- tạo nhóm lớp
- cấu hình sĩ số
- gán giảng viên chính hoặc phân công giảng dạy
- theo dõi trạng thái mở học phần

## 8. Quản lý lịch học

Tại màn hình `Lịch học`, quản trị viên có thể:

- gắn lịch với học phần mở
- chọn phòng học
- chọn thứ trong tuần
- chọn giờ bắt đầu và giờ kết thúc
- chọn khoảng ngày hiệu lực

Lưu ý quan trọng:

- hệ thống kiểm tra trùng phòng ở tầng cơ sở dữ liệu
- hai lịch cùng phòng, cùng thứ, cùng giờ sẽ bị chặn nếu trùng khoảng ngày hiệu lực

## 9. Duyệt và khóa điểm

Màn hình `Duyệt điểm` hỗ trợ quy trình:

- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `LOCKED`

### 9.1 Duyệt theo học phần

Quản trị viên có thể:

- duyệt toàn bộ điểm `SUBMITTED` của một học phần sang `APPROVED`
- khóa toàn bộ điểm `APPROVED` của một học phần sang `LOCKED`
- mở khóa điểm `LOCKED` quay về `APPROVED`

### 9.2 Duyệt theo từng bản ghi

Ngoài thao tác hàng loạt, có thể xem danh sách chi tiết để xử lý từng bản ghi điểm.

## 10. Quản lý phúc khảo

Tại màn hình `Phúc khảo`, quản trị viên có thể:

- xem toàn bộ yêu cầu phúc khảo
- theo dõi trạng thái từng yêu cầu
- phối hợp với giảng viên xử lý
- xem kết quả và ghi chú xử lý

## 11. Báo cáo

Màn hình `Báo cáo` giúp theo dõi:

- số lượng sinh viên theo đơn vị
- tỷ lệ đạt theo môn
- GPA trung bình
- cảnh báo học vụ hoặc tín hiệu cần quan tâm

Khuyến nghị:

- dùng báo cáo như màn hình giám sát nhanh
- đối chiếu với dữ liệu nguồn trước khi đưa ra quyết định quản trị

## 12. Nhật ký hệ thống

Màn hình `Nhật ký hệ thống` dùng để:

- theo dõi lịch sử thao tác quan trọng
- kiểm tra ai đã tạo, sửa hoặc duyệt dữ liệu
- hỗ trợ truy vết khi có lỗi hoặc tranh chấp dữ liệu

## 13. Quy tắc vận hành cho quản trị viên

- Không nhập dữ liệu nền sai thứ tự phụ thuộc.
- Không chỉnh sửa điểm đã khóa trừ khi có lý do rõ ràng.
- Không dùng tài khoản demo cho vận hành thật.
- Sau khi bootstrap admin, nên đổi mật khẩu tại `Hồ sơ cá nhân`.

## 14. Các lỗi thường gặp

### Không tạo được sinh viên hoặc giảng viên

Thường do:

- email đã tồn tại
- mã sinh viên hoặc mã giảng viên đã tồn tại
- thiếu mật khẩu khởi tạo

### Không tạo được lịch học

Thường do:

- phòng học bị trùng lịch
- giờ bắt đầu và giờ kết thúc không hợp lệ
- dữ liệu học phần hoặc phòng học chưa đúng

### Không duyệt được điểm

Thường do:

- trạng thái hiện tại không đúng workflow
- dữ liệu điểm chưa hợp lệ
- bản ghi đã bị khóa
