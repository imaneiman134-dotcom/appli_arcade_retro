package com.arcade.service;

import org.springframework.stereotype.Service;

import com.arcade.model.Utilisateur;
import com.arcade.repository.UtilisateurRepository;

@Service
public class UtilisateurService {
    private final UtilisateurRepository utilisateurRepository;
    private final JwtSimpleService jwtService;

    public UtilisateurService(UtilisateurRepository utilisateurRepository, JwtSimpleService jwtService) {
        this.utilisateurRepository = utilisateurRepository;
        this.jwtService = jwtService;
    }

    public Utilisateur inscrire(Utilisateur utilisateur) {
        if (utilisateurRepository.findByPseudo(utilisateur.getPseudo()).isPresent()) {
            throw new RuntimeException("Pseudo déjà utilisé");
        }
        return utilisateurRepository.save(utilisateur);
    }
    public Utilisateur getByPseudo(String pseudo) {
    return utilisateurRepository.findByPseudo(pseudo)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
}
    public String connecter(String pseudo, String motDePasse) {
        Utilisateur utilisateur = utilisateurRepository.findByPseudo(pseudo)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        if (!utilisateur.getMotDePasse().equals(motDePasse)) {
            throw new RuntimeException("Mot de passe incorrect");
        }
        return jwtService.generateToken(pseudo);
    }
}
