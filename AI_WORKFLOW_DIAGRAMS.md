# AI Workflow Sequence Diagrams - TimeMaster AI

Dưới đây là sơ đồ tuần tự mô tả cách hệ thống xử lý 3 loại yêu cầu phổ biến dựa trên kiến trúc thực tế của module `timemaster-ai`.

---

## 1. Câu lệnh Chào hỏi Thông thường
*LLM sẽ trả lời dựa trên Persona mà không cần dữ liệu bổ sung.*

```mermaid
sequenceDiagram
    participant U as User
    participant C as AiController
    participant S as AiMentorService
    participant A as AiMentorAgent (LangChain4j)
    participant R as ContentRetriever (RAG)
    participant M as GoogleGemini (LLM)

    U->>C: Gửi "Chào bạn, bạn là ai?"
    C->>S: chat(message, userId)
    S->>A: execute(message)
    
    Note over A,R: Bước kiểm tra RAG
    A->>R: retrieve(query)
    R->>R: Tạo vector & Tìm kiếm trong pgvector
    R-->>A: Trả về kết quả (Score < 0.6 - Rỗng)
    
    A->>M: Gửi Message + Prompt Hệ thống (Không có context)
    M-->>A: Trả về: "Chào bạn! Tôi là Mentor AI của bạn..."
    A-->>S: Trả về nội dung text
    S-->>C: Response DTO
    C-->>U: Hiển thị lời chào
```

---

## 2. Câu lệnh Yêu cầu dùng Tool (MCP)
*Hệ thống nhận diện ý định thực hiện hành động và gọi đến server Core thông qua giao thức MCP.*

```mermaid
sequenceDiagram
    participant U as User
    participant A as AiMentorAgent (LangChain4j)
    participant T as McpToolProvider
    participant MS as MCP Server (Core BE)
    participant M as GoogleGemini (LLM)

    U->>A: Gửi "Hãy tạo cho tôi task mua sữa lúc 8h"
    A->>M: Gửi yêu cầu phân tích
    M-->>A: Yêu cầu gọi Tool: create_task(title="Mua sữa", time="08:00")
    
    A->>T: Gọi tool tương ứng thông qua McpClient
    T->>MS: Gửi JSON-RPC (SSE) tới Core Backend
    MS->>MS: Lưu database thực tế
    MS-->>T: Trả về: "Success: Task created"
    
    T-->>A: Kết quả thực thi tool
    A->>M: Gửi kết quả tool để LLM tổng hợp câu trả lời
    M-->>A: Trả về: "Đã xong! Tôi đã thêm việc mua sữa vào lịch của bạn."
    A-->>U: Hiển thị phản hồi xác nhận
```

---

## 3. Câu lệnh RAG (Truy vấn dữ liệu cá nhân)
*Tìm kiếm ngữ cảnh từ pgvector trước khi gửi đến LLM.*

```mermaid
sequenceDiagram
    participant U as User
    participant A as AiMentorAgent (LangChain4j)
    participant R as ContentRetriever (RAG)
    participant DB as PgVector (PostgreSQL)
    participant M as GoogleGemini (LLM)

    U->>A: Gửi "Ngày mai tôi có những việc gì?"
    
    A->>R: retrieve("Công việc ngày mai của userId X")
    R->>R: Tạo Embedding cho câu hỏi
    R->>DB: Tìm kiếm vector tương đồng (Filter: userId)
    DB-->>R: Trả về 3 nhiệm vụ liên quan (Score > 0.6)
    R-->>A: Danh sách TextSegment (ngữ cảnh)
    
    A->>M: Gửi câu hỏi + Ngữ cảnh (RAG data) + Prompt
    Note right of M: LLM đọc dữ liệu từ context để trả lời
    M-->>A: Trả về: "Ngày mai bạn có 3 việc: 1. Họp team... 2. Đi gym..."
    A-->>U: Hiển thị câu trả lời chính xác dựa trên dữ liệu thực
```

---

## Giải thích các thành phần chính:
1.  **ContentRetriever (RAG):** Được cấu hình với `minScore(0.6)`. Nếu câu lệnh là chào hỏi, độ tương đồng thấp nên nó sẽ không lấy dữ liệu rác vào context, giúp tiết kiệm token và tránh làm loãng câu trả lời.
2.  **McpToolProvider:** Kết nối với Core Backend qua SSE. Đây là cầu nối giúp AI không chỉ "nói" mà còn "làm" được (tạo task, sửa habit).
3.  **UserContext:** Đảm bảo RAG và Tool chỉ truy cập dữ liệu của chính người dùng đang đăng nhập thông qua Filter `userId`.
