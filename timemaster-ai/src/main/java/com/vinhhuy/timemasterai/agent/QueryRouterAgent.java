package com.vinhhuy.timemasterai.agent;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

/**
 * AI Service to classify user intent for RAG routing.
 */
public interface QueryRouterAgent {

    enum Intent {
        GREETING, // General talk, no context needed
        ACTION,   // Create, Delete, Update, View, List tasks (uses Tools, no RAG needed)
        INQUIRY   // Semantic/analytical questions about tasks (requires RAG)
    }

    @SystemMessage("""
            You are a query classifier for a Task Management AI system.
            Classify the user message into one of these categories:
            - GREETING: If the user is just saying hello, goodbye, or casual talk.
            - ACTION: If the user wants to create, delete, complete, modify, view, or list tasks (e.g., 'thêm task', 'xóa việc X', 'xong rồi', 'xem task hôm nay', 'gom công việc ngày mai', 'liệt kê task').
            - INQUIRY: If the user is asking a semantic or analytical question about their tasks that requires searching by meaning (e.g., 'task nào liên quan đến học tập?', 'tôi có việc gì quan trọng cần ưu tiên?').
            Return ONLY the category name in uppercase.
            """)
    Intent classify(@UserMessage String message);
}
