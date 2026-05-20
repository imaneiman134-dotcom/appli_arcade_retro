package com.arcade.dto;

public class MatchMastersMatchDTO {
    private Long matchId;
    private Long player1Id;
    private String player1Name;
    private Long player2Id;
    private String player2Name;
    private Integer player1Score;
    private Integer player2Score;
    private Integer currentTurn;
    private Integer maxTurns;
    private String status;
    private Long winnerId;
    private String boardState;

    public MatchMastersMatchDTO() {}

    public MatchMastersMatchDTO(Long matchId, Long player1Id, String player1Name, Long player2Id, String player2Name, Integer player1Score, Integer player2Score, Integer currentTurn, Integer maxTurns, String status, Long winnerId, String boardState) {
        this.matchId = matchId;
        this.player1Id = player1Id;
        this.player1Name = player1Name;
        this.player2Id = player2Id;
        this.player2Name = player2Name;
        this.player1Score = player1Score;
        this.player2Score = player2Score;
        this.currentTurn = currentTurn;
        this.maxTurns = maxTurns;
        this.status = status;
        this.winnerId = winnerId;
        this.boardState = boardState;
    }

    public Long getMatchId() { return matchId; }
    public void setMatchId(Long matchId) { this.matchId = matchId; }

    public Long getPlayer1Id() { return player1Id; }
    public void setPlayer1Id(Long player1Id) { this.player1Id = player1Id; }

    public String getPlayer1Name() { return player1Name; }
    public void setPlayer1Name(String player1Name) { this.player1Name = player1Name; }

    public Long getPlayer2Id() { return player2Id; }
    public void setPlayer2Id(Long player2Id) { this.player2Id = player2Id; }

    public String getPlayer2Name() { return player2Name; }
    public void setPlayer2Name(String player2Name) { this.player2Name = player2Name; }

    public Integer getPlayer1Score() { return player1Score; }
    public void setPlayer1Score(Integer player1Score) { this.player1Score = player1Score; }

    public Integer getPlayer2Score() { return player2Score; }
    public void setPlayer2Score(Integer player2Score) { this.player2Score = player2Score; }

    public Integer getCurrentTurn() { return currentTurn; }
    public void setCurrentTurn(Integer currentTurn) { this.currentTurn = currentTurn; }

    public Integer getMaxTurns() { return maxTurns; }
    public void setMaxTurns(Integer maxTurns) { this.maxTurns = maxTurns; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getWinnerId() { return winnerId; }
    public void setWinnerId(Long winnerId) { this.winnerId = winnerId; }

    public String getBoardState() { return boardState; }
    public void setBoardState(String boardState) { this.boardState = boardState; }
}
