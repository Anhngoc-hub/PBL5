package com.example.PBL5.service;

import com.example.PBL5.dto.PalmScanResponse;
import com.example.PBL5.dto.SessionResponse;
import com.example.PBL5.entity.Locker;
import com.example.PBL5.entity.Session;
import com.example.PBL5.repository.LockerRepository;
import com.example.PBL5.repository.SessionRepository;
import com.example.PBL5.utils.IdGenerator;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SessionService {
    private final SessionRepository sessionRepository; // khai báo 1 biến trong class Service
    private final LockerRepository lockerRepository;

    public SessionService(SessionRepository sessionRepository, LockerRepository lockerRepository) {
        this.sessionRepository = sessionRepository;// gan obj cho bien cua class Service
        this.lockerRepository = lockerRepository;
    }

    private SessionResponse convertToDTO(Session session) {
        SessionResponse response = new SessionResponse();

        response.setId(session.getId());
        response.setStart_time(session.getStart_time());
        response.setEnd_time(session.getEnd_time());
        response.setStatus(session.getStatus());

        if (session.getLocker() != null) {
            response.setLockerId(session.getLocker().getId());
        }
        return response;
    }

    public List<SessionResponse> getAllSessions() {
        List<Session> sessions = sessionRepository.findAll();
        List<SessionResponse> result = new ArrayList<>();

        for (Session session : sessions) {
            result.add(convertToDTO(session));
        }
        return result;
    }

    public SessionResponse getSessionById(String id) {
        Session session = sessionRepository.findById(id).orElse(null);

        if (session == null) {
            return null;
        }

        SessionResponse response = convertToDTO(session);
        return response;
    }

    public SessionResponse getCurrentSession(String lockerId) {
        Session session = sessionRepository.findByLockerIdAndStatus(lockerId, "ACTIVE");
        if (session == null) {
            return null;
        }
        return convertToDTO(session);
    }

    public List<SessionResponse> getActiveSessions() {
        List<Session> sessions = sessionRepository.findByStatus("ACTIVE");
        List<SessionResponse> result = new ArrayList<>();

        for (Session session : sessions) {
            result.add(convertToDTO(session));
        }
        return result;
    }

  /*  public PalmScanResponse scanPalm(String palmHash) {
        Session session = sessionRepository.findByPalmHashAndStatus(palmHash, "ACTIVE");
        if(session != null){

            Locker locker = session.getLocker();

            session.setStatus("FINISHED");
            session.setEnd_time(LocalDateTime.now());

            locker.setStatus("AVAILABLE");

            sessionRepository.save(session);
            lockerRepository.save(locker);

            return new PalmScanResponse(
                    "RETRIEVE",
                    locker.getId(),
                    session.getId()
            );
        }
        // 3 nếu chưa có → user gửi đồ
        Locker locker = lockerRepository.findTopByStatus("AVAILABLE");

        if(locker == null){
            return null;
        }

        // tạo sessionId
        Session lastSession = sessionRepository.findTopByOrderByIdDesc();
        String lastId = lastSession != null ? lastSession.getId() : null;

        String newId = IdGenerator.generateId(lastId,"SS");

        // tạo session
        Session newSession = new Session();
        newSession.setId(newId);
        newSession.setPalm_hash(palmHash);
        newSession.setStart_time(LocalDateTime.now());
        newSession.setStatus("ACTIVE");
        newSession.setLocker(locker);

        sessionRepository.save(newSession);

        locker.setStatus("OCCUPIED");
        lockerRepository.save(locker);

        return new PalmScanResponse(
                "STORE",
                locker.getId(),
                newId
        );
    }*/

    /*public SessionResponse createSession(String palmHash) {
        //check palm da co session chua
        Session existSession = sessionRepository.findByPalmHashAndStatus(palmHash, "ACTIVE");

        if (existSession != null) {
            SessionResponse response = new SessionResponse();

            response.setId(existSession.getId());
            response.setLockerId(existSession.getLocker().getId());
            response.setStatus("ACTIVE");

            return response;

        }
        //tim locker AVAILABLE
        Locker locker = lockerRepository.findTopByStatus("AVAILABLE");
        if (locker == null) {
            return null;
        }
        //tao sessionId
        Session lastSession = sessionRepository.findTopByOrderByIdDesc();
        String lastId = lastSession != null ? lastSession.getId() : null;

        String newId = IdGenerator.generateId(lastId, "SS");

        Session session = new Session();
        session.setId(newId);
        session.setPalm_hash(palmHash);
        session.setStart_time(LocalDateTime.now());
        session.setStatus("ACTIVE");
        session.setLocker(locker);

        sessionRepository.save(session);
        //update locker
        locker.setStatus("ACTIVE");
        lockerRepository.save(locker);

        //response
        SessionResponse response = new SessionResponse();
        response.setId(session.getId());
        response.setLockerId(locker.getId());
        response.setStatus("ACTIVE");
        response.setStart_time(LocalDateTime.now());

        return response;

    }*/

   /* public String finishSession(String sessionId) {
        Session session = sessionRepository.findById(sessionId).orElse(null);

        if (session == null) {
            return "session not found";
        }

        if ("FINISHED".equals(session.getStatus())) {
            return "session finished";
        }
        session.setEnd_time(LocalDateTime.now());
        session.setStatus("FINISHED");

        Locker locker = session.getLocker();
        locker.setStatus("AVAILABLE");

        sessionRepository.save(session);
        lockerRepository.save(locker);

        return "session finished";
    }*/
}
