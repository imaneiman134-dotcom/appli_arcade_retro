package com.arcade.dto;

public class MoveDTO {
    private Long matchId;
    private Long playerId;
    private int position;
    private String role; // "X" ou "O"

    // Constructeurs
    public MoveDTO() {}

    public MoveDTO(Long matchId, Long playerId, int position, String role) {
        this.matchId = matchId;
        this.playerId = playerId;
        this.position = position;
        this.role = role;
    }

    // Getters et Setters
    public Long getMatchId() { return matchId; }
    public void setMatchId(Long matchId) { this.matchId = matchId; }

    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}