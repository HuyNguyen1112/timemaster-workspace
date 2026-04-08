package com.vinhhuy.timemasterai.controller;

import com.vinhhuy.timemasterai.agent.AiMentorService;
import com.vinhhuy.timemasterai.dto.ChatRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiMentorService aiMentorService;

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@RequestBody ChatRequest request,
            @org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Long userId = null;

            // Bóc tách JWT Token (không cần verify chữ ký vì Gateway/Core đã làm, chỉ cần
            // Base64 decode)
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String[] chunks = authHeader.substring(7).split("\\.");
                    if (chunks.length > 1) {
                        String payload = new String(java.util.Base64.getUrlDecoder().decode(chunks[1]));
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(payload);

                        if (node.has("userId")) {
                            userId = node.get("userId").asLong();
                        } else if (node.has("sub")) {
                            userId = Long.parseLong(node.get("sub").asText());
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Lỗi bóc tách JWT: " + e.getMessage());
                }
            } else {
                throw new RuntimeException("Anh chưa đăng nhập mà đòi xài AI à? (401 Unauthorized)");
            }

            java.time.LocalDate now = java.time.LocalDate.now();
            String currentDate = now.toString();
            String dayOfWeek = now.getDayOfWeek().name();

            String cleanMessage = request.getMessage();
            String response = aiMentorService.chat(userId, currentDate, dayOfWeek, cleanMessage);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("LỖI HỆ THỐNG: " + e.getMessage() + "\nNguyên nhân: " + e.toString());
        }
    }

    @GetMapping("/testTools")
    public ResponseEntity<String> testTools(@org.springframework.beans.factory.annotation.Autowired dev.langchain4j.mcp.client.McpClient mcpClient) {
        try {
            var tools = mcpClient.listTools();
            if (tools == null || tools.isEmpty()) return ResponseEntity.ok("0");
            StringBuilder sb = new StringBuilder(tools.size() + "\n");
            tools.forEach(t -> sb.append(t.name()).append("\n"));
            return ResponseEntity.ok(sb.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}
