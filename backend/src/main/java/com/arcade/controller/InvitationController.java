package com.arcade.controller;

import com.arcade.model.Invitation;
import com.arcade.model.Match;
import com.arcade.service.InvitationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    @Autowired
    private InvitationService invitationService;

    @PostMapping("/send")
    public ResponseEntity<Invitation> sendInvitation(@RequestParam Long senderId, @RequestParam String receiverPseudo, @RequestParam Long jeuId) {
        try {
            Invitation invitation = invitationService.sendInvitation(senderId, receiverPseudo, jeuId);
            return ResponseEntity.ok(invitation);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null); // Or a more specific error response
        }
    }

    @GetMapping("/received/{userId}")
    public ResponseEntity<List<Invitation>> getReceivedInvitations(@PathVariable Long userId) {
        List<Invitation> invitations = invitationService.getReceivedInvitations(userId);
        return ResponseEntity.ok(invitations);
    }

    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<Invitation>> getSentInvitations(@PathVariable Long userId) {
        List<Invitation> invitations = invitationService.getSentInvitations(userId);
        return ResponseEntity.ok(invitations);
    }

    @PostMapping("/accept/{invitationId}")
    public ResponseEntity<Match> acceptInvitation(@PathVariable Long invitationId) {
        try {
            Match match = invitationService.acceptInvitation(invitationId);
            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/decline/{invitationId}")
    public ResponseEntity<Invitation> declineInvitation(@PathVariable Long invitationId) {
        try {
            Invitation invitation = invitationService.declineInvitation(invitationId);
            return ResponseEntity.ok(invitation);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
