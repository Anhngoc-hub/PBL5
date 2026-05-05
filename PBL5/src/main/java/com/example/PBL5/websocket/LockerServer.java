package com.example.PBL5.websocket;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
public class LockerServer {

    // IP của ESP32
    private static final String ESP32_IP = "http://172.20.10.5";

    private RestTemplate restTemplate = new RestTemplate();

    // test server
   /* @GetMapping("/")
    public String home() {
        return "Spring Locker Server Running";
    }*/

    // mở locker
    @GetMapping("/open/{id}")
    public String openLocker(@PathVariable String id) {

        try {

            String url = ESP32_IP + "/open?locker=" + id;

            String response = restTemplate.getForObject(url, String.class);

            return "Locker " + id + " -> " + response;

        } catch (Exception e) {

            return "ESP32 offline";
        }
    }

}