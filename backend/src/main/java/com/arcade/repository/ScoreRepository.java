package com.arcade.repository;

import com.arcade.model.Score;
import com.arcade.model.Jeu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    List<Score> findByJeuOrderByValeurDesc(Jeu jeu);
}
