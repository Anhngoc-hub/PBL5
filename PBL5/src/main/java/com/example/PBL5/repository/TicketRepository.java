package com.example.PBL5.repository;

import com.example.PBL5.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, String> {
Ticket findTopByOrderByIdDesc();

}
