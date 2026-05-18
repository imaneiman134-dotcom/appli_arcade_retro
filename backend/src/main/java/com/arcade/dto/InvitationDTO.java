package com.arcade.dto;

import java.time.LocalDateTime;

public class InvitationDTO {
    private Long id;
    private String senderPseudo;
    private Long senderId;
    private String receiverPseudo;
    private Long receiverId;
    private String jeuTitre;
    private Long jeuId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;

    // Constructeurs
    public InvitationDTO() {}

    public InvitationDTO(Long id, String senderPseudo, Long senderId, String receiverPseudo, Long receiverId, 
                        String jeuTitre, Long jeuId, String status, LocalDateTime createdAt, LocalDateTime acceptedAt) {
        this.id = id;
        this.senderPseudo = senderPseudo;
        this.senderId = senderId;
        this.receiverPseudo = receiverPseudo;
        this.receiverId = receiverId;
        this.jeuTitre = jeuTitre;
        this.jeuId = jeuId;
        this.status = status;
        this.createdAt = createdAt;
        this.acceptedAt = acceptedAt;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSenderPseudo() {
        return senderPseudo;
    }

    public void setSenderPseudo(String senderPseudo) {
        this.senderPseudo = senderPseudo;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getReceiverPseudo() {
        return receiverPseudo;
    }

    public void setReceiverPseudo(String receiverPseudo) {
        this.receiverPseudo = receiverPseudo;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }

    public String getJeuTitre() {
        return jeuTitre;
    }

    public void setJeuTitre(String jeuTitre) {
        this.jeuTitre = jeuTitre;
    }

    public Long getJeuId() {
        return jeuId;
    }

    public void setJeuId(Long jeuId) {
        this.jeuId = jeuId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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
}
