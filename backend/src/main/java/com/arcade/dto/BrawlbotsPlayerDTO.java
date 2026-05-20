package com.arcade.dto;

public class BrawlbotsPlayerDTO {
    private Long userId;
    private String userName;
    private String botType;
    private Integer health;
    private Integer maxHealth;
    private Boolean isAlive;
    private Integer score;
    private String lastAction;

    public BrawlbotsPlayerDTO() {}

    public BrawlbotsPlayerDTO(Long userId, String userName, String botType, Integer health, Integer maxHealth, Boolean isAlive, Integer score, String lastAction) {
        this.userId = userId;
        this.userName = userName;
        this.botType = botType;
        this.health = health;
        this.maxHealth = maxHealth;
        this.isAlive = isAlive;
        this.score = score;
        this.lastAction = lastAction;
    }

    // getters and setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

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
