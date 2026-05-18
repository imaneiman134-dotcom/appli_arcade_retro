package com.arcade.model;

import javax.persistence.Embeddable;

@Embeddable
public class BrawlbotsPlayer {
    private Long userId;
    private String botType; // ELDRITCH, NANO, RAPTOR
    private Integer health;
    private Integer maxHealth;
    private Boolean isAlive;
    private Integer score;
    private String lastAction; // ATTACK, DEFEND, SPECIAL, JUMP

    public BrawlbotsPlayer() {}

    public BrawlbotsPlayer(Long userId, String botType, Integer maxHealth) {
        this.userId = userId;
        this.botType = botType;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.isAlive = true;
        this.score = 0;
    }

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getBotType() { return botType; }
    public void setBotType(String botType) { this.botType = botType; }

    public Integer getHealth() { return health; }
    public void setHealth(Integer health) { this.health = health; }

    public Integer getMaxHealth() { return maxHealth; }
    public void setMaxHealth(Integer maxHealth) { this.maxHealth = maxHealth; }

    public Boolean getIsAlive() { return isAlive; }
    public void setIsAlive(Boolean isAlive) { this.isAlive = isAlive; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getLastAction() { return lastAction; }
    public void setLastAction(String lastAction) { this.lastAction = lastAction; }
}
