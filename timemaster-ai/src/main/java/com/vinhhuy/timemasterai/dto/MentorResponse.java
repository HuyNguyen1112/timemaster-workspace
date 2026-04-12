package com.vinhhuy.timemasterai.dto;

/**
 * Structured response from the AI Mentor.
 * LangChain4j will automatically parse the LLM's JSON into this object.
 */
public record MentorResponse(
    String message,
    String actionTaken
) {
}
