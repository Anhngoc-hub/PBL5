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
    // 1. Kiểm tra cấu trúc chuỗi đầu vào (Ví dụ: 20260505_212815)
    if (sessionId == null || !sessionId.contains("_") || sessionId.length() < 15) {
        return ResponseEntity.badRequest().body("Định dạng ID phải là YYYYMMDD_HHmmss");
    }

    try {
        // Tách chuỗi dựa vào dấu gạch dưới duy nhất
        String[] parts = sessionId.split("_");
        String datePart = parts[0]; // "20260505"
        String timePart = parts[1]; // "212815"
        
        String year = datePart.substring(0, 4);
        String month = datePart.substring(4, 6);
        String day = datePart.substring(6, 8);

        // Tạo tiền tố tìm kiếm folder giờ_phút_giây (Ví dụ: "21_28_15")
        String prefix = timePart.substring(0, 2) + "_" + timePart.substring(2, 4) + "_" + timePart.substring(4, 6);

        // Đường dẫn chứa ảnh thực tế bên ổ D của bạn
        String realStoragePath = "D:/Projects/Personal/PalmLocker/storage";
        File dateDir = Paths.get(realStoragePath, year, month, day).toFile();

        if (!dateDir.exists()) {
            return ResponseEntity.status(404).body("Không tìm thấy thư mục ngày: " + dateDir.getAbsolutePath());
        }

        // Tìm folder bắt đầu bằng "21_28_15" (Sẽ tự động quét trúng folder "21_28_15_373" ngoài ổ đĩa)
        File[] folders = dateDir.listFiles((dir, name) -> name.startsWith(prefix));

        if (folders == null || folders.length == 0) {
            return ResponseEntity.status(404).body("Không tìm thấy folder session bắt đầu bằng: " + prefix);
        }

        // Đi thẳng vào thư mục raw chứa ảnh gốc
        File rawDir = new File(folders[0], "raw");
        if (!rawDir.exists()) {
            return ResponseEntity.status(404).body("Không tìm thấy thư mục ảnh raw tại: " + rawDir.getAbsolutePath());
        }

        String[] files = rawDir.list((dir, name) -> name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".png"));
        if (files == null || files.length == 0) return ResponseEntity.ok(Collections.emptyList());

        // Trả về danh sách URL để hiển thị lên Frontend
        List<String> urls = Arrays.stream(files)
            .map(f -> "/sessions/display-image?fullPath=" + URLEncoder.encode(new File(rawDir, f).getAbsolutePath(), StandardCharsets.UTF_8))
            .collect(Collectors.toList());

        return ResponseEntity.ok(urls);

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
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
