package com.arcade.model;

import javax.persistence.*;

@Entity
@Table(name = "jeux")
public class Jeu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titre;
    private String description;
    private String urlImage;

    public Jeu() {}

    public Jeu(Long id, String titre, String description, String urlImage) {
        this.id = id;
        this.titre = titre;
        this.description = description;
        this.urlImage = urlImage;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUrlImage() { return urlImage; }
    public void setUrlImage(String urlImage) { this.urlImage = urlImage; }

    public void lancer() {
        System.out.println("Lancement du jeu : " + titre);
    }
}
