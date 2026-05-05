package com.example.PBL5.controller;

import java.util.List;

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
        @RequestParam(defaultValue = "startTime") String sortBy) { // Mặc định lọc theo startTime
    return sessionService.searchSessions(lockerId, status, sortBy);
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
