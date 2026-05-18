package com.arcade.service;

import com.arcade.model.MatchMastersMatch;
import com.arcade.model.Jeu;
import com.arcade.repository.MatchMastersMatchRepository;
import com.arcade.repository.JeuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MatchMastersService {

    @Autowired
    private MatchMastersMatchRepository matchMastersMatchRepository;

    @Autowired
    private JeuRepository jeuRepository;

    public MatchMastersMatch createMatch(Long jeuId, Long player1Id, Long player2Id) {
        Optional<Jeu> jeu = jeuRepository.findById(jeuId);
        if (jeu.isEmpty()) {
            throw new RuntimeException("Jeu non trouvé");
        }
        MatchMastersMatch match = new MatchMastersMatch(jeu.get(), player1Id, player2Id);
        match.setStatus("IN_PROGRESS");
        return matchMastersMatchRepository.save(match);
    }

    public MatchMastersMatch playTurn(Long matchId, Integer scoreGained) {
        Optional<MatchMastersMatch> optMatch = matchMastersMatchRepository.findById(matchId);
        if (optMatch.isEmpty()) {
            throw new RuntimeException("Match non trouvé");
        }

        MatchMastersMatch match = optMatch.get();

        // Add score to current player
        if (match.getCurrentTurn() == 1) {
            match.setPlayer1Score(match.getPlayer1Score() + scoreGained);
        } else {
            match.setPlayer2Score(match.getPlayer2Score() + scoreGained);
        }

        // Switch turn or end game
        Integer totalTurns = (match.getCurrentTurn() - 1) / 2 + 1;
        if (match.getCurrentTurn() == 1) {
            match.setCurrentTurn(2);
        } else {
            match.setCurrentTurn(1);
            totalTurns++;
        }

        // Check if game is over
        if (totalTurns > match.getMaxTurns()) {
            match.setStatus("COMPLETED");
            if (match.getPlayer1Score() > match.getPlayer2Score()) {
                match.setWinnerId(match.getPlayer1Id());
            } else if (match.getPlayer2Score() > match.getPlayer1Score()) {
                match.setWinnerId(match.getPlayer2Id());
            }
            // If equal, no winner (draw)
            match.setFinishedAt(LocalDateTime.now());
        }

        return matchMastersMatchRepository.save(match);
    }

    public MatchMastersMatch getMatch(Long matchId) {
        return matchMastersMatchRepository.findById(matchId).orElse(null);
    }

    public List<MatchMastersMatch> getPlayerMatches(Long userId) {
        return matchMastersMatchRepository.findByPlayer1IdOrPlayer2Id(userId, userId);
    }

    public List<MatchMastersMatch> getMatchesByStatus(String status) {
        return matchMastersMatchRepository.findByStatus(status);
    }

    public void updateBoardState(Long matchId, String newBoardState) {
        Optional<MatchMastersMatch> optMatch = matchMastersMatchRepository.findById(matchId);
        if (optMatch.isPresent()) {
            MatchMastersMatch match = optMatch.get();
            match.setBoardState(newBoardState);
            matchMastersMatchRepository.save(match);
        }
    }
}
