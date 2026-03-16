package com.example.PBL5.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LockerWebSocketHandler extends TextWebSocketHandler {

    // Danh sách lưu trữ Mạch ESP32 (Chỉ cần lưu 1 kết nối chung)
    private static final Map<String, WebSocketSession> espSessions = new ConcurrentHashMap<>();

    // --- HÀM PHIÊN DỊCH ID DÀI THÀNH SỐ 1, 2, 3, 4 ---
    private String getDoorNumber(String dbLockerId) {
        // Bạn có thể tùy chỉnh logic này theo ID thực tế trong Database của bạn
        if (dbLockerId.endsWith("1")) return "1"; // VD: LK00000001 -> 1
        if (dbLockerId.endsWith("2")) return "2";
        if (dbLockerId.endsWith("3")) return "3";
        if (dbLockerId.endsWith("4")) return "4";

        return "0"; // Trả về 0 nếu có lỗi không khớp
    }

    // 1. Khi ESP32 gửi tin nhắn lên Server
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();

        // ESP32 chỉ cần gửi đúng 1 câu báo danh cho cả cụm 4 tủ
        if (payload.equals("REGISTER:ESP_MAIN")) {
            espSessions.put("ESP_MAIN", session);
            System.out.println("Mạch ESP32 trung tâm đã kết nối thành công!");
            session.sendMessage(new TextMessage("SERVER_ACK: Da ket noi ESP32"));
        }
    }

    // 2. Khi ESP32 bị mất điện hoặc mất mạng
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        espSessions.values().remove(session);
        System.out.println("Mạch ESP32 trung tâm đã mất kết nối.");
    }

    // 3. Hàm TicketService gọi tới khi Admin bấm "Mở Tủ"
    public void sendOpenCommand(String dbLockerId) {
        // Phiên dịch ID dài ngoằng thành số tủ ngắn gọn
        String doorNumber = getDoorNumber(dbLockerId);

        // Lấy đường ống của con ESP32 ra
        WebSocketSession session = espSessions.get("ESP_MAIN");

        if (session != null && session.isOpen()) {
            try {
                // Ráp số tủ vào lệnh. Nếu Admin bấm mở LK...02 -> Gửi chuỗi "OPEN:2"
                String command = "OPEN:" + doorNumber;
                session.sendMessage(new TextMessage(command));

                System.out.println("Đã gửi lệnh " + command + " xuống ESP32!");
            } catch (IOException e) {
                System.out.println("Lỗi gửi lệnh: " + e.getMessage());
            }
        } else {
            System.out.println("Lỗi: Không thể mở tủ " + doorNumber + " vì ESP32 đang Offline!");
        }
    }
}