package com.arcade.controller;

import com.arcade.model.Score;
import com.arcade.service.ScoreService;
import com.arcade.dto.ScoreRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/scores")
@CrossOrigin(origins = "*")
public class ScoreController {
    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @PostMapping("/save")
    public ResponseEntity<Score> saveScore(@RequestBody ScoreRequest scoreRequest) {
        return ResponseEntity.ok(scoreService.enregistrerScore(
                scoreRequest.getUserId(),
                scoreRequest.getJeuId(),
                scoreRequest.getValeur()
        ));
    }

    @GetMapping("/leaderboard/{jeuId}")
    public ResponseEntity<List<Score>> getLeaderboard(@PathVariable Long jeuId) {
        return ResponseEntity.ok(scoreService.getScoresByJeu(jeuId));
    }
}
