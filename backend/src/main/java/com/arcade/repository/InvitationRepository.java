package com.arcade.repository;

import com.arcade.model.Invitation;
import com.arcade.model.InvitationStatus;
import com.arcade.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    List<Invitation> findByReceiverAndStatus(Utilisateur receiver, InvitationStatus status);
    List<Invitation> findBySenderAndStatus(Utilisateur sender, InvitationStatus status);
    List<Invitation> findByStatusAndCreatedAtBefore(InvitationStatus status, LocalDateTime dateTime);
    Optional<Invitation> findBySenderAndReceiverAndJeuAndStatus(Utilisateur sender, Utilisateur receiver, com.arcade.model.Jeu jeu, InvitationStatus status);
}
