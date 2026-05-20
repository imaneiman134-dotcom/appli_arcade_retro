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

    @MessageMapping("/game.move")
    public void processMove(@Payload MoveDTO move) {
        messagingTemplate.convertAndSend("/topic/game/" + move.getMatchId(), move);
    }
}