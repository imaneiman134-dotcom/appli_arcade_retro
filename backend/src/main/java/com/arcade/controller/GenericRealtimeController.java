package com.arcade.controller;

import com.arcade.dto.GenericSyncMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class GenericRealtimeController {

    private final SimpMessagingTemplate messagingTemplate;

    public GenericRealtimeController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/match/{matchId}/sync")
    public void syncGameState(
            @DestinationVariable Long matchId,
            @Payload GenericSyncMessage message,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Blindly broadcast the state to all subscribers of this match
        messagingTemplate.convertAndSend("/topic/match/" + matchId + "/sync", message);
    }
}
