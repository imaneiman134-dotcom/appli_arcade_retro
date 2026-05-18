package com.arcade.service;

import com.arcade.model.*;
import com.arcade.repository.MatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MatchService {

    @Autowired
    private MatchRepository matchRepository;

    @Transactional
    public Match createMatch(Jeu jeu, Utilisateur player1, Utilisateur player2) {
        Match match = new Match(jeu, player1, player2);
        match.setStatus(MatchStatus.IN_PROGRESS);
        match.setStartedAt(LocalDateTime.now());
        return matchRepository.save(match);
    }

    public Match getMatchById(Long matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match non trouvé"));
    }

    @Transactional
    public Match updateMatchStatus(Long matchId, MatchStatus newStatus) {
        Match match = getMatchById(matchId);
        match.setStatus(newStatus);
        if (newStatus == MatchStatus.COMPLETED || newStatus == MatchStatus.CANCELLED) {
            match.setFinishedAt(LocalDateTime.now());
        }
        return matchRepository.save(match);
    }

    @Transactional
    public Match setMatchWinner(Long matchId, Long winnerId) {
        Match match = getMatchById(matchId);
        match.setWinnerId(winnerId);
        match.setStatus(MatchStatus.COMPLETED);
        match.setFinishedAt(LocalDateTime.now());
        return matchRepository.save(match);
    }

    public List<Match> getPlayerMatches(Utilisateur player) {
        return matchRepository.findByPlayer1OrPlayer2(player, player);
    }

    @Transactional
    public void cleanupExpiredMatches() {
        LocalDateTime expirationTime = LocalDateTime.now().minusDays(7); // Matches expire after 7 days if not completed
        List<Match> expiredPendingMatches = matchRepository.findByStatusAndCreatedAtBefore(MatchStatus.PENDING, expirationTime);
        for (Match match : expiredPendingMatches) {
            match.setStatus(MatchStatus.EXPIRED);
            matchRepository.save(match);
        }
        List<Match> expiredInProgressMatches = matchRepository.findByStatusAndCreatedAtBefore(MatchStatus.IN_PROGRESS, expirationTime);
        for (Match match : expiredInProgressMatches) {
            match.setStatus(MatchStatus.EXPIRED);
            matchRepository.save(match);
        }
        System.out.println("Cleaned up " + (expiredPendingMatches.size() + expiredInProgressMatches.size()) + " expired matches.");
    }
}
