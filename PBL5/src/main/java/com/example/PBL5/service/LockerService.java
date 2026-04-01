package com.example.PBL5.service;

import java.time.LocalDateTime;
import java.util.List;

import com.example.PBL5.dto.adminOpenRequestDto;
import com.example.PBL5.entity.Ticket;
import com.example.PBL5.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.PBL5.dto.updateLocker;
import com.example.PBL5.entity.Locker;
import com.example.PBL5.repository.LockerRepository;
import com.example.PBL5.utils.IdGenerator;
import org.springframework.web.client.RestTemplate;

@Service
public class LockerService {

    @Value("${esp32.ip}")
    private String ESP32_IP;

    // Công cụ để Server gọi API sang con ESP32
    private final RestTemplate restTemplate = new RestTemplate();

    private final LockerRepository lockerRepository; // khai báo 1 biến trong class Service
    private final TicketRepository ticketRepository;
    public LockerService(LockerRepository lockerRepository, TicketRepository ticketRepository) {
        this.lockerRepository = lockerRepository;// gan obj cho bien cua class Service
        this.ticketRepository = ticketRepository;
    }
    public Locker createLocker(Locker locker) {
        if (lockerRepository.existsByLocation(locker.getLocation())) {
            throw new RuntimeException("Vị trí này đã có tủ đồ rồi!");
        }

        Locker lastLocker = lockerRepository.findTopByOrderByIdDesc();
        String lastId = null;
        if (lastLocker != null) {
            lastId = lastLocker.getId();
        }

        String newId = IdGenerator.generateId(lastId, "LK");
        locker.setId(newId);

        return lockerRepository.save(locker);
    }
    public List<Locker> getAllLockers() {
        return lockerRepository.findAll();
    }
    public Locker getLockerById(String id){
        return lockerRepository.findById(id).orElse(null);
    }

    public Locker updateLocker(String id, updateLocker request) {
        Locker locker = lockerRepository.findById(id).orElse(null);

        if (locker == null) {
            return null;
        }

        locker.setLocation(request.getLocation());
        locker.setStatus(request.getStatus());

        return lockerRepository.save(locker);

    }

    public void deleteLocker(String id) {
        Locker locker = lockerRepository.findById(id).orElse(null);

        if (locker == null) {
            return;
        }
        lockerRepository.delete(locker);
    }
    public List<Locker> searchLockers(String keyword, String status) {
        if (status == null || status.equals("ALL")) {
            return lockerRepository.searchAllStatus(keyword);
        }
        return lockerRepository.searchWithStatus(keyword, status);
    }

    public String adminOpenLocker(adminOpenRequestDto request ) {
        try {
            String id = request.getLockerId();
            String reason = request.getReason();

            String doorNumber = String.valueOf(
                    Integer.parseInt(id.replaceAll("\\D+", ""))
            );
            String url = ESP32_IP + "/open?locker=" + doorNumber;

            String response = restTemplate.getForObject(url, String.class);

            if (response != null && response.contains("opened")) {
                Locker locker = lockerRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Locker not found"));

                locker.setStatus("AVAILABLE");
                lockerRepository.save(locker);

                Ticket lastTicket = ticketRepository.findTopByOrderByIdDesc();
                String lastId = null;
                if (lastTicket != null) {
                    lastId = lastTicket.getId();
                }

                String newId = IdGenerator.generateId(lastId, "TK");
                Ticket ticket = new Ticket();
                ticket.setId(newId);
                ticket.setCreated_at(LocalDateTime.now());
                ticket.setReason(reason);
                ticket.setLocker(locker);

                ticketRepository.save(ticket);

            }
            return "Locker " + id + " -> " + response;
        } catch (Exception e) {
            e.printStackTrace();
            return "ESP32 offline";
            }

        }
    }

