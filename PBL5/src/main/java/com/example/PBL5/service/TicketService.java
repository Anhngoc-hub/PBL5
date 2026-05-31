package com.example.PBL5.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.PBL5.entity.Locker;
import com.example.PBL5.entity.Session;
import com.example.PBL5.entity.Ticket;
import com.example.PBL5.repository.LockerRepository;
import com.example.PBL5.repository.SessionRepository;
import com.example.PBL5.repository.TicketRepository;
import com.example.PBL5.utils.IdGenerator;
import com.example.PBL5.websocket.LockerServer;

@Service
public class TicketService {
@Autowired
private TicketRepository ticketRepository;
@Autowired
private SessionRepository sessionRepository;
@Autowired
private LockerRepository lockerRepository;
LockerServer lockerServer;

public void adminForceOpen(String lockerId, String reason) {
   Locker locker = lockerRepository.findById(lockerId)
           .orElseThrow(() -> new RuntimeException("Locker not found"));

   Session session = sessionRepository.findByLockerIdAndStatus(lockerId, "OCCUPIED");

   Ticket lastTicket = ticketRepository.findTopByOrderByIdDesc();

   String lastId = null;
   if (lastTicket != null) {
       lastId = lastTicket.getId();
   }

   String newId = IdGenerator.generateId(lastId, "TK");

   Ticket ticket = new Ticket();
   ticket.setId(newId);
   ticket.setLocker(locker);
   ticket.setSession(session);
   ticket.setReason(reason);
   ticket.setCreated_at(LocalDateTime.now());

   ticketRepository.save(ticket);
   lockerServer.openLocker(locker.getId());
}
// Thêm hàm này vào bên trong class TicketService của bạn:
public java.util.List<Ticket> getAllTickets() {
    return ticketRepository.findAll();
}

}
