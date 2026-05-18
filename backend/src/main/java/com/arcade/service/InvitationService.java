package com.arcade.service;

import com.arcade.model.*;
import com.arcade.repository.InvitationRepository;
import com.arcade.repository.JeuRepository;
import com.arcade.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InvitationService {

    @Autowired
    private InvitationRepository invitationRepository;
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    @Autowired
    private JeuRepository jeuRepository;
    @Autowired
    private MatchService matchService; // Inject MatchService

    @Transactional
    public Invitation sendInvitation(Long senderId, String receiverPseudo, Long jeuId) {
        Utilisateur sender = utilisateurRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));
        Utilisateur receiver = utilisateurRepository.findByPseudo(receiverPseudo)
                .orElseThrow(() -> new RuntimeException("Destinataire non trouvé"));
        Jeu jeu = jeuRepository.findById(jeuId)
                .orElseThrow(() -> new RuntimeException("Jeu non trouvé"));

        // Check for existing pending invitation between these two for this game
        Optional<Invitation> existingInvitation = invitationRepository.findBySenderAndReceiverAndJeuAndStatus(sender, receiver, jeu, InvitationStatus.PENDING);
        if (existingInvitation.isPresent()) {
            throw new RuntimeException("Une invitation en attente existe déjà pour ce jeu entre ces joueurs.");
        }

        Invitation invitation = new Invitation(sender, receiver, jeu);
        return invitationRepository.save(invitation);
    }

    public List<Invitation> getReceivedInvitations(Long receiverId) {
        Utilisateur receiver = utilisateurRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return invitationRepository.findByReceiverAndStatus(receiver, InvitationStatus.PENDING);
    }

    public List<Invitation> getSentInvitations(Long senderId) {
        Utilisateur sender = utilisateurRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return invitationRepository.findBySenderAndStatus(sender, InvitationStatus.PENDING);
    }

    @Transactional
    public Match acceptInvitation(Long invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation non trouvée"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("L'invitation n'est pas en attente.");
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        // Create a new match
        return matchService.createMatch(invitation.getJeu(), invitation.getSender(), invitation.getReceiver());
    }

    @Transactional
    public Invitation declineInvitation(Long invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation non trouvée"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("L'invitation n'est pas en attente.");
        }

        invitation.setStatus(InvitationStatus.DECLINED);
        invitation.setDeclinedAt(LocalDateTime.now());
        return invitationRepository.save(invitation);
    }

    @Transactional
    public void cleanupExpiredInvitations() {
        LocalDateTime expirationTime = LocalDateTime.now().minusHours(1); // Invitations expire after 1 hour
        List<Invitation> expiredInvitations = invitationRepository.findByStatusAndCreatedAtBefore(InvitationStatus.PENDING, expirationTime);
        for (Invitation invitation : expiredInvitations) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
        }
        System.out.println("Cleaned up " + expiredInvitations.size() + " expired invitations.");
    }
}
