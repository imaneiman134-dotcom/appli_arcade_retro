package com.arcade.dto;

import java.util.List;
import java.util.Map;

public class BrawlbotsMatchDTO {
    private Long matchId;
    private Integer maxPlayers;
    private String status;
    private Integer currentRound;
    private Integer maxRounds;
    private List<BrawlbotsPlayerDTO> players;
    private Long winnerId;

    public BrawlbotsMatchDTO() {}

    public BrawlbotsMatchDTO(Long matchId, Integer maxPlayers, String status, Integer currentRound, Integer maxRounds, List<BrawlbotsPlayerDTO> players, Long winnerId) {
        this.matchId = matchId;
        this.maxPlayers = maxPlayers;
        this.status = status;
        this.currentRound = currentRound;
        this.maxRounds = maxRounds;
        this.players = players;
        this.winnerId = winnerId;
    }

    // Getters and Setters
    public Long getMatchId() { return matchId; }
    public void setMatchId(Long matchId) { this.matchId = matchId; }

    public Integer getMaxPlayers() { return maxPlayers; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getCurrentRound() { return currentRound; }
    public void setCurrentRound(Integer currentRound) { this.currentRound = currentRound; }

    public Integer getMaxRounds() { return maxRounds; }
    public void setMaxRounds(Integer maxRounds) { this.maxRounds = maxRounds; }

    public List<BrawlbotsPlayerDTO> getPlayers() { return players; }
    public void setPlayers(List<BrawlbotsPlayerDTO> players) { this.players = players; }

    public Long getWinnerId() { return winnerId; }
    public void setWinnerId(Long winnerId) { this.winnerId = winnerId; }
}
