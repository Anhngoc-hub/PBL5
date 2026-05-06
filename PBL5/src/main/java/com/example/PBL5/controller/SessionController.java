package com.example.PBL5.controller;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.PBL5.dto.SessionResponse;
import com.example.PBL5.service.SessionService;

@RestController
@RequestMapping("/sessions")
public class SessionController {

    private final SessionService sessionService;
    // Khai báo đường dẫn gốc chứa ảnh từ Python
    private final String STORAGE_PATH = "D:/Projects/Personal/PalmLocker/storage";

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping
    public List<SessionResponse> getAllSessions() {
        return sessionService.getAllSessions();
    }

    @GetMapping("/{id}")
    public SessionResponse getSessionById(@PathVariable String id) {
        return sessionService.getSessionById(id);
    }

    @GetMapping("/{lockerId}/current-session")
    public SessionResponse getCurrentSession(@PathVariable String lockerId) {
        return sessionService.getCurrentSession(lockerId);
    }

    @GetMapping("/search")
    public List<SessionResponse> searchSessions(
            @RequestParam(required = false) String lockerId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "startTime") String sortBy) {
        return sessionService.searchSessions(lockerId, status, sortBy);
    }

    @GetMapping("/images")
    public ResponseEntity<List<String>> getSessionImages(@RequestParam String sessionId, @RequestParam String startTime) {
        try {
            // 1. Phân tích ngày tháng từ startTime
            LocalDateTime ldt = LocalDateTime.parse(startTime);
            String year = String.valueOf(ldt.getYear());
            String month = String.format("%02d", ldt.getMonthValue());
            String day = String.format("%02d", ldt.getDayOfMonth());

            // 2. Sử dụng Paths.get để nối chuỗi đường dẫn an toàn hơn trên Windows
            Path sessionPath = Paths.get(STORAGE_PATH, year, month, day, sessionId, "roi");
            File roiDir = sessionPath.toFile();

            // Log để Toàn kiểm tra đường dẫn trong Console nếu vẫn lỗi 404
            System.out.println("🔍 Đang tìm ảnh tại: " + roiDir.getAbsolutePath());
            System.out.println("❓ Thư mục tồn tại không: " + roiDir.exists());

            if (roiDir.exists() && roiDir.isDirectory()) {
                String[] files = roiDir.list((dir, name) -> name.toLowerCase().endsWith(".jpg"));

                if (files != null && files.length > 0) {
                    List<String> imageUrls = Arrays.stream(files)
                            .map(fileName -> "/sessions/display-image?fullPath=" + 
                                 URLEncoder.encode(new File(roiDir, fileName).getAbsolutePath(), StandardCharsets.UTF_8))
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(imageUrls);
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi ra console để debug
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Stream ảnh từ ổ cứng lên giao diện
     */
    @GetMapping("/display-image")
    public ResponseEntity<Resource> displayImage(@RequestParam String fullPath) {
        try {
            Path path = Paths.get(fullPath);
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    /*@PostMapping
    public SessionResponse createSession(@RequestBody PalmScanRequest request) {
        return sessionService.createSession(request.getPalmHash());
    }
    @PutMapping("/{id}/finish")
    public Map<String, String> finishSession(@PathVariable String id) {
        String message = sessionService.finishSession(id);
        return Map.of("message", message);
    }*/
  /*  @PostMapping("/palm")
    public PalmScanResponse scanPalm(@RequestBody PalmScanRequest palmScanRequest) {
        return sessionService.scanPalm(palmScanRequest.getPalmHash());
    }*/
    

}
