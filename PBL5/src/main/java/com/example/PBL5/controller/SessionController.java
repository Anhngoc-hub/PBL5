package com.example.PBL5.controller;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
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

 
    @GetMapping("/images-by-session")
public ResponseEntity<?> getSessionImages(@RequestParam String sessionId) {
    // 1. Chống lỗi cắt chuỗi: Kiểm tra độ dài sessionId trước
    if (sessionId == null || sessionId.length() < 15) {
        return ResponseEntity.badRequest().body("ID quá ngắn, phải là YYYYMMDD_HHmmss");
    }

    try {
        // Cắt chuỗi an toàn (Chỉ số chuẩn cho format: 20260505_212815)
        String year = sessionId.substring(0, 4);
        String month = sessionId.substring(4, 6);
        String day = sessionId.substring(6, 8);
        String hour = sessionId.substring(9, 11);
        String min = sessionId.substring(11, 13);
        String sec = sessionId.substring(13, 15);
        String prefix = hour + "_" + min + "_" + sec;

        // 2. Chống lỗi Null: Dùng Paths.get để tự chuẩn hóa xuyệt / hoặc \
        File dateDir = Paths.get(STORAGE_PATH, year, month, day).toFile();

        if (!dateDir.exists()) {
            return ResponseEntity.status(404).body("Không tìm thấy thư mục ngày: " + dateDir.getAbsolutePath());
        }

        // 3. Chống lỗi tìm kiếm: Kiểm tra danh sách folder
        File[] folders = dateDir.listFiles((dir, name) -> name.startsWith(prefix));

        if (folders == null || folders.length == 0) {
            return ResponseEntity.status(404).body("Không tìm thấy folder session bắt đầu bằng: " + prefix);
        }

        // 4. Vào thư mục ROI
        File roiDir = new File(folders[0], "roi");
        if (!roiDir.exists()) return ResponseEntity.notFound().build();

        String[] files = roiDir.list((dir, name) -> name.toLowerCase().endsWith(".jpg"));
        if (files == null || files.length == 0) return ResponseEntity.ok(Collections.emptyList());

        // 5. Trả về kết quả
        List<String> urls = Arrays.stream(files)
            .map(f -> "/sessions/display-image?fullPath=" + URLEncoder.encode(new File(roiDir, f).getAbsolutePath(), StandardCharsets.UTF_8))
            .collect(Collectors.toList());

        return ResponseEntity.ok(urls);

    } catch (Exception e) {
        e.printStackTrace(); // In lỗi ra Console để Toàn debug
        return ResponseEntity.internalServerError().body("Lỗi xử lý: " + e.getMessage());
    }
}
    @GetMapping("/display-image")
    public ResponseEntity<Resource> displayImage(@RequestParam String fullPath) {
        try {
            Path path = Paths.get(fullPath);
            Resource resource = new UrlResource(path.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
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
