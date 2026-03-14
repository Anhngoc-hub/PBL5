package com.example.PBL5.repository;

import com.example.PBL5.entity.Locker;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LockerRepository extends JpaRepository<Locker, String> {
Locker findTopByOrderByIdDesc();
Locker findTopByStatus(String status);
}
