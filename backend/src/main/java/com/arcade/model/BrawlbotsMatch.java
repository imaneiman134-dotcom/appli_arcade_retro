package com.arcade.model;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "brawlbots_matches")
public class BrawlbotsMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Jeu jeu;

    private Integer maxPlayers;
    private String status;
    private Integer currentRound;
    private Integer maxRounds;
    private Long winnerId;
    private LocalDateTime createdAt;
    private LocalDateTime finishedAt;

    @ElementCollection
    @CollectionTable(name = "brawlbots_players", joinColumns = @JoinColumn(name = "match_id"))
    private List<BrawlbotsPlayer> players = new ArrayList<>();

    public BrawlbotsMatch() {}

    public BrawlbotsMatch(Jeu jeu, Integer maxPlayers) {
        this.jeu = jeu;
        this.maxPlayers = maxPlayers;
        this.status = "PENDING";
        this.currentRound = 0;
        this.maxRounds = 10;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Jeu getJeu() { return jeu; }
    public void setJeu(Jeu jeu) { this.jeu = jeu; }

    public Integer getMaxPlayers() { return maxPlayers; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getCurrentRound() { return currentRound; }
    public void setCurrentRound(Integer currentRound) { this.currentRound = currentRound; }

    public Integer getMaxRounds() { return maxRounds; }
    public void setMaxRounds(Integer maxRounds) { this.maxRounds = maxRounds; }

    public Long getWinnerId() { return winnerId; }
    public void setWinnerId(Long winnerId) { this.winnerId = winnerId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }

    public List<BrawlbotsPlayer> getPlayers() { return players; }
    public void setPlayers(List<BrawlbotsPlayer> players) { this.players = players; }
}
