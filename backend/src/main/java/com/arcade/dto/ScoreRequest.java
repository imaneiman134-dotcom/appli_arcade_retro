package com.arcade.dto;

public class ScoreRequest {
    private Long userId;
    private Long jeuId;
    private int valeur;

    public ScoreRequest() {}

    public ScoreRequest(Long userId, Long jeuId, int valeur) {
        this.userId = userId;
        this.jeuId = jeuId;
        this.valeur = valeur;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getJeuId() { return jeuId; }
    public void setJeuId(Long jeuId) { this.jeuId = jeuId; }

    public int getValeur() { return valeur; }
    public void setValeur(int valeur) { this.valeur = valeur; }
}
