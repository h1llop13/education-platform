package com.education.courses.service;

import com.education.common.exception.BusinessException;
import com.education.courses.dto.LessonBlockResponse;
import com.education.courses.dto.LessonCreateRequest;
import com.education.courses.dto.LessonResponse;
import com.education.courses.dto.LessonUpdateRequest;
import com.education.courses.entity.Course;
import com.education.courses.entity.Lesson;
import com.education.courses.repository.CourseRepository;
import com.education.courses.repository.LessonRepository;
import com.education.users.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public LessonResponse createLesson(Long courseId, LessonCreateRequest request, CustomUserDetails userDetails) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException("COURSE_NOT_FOUND", "Курс не найден"));

        checkCourseOwnership(course, userDetails);

        Lesson lesson = Lesson.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex())
                .isPublished(false)
                .build();

        return mapToResponse(lessonRepository.save(lesson));
    }

    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LessonResponse getLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException("LESSON_NOT_FOUND", "Урок не найден"));
        return mapToResponse(lesson);
    }

    @Transactional
    public LessonResponse updateLesson(Long lessonId, LessonUpdateRequest request, CustomUserDetails userDetails) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException("LESSON_NOT_FOUND", "Урок не найден"));

        checkCourseOwnership(lesson.getCourse(), userDetails);

        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        lesson.setOrderIndex(request.getOrderIndex());
        if (request.getIsPublished() != null) {
            lesson.setIsPublished(request.getIsPublished());
        }

        return mapToResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public void deleteLesson(Long lessonId, CustomUserDetails userDetails) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException("LESSON_NOT_FOUND", "Урок не найден"));

        checkCourseOwnership(lesson.getCourse(), userDetails);

        lessonRepository.delete(lesson);
    }

    private void checkCourseOwnership(Course course, CustomUserDetails userDetails) {
        boolean isAuthor = course.getAuthor().getId().equals(userDetails.getId());
        boolean isAdmin = "ADMIN".equals(userDetails.getRole());

        if (!isAuthor && !isAdmin) {
            throw new BusinessException("FORBIDDEN", "У вас нет прав на изменение этого курса");
        }
    }

    private LessonResponse mapToResponse(Lesson lesson) {
        List<LessonBlockResponse> blockResponses = lesson.getBlocks().stream()
                .map(block -> LessonBlockResponse.builder()
                        .id(block.getId())
                        .lessonId(block.getLesson().getId())
                        .blockType(block.getBlockType())
                        .content(block.getContent())
                        .orderIndex(block.getOrderIndex())
                        .createdAt(block.getCreatedAt())
                        .updatedAt(block.getUpdatedAt())
                        .build())
                .toList();

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