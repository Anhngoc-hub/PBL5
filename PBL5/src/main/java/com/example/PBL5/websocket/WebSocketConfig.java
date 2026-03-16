package com.example.PBL5.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private LockerWebSocketHandler lockerWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Mở địa chỉ /ws/locker cho ESP32 kết nối vào
        // setAllowedOrigins("*") cho phép kết nối từ mọi IP (cần thiết khi làm mạch)
        registry.addHandler(lockerWebSocketHandler, "/ws/locker").setAllowedOrigins("*");
    }
}