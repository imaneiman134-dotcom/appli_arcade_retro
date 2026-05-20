package com.arcade.controller;

import com.arcade.dto.MoveDTO;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class GameController {

    private final SimpMessagingTemplate messagingTemplate;

    public GameController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Le frontend enverra ses messages à "/app/game.move"
    @MessageMapping("/game.move")
    public void processMove(@Payload MoveDTO move) {
        // Le serveur reçoit le coup et le diffuse immédiatement sur le "topic" du match spécifique
        messagingTemplate.convertAndSend("/topic/game/" + move.getMatchId(), move);
    }
}