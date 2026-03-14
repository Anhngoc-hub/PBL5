package com.example.PBL5.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name ="session")
public class Session {
    @Id
    private String id;
    @Column(name ="palm_hash")
    private String palmHash;

    @Column(name ="start_time")
    private LocalDateTime start_time;

    @Column(name ="end_time")
    private LocalDateTime end_time;

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
        this.start_time = start_time;
        this.end_time = end_time;
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
        return start_time;
    }

    public void setStart_time(LocalDateTime start_time) {
        this.start_time = start_time;
    }

    public String getPalm_hash() {
        return palmHash;
    }

    public void setPalm_hash(String palm_hash) {
        this.palmHash = palm_hash;
    }

    public LocalDateTime getEnd_time() {
        return end_time;
    }

    public void setEnd_time(LocalDateTime end_time) {
        this.end_time = end_time;
    }

    public Locker getLocker() {
        return locker;
    }

    public void setLocker(Locker locker) {
        this.locker = locker;
    }
}
