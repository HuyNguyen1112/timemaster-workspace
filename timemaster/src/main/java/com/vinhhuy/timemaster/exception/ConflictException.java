package com.vinhhuy.timemaster.exception;

import lombok.Getter;
import java.util.List;

@Getter
public class ConflictException extends RuntimeException {
    private final List<String> conflictingTasks;

    public ConflictException(String message, List<String> conflictingTasks) {
        super(message + " Chi tiết: " + String.join(", ", conflictingTasks));
        this.conflictingTasks = conflictingTasks;
    }
}
