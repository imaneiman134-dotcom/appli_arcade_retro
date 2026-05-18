package com.arcade.controller;

import com.arcade.dto.BrawlbotsMatchDTO;
import com.arcade.model.BrawlbotsMatch;
import com.arcade.service.BrawlbotsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brawlbots")
@CrossOrigin(origins = "*")
public class BrawlbotsController {

    @Autowired
    private BrawlbotsService brawlbotsService;

    @PostMapping("/create")
    public ResponseEntity<BrawlbotsMatch> createMatch(@RequestParam Long jeuId, @RequestParam Integer maxPlayers) {
        try {
            BrawlbotsMatch match = brawlbotsService.createMatch(jeuId, maxPlayers);
            return ResponseEntity.ok(match);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{matchId}/add-player")
    public ResponseEntity<BrawlbotsMatch> addPlayer(@PathVariable Long matchId, @RequestParam Long userId, @RequestParam String botType) {
        try {
            BrawlbotsMatch match = brawlbotsService.addPlayerToMatch(matchId, userId, botType);
            return ResponseEntity.ok(match);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{matchId}/execute-round")
    public ResponseEntity<BrawlbotsMatch> executeRound(@PathVariable Long matchId, @RequestBody List<String> actions) {
        try {
            BrawlbotsMatch match = brawlbotsService.executeRound(matchId, actions);
            return ResponseEntity.ok(match);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<BrawlbotsMatch> getMatch(@PathVariable Long matchId) {
        BrawlbotsMatch match = brawlbotsService.getMatch(matchId);
        if (match != null) {
            return ResponseEntity.ok(match);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<BrawlbotsMatch>> getMatchesByStatus(@PathVariable String status) {
        List<BrawlbotsMatch> matches = brawlbotsService.getMatchesByStatus(status);
        return ResponseEntity.ok(matches);
    }
}
