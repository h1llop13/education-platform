package com.education.courses.service;

import com.education.common.exception.BusinessException;
import com.education.courses.dto.LessonBlockCreateRequest;
import com.education.courses.dto.LessonBlockResponse;
import com.education.courses.dto.LessonBlockUpdateRequest;
import com.education.courses.entity.BlockType;
import com.education.courses.entity.Course;
import com.education.courses.entity.Lesson;
import com.education.courses.entity.LessonBlock;
import com.education.courses.repository.LessonBlockRepository;
import com.education.courses.repository.LessonRepository;
import com.education.files.entity.StoredFile;
import com.education.files.repository.StoredFileRepository;
import com.education.users.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

@Service
@RequiredArgsConstructor
public class LessonBlockService {
    private final LessonBlockRepository lessonBlockRepository;
    private final LessonRepository lessonRepository;
    private final StoredFileRepository storedFileRepository;

    @Transactional
    public LessonBlockResponse addBlock(Long lessonId, LessonBlockCreateRequest request, CustomUserDetails userDetails) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException("LESSON_NOT_FOUND", "Урок не найден"));
        checkCourseOwnership(lesson.getCourse(), userDetails);

        // Валидация структуры content
        validateContent(request.getBlockType(), request.getContent());

        LessonBlock block = LessonBlock.builder()
                .lesson(lesson)
                .blockType(request.getBlockType())
                .content(request.getContent())
                .orderIndex(request.getOrderIndex())
                .build();

        return mapToResponse(lessonBlockRepository.save(block));
    }

    @Transactional
    public LessonBlockResponse updateBlock(Long blockId, LessonBlockUpdateRequest request, CustomUserDetails userDetails) {
        LessonBlock block = lessonBlockRepository.findById(blockId)
                .orElseThrow(() -> new BusinessException("BLOCK_NOT_FOUND", "Блок не найден"));
        checkCourseOwnership(block.getLesson().getCourse(), userDetails);

        // Валидация структуры content при обновлении
        BlockType blockType = request.getBlockType() != null ? request.getBlockType() : block.getBlockType();
        JsonNode content = request.getContent() != null ? request.getContent() : block.getContent();
        validateContent(blockType, content);

        if (request.getBlockType() != null) {
            block.setBlockType(request.getBlockType());
        }
        if (request.getContent() != null) {
            block.setContent(request.getContent());
        }
        if (request.getOrderIndex() != null) {
            block.setOrderIndex(request.getOrderIndex());
        }

        return mapToResponse(lessonBlockRepository.save(block));
    }

    @Transactional
    public void deleteBlock(Long blockId, CustomUserDetails userDetails) {
        LessonBlock block = lessonBlockRepository.findById(blockId)
                .orElseThrow(() -> new BusinessException("BLOCK_NOT_FOUND", "Блок не найден"));
        checkCourseOwnership(block.getLesson().getCourse(), userDetails);
        lessonBlockRepository.delete(block);
    }

    private void validateContent(BlockType blockType, JsonNode content) {
        if (content == null || content.isNull()) {
            throw new BusinessException("INVALID_CONTENT", "Содержимое блока не может быть пустым");
        }

        switch (blockType) {
            case IMAGE -> validateImageContent(content);
            case VIDEO -> validateVideoContent(content);
            case WARNING -> validateWarningContent(content);
            case EXTERNAL_LINK -> validateExternalLinkContent(content);
            case TEXT, CODE, TEST -> {
                // Для этих типов структура не валидируется строго
            }
        }
    }

    private void validateImageContent(JsonNode content) {
        if (!content.has("fileId") || content.get("fileId").isNull()) {
            throw new BusinessException("INVALID_CONTENT", "Для блока IMAGE обязательно поле 'fileId'");
        }

        Long fileId = content.get("fileId").asLong();
        validateFileExists(fileId, "image");

        // Проверяем, что это действительно изображение
        StoredFile file = storedFileRepository.findById(fileId).orElseThrow();
        if (!file.getMimeType().startsWith("image/")) {
            throw new BusinessException("INVALID_FILE_TYPE", "Файл должен быть изображением");
        }
    }

    private void validateVideoContent(JsonNode content) {
        boolean hasFileId = content.has("fileId") && !content.get("fileId").isNull();
        boolean hasExternalUrl = content.has("externalUrl") && !content.get("externalUrl").isNull();

        if (!hasFileId && !hasExternalUrl) {
            throw new BusinessException("INVALID_CONTENT",
                    "Для блока VIDEO необходимо указать либо 'fileId', либо 'externalUrl'");
        }

        if (hasFileId) {
            Long fileId = content.get("fileId").asLong();
            validateFileExists(fileId, "video");

            StoredFile file = storedFileRepository.findById(fileId).orElseThrow();
            if (!file.getMimeType().startsWith("video/")) {
                throw new BusinessException("INVALID_FILE_TYPE", "Файл должен быть видео");
            }
        }

        if (hasExternalUrl) {
            String url = content.get("externalUrl").asText();
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                throw new BusinessException("INVALID_CONTENT", "Внешняя ссылка должна начинаться с http:// или https://");
            }
        }
    }

    private void validateWarningContent(JsonNode content) {
        if (!content.has("text") || content.get("text").isNull() || content.get("text").asText().isBlank()) {
            throw new BusinessException("INVALID_CONTENT", "Для блока WARNING обязательно поле 'text'");
        }

        if (content.has("level")) {
            String level = content.get("level").asText();
            if (!level.matches("INFO|WARNING|DANGER")) {
                throw new BusinessException("INVALID_CONTENT",
                        "Поле 'level' должно быть одним из: INFO, WARNING, DANGER");
            }
        }
    }

    private void validateExternalLinkContent(JsonNode content) {
        if (!content.has("url") || content.get("url").isNull() || content.get("url").asText().isBlank()) {
            throw new BusinessException("INVALID_CONTENT", "Для блока EXTERNAL_LINK обязательно поле 'url'");
        }

        String url = content.get("url").asText();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new BusinessException("INVALID_CONTENT", "Ссылка должна начинаться с http:// или https://");
        }
    }

    private void validateFileExists(Long fileId, String fileType) {
        if (!storedFileRepository.existsById(fileId)) {
            throw new BusinessException("FILE_NOT_FOUND",
                    String.format("Файл с ID %d не найден для блока %s", fileId, fileType));
        }
    }

    private void checkCourseOwnership(Course course, CustomUserDetails userDetails) {
        boolean isAuthor = course.getAuthor().getId().equals(userDetails.getId());
        boolean isAdmin = "ADMIN".equals(userDetails.getRole());
        if (!isAuthor && !isAdmin) {
            throw new BusinessException("FORBIDDEN", "У вас нет прав на изменение этого курса");
        }
    }

    private LessonBlockResponse mapToResponse(LessonBlock block) {
        return LessonBlockResponse.builder()
                .id(block.getId())
                .lessonId(block.getLesson().getId())
                .blockType(block.getBlockType())
                .content(block.getContent())
                .orderIndex(block.getOrderIndex())
                .createdAt(block.getCreatedAt())
                .updatedAt(block.getUpdatedAt())
                .build();
    }
}