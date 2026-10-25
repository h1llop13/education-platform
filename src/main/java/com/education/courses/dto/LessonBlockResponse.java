package com.education.courses.dto;

import com.education.courses.entity.BlockType;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonBlockResponse {

    private Long id;
    private Long lessonId;
    private BlockType blockType;
    private JsonNode content;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}