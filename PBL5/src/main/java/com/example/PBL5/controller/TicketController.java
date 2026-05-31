package com.example.PBL5.controller;

import com.example.PBL5.dto.adminOpenRequestDto;
import com.example.PBL5.entity.Ticket;
import com.example.PBL5.service.TicketService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*") // Đảm bảo Frontend fetch dữ liệu không bị lỗi CORS
public class TicketController {
    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/force-open")
    public String forceOpen(@RequestBody adminOpenRequestDto request) {
        ticketService.adminForceOpen(
                request.getLockerId(),
                request.getReason()
        );
        return "locker opened";
    }

    // THÊM ENDPOINT NÀY: Lấy tất cả danh sách Ticket
    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketService.getAllTickets();
    }
}