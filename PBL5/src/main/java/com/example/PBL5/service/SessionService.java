package com.example.PBL5.service;
import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.example.PBL5.dto.SessionResponse;
import com.example.PBL5.entity.Session;
import com.example.PBL5.repository.SessionRepository;

@Service
public class SessionService {
    private final SessionRepository sessionRepository; // khai báo 1 biến trong class Service
    private final String STORAGE_PATH = "D:/Projects/Personal/PalmLocker/storage";

    public SessionService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;// gan obj cho bien cua class Service
    }

    private SessionResponse convertToDTO(Session session) {
    SessionResponse response = new SessionResponse();
    response.setId(session.getId());
    
    // Gọi các getter mới
    response.setStartTime(session.getStartTime()); 
    response.setEndTime (session.getEndTime());
    response.setStatus(session.getStatus());
    response.setLockerLocation(session.getLocker() != null ? session.getLocker().getLocation() : null);

    if (session.getLocker() != null) {
        response.setLockerId(session.getLocker().getId());
    }
    return response;
}

   public List<SessionResponse> getAllSessions() {
    List<Session> sessions = sessionRepository.findAll();
    List<SessionResponse> responseList = new java.util.ArrayList<>();
    
    for (Session session : sessions) {
        SessionResponse res = new SessionResponse();
        res.setId(session.getId());
        
        if (session.getLocker() != null) {
            res.setLockerId(session.getLocker().getId());
            res.setLockerLocation(session.getLocker().getLocation()); // 🔥 Nạp vị trí tủ
        }
        
        res.setStartTime(session.getStartTime());
        res.setEndTime(session.getEndTime());
        res.setStatus(session.getStatus());
        responseList.add(res);
    }
    return responseList;
}

    public SessionResponse getSessionById(String id) {
        Session session = sessionRepository.findById(id).orElse(null);

        if (session == null) {
            return null;
        }

        SessionResponse response = convertToDTO(session);
        return response;
    }

    public SessionResponse getCurrentSession(String lockerId) {
        Session session = sessionRepository.findByLockerIdAndStatus(lockerId, "ACTIVE");
        if (session == null) {
            return null;
        }
        return convertToDTO(session);
    }

   
    
public List<SessionResponse> searchSessions(String lockerId, String status, String sortBy) {
    // sortBy gửi lên sẽ là "start_time" hoặc "end_time", khớp 100% với Entity
    String fieldName = sortBy;
    if ("start_time".equals(sortBy)) fieldName = "startTime";
    if ("end_time".equals(sortBy)) fieldName = "endTime";

    Sort sort = Sort.by(Sort.Direction.ASC, fieldName);
    
    List<Session> sessions;
    boolean hasLockerId = lockerId != null && !lockerId.isEmpty();
    boolean hasStatus = status != null && !status.equalsIgnoreCase("ALL");

    if (hasLockerId && hasStatus) {
        sessions = sessionRepository.findByLockerIdAndStatus(lockerId, status, sort);
    } else if (hasLockerId) {
        sessions = sessionRepository.findByLockerId(lockerId, sort);
    } else if (hasStatus) {
        sessions = sessionRepository.findByStatus(status, sort);
    } else {
        sessions = sessionRepository.findAll(sort);
    }

    return sessions.stream()
                   .map(s -> this.convertToDTO(s)) 
                   .collect(Collectors.toList());
}
public List<String> getSessionImageUrls(String sessionId) throws IllegalArgumentException, Exception {
        // 1. Kiểm tra cấu trúc chuỗi đầu vào
        if (sessionId == null || !sessionId.contains("_") || sessionId.length() < 15) {
            throw new IllegalArgumentException("Định dạng ID phải là YYYYMMDD_HHmmss");
        }

        // Tách chuỗi dựa vào dấu gạch dưới duy nhất
        String[] parts = sessionId.split("_");
        String datePart = parts[0]; // "20260505"
        String timePart = parts[1]; // "212815"
        
        String year = datePart.substring(0, 4);
        String month = datePart.substring(4, 6);
        String day = datePart.substring(6, 8);

        // Tạo tiền tố tìm kiếm folder giờ_phút_giây (Ví dụ: "21_28_15")
        String prefix = timePart.substring(0, 2) + "_" + timePart.substring(2, 4) + "_" + timePart.substring(4, 6);

        File dateDir = Paths.get(STORAGE_PATH, year, month, day).toFile();
        if (!dateDir.exists()) {
            return null; // Trả về null báo hiệu Controller xuất lỗi 404 không thấy ngày
        }

        // Tìm folder bắt đầu bằng prefix (Ví dụ: "21_28_15_373")
        File[] folders = dateDir.listFiles((dir, name) -> name.startsWith(prefix));
        if (folders == null || folders.length == 0) {
            return null; // Trả về null báo hiệu không thấy folder giờ
        }

        // Đi thẳng vào thư mục raw chứa ảnh gốc
        File rawDir = new File(folders[0], "raw");
        if (!rawDir.exists()) {
            return null; // Trả về null báo hiệu không thấy folder raw
        }

        String[] files = rawDir.list((dir, name) -> name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".png"));
        if (files == null || files.length == 0) {
            return Collections.emptyList();
        }

        // Trả về danh sách URL tương đối để hiển thị lên Frontend
        return Arrays.stream(files)
            .map(f -> "/sessions/display-image?fullPath=" + URLEncoder.encode(new File(rawDir, f).getAbsolutePath(), StandardCharsets.UTF_8))
            .collect(Collectors.toList());
    }
 
}
