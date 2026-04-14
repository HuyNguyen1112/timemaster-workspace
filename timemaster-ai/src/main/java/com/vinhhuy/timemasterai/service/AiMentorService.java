package com.vinhhuy.timemasterai.service;

import com.vinhhuy.timemasterai.dto.MentorResponse;

public interface AiMentorService {

    /**
     * Orchestrates the chat flow with automated retry logic.
     * @param userMessage The message from the user.
     * @return The mentor's response.
     */
    MentorResponse chat(String userMessage);
}
