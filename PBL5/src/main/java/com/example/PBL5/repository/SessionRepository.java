package com.example.PBL5.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.PBL5.entity.Session;

public interface SessionRepository extends JpaRepository<Session, String> {
    Session findByLockerIdAndStatus(String lockerId, String status);
    Session findByPalmHashAndStatus(String palmHash, String status);
    Session findTopByOrderByIdDesc();
    @Query("SELECT s FROM Session s WHERE s.locker.id = :lockerId AND s.status = :status")
    List<Session> findByLockerIdAndStatus(@Param("lockerId") String lockerId, @Param("status") String status, Sort sort);

    @Query("SELECT s FROM Session s WHERE s.locker.id = :lockerId")
    List<Session> findByLockerId(@Param("lockerId") String lockerId, Sort sort);

    @Query("SELECT s FROM Session s WHERE s.status = :status")
    List<Session> findByStatus(@Param("status") String status, Sort sort);

}
