package com.arcade.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.arcade.model.Jeu;
import com.arcade.model.Score;
import com.arcade.model.Utilisateur;
import com.arcade.repository.JeuRepository;
import com.arcade.repository.ScoreRepository;
import com.arcade.repository.UtilisateurRepository;

@Service
public class ScoreService {
    private final ScoreRepository scoreRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final JeuRepository jeuRepository;

    public ScoreService(ScoreRepository scoreRepository, 
                        UtilisateurRepository utilisateurRepository, 
                        JeuRepository jeuRepository) {
        this.scoreRepository = scoreRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.jeuRepository = jeuRepository;
    }

    public Score enregistrerScore(Long userId, Long jeuId, int valeur) {
        Utilisateur utilisateur = utilisateurRepository.findById(userId) // Simulation
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        Jeu jeu = jeuRepository.findById(jeuId)
                .orElseThrow(() -> new RuntimeException("Jeu non trouvé"));

        Score score = new Score(null, valeur, LocalDateTime.now(), utilisateur, jeu);
        return scoreRepository.save(score);
    }

    public List<Score> getScoresByJeu(Long jeuId) {
        Jeu jeu = jeuRepository.findById(jeuId)
                .orElseThrow(() -> new RuntimeException("Jeu non trouvé"));
        return scoreRepository.findByJeuOrderByValeurDesc(jeu);
    }
}
