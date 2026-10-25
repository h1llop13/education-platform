package com.education.courses.service;

import com.education.courses.dto.LessonCreateRequest;
import com.education.courses.entity.Course;
import com.education.users.entity.User;
import com.education.courses.repository.CourseRepository;
import com.education.courses.repository.LessonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LessonServiceTest {

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private LessonService lessonService;

    private User owner;
    private User stranger;
    private Course course;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);

        stranger = new User();
        stranger.setId(2L);

        course = new Course();
        course.setId(100L);
        course.setAuthor(owner); // Важно: используем getAuthor(), как мы исправили
    }

    @Test
    void createLesson_ShouldThrowForbidden_WhenUserIsNotOwner() {
        // Arrange
        LessonCreateRequest request = LessonCreateRequest.builder()
                .title("Новый урок")
                .orderIndex(1)
                .build();

        // Мокаем SecurityContext, чтобы текущий пользователь был "stranger" (id = 2)
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("2"); // ID текущего пользователя
        when(authentication.isAuthenticated()).thenReturn(true);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(courseRepository.findById(100L)).thenReturn(Optional.of(course));

        // Act & Assert
        assertThatThrownBy(() -> lessonService.createLesson(100L, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN)
                .hasMessageContaining("Нет прав на управление этим курсом");
    }
}