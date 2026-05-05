package com.example.PBL5.controller;

import com.example.PBL5.dto.ImageSessionDto;
import com.example.PBL5.service.ImageService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        List<ImageSessionDto> all = imageService.searchSessions(sessionId, startDate, endDate);
        
        // Manual pagination
        int totalElements = all.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        
        int start = Math.min(page * size, totalElements);
        int end = Math.min((page + 1) * size, totalElements);
        
        List<ImageSessionDto> paged = all.subList(start, end);
        
        return ResponseEntity.ok(new PaginatedResponse(paged, totalPages, totalElements, page));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<?> getSessionImages(@PathVariable String sessionId) {
        ImageSessionDto dto = imageService.getSessionImages(sessionId);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }
    
    public static class PaginatedResponse {
        public List<ImageSessionDto> content;
        public int totalPages;
        public int totalElements;
        public int pageNumber;
        
        public PaginatedResponse(List<ImageSessionDto> content, int totalPages, int totalElements, int pageNumber) {
            this.content = content;
            this.totalPages = totalPages;
            this.totalElements = totalElements;
            this.pageNumber = pageNumber;
        }
    }
}
