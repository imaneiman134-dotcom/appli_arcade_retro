import axios from 'axios';

const currentHost = window.location.hostname;
const defaultApiBase = `http://${currentHost}:8080/api`;
const defaultWsBase = `http://${currentHost}:8080`;

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || defaultApiBase;
export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || defaultWsBase;
export const WS_ENDPOINT = `${WS_BASE_URL}/ws-arcade`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const utilisateurService = {
  register: (utilisateur) => apiClient.post('/utilisateurs/register', utilisateur),
  login: (pseudo, motDePasse) => apiClient.post('/utilisateurs/login', { pseudo, motDePasse }),
};

export const jeuService = {
  getAllJeux: () => apiClient.get('/jeux'),
  getJeuById: (id) => apiClient.get(`/jeux/${id}`),
};

export const scoreService = {
  saveScore: (userId, jeuId, valeur) => apiClient.post('/scores/save', { userId, jeuId, valeur }),
  getLeaderboard: (jeuId) => apiClient.get(`/scores/leaderboard/${jeuId}`),
};

export const brawlbotsService = {
  createMatch: (jeuId, maxPlayers) => apiClient.post(`/brawlbots/create?jeuId=${jeuId}&maxPlayers=${maxPlayers}`),
  addPlayer: (matchId, userId, botType) => apiClient.post(`/brawlbots/${matchId}/add-player?userId=${userId}&botType=${botType}`),
  executeRound: (matchId, actions) => apiClient.post(`/brawlbots/${matchId}/execute-round`, actions),
  getMatch: (matchId) => apiClient.get(`/brawlbots/${matchId}`),
};

export const matchMastersService = {
  createMatch: (jeuId, player1Id, player2Id) => apiClient.post(`/match-masters/create?jeuId=${jeuId}&player1Id=${player1Id}&player2Id=${player2Id}`),
  playTurn: (matchId, scoreGained) => apiClient.post(`/match-masters/${matchId}/play-turn?scoreGained=${scoreGained}`),
  getMatch: (matchId) => apiClient.get(`/match-masters/${matchId}`),
  getPlayerMatches: (userId) => apiClient.get(`/match-masters/player/${userId}`),
  updateBoardState: (matchId, boardState) => apiClient.post(`/match-masters/${matchId}/update-board`, boardState),
};

export const invitationService = {
  sendInvitation: (senderId, receiverPseudo, jeuId) => 
    apiClient.post(`/invitations/send?senderId=${senderId}&receiverPseudo=${receiverPseudo}&jeuId=${jeuId}`),
  
  getReceivedInvitations: (userId) => 
    apiClient.get(`/invitations/received/${userId}`),
  
  getSentInvitations: (userId) => 
    apiClient.get(`/invitations/sent/${userId}`),
  
  acceptInvitation: (invitationId) => 
    apiClient.post(`/invitations/accept/${invitationId}`),
  
  declineInvitation: (invitationId) => 
    apiClient.post(`/invitations/decline/${invitationId}`),
};

export const matchService = {
  getMatch: (matchId) => 
    apiClient.get(`/matches/${matchId}`),

  getConnect4State: (matchId) =>
    apiClient.get(`/matches/${matchId}/connect4/state`),
  
  updateMatchStatus: (matchId, status) => 
    apiClient.put(`/matches/${matchId}/status?status=${status}`),
  
  setMatchWinner: (matchId, winnerId) => 
    apiClient.post(`/matches/${matchId}/winner?winnerId=${winnerId}`),
  
  getPlayerMatches: (userId) => 
    apiClient.get(`/matches/player/${userId}`),
};

export default apiClient;
