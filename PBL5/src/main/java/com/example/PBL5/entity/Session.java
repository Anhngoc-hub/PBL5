package com.example.PBL5.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name ="session")
public class Session {
    @Id
    private String id;
    @Column(name ="palm_hash")
    private String palmHash;

    @Column(name = "start_time")
private LocalDateTime startTime; 

@Column(name = "end_time")
private LocalDateTime endTime;

    @Column(name ="status")
    private String status;

    @ManyToOne
    @JoinColumn(name = "locker_id")
    private Locker locker;

    public Session() {

    }
    public Session(String id, String palm_hash, LocalDateTime start_time, LocalDateTime end_time, Locker locker) {
        this.id = id;
        this.palmHash = palm_hash;
        this.startTime = start_time;
        this.endTime = end_time;
        this.locker = locker;
    }
    public String getId() {
        return id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setId(String id) {
        this.id = id;
    }

    public LocalDateTime getStart_time() {
        return startTime;
    }

    public void setStart_time(LocalDateTime start_time) {
        this.startTime = start_time;
    }

    public String getPalm_hash() {
        return palmHash;
    }

    public void setPalm_hash(String palm_hash) {
        this.palmHash = palm_hash;
    }

    public LocalDateTime getEnd_time() {
        return endTime;
    }

    public void setEnd_time(LocalDateTime end_time) {
        this.endTime = end_time;
    }

    public Locker getLocker() {
        return locker;
    }

    public void setLocker(Locker locker) {
        this.locker = locker;
    }
}
