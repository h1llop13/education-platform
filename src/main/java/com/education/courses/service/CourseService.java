package com.education.courses.service;

import com.education.common.exception.BusinessException;
import com.education.courses.dto.CourseCreateRequest;
import com.education.courses.dto.CourseResponse;
import com.education.courses.dto.CourseUpdateRequest;
import com.education.courses.entity.Course;
import com.education.courses.entity.CourseStatus;
import com.education.courses.entity.CourseVisibility;
import com.education.courses.repository.CourseRepository;
import com.education.users.entity.Role;
import com.education.users.entity.User;
import com.education.users.repository.UserRepository;
import com.education.users.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Transactional
    public CourseResponse createCourse(CourseCreateRequest request, Long currentUserId) {
        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Пользователь не найден"));

        if (author.getRole() != Role.TEACHER && author.getRole() != Role.ADMIN) {
            throw new BusinessException("FORBIDDEN", "Только преподаватели и администраторы могут создавать курсы");
        }

        Course course = Course.builder()
                .title(request.title())
                .description(request.description())
                .coverUrl(request.coverUrl())
                .discipline(request.discipline())
                .visibility(request.visibility() != null ? request.visibility() : CourseVisibility.PUBLIC)
                .status(CourseStatus.DRAFT)
                .author(author)
                .build();

        return mapToResponse(courseRepository.save(course));
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException("COURSE_NOT_FOUND", "Курс не найден"));
        return mapToResponse(course);
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getPublicCatalog() {
        return courseRepository.findByStatusAndVisibility(CourseStatus.PUBLISHED, CourseVisibility.PUBLIC)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public CourseResponse updateCourse(Long courseId, CourseUpdateRequest request, CustomUserDetails userDetails) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException("COURSE_NOT_FOUND", "Курс не найден"));

        checkCourseOwnership(course, userDetails);

        course.setTitle(request.title());
        course.setDescription(request.description());
        course.setCoverUrl(request.coverUrl());
        // Внимание: здесь используется request.descipline() из-за опечатки в вашем DTO
        course.setDiscipline(request.descipline());

        return mapToResponse(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse publishCourse(Long courseId, CustomUserDetails userDetails) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException("COURSE_NOT_FOUND", "Курс не найден"));

        checkCourseOwnership(course, userDetails);

        course.setStatus(CourseStatus.PUBLISHED);
        return mapToResponse(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse copyCourse(Long courseId, Long currentUserId) {
        Course original = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException("COURSE_NOT_FOUND", "Курс не найден"));

        User newAuthor = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Пользователь не найден"));

        if (newAuthor.getRole() != Role.TEACHER && newAuthor.getRole() != Role.ADMIN) {
            throw new BusinessException("FORBIDDEN", "Только преподаватели и администраторы могут копировать курсы");
        }

        Course copy = Course.builder()
                .title(original.getTitle() + " (Копия)")
                .description(original.getDescription())
                .coverUrl(original.getCoverUrl())
                .discipline(original.getDiscipline())
                .visibility(CourseVisibility.PUBLIC)
                .status(CourseStatus.DRAFT)
                .author(newAuthor)
                .build();

        return mapToResponse(courseRepository.save(copy));
    }

    private void checkCourseOwnership(Course course, CustomUserDetails userDetails) {
        boolean isAuthor = course.getAuthor().getId().equals(userDetails.getId());
        boolean isAdmin = "ADMIN".equals(userDetails.getRole());

        if (!isAuthor && !isAdmin) {
            throw new BusinessException("FORBIDDEN", "Вы можете изменять только свои курсы");
        }
    }

    private CourseResponse mapToResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getCoverUrl(),
                course.getDiscipline(),
                course.getStatus(),
                course.getVisibility(),
                course.getAuthor().getId(),
                course.getAuthor().getFullName(),
                course.getCreatedAt()
        );
    }
}