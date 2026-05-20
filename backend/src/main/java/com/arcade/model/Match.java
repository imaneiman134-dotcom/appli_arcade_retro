package com.arcade.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "jeu_id", nullable = false)
    private Jeu jeu;

    @ManyToOne
    @JoinColumn(name = "player1_id", nullable = false)
    private Utilisateur player1;

    @ManyToOne
    @JoinColumn(name = "player2_id")
    private Utilisateur player2;

    @Enumerated(EnumType.STRING)
    private MatchStatus status;

    private Long winnerId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime startedAt;

    private LocalDateTime finishedAt;

    public Match() {
        this.createdAt = LocalDateTime.now();
        this.status = MatchStatus.PENDING;
    }

    public Match(Jeu jeu, Utilisateur player1, Utilisateur player2) {
        this.jeu = jeu;
        this.player1 = player1;
        this.player2 = player2;
        this.createdAt = LocalDateTime.now();
        this.status = MatchStatus.PENDING;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Jeu getJeu() {
        return jeu;
    }

    public void setJeu(Jeu jeu) {
        this.jeu = jeu;
    }

    public Utilisateur getPlayer1() {
        return player1;
    }

    public void setPlayer1(Utilisateur player1) {
        this.player1 = player1;
    }

    public Utilisateur getPlayer2() {
        return player2;
    }

    public void setPlayer2(Utilisateur player2) {
        this.player2 = player2;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public void setStatus(MatchStatus status) {
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

    @Override
    public String toString() {
        return "Match{" +
               "id=" + id +
               ", jeu=" + (jeu != null ? jeu.getTitre() : "null") +
               ", player1=" + (player1 != null ? player1.getPseudo() : "null") +
               ", player2=" + (player2 != null ? player2.getPseudo() : "null") +
               ", status=" + status +
               ", createdAt=" + createdAt +
               "}";
    }
}
