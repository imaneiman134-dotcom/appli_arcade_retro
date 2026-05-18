package com.arcade.repository;

import com.arcade.model.MatchMastersMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchMastersMatchRepository extends JpaRepository<MatchMastersMatch, Long> {
    List<MatchMastersMatch> findByStatus(String status);
    List<MatchMastersMatch> findByPlayer1IdOrPlayer2Id(Long player1Id, Long player2Id);
}
