package com.arcade.dto;

public class GenericSyncMessage {
    
    private Long senderId;
    private String actionType;
    private Object payload; 

    public GenericSyncMessage() {
    }

    public GenericSyncMessage(Long senderId, String actionType, Object payload) {
        this.senderId = senderId;
        this.actionType = actionType;
        this.payload = payload;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public Object getPayload() {
        return payload;
    }

    public void setPayload(Object payload) {
        this.payload = payload;
    }
}