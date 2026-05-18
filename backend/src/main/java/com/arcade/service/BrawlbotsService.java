package com.arcade.service;

import com.arcade.model.BrawlbotsMatch;
import com.arcade.model.BrawlbotsPlayer;
import com.arcade.model.Jeu;
import com.arcade.model.Utilisateur;
import com.arcade.repository.BrawlbotsMatchRepository;
import com.arcade.repository.JeuRepository;
import com.arcade.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BrawlbotsService {

    @Autowired
    private BrawlbotsMatchRepository brawlbotsMatchRepository;

    @Autowired
    private JeuRepository jeuRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    public BrawlbotsMatch createMatch(Long jeuId, Integer maxPlayers) {
        Optional<Jeu> jeu = jeuRepository.findById(jeuId);
        if (jeu.isEmpty()) {
            throw new RuntimeException("Jeu non trouvé");
        }
        BrawlbotsMatch match = new BrawlbotsMatch(jeu.get(), maxPlayers);
        return brawlbotsMatchRepository.save(match);
    }

    public BrawlbotsMatch addPlayerToMatch(Long matchId, Long userId, String botType) {
        Optional<BrawlbotsMatch> optMatch = brawlbotsMatchRepository.findById(matchId);
        if (optMatch.isEmpty()) {
            throw new RuntimeException("Match non trouvé");
        }

        BrawlbotsMatch match = optMatch.get();
        if (match.getPlayers().size() >= match.getMaxPlayers()) {
            throw new RuntimeException("Match plein");
        }

        Integer maxHealth = getBotMaxHealth(botType);
        BrawlbotsPlayer player = new BrawlbotsPlayer(userId, botType, maxHealth);
        match.getPlayers().add(player);

        if (match.getPlayers().size() == match.getMaxPlayers()) {
            match.setStatus("IN_PROGRESS");
        }

        return brawlbotsMatchRepository.save(match);
    }

    public BrawlbotsMatch executeRound(Long matchId, List<String> playerActions) {
        Optional<BrawlbotsMatch> optMatch = brawlbotsMatchRepository.findById(matchId);
        if (optMatch.isEmpty()) {
            throw new RuntimeException("Match non trouvé");
        }

        BrawlbotsMatch match = optMatch.get();
        List<BrawlbotsPlayer> players = match.getPlayers();

        // Store actions
        for (int i = 0; i < playerActions.size() && i < players.size(); i++) {
            players.get(i).setLastAction(playerActions.get(i));
        }

        // Resolve simultaneous actions
        resolveActions(players);

        // Check for eliminated players
        int alivePlayers = 0;
        Long lastAlivePlayer = null;
        for (BrawlbotsPlayer player : players) {
            if (player.getIsAlive()) {
                alivePlayers++;
                lastAlivePlayer = player.getUserId();
            }
        }

        // If only one player left, end match
        if (alivePlayers == 1) {
            match.setStatus("COMPLETED");
            match.setWinnerId(lastAlivePlayer);
            match.setFinishedAt(LocalDateTime.now());
        } else {
            match.setCurrentRound(match.getCurrentRound() + 1);
        }

        return brawlbotsMatchRepository.save(match);
    }

    private void resolveActions(List<BrawlbotsPlayer> players) {
        for (BrawlbotsPlayer attacker : players) {
            if (!attacker.getIsAlive()) continue;

            String action = attacker.getLastAction();
            if ("ATTACK".equals(action)) {
                // Find a random alive opponent
                BrawlbotsPlayer defender = players.stream()
                    .filter(p -> p.getIsAlive() && !p.getUserId().equals(attacker.getUserId()))
                    .findAny()
                    .orElse(null);

                if (defender != null) {
                    Integer damage = calculateDamage(attacker.getBotType());
                    defender.setHealth(Math.max(0, defender.getHealth() - damage));
                    if (defender.getHealth() <= 0) {
                        defender.setIsAlive(false);
                    }
                }
            } else if ("SPECIAL".equals(action)) {
                // Special ability logic
                applySpecialAbility(attacker, players);
            }
        }
    }

    private void applySpecialAbility(BrawlbotsPlayer player, List<BrawlbotsPlayer> allPlayers) {
        String botType = player.getBotType();
        if ("ELDRITCH".equals(botType)) {
            // Into the Void - Pull all enemies and damage them
            for (BrawlbotsPlayer enemy : allPlayers) {
                if (enemy.getIsAlive() && !enemy.getUserId().equals(player.getUserId())) {
                    enemy.setHealth(Math.max(0, enemy.getHealth() - 15));
                    if (enemy.getHealth() <= 0) {
                        enemy.setIsAlive(false);
                    }
                }
            }
        } else if ("NANO".equals(botType)) {
            // Explosive cannon - High damage to one target
            BrawlbotsPlayer target = allPlayers.stream()
                .filter(p -> p.getIsAlive() && !p.getUserId().equals(player.getUserId()))
                .findAny()
                .orElse(null);
            if (target != null) {
                target.setHealth(Math.max(0, target.getHealth() - 30));
                if (target.getHealth() <= 0) {
                    target.setIsAlive(false);
                }
            }
        } else if ("RAPTOR".equals(botType)) {
            // Bouncing grenade - Damage to nearby enemies
            for (BrawlbotsPlayer enemy : allPlayers) {
                if (enemy.getIsAlive() && !enemy.getUserId().equals(player.getUserId())) {
                    enemy.setHealth(Math.max(0, enemy.getHealth() - 20));
                    if (enemy.getHealth() <= 0) {
                        enemy.setIsAlive(false);
                    }
                }
            }
        }
    }

    private Integer calculateDamage(String botType) {
        return switch (botType) {
            case "NANO" -> 25; // High attack
            case "RAPTOR" -> 18; // Medium attack
            case "ELDRITCH" -> 15; // Low attack
            default -> 10;
        };
    }

    private Integer getBotMaxHealth(String botType) {
        return switch (botType) {
            case "NANO" -> 120; // High health
            case "RAPTOR" -> 100; // Medium health
            case "ELDRITCH" -> 90; // Lower health
            default -> 100;
        };
    }

    public BrawlbotsMatch getMatch(Long matchId) {
        return brawlbotsMatchRepository.findById(matchId).orElse(null);
    }

    public List<BrawlbotsMatch> getMatchesByStatus(String status) {
        return brawlbotsMatchRepository.findByStatus(status);
    }
}
