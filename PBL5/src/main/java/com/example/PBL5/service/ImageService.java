package com.example.PBL5.service;

import com.example.PBL5.dto.ImageSessionDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ImageService {

    @Value("${ai.storage.path}")
    private String storagePath;

    public List<ImageSessionDto> searchSessions(String searchId, LocalDateTime startDate, LocalDateTime endDate) {
        List<ImageSessionDto> all = getAllSessions();
        
        return all.stream()
                .filter(s -> searchId == null || searchId.isEmpty() || s.getSessionId().contains(searchId))
                .filter(s -> startDate == null || !s.getTimestamp().isBefore(startDate))
                .filter(s -> endDate == null || !s.getTimestamp().isAfter(endDate))
                .collect(Collectors.toList());
    }

    public ImageSessionDto getSessionImages(String sessionId) {
        List<ImageSessionDto> all = getAllSessions();
        Optional<ImageSessionDto> opt = all.stream().filter(s -> s.getSessionId().equals(sessionId)).findFirst();
        
        if (opt.isPresent()) {
            ImageSessionDto dto = opt.get();
            File rawDir = new File(storagePath, dto.getRelativePath() + "/raw");
            File roiDir = new File(storagePath, dto.getRelativePath() + "/roi");
            
            dto.setRawImages(listFiles(rawDir, dto.getRelativePath() + "/raw"));
            dto.setRoiImages(listFiles(roiDir, dto.getRelativePath() + "/roi"));
            return dto;
        }
        return null;
    }

    private List<String> listFiles(File dir, String relativePrefix) {
        List<String> files = new ArrayList<>();
        if (dir.exists() && dir.isDirectory()) {
            File[] fileList = dir.listFiles((d, name) -> name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".png"));
            if (fileList != null) {
                Arrays.sort(fileList, Comparator.comparing(File::getName));
                for (File f : fileList) {
                    files.add("/ai-images/" + relativePrefix + "/" + f.getName());
                }
            }
        }
        return files;
    }

    private List<ImageSessionDto> getAllSessions() {
        List<ImageSessionDto> sessions = new ArrayList<>();
        File baseDir = new File(storagePath);
        if (!baseDir.exists() || !baseDir.isDirectory()) {
            return sessions;
        }

        try {
            Files.walkFileTree(baseDir.toPath(), new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) {
                    File rawDir = new File(dir.toFile(), "raw");
                    File roiDir = new File(dir.toFile(), "roi");
                    if (rawDir.exists() && rawDir.isDirectory() && roiDir.exists() && roiDir.isDirectory()) {
                        String relative = baseDir.toPath().relativize(dir).toString().replace("\\", "/");
                        String[] parts = relative.split("/");
                        if (parts.length >= 4) {
                            try {
                                String year = parts[parts.length - 4];
                                String month = parts[parts.length - 3];
                                String day = parts[parts.length - 2];
                                String timePart = parts[parts.length - 1];
                                
                                String[] timeParts = timePart.split("_");
                                if (timeParts.length >= 3) {
                                    int hour = Integer.parseInt(timeParts[0]);
                                    int min = Integer.parseInt(timeParts[1]);
                                    int sec = Integer.parseInt(timeParts[2]);
                                    
                                    LocalDateTime dt = LocalDateTime.of(
                                            Integer.parseInt(year), Integer.parseInt(month), Integer.parseInt(day),
                                            hour, min, sec
                                    );
                                    
                                    // sessionId: YYYYMMDD_HHMMSS_fff
                                    String sessionId = String.format("%s%s%s_%s%s%s", year, month, day, 
                                            timeParts[0], timeParts[1], timeParts[2]);
                                    if(timeParts.length >= 4) {
                                        sessionId += "_" + timeParts[3];
                                    }

                                    ImageSessionDto dto = new ImageSessionDto(sessionId, dt, relative);
                                    sessions.add(dto);
                                }
                            } catch (Exception e) {
                            }
                        }
                        return FileVisitResult.SKIP_SUBTREE;
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            e.printStackTrace();
        }

        sessions.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return sessions;
    }
}
