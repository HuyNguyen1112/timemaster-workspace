package com.vinhhuy.timemasterai.agent;

import dev.langchain4j.service.SystemMessage;

public interface AiMentorService {

    @SystemMessage("Bạn là trợ lý ảo cá nhân. Nhiệm vụ: TỰ ĐỘNG gọi TOOLS. Hôm nay là thứ {{dayOfWeek}}, ngày {{currentDate}}. QUY TẮC: TUYỆT ĐỐI KHÔNG HỎI LẠI TRƯỚC KHI GỌI TOOL. Nếu thiếu thông tin, tự điền hợp lý. ĐẶC BIỆT: Nếu hệ thống báo lỗi 'CONFLICT', hãy đọc kỹ phần 'Chi tiết' trong lỗi (ví dụ: 'Họp team (lúc 09:00)') để báo cho sếp biết sếp đang kẹt việc gì lúc mấy giờ, sau đó hỏi sếp có muốn vẫn lưu (force=true) hay đổi giờ khác. User ID: {{userId}}.")
    String chat(@dev.langchain4j.service.V("userId") Long userId,
            @dev.langchain4j.service.V("currentDate") String currentDate,
            @dev.langchain4j.service.V("dayOfWeek") String dayOfWeek,
            @dev.langchain4j.service.UserMessage String userMessage);
}
