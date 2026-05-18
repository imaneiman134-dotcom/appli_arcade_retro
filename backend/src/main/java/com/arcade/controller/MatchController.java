package com.arcade.controller;

import com.arcade.model.Match;
import com.arcade.model.MatchStatus;
import com.arcade.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    @Autowired
    private MatchService matchService;

    @GetMapping("/{matchId}")
    public ResponseEntity<Match> getMatch(@PathVariable Long matchId) {
        try {
            Match match = matchService.getMatchById(matchId);
            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{matchId}/status")
    public ResponseEntity<Match> updateMatchStatus(@PathVariable Long matchId, @RequestParam MatchStatus status) {
        try {
            Match match = matchService.updateMatchStatus(matchId, status);
            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/{matchId}/winner")
    public ResponseEntity<Match> setMatchWinner(@PathVariable Long matchId, @RequestParam Long winnerId) {
        try {
            Match match = matchService.setMatchWinner(matchId, winnerId);
            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
