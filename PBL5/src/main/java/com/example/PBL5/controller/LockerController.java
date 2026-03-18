package com.example.PBL5.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.PBL5.dto.createLocker;
import com.example.PBL5.dto.updateLocker;
import com.example.PBL5.entity.Locker;
import com.example.PBL5.service.LockerService;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/lockers")
public class LockerController {
    private final LockerService lockerService;

    private static final String ESP32_IP = "http://172.20.10.5";

    // Công cụ để Server gọi API sang con ESP32
    private final RestTemplate restTemplate = new RestTemplate();

    public LockerController(LockerService lockerService) {
        this.lockerService = lockerService;
    }

    @GetMapping
    public List<Locker> getAllLockers() {
        return lockerService.getAllLockers();
    }


    @PostMapping
    public Locker createLocker(@RequestBody createLocker request) {
        Locker locker = new Locker();
        locker.setLocation(request.getLocation());
        locker.setStatus("AVAILABLE");

        return lockerService.createLocker(locker);
    }

    @GetMapping("/{id}")
    public Locker getLockerById(@PathVariable String id) {
        return lockerService.getLockerById(id);
    }

    @PutMapping("/{id}")
    public Locker updateLocker(@PathVariable String id, @RequestBody updateLocker request) {
        return lockerService.updateLocker(id, request);
    }

    @DeleteMapping("/{id}")
    public String deleteLocker(@PathVariable String id) {
        lockerService.deleteLocker(id);
        return "deleted";
    }
    @GetMapping("/search")
    public List<Locker> searchLockers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "ALL") String status) {
        return lockerService.searchLockers(keyword, status);
    }

    // API mở locker (Khớp 100% với link fetch ở Frontend của bạn)
    @GetMapping("/open")
    public String openLocker(@RequestParam String id) {
        try {
            String doorNumber = String.valueOf(Integer.parseInt(id.replaceAll("\\D+", "")));
            // Server gõ cửa IP của ESP32
            String url = ESP32_IP + "/open?locker=" + doorNumber;
            System.out.println(doorNumber);

            // Lấy câu trả lời từ ESP32 về
            String response = restTemplate.getForObject(url, String.class);
            System.out.println(response);

            return "Locker " + id + " -> " + response;

        } catch (Exception e) {
            // Nếu con ESP32 bị rút điện hoặc đổi Wi-Fi
            return "ESP32 offline";
        }
    }
}

