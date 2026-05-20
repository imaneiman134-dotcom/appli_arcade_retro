import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jeuService, invitationService, matchService } from '../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const LobbyPage = () => {
  const navigate = useNavigate();
  const [jeux, setJeux] = useState([]);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [inviteForm, setInviteForm] = useState({
    receiverPseudo: '',
    jeuId: ''
  });

  const userId = localStorage.getItem('userId');
  const userPseudo = localStorage.getItem('userPseudo');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    
    fetchData();

    const currentHost = window.location.hostname;
    const socketUrl = `http://${currentHost}:8080/ws-arcade`; 
    const socket = new SockJS(socketUrl);
    
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log('Connecté au serveur d\'Arcade (WebSocket)');
        
        stompClient.subscribe(`/topic/invitations/${userId}`, (message) => {
          console.log('Notification reçue:', message.body);
          
          if (message.body.startsWith("MATCH_START:")) {
             const parts = message.body.split(":");
             const matchId = parts[1];
             const jeuId = parts[2];
             const jeuTitre = parts[3];
             
             const route = getGameRoute(jeuTitre);
             
             navigate(`/game/${route}/${jeuId}?matchId=${matchId}`);
             return; 
          }

          fetchData();
          setSuccessMessage("Nouvelle notification!");
          setTimeout(() => setSuccessMessage(''), 4000);
        });
      },
      onStompError: (frame) => {
        console.error('Erreur STOMP:', frame.headers['message']);
      }
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [userId]);

  const fetchData = async () => {
    try {
      const jeuxRes = await jeuService.getAllJeux();
      setJeux(jeuxRes.data || []);
    } catch (err) {
      console.error('Erreur chargement jeux:', err);
    }

    try {
      const receivedRes = await invitationService.getReceivedInvitations(userId);
      setReceivedInvitations(receivedRes.data || []);
    } catch (err) {
      console.error('Erreur chargement invitations reçues:', err);
    }

    try {
      const sentRes = await invitationService.getSentInvitations(userId);
      setSentInvitations(sentRes.data || []);
    } catch (err) {
      console.error('Erreur chargement invitations envoyées:', err);
    }

    setLoading(false);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.receiverPseudo || !inviteForm.jeuId) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setError('');
    try {
      await invitationService.sendInvitation(userId, inviteForm.receiverPseudo, inviteForm.jeuId);
      setInviteForm({ receiverPseudo: '', jeuId: '' });
      setSuccessMessage('Invitation envoyée avec succès!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (err) {
      console.error("Erreur brute Axios :", err);
      console.log("Données renvoyées par le backend :", err.response?.data);

      const backendData = err.response?.data;
      let errorMessage = 'Impossible d\'envoyer l\'invitation. Vérifiez le pseudo.';

      if (!err.response) {
        errorMessage = "Erreur réseau : le serveur est injoignable ou bloque la requête (CORS).";
      } else if (typeof backendData === 'string' && backendData.length > 0) {
        errorMessage = backendData;
      } else if (backendData && typeof backendData === 'object' && backendData.message) {
        errorMessage = `Erreur serveur: ${backendData.message}`;
      }

      setError(errorMessage);
    }
  };

  const handleAccept = async (invitationId) => {
    try {
      const res = await invitationService.acceptInvitation(invitationId);
      const match = res.data;
      const jeuTitre = match.jeu?.titre;
      const route = getGameRoute(jeuTitre);
      navigate(`/game/${route}/${match.jeu?.id}?matchId=${match.id}`);
    } catch (err) {
      const backendMessage = err.response?.data;
      setError(typeof backendMessage === 'string' ? backendMessage : 'Erreur lors de l\'acceptation');
    }
  };

  const handleDecline = async (invitationId) => {
    try {
      await invitationService.declineInvitation(invitationId);
      fetchData();
      setSuccessMessage('Invitation refusée');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      const backendMessage = err.response?.data;
      setError(typeof backendMessage === 'string' ? backendMessage : 'Erreur lors du refus');
    }
  };

  const getGameRoute = (title) => {
    const routes = {
      'Bataille Navale': 'battleship',
      'Puissance 4': 'connect4',
      'Tic Tac Toe': 'tictactoe',
      'Asteroid Duel': 'asteroid',
      'Brawlbots': 'brawlbots',
      'Match Masters': 'matchmasters'
    };
    return routes[title] || '';
  };

  if (loading) return <div className="loading">Chargement du lobby...</div>;

  return (
    <div className="lobby-page">
      <h1>Salon Multijoueur</h1>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="lobby-container">
        <div className="lobby-section">
          <h2>Invitations reçues ({receivedInvitations.length})</h2>
          <div className="invitations-list">
            {receivedInvitations.length === 0 ? (
              <p className="empty-message">Aucune invitation reçue</p>
            ) : (
              receivedInvitations.map(inv => (
                <div key={inv.id} className="invitation-card received">
                  <div className="invitation-info">
                    <p><strong>{inv.senderPseudo}</strong> vous défie à <span className="game-title">{inv.jeuTitre}</span></p>
                    <p className="time">{new Date(inv.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="invitation-actions">
                    <button className="btn-accept" onClick={() => handleAccept(inv.id)}>Accepter</button>
                    <button className="btn-decline" onClick={() => handleDecline(inv.id)}>Refuser</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lobby-section">
          <h2>Défier un joueur</h2>
          <form onSubmit={handleInviteSubmit} className="invite-form">
            <div className="form-group">
              <label>Pseudo de l'adversaire</label>
              <input 
                type="text" 
                value={inviteForm.receiverPseudo}
                onChange={e => setInviteForm({...inviteForm, receiverPseudo: e.target.value})}
                placeholder="Ex: Player2"
              />
            </div>
            <div className="form-group">
              <label>Choisir un jeu</label>
              <select 
                value={inviteForm.jeuId}
                onChange={e => setInviteForm({...inviteForm, jeuId: e.target.value})}
              >
                <option value="">-- Sélectionner --</option>
                {jeux.map(jeu => (
                  <option key={jeu.id} value={jeu.id}>{jeu.titre}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary">Envoyer l'invitation</button>
          </form>

          <h2 style={{marginTop: '30px'}}>Invitations envoyées ({sentInvitations.length})</h2>
          <div className="invitations-list">
            {sentInvitations.length === 0 ? (
              <p className="empty-message">Aucune invitation envoyée</p>
            ) : (
              sentInvitations.map(inv => (
                <div key={inv.id} className="invitation-card sent">
                  <div className="invitation-info">
                    <p>Défi à <strong>{inv.receiverPseudo}</strong></p>
                    <p className="game-info">Jeu: {inv.jeuTitre}</p>
                    <p className="time">{new Date(inv.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="invitation-status">
                    <span className={`status-badge ${inv.status?.toLowerCase()}`}>{inv.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button className="btn-back" onClick={() => navigate('/')}>← Retour à l'accueil</button>
    </div>
  );
};

export default LobbyPage;
