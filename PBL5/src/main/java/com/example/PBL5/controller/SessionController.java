package com.example.PBL5.controller;

import com.example.PBL5.dto.PalmScanResponse;
import com.example.PBL5.dto.SessionResponse;
import com.example.PBL5.dto.PalmScanRequest;
import com.example.PBL5.service.SessionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    @GetMapping("/active")
    public List<SessionResponse> getAllActiveSessions() {
        return sessionService.getActiveSessions();
    }
}
