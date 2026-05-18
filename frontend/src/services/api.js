import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT aux requêtes
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

// Services pour les utilisateurs
export const utilisateurService = {
  register: (utilisateur) => apiClient.post('/utilisateurs/register', utilisateur),
  login: (pseudo, motDePasse) => apiClient.post('/utilisateurs/login', { pseudo, motDePasse }),
};

// Services pour les jeux
export const jeuService = {
  getAllJeux: () => apiClient.get('/jeux'),
  getJeuById: (id) => apiClient.get(`/jeux/${id}`),
};

// Services pour les scores
export const scoreService = {
  saveScore: (userId, jeuId, valeur) => apiClient.post('/scores/save', { userId, jeuId, valeur }),
  getLeaderboard: (jeuId) => apiClient.get(`/scores/leaderboard/${jeuId}`),
};

// Services pour Brawlbots
export const brawlbotsService = {
  createMatch: (jeuId, maxPlayers) => apiClient.post(`/brawlbots/create?jeuId=${jeuId}&maxPlayers=${maxPlayers}`),
  addPlayer: (matchId, userId, botType) => apiClient.post(`/brawlbots/${matchId}/add-player?userId=${userId}&botType=${botType}`),
  executeRound: (matchId, actions) => apiClient.post(`/brawlbots/${matchId}/execute-round`, actions),
  getMatch: (matchId) => apiClient.get(`/brawlbots/${matchId}`),
};

// Services pour Match Masters
export const matchMastersService = {
  createMatch: (jeuId, player1Id, player2Id) => apiClient.post(`/match-masters/create?jeuId=${jeuId}&player1Id=${player1Id}&player2Id=${player2Id}`),
  playTurn: (matchId, scoreGained) => apiClient.post(`/match-masters/${matchId}/play-turn?scoreGained=${scoreGained}`),
  getMatch: (matchId) => apiClient.get(`/match-masters/${matchId}`),
  getPlayerMatches: (userId) => apiClient.get(`/match-masters/player/${userId}`),
  updateBoardState: (matchId, boardState) => apiClient.post(`/match-masters/${matchId}/update-board`, boardState),
};

// Services pour les Invitations
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

// Services pour les Matchs (nouveau)
export const matchService = {
  getMatch: (matchId) => 
    apiClient.get(`/matches/${matchId}`),
  
  updateMatchStatus: (matchId, status) => 
    apiClient.put(`/matches/${matchId}/status`, { status }),
  
  setMatchWinner: (matchId, winnerId) => 
    apiClient.post(`/matches/${matchId}/winner?winnerId=${winnerId}`),
  
  getPlayerMatches: (userId) => 
    apiClient.get(`/matches/player/${userId}`),
};

export default apiClient;
