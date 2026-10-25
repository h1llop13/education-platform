package com.education.courses.service;

import com.education.courses.dto.*;
import com.education.courses.entity.Course;
import com.education.courses.entity.Lesson;
import com.education.courses.repository.CourseRepository;
import com.education.courses.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LessonResponse getLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Урок не найден"));
        return mapToResponse(lesson);
    }

    @Transactional
    public LessonResponse createLesson(Long courseId, LessonCreateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Курс не найден"));

        verifyCourseOwner(course);

        Lesson lesson = Lesson.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex())
                .isPublished(false)
                .build();

        return mapToResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public LessonResponse updateLesson(Long lessonId, LessonUpdateRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Урок не найден"));

        verifyCourseOwner(lesson.getCourse());

        if (request.getTitle() != null) lesson.setTitle(request.getTitle());
        if (request.getDescription() != null) lesson.setDescription(request.getDescription());
        if (request.getOrderIndex() != null) lesson.setOrderIndex(request.getOrderIndex());
        if (request.getIsPublished() != null) lesson.setIsPublished(request.getIsPublished());

        return mapToResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public void deleteLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Урок не найден"));

        verifyCourseOwner(lesson.getCourse());
        lessonRepository.delete(lesson);
    }

    // СДЕЛАНО PUBLIC для использования в LessonBlockService
    public void verifyCourseOwner(Course course) {
        Long currentUserId = getCurrentUserId();
        // ИСПРАВЛЕНО: getAuthor() вместо getOwner()
        if (course.getAuthor() == null || !course.getAuthor().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет прав на управление этим курсом");
        }
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Пользователь не авторизован");
        }
        // Адаптируйте под вашу реализацию, если principal хранится иначе
        return Long.valueOf(authentication.getName());
    }

    private LessonResponse mapToResponse(Lesson lesson) {
        List<LessonBlockResponse> blockResponses = lesson.getBlocks().stream()
                .map(block -> LessonBlockResponse.builder()
                        .id(block.getId())
                        .lessonId(lesson.getId())
                        .blockType(block.getBlockType())
                        .content(block.getContent())
                        .orderIndex(block.getOrderIndex())
                        .createdAt(block.getCreatedAt())
                        .updatedAt(block.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return LessonResponse.builder()
                .id(lesson.getId())
                .courseId(lesson.getCourse().getId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .orderIndex(lesson.getOrderIndex())
                .isPublished(lesson.getIsPublished())
                .blocks(blockResponses)
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }
}