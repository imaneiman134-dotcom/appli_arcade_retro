package com.arcade.repository;

import com.arcade.model.Match;
import com.arcade.model.MatchStatus;
import com.arcade.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByStatusAndCreatedAtBefore(MatchStatus status, LocalDateTime dateTime);
    List<Match> findByPlayer1OrPlayer2(Utilisateur player1, Utilisateur player2);
}
