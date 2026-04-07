package com.vinhhuy.timemasterai.tool;

import com.vinhhuy.timemasterai.dto.TaskRequest;
import dev.langchain4j.agent.tool.Tool;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
@RequiredArgsConstructor
public class AiTaskTool {

    private final RestTemplate restTemplate;
    // URL tĩnh trỏ về hệ thống Core (port 8080) cho User có id=1
    private final String CORE_API_URL = "http://localhost:8080/api/tasks?userId=1";

    @Tool("Sử dụng công cụ này ĐỂ TẠO MỚI công việc (task). Yêu cầu đã có đủ title, startTime, estimatedDuration, và matrixType (Q1/Q2/Q3/Q4).")
    public String createNewTask(String title, String startTime, Double estimatedDuration, String matrixType) {
        System.out.println("🤖 AI ĐANG KÍCH HOẠT TOOL GỌI API...");
        System.out.println("Payload: Tên=" + title + ", Giờ=" + startTime + ", Thời lượng=" + estimatedDuration + ", Eisenhower=" + matrixType);

        try {
            TaskRequest request = TaskRequest.builder()
                    .title(title)
                    .startTime(startTime + ":00") // Cần định dạng HH:mm:ss cho chuẩn backend
                    .estimatedDuration(estimatedDuration)
                    .matrixType(matrixType)
                    .build();

            // 1. Lọt qua khe hở để móc lấy Header của HTTP Request gốc (Từ Postman)
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpHeaders headers = new HttpHeaders();
            
            if (attributes != null) {
                HttpServletRequest httpRequest = attributes.getRequest();
                String authHeader = httpRequest.getHeader("Authorization");
                if (authHeader != null) {
                    headers.set("Authorization", authHeader);
                    System.out.println("✅ Đã tóm được thẻ Token để chèn sang Core!");
                }
            }

            // 2. Gói TaskRequest và Header vào chung một thực thể
            HttpEntity<TaskRequest> entity = new HttpEntity<>(request, headers);

            // 3. Dùng điện thoại gọi đi!
            ResponseEntity<String> response = restTemplate.postForEntity(CORE_API_URL, entity, String.class);
            return "Thành công! Core Response: " + response.getStatusCode();
        } catch (Exception e) {
            e.printStackTrace();
            return "Thất bại khi gọi API tạo task: " + e.getMessage();
        }
    }
}
