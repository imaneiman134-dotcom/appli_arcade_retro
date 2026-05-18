package com.arcade.dto;

import java.time.LocalDateTime;

public class MatchDTO {
    private Long id;
    private Long jeuId;
    private String jeuTitre;
    private Long player1Id;
    private String player1Pseudo;
    private Long player2Id;
    private String player2Pseudo;
    private String status;
    private Long winnerId;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    // Constructeurs
    public MatchDTO() {}

    public MatchDTO(Long id, Long jeuId, String jeuTitre, Long player1Id, String player1Pseudo, 
                   Long player2Id, String player2Pseudo, String status, Long winnerId, 
                   LocalDateTime createdAt, LocalDateTime startedAt, LocalDateTime finishedAt) {
        this.id = id;
        this.jeuId = jeuId;
        this.jeuTitre = jeuTitre;
        this.player1Id = player1Id;
        this.player1Pseudo = player1Pseudo;
        this.player2Id = player2Id;
        this.player2Pseudo = player2Pseudo;
        this.status = status;
        this.winnerId = winnerId;
        this.createdAt = createdAt;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getJeuId() {
        return jeuId;
    }

    public void setJeuId(Long jeuId) {
        this.jeuId = jeuId;
    }

    public String getJeuTitre() {
        return jeuTitre;
    }

    public void setJeuTitre(String jeuTitre) {
        this.jeuTitre = jeuTitre;
    }

    public Long getPlayer1Id() {
        return player1Id;
    }

    public void setPlayer1Id(Long player1Id) {
        this.player1Id = player1Id;
    }

    public String getPlayer1Pseudo() {
        return player1Pseudo;
    }

    public void setPlayer1Pseudo(String player1Pseudo) {
        this.player1Pseudo = player1Pseudo;
    }

    public Long getPlayer2Id() {
        return player2Id;
    }

    public void setPlayer2Id(Long player2Id) {
        this.player2Id = player2Id;
    }

    public String getPlayer2Pseudo() {
        return player2Pseudo;
    }

    public void setPlayer2Pseudo(String player2Pseudo) {
        this.player2Pseudo = player2Pseudo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getWinnerId() {
        return winnerId;
    }

    public void setWinnerId(Long winnerId) {
        this.winnerId = winnerId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(LocalDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }
}
