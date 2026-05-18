package com.arcade.service;

import org.springframework.scheduling.annotation.Scheduled;

import com.arcade.model.Jeu;
import com.arcade.repository.JeuRepository;
import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;
import java.util.List;

@Service
public class JeuService {
    private final JeuRepository jeuRepository;
    private final InvitationService invitationService;
    private final MatchService matchService;

    public JeuService(JeuRepository jeuRepository, InvitationService invitationService, MatchService matchService) {
        this.jeuRepository = jeuRepository;
        this.invitationService = invitationService;
        this.matchService = matchService;
    }

    @PostConstruct
    public void initJeux() {
        if (jeuRepository.count() == 0) {
            jeuRepository.save(new Jeu(null, "Bataille Navale", "Jeu de stratégie 1v1 - Placez vos navires et coulez ceux de votre adversaire", null));
            jeuRepository.save(new Jeu(null, "Puissance 4", "Jeu classique 1v1 - Alignez 4 pions pour gagner", null));
            jeuRepository.save(new Jeu(null, "Tic Tac Toe", "Jeu simple 1v1 - Alignez 3 symboles pour gagner", null));
            jeuRepository.save(new Jeu(null, "Asteroid Duel", "Jeu d'action 1v1 - Détruisez les astéroïdes et votre adversaire", null));
            jeuRepository.save(new Jeu(null, "Brawlbots", "Combat de robots 1v1-4 - Choisissez votre bot et éliminez vos ennemis", null));
            jeuRepository.save(new Jeu(null, "Match Masters", "Puzzle 1v1 - Marquez plus de points que votre adversaire en 15 tours", null));
        }
    }

    public List<Jeu> getAllJeux() {
        return jeuRepository.findAll();
    }

    public Jeu getJeuById(Long id) {
        return jeuRepository.findById(id).orElseThrow(() -> new RuntimeException("Jeu non trouvé"));
    }

    // Nettoyage des invitations expirées toutes les heures
    @Scheduled(fixedRate = 3600000) // 1 heure en millisecondes
    public void cleanupInvitations() {
        invitationService.cleanupExpiredInvitations();
    }

    // Nettoyage des matchs expirés toutes les 6 heures
    @Scheduled(fixedRate = 21600000) // 6 heures en millisecondes
    public void cleanupMatches() {
        matchService.cleanupExpiredMatches();
    }
}
