package com.education.courses.service;

import com.education.courses.dto.LessonBlockCreateRequest;
import com.education.courses.dto.LessonBlockResponse;
import com.education.courses.dto.LessonBlockUpdateRequest;
import com.education.courses.entity.Lesson;
import com.education.courses.entity.LessonBlock;
import com.education.courses.repository.LessonBlockRepository;
import com.education.courses.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class LessonBlockService {

    private final LessonBlockRepository blockRepository;
    private final LessonRepository lessonRepository;
    private final LessonService lessonService; // Для переиспользования проверки прав

    @Transactional
    public LessonBlockResponse addBlock(Long lessonId, LessonBlockCreateRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Урок не найден"));

        // Проверка прав через существующий метод (нужно сделать его package-private или public в LessonService,
        // или продублировать логику. Сделаем public метод verifyAccess в LessonService)
        lessonService.verifyCourseOwner(lesson.getCourse());

        LessonBlock block = LessonBlock.builder()
                .lesson(lesson)
                .blockType(request.getBlockType())
                .content(request.getContent())
                .orderIndex(request.getOrderIndex())
                .build();

        return mapToResponse(blockRepository.save(block));
    }

    @Transactional
    public LessonBlockResponse updateBlock(Long blockId, LessonBlockUpdateRequest request) {
        LessonBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Блок не найден"));

        lessonService.verifyCourseOwner(block.getLesson().getCourse());

        if (request.getBlockType() != null) block.setBlockType(request.getBlockType());
        if (request.getContent() != null) block.setContent(request.getContent());
        if (request.getOrderIndex() != null) block.setOrderIndex(request.getOrderIndex());

        return mapToResponse(blockRepository.save(block));
    }

    @Transactional
    public void deleteBlock(Long blockId) {
        LessonBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Блок не найден"));

        lessonService.verifyCourseOwner(block.getLesson().getCourse());
        blockRepository.delete(block);
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