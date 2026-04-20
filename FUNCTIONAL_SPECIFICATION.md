# Functional Specification - TimeMaster AI

Tài liệu này tổng hợp toàn bộ các chức năng nghiệp vụ của hệ thống Backend TimeMaster, được phân loại theo từng thực thể và module.

---

## 1. Module Auth (Xác thực & Người dùng)
Quản lý quyền truy cập và tài khoản người dùng.
- **Đăng ký (Register):** Tạo tài khoản mới với Email, Mật khẩu và Họ tên.
- **Đăng nhập (Login):** Nhận diện người dùng và trả về JWT Token cùng thông tin cơ bản.

## 2. Module Category (Danh mục)
Tổ chức và phân loại các đầu việc.
- **Quản lý danh mục (CRUD):** 
    - Tạo danh mục mới với tên và mã màu tùy chỉnh.
    - Chỉnh sửa thông tin danh mục.
    - Xóa danh mục không còn sử dụng.
- **Truy vấn:** Liệt kê tất cả danh mục thuộc sở hữu của người dùng hiện tại.

## 3. Module Task (Nhiệm vụ - Eisenhower Matrix)
Trung tâm quản lý công việc và độ ưu tiên.
- **Lập kế hoạch nhiệm vụ:** 
    - Thêm nhiệm vụ vào 1 trong 4 nhóm ma trận (Q1 - Q4).
    - Thiết lập thời gian dự kiến (`startTime`), ngày thực hiện (`targetDate`) và thời lượng (`estimatedDuration`).
- **Theo dõi tiến độ:**
    - Thay đổi trạng thái (`PENDING` -> `IN_PROGRESS` -> `COMPLETED`).
    - Đánh dấu hoàn thành nhanh (`completeTask`).
- **Truy vấn nâng cao:** 
    - Lấy danh sách nhiệm vụ theo ngày cụ thể.
    - Quản lý vòng đời nhiệm vụ (Sửa/Xóa).

## 4. Module Habit (Thói quen & Kỷ luật)
Xây dựng lối sống lành mạnh thông qua theo dõi định lượng.
- **Thiết lập thói quen:** 
    - Tạo thói quen với mục tiêu cụ thể (VD: đọc 20 trang sách/ngày).
    - Hỗ trợ tần suất Hàng ngày (Daily) hoặc Hàng tuần (Weekly).
- **Ghi nhận tiến bộ (Check-in):** 
    - Cập nhật số lượng đã thực hiện thực tế.
    - Hệ thống tự động tính toán tỷ lệ hoàn thành dựa trên mục tiêu đề ra.
- **Lịch sử & Quản lý:** Theo dõi, sửa đổi hoặc xóa thói quen.

## 5. Module Pomodoro (Tập trung sâu)
Công cụ hỗ trợ làm việc hiệu quả.
- **Ghi nhận phiên tập trung:** Lưu lại thời gian bắt đầu, kết thúc và kết quả (Hoàn thành/Bị ngắt quãng).
- **Liên kết ngữ cảnh:** 
    - Gắn phiên tập trung trực tiếp với một **Task** cụ thể để tính tổng thời gian làm việc cho một dự án.
    - Gắn với một **Habit** để ghi nhận thời gian thực hiện thói quen.
- **Lịch sử:** Truy xuất danh sách các phiên làm việc đã thực hiện của người dùng.

## 6. Module Analytics & Planning (Thống kê & Tổng hợp)
Cung cấp cái nhìn tổng quan về hiệu suất.
- **Báo cáo hàng ngày (Daily Analytics):** Thống kê nhanh số công việc đã xong, số thói quen đã duy trì và tổng thời gian tập trung trong ngày.
- **Kế hoạch trong ngày (Daily Plan):** Một View tổng hợp hiển thị tất cả Nhiệm vụ và Thói quen cần làm trong một ngày được chọn.

---

## 7. Các tính năng hệ thống khác
- **Đảm bảo dữ liệu:** Các ràng buộc duy nhất (Unique Constraints) trên `HabitLog` đảm bảo không có sự ghi nhận trùng lặp trong cùng một ngày.
- **Phân quyền:** Bảo vệ dữ liệu cá nhân, đảm bảo người dùng chỉ có thể tương tác với Task/Habit của chính mình.
