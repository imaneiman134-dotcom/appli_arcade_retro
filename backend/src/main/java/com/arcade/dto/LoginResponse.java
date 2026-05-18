package com.arcade.dto;

public class LoginResponse {
    private String token;
    private String pseudo;
    private Long id;

    public LoginResponse(String token, String pseudo, Long id) {
        this.token = token;
        this.pseudo = pseudo;
        this.id = id;
    }

    public String getToken() { return token; }
    public String getPseudo() { return pseudo; }
    public Long getId() { return id; }
}