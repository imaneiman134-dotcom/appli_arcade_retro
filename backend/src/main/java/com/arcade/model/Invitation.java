package com.arcade.model;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "invitations")
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private Utilisateur sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private Utilisateur receiver;

    @ManyToOne
    @JoinColumn(name = "jeu_id", nullable = false)
    private Jeu jeu;

    @Enumerated(EnumType.STRING)
    private InvitationStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime acceptedAt;

    private LocalDateTime declinedAt;

    public Invitation() {
        this.createdAt = LocalDateTime.now();
        this.status = InvitationStatus.PENDING;
    }

    public Invitation(Utilisateur sender, Utilisateur receiver, Jeu jeu) {
        this.sender = sender;
        this.receiver = receiver;
        this.jeu = jeu;
        this.createdAt = LocalDateTime.now();
        this.status = InvitationStatus.PENDING;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Utilisateur getSender() {
        return sender;
    }

    public void setSender(Utilisateur sender) {
        this.sender = sender;
    }

    public Utilisateur getReceiver() {
        return receiver;
    }

    public void setReceiver(Utilisateur receiver) {
        this.receiver = receiver;
    }

    public Jeu getJeu() {
        return jeu;
    }

    public void setJeu(Jeu jeu) {
        this.jeu = jeu;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getDeclinedAt() {
        return declinedAt;
    }

    public void setDeclinedAt(LocalDateTime declinedAt) {
        this.declinedAt = declinedAt;
    }

    @Override
    public String toString() {
        return "Invitation{" +
               "id=" + id +
               ", sender=" + (sender != null ? sender.getPseudo() : "null") +
               ", receiver=" + (receiver != null ? receiver.getPseudo() : "null") +
               ", jeu=" + (jeu != null ? jeu.getTitre() : "null") +
               ", status=" + status +
               ", createdAt=" + createdAt +
               "}";
    }
}
