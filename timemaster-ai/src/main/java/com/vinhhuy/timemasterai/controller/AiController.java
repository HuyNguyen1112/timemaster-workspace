package com.vinhhuy.timemasterai.controller;

import com.vinhhuy.timemasterai.agent.AiMentorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiMentorService aiMentorService;

    @GetMapping("/chat")
    public ResponseEntity<String> chat(@RequestParam(defaultValue = "Hello") String message) {
        String response = aiMentorService.chat(message);
        return ResponseEntity.ok(response);
    }
}
