package com.example.PBL5.controller;

import com.example.PBL5.dto.adminOpenRequestDto;
import com.example.PBL5.service.TicketService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {
    private TicketService ticketService;
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

}
