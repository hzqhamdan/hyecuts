package com.hyecuts.loyalty.repository;
import com.hyecuts.loyalty.model.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MissionRepository extends JpaRepository<Mission, Long> {
    List<Mission> findByType(String type);
}
