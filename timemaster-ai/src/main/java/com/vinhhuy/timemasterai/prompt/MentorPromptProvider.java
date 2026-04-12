package com.vinhhuy.timemasterai.prompt;

import com.vinhhuy.timemasterai.security.UserContext;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class MentorPromptProvider {

    @Value("classpath:prompts/mentor/system.txt")
    private Resource systemPersonaResource;

    private String cachedSystemPersona;

    @PostConstruct
    public void init() throws IOException {
        this.cachedSystemPersona = StreamUtils.copyToString(
                systemPersonaResource.getInputStream(), 
                StandardCharsets.UTF_8
        );
        log.info("Mentor System Persona cached successfully ({} characters)", cachedSystemPersona.length());
    }

    /**
     * Returns the cached System Persona with dynamic User Context injected.
     * Uses ObjectMapper-based JSON serialization to prevent Prompt Injection (Point 4).
     */
    public String getSystemPersona(UserContext userContext) {
        return String.format(
                "%s\n\nUSER_CONTEXT_JSON: %s",
                cachedSystemPersona,
                userContext.toJson()
        );
    }
}
