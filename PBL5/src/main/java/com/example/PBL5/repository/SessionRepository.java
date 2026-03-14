package com.example.PBL5.repository;

import com.example.PBL5.entity.Locker;
import com.example.PBL5.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<Session, String> {
    Session findByLockerIdAndStatus(String lockerId, String status);
    Session findByPalmHashAndStatus(String palmHash, String status);
    Session findTopByOrderByIdDesc();

}
