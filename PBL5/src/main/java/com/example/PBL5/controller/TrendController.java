package com.example.PBL5.controller;

import com.example.PBL5.dto.DashboardTrendDto;
import com.example.PBL5.service.TrendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

    @RestController
    @RequestMapping("/api/dashboard")
    @CrossOrigin(origins = "*")
    public class TrendController {

        @Autowired
        private TrendService trendService;

        @GetMapping("/trend")
        public ResponseEntity<DashboardTrendDto> getTrend(
                @RequestParam(value = "type", defaultValue = "week") String type,
                @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

            return ResponseEntity.ok(trendService.getTrendData(type, startDate, endDate));
        }
<<<<<<< HEAD
    }
=======
    }

>>>>>>> 471904535ee3a974de671679233564eb79a3eb6d
