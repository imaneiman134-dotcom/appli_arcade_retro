package com.arcade.controller;

import com.arcade.model.Utilisateur;
import com.arcade.service.UtilisateurService;
import com.arcade.dto.LoginResponse;
import com.arcade.dto.LoginRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/utilisateurs")
@CrossOrigin(origins = "*")
public class UtilisateurController {
    private final UtilisateurService utilisateurService;

    public UtilisateurController(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

    @PostMapping("/register")
    public ResponseEntity<Utilisateur> register(@RequestBody Utilisateur utilisateur) {
        return ResponseEntity.ok(utilisateurService.inscrire(utilisateur));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        String token = utilisateurService.connecter(loginRequest.getPseudo(), loginRequest.getMotDePasse());
        Utilisateur u = utilisateurService.getByPseudo(loginRequest.getPseudo());
return ResponseEntity.ok(new LoginResponse(token, loginRequest.getPseudo(), u.getId()));
    }
}
