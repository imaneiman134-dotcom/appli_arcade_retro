package com.arcade.controller;

import com.arcade.model.MatchMastersMatch;
import com.arcade.service.MatchMastersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/match-masters")
@CrossOrigin(origins = "*")
public class MatchMastersController {

    @Autowired
    private MatchMastersService matchMastersService;

    @PostMapping("/create")
    public ResponseEntity<MatchMastersMatch> createMatch(@RequestParam Long jeuId, @RequestParam Long player1Id, @RequestParam Long player2Id) {
        try {
            MatchMastersMatch match = matchMastersService.createMatch(jeuId, player1Id, player2Id);
            return ResponseEntity.ok(match);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{matchId}/play-turn")
    public ResponseEntity<MatchMastersMatch> playTurn(@PathVariable Long matchId, @RequestParam Integer scoreGained) {
        try {
            MatchMastersMatch match = matchMastersService.playTurn(matchId, scoreGained);
            return ResponseEntity.ok(match);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<MatchMastersMatch> getMatch(@PathVariable Long matchId) {
        MatchMastersMatch match = matchMastersService.getMatch(matchId);
        if (match != null) {
            return ResponseEntity.ok(match);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/player/{userId}")
    public ResponseEntity<List<MatchMastersMatch>> getPlayerMatches(@PathVariable Long userId) {
        List<MatchMastersMatch> matches = matchMastersService.getPlayerMatches(userId);
        return ResponseEntity.ok(matches);
    }

    @PostMapping("/{matchId}/update-board")
    public ResponseEntity<Void> updateBoardState(@PathVariable Long matchId, @RequestBody String boardState) {
        try {
            matchMastersService.updateBoardState(matchId, boardState);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
