package com.arcade.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.arcade.dto.InvitationDTO;
import com.arcade.model.Invitation;
import com.arcade.model.Match;
import com.arcade.service.InvitationService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    @Autowired
    private InvitationService invitationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Convertit Invitation -> InvitationDTO pour éviter les cycles de sérialisation JSON
    private InvitationDTO toDTO(Invitation inv) {
        return new InvitationDTO(
            inv.getId(),
            inv.getSender() != null ? inv.getSender().getPseudo() : null,
            inv.getSender() != null ? inv.getSender().getId() : null,
            inv.getReceiver() != null ? inv.getReceiver().getPseudo() : null,
            inv.getReceiver() != null ? inv.getReceiver().getId() : null,
            inv.getJeu() != null ? inv.getJeu().getTitre() : null,
            inv.getJeu() != null ? inv.getJeu().getId() : null,
            inv.getStatus() != null ? inv.getStatus().name() : null,
            inv.getCreatedAt(),
            inv.getAcceptedAt()
        );
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendInvitation(
            @RequestParam Long senderId,
            @RequestParam String receiverPseudo,
            @RequestParam Long jeuId) {
        try {
            Invitation invitation = invitationService.sendInvitation(senderId, receiverPseudo, jeuId);
            InvitationDTO dto = toDTO(invitation);

            // Notifier le destinataire via WebSocket
            Long receiverId = invitation.getReceiver().getId();
            messagingTemplate.convertAndSend("/topic/invitations/" + receiverId, "nouvelle_invitation");

            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            // Retourner le message d'erreur précis au lieu de null
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/received/{userId}")
    public ResponseEntity<List<InvitationDTO>> getReceivedInvitations(@PathVariable Long userId) {
        List<Invitation> invitations = invitationService.getReceivedInvitations(userId);
        List<InvitationDTO> dtos = invitations.stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<InvitationDTO>> getSentInvitations(@PathVariable Long userId) {
        List<Invitation> invitations = invitationService.getSentInvitations(userId);
        List<InvitationDTO> dtos = invitations.stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/accept/{invitationId}")
    public ResponseEntity<?> acceptInvitation(@PathVariable Long invitationId) {
        try {
            Match match = invitationService.acceptInvitation(invitationId);
            
            if (match.getPlayer1() != null) {
                Long senderId = match.getPlayer1().getId(); 
                
                // On envoie une chaîne formatée : "MATCH_START:matchId:jeuId:jeuTitre"
                String message = "MATCH_START:" + match.getId() + ":" + match.getJeu().getId() + ":" + match.getJeu().getTitre();
                messagingTemplate.convertAndSend("/topic/invitations/" + senderId, message);
            }

            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/decline/{invitationId}")
    public ResponseEntity<?> declineInvitation(@PathVariable Long invitationId) {
        try {
            Invitation invitation = invitationService.declineInvitation(invitationId);
            return ResponseEntity.ok(toDTO(invitation));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
