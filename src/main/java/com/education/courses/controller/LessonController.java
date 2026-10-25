package com.education.courses.controller;

import com.education.courses.dto.*;
import com.education.courses.service.LessonBlockService;
import com.education.courses.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;
    private final LessonBlockService lessonBlockService;

    // --- Уроки ---

    @PostMapping("/courses/{courseId}/lessons")
    public ResponseEntity<LessonResponse> createLesson(
            @PathVariable Long courseId,
            @Valid @RequestBody LessonCreateRequest request) {
        return ResponseEntity.ok(lessonService.createLesson(courseId, request));
    }

    @GetMapping("/courses/{courseId}/lessons")
    public ResponseEntity<List<LessonResponse>> getLessonsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(lessonService.getLessonsByCourse(courseId));
    }

    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<LessonResponse> getLesson(@PathVariable Long lessonId) {
        return ResponseEntity.ok(lessonService.getLesson(lessonId));
    }

    @PutMapping("/lessons/{lessonId}")
    public ResponseEntity<LessonResponse> updateLesson(
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonUpdateRequest request) {
        return ResponseEntity.ok(lessonService.updateLesson(lessonId, request));
    }

    @DeleteMapping("/lessons/{lessonId}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long lessonId) {
        lessonService.deleteLesson(lessonId);
        return ResponseEntity.noContent().build();
    }

    // --- Блоки уроков ---

    @PostMapping("/lessons/{lessonId}/blocks")
    public ResponseEntity<LessonBlockResponse> addBlock(
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonBlockCreateRequest request) {
        return ResponseEntity.ok(lessonBlockService.addBlock(lessonId, request));
    }

    @PutMapping("/lessons/blocks/{blockId}")
    public ResponseEntity<LessonBlockResponse> updateBlock(
            @PathVariable Long blockId,
            @Valid @RequestBody LessonBlockUpdateRequest request) {
        return ResponseEntity.ok(lessonBlockService.updateBlock(blockId, request));
    }

    @DeleteMapping("/lessons/blocks/{blockId}")
    public ResponseEntity<Void> deleteBlock(@PathVariable Long blockId) {
        lessonBlockService.deleteBlock(blockId);
        return ResponseEntity.noContent().build();
    }
}