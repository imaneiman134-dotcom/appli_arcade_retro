package com.arcade.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scores")
public class Score {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int valeur;
    private LocalDateTime date;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @ManyToOne
    @JoinColumn(name = "jeu_id")
    private Jeu jeu;

    public Score() {}

    public Score(Long id, int valeur, LocalDateTime date, Utilisateur utilisateur, Jeu jeu) {
        this.id = id;
        this.valeur = valeur;
        this.date = date;
        this.utilisateur = utilisateur;
        this.jeu = jeu;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getValeur() { return valeur; }
    public void setValeur(int valeur) { this.valeur = valeur; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public Utilisateur getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }

    public Jeu getJeu() { return jeu; }
    public void setJeu(Jeu jeu) { this.jeu = jeu; }

    public void enregistrer() {
        System.out.println("Enregistrement du score : " + valeur + " pour l'utilisateur " + utilisateur.getPseudo() + " sur le jeu " + jeu.getTitre());
    }
}
