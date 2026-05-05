package com.example.PBL5.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ImageSessionDto {
    private String sessionId;
    private LocalDateTime timestamp;
    private String relativePath;
    private List<String> rawImages;
    private List<String> roiImages;

    public ImageSessionDto() {}

    public ImageSessionDto(String sessionId, LocalDateTime timestamp, String relativePath) {
        this.sessionId = sessionId;
        this.timestamp = timestamp;
        this.relativePath = relativePath;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getRelativePath() {
        return relativePath;
    }

    public void setRelativePath(String relativePath) {
        this.relativePath = relativePath;
    }

    public List<String> getRawImages() {
        return rawImages;
    }

    public void setRawImages(List<String> rawImages) {
        this.rawImages = rawImages;
    }

    public List<String> getRoiImages() {
        return roiImages;
    }

    public void setRoiImages(List<String> roiImages) {
        this.roiImages = roiImages;
    }
}
