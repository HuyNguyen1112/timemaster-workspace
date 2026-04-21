package com.vinhhuy.timemasterai.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.Getter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.time.LocalDate;

/**
 * Modern, Thread-safe User Context utilizing Spring RequestScope.
 * Automatically cleared when the HTTP Request ends.
 * Eliminates memory leaks and context pollution risks of ThreadLocal.
 */
@Component
@RequestScope
@Data
public class UserContext {

    private Long userId;

    @Getter
    private final String currentDate = LocalDate.now().toString();

    @Getter
    private final String dayOfWeek = LocalDate.now().getDayOfWeek().name();

    public String toJson() {
        try {
            return new ObjectMapper().writeValueAsString(this);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
