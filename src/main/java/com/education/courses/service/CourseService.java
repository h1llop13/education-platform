package com.education.courses.service;

import com.education.common.exception.BusinessException;
import com.education.courses.dto.CourseCreateRequest;
import com.education.courses.dto.CourseResponse;
import com.education.courses.entity.Course;
import com.education.courses.entity.CourseStatus;
import com.education.courses.entity.CourseVisibility;
import com.education.courses.repository.CourseRepository;
import com.education.users.entity.Role;
import com.education.users.entity.User;
import com.education.users.repository.UserRepository;
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

        // Проверка роли: создавать курсы могут только TEACHER и ADMIN
        if (author.getRole() != Role.TEACHER && author.getRole() != Role.ADMIN) {
            throw new BusinessException("FORBIDDEN", "Только преподаватели и администраторы могут создавать курсы");
        }

        Course course = Course.builder()
                .title(request.title())
                .description(request.description())
                .coverUrl(request.coverUrl())
                .discipline(request.discipline())
                .visibility(request.visibility() != null ? request.visibility() : CourseVisibility.PUBLIC)
                .status(CourseStatus.DRAFT) // Новый курс всегда создается как черновик
                .author(author)
                .build();

        Course savedCourse = courseRepository.save(course);

        return mapToResponse(savedCourse);
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getPublicCatalog() {
        // Возвращаем только опубликованные и публичные курсы для каталога
        return courseRepository.findByStatusAndVisibility(CourseStatus.PUBLISHED, CourseVisibility.PUBLIC)
                .stream()
                .map(this::mapToResponse)
                .toList();
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