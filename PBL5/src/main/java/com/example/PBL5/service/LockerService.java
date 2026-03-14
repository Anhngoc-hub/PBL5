package com.example.PBL5.service;

import com.example.PBL5.dto.updateLocker;
import com.example.PBL5.entity.Locker;
import com.example.PBL5.repository.LockerRepository;
import com.example.PBL5.utils.IdGenerator;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LockerService {
    private final LockerRepository lockerRepository; // khai báo 1 biến trong class Service
    public LockerService(LockerRepository lockerRepository) {
        this.lockerRepository = lockerRepository;// gan obj cho bien cua class Service
    }
    public Locker createLocker(Locker locker){

        Locker lastLocker = lockerRepository.findTopByOrderByIdDesc();

        String lastId = null;

        if (lastLocker != null){
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

}
