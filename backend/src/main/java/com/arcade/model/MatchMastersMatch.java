package com.arcade.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "match_masters_matches")
public class MatchMastersMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Jeu jeu;

    private Long player1Id;
    private Long player2Id;
    private Integer player1Score;
    private Integer player2Score;
    private Integer currentTurn; // 1 or 2
    private Integer maxTurns;
    private String status; // PENDING, IN_PROGRESS, COMPLETED
    private Long winnerId;
    private String boardState; // JSON representation of the board
    private LocalDateTime createdAt;
    private LocalDateTime finishedAt;

    public MatchMastersMatch() {}

    public MatchMastersMatch(Jeu jeu, Long player1Id, Long player2Id) {
        this.jeu = jeu;
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.player1Score = 0;
        this.player2Score = 0;
        this.currentTurn = 1;
        this.maxTurns = 15;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
        this.boardState = initializeBoardState();
    }

    private String initializeBoardState() {
        // Initialize empty board (6x6 grid)
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 36; i++) {
            sb.append("0");
        }
        return sb.toString();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Jeu getJeu() { return jeu; }
    public void setJeu(Jeu jeu) { this.jeu = jeu; }

    public Long getPlayer1Id() { return player1Id; }
    public void setPlayer1Id(Long player1Id) { this.player1Id = player1Id; }

    public Long getPlayer2Id() { return player2Id; }
    public void setPlayer2Id(Long player2Id) { this.player2Id = player2Id; }

    public Integer getPlayer1Score() { return player1Score; }
    public void setPlayer1Score(Integer player1Score) { this.player1Score = player1Score; }

    public Integer getPlayer2Score() { return player2Score; }
    public void setPlayer2Score(Integer player2Score) { this.player2Score = player2Score; }

    public Integer getCurrentTurn() { return currentTurn; }
    public void setCurrentTurn(Integer currentTurn) { this.currentTurn = currentTurn; }

    public Integer getMaxTurns() { return maxTurns; }
    public void setMaxTurns(Integer maxTurns) { this.maxTurns = maxTurns; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getWinnerId() { return winnerId; }
    public void setWinnerId(Long winnerId) { this.winnerId = winnerId; }

    public String getBoardState() { return boardState; }
    public void setBoardState(String boardState) { this.boardState = boardState; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
}
