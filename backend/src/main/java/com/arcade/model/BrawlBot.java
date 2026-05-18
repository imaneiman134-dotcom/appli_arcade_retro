package com.arcade.model;

import javax.persistence.*;

@Entity
@Table(name = "brawl_bots")
public class BrawlBot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type; // ELDRITCH, NANO, RAPTOR
    private Integer maxHealth;
    private Integer currentHealth;
    private Integer attack;
    private Integer defense;
    private Integer speed;
    private String specialAbility1;
    private String specialAbility2;

    public BrawlBot() {}

    public BrawlBot(String name, String type, Integer maxHealth, Integer attack, Integer defense, Integer speed, String specialAbility1, String specialAbility2) {
        this.name = name;
        this.type = type;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.attack = attack;
        this.defense = defense;
        this.speed = speed;
        this.specialAbility1 = specialAbility1;
        this.specialAbility2 = specialAbility2;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getMaxHealth() { return maxHealth; }
    public void setMaxHealth(Integer maxHealth) { this.maxHealth = maxHealth; }

    public Integer getCurrentHealth() { return currentHealth; }
    public void setCurrentHealth(Integer currentHealth) { this.currentHealth = currentHealth; }

    public Integer getAttack() { return attack; }
    public void setAttack(Integer attack) { this.attack = attack; }

    public Integer getDefense() { return defense; }
    public void setDefense(Integer defense) { this.defense = defense; }

    public Integer getSpeed() { return speed; }
    public void setSpeed(Integer speed) { this.speed = speed; }

    public String getSpecialAbility1() { return specialAbility1; }
    public void setSpecialAbility1(String specialAbility1) { this.specialAbility1 = specialAbility1; }

    public String getSpecialAbility2() { return specialAbility2; }
    public void setSpecialAbility2(String specialAbility2) { this.specialAbility2 = specialAbility2; }
}
