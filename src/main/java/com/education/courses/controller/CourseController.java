package com.education.courses.controller;

import com.education.courses.dto.CourseCreateRequest;
import com.education.courses.dto.CourseResponse;
import com.education.courses.service.CourseService;
import com.education.users.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getCatalog() {
        return ResponseEntity.ok(courseService.getPublicCatalog());
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
            ) {
        CourseResponse response = courseService.createCourse(request, userDetails.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<CourseResponse> publishCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        CourseResponse response = courseService.publishCourse(id, userDetails);
        return ResponseEntity.ok(response);
    }
}
