package com.example.PBL5.dto;

public class PalmScanResponse {
    private String action;
    private String lockerId;
    private String sessionId;

    public PalmScanResponse() {
    }

    public PalmScanResponse(String action, String lockerId, String sessionId) {
        this.action = action;
        this.lockerId = lockerId;
        this.sessionId = sessionId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getLockerId() {
        return lockerId;
    }

    public void setLockerId(String lockerId) {
        this.lockerId = lockerId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
