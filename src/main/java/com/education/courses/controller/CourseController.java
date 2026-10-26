package com.education.courses.controller;

import com.education.courses.dto.CourseCreateRequest;
import com.education.courses.dto.CourseResponse;
import com.education.courses.dto.CourseUpdateRequest;
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

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourse(id));
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return new ResponseEntity<>(courseService.createCourse(request, userDetails.getId()), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, userDetails));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<CourseResponse> publishCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(courseService.publishCourse(id, userDetails));
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<CourseResponse> copyCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return new ResponseEntity<>(courseService.copyCourse(id, userDetails.getId()), HttpStatus.CREATED);
    }
}