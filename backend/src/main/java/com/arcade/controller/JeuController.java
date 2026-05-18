package com.arcade.controller;

import com.arcade.model.Jeu;
import com.arcade.service.JeuService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/jeux")
@CrossOrigin(origins = "*")
public class JeuController {
    private final JeuService jeuService;

    public JeuController(JeuService jeuService) {
        this.jeuService = jeuService;
    }

    @GetMapping
    public List<Jeu> getAllJeux() {
        System.out.println("Requête GET /api/jeux reçue");
        return jeuService.getAllJeux();
    }

    @GetMapping("/{id}")
    public Jeu getJeuById(@PathVariable Long id) {
        System.out.println("Requête GET /api/jeux/" + id + " reçue");
        return jeuService.getJeuById(id);
    }
}
