import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jeuService, invitationService, matchService } from '../services/api';

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
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [userId]);

  const fetchData = async () => {
    try {
      const [jeuxRes, receivedRes, sentRes] = await Promise.all([
        jeuService.getAllJeux(),
        invitationService.getReceivedInvitations(userId),
        invitationService.getSentInvitations(userId)
      ]);
      setJeux(jeuxRes.data || []);
      setReceivedInvitations(receivedRes.data || []);
      setSentInvitations(sentRes.data || []);
      setError('');
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      // Don't show error for background refreshes
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.receiverPseudo || !inviteForm.jeuId) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      await invitationService.sendInvitation(userId, inviteForm.receiverPseudo, inviteForm.jeuId);
      setInviteForm({ receiverPseudo: '', jeuId: '' });
      setSuccessMessage('Invitation envoyée avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
      setError('');
    } catch (err) {
      setError('Impossible d\'envoyer l\'invitation. Vérifiez le pseudo.');
    }
  };

  const handleAccept = async (invitationId) => {
    try {
      const res = await invitationService.acceptInvitation(invitationId);
      const match = res.data;
      const jeu = jeux.find(j => j.id === match.jeu?.id);
      const route = getGameRoute(jeu?.titre);
      navigate(`/game/${route}/${match.jeu?.id}?matchId=${match.id}`);
    } catch (err) {
      setError('Erreur lors de l\'acceptation');
    }
  };

  const handleDecline = async (invitationId) => {
    try {
      await invitationService.declineInvitation(invitationId);
      fetchData();
      setSuccessMessage('Invitation refusée');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('Erreur lors du refus');
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
      <h1>🎮 Salon Multijoueur</h1>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="lobby-container">
        <div className="lobby-section">
          <h2>📬 Invitations reçues ({receivedInvitations.length})</h2>
          <div className="invitations-list">
            {receivedInvitations.length === 0 ? (
              <p className="empty-message">Aucune invitation reçue</p>
            ) : (
              receivedInvitations.map(inv => (
                <div key={inv.id} className="invitation-card received">
                  <div className="invitation-info">
                    <p><strong>{inv.sender?.pseudo}</strong> vous défie à <span className="game-title">{inv.jeu?.titre}</span></p>
                    <p className="time">{new Date(inv.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="invitation-actions">
                    <button className="btn-accept" onClick={() => handleAccept(inv.id)}>✓ Accepter</button>
                    <button className="btn-decline" onClick={() => handleDecline(inv.id)}>✗ Refuser</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lobby-section">
          <h2>⚔️ Défier un joueur</h2>
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
            <button type="submit" className="btn-primary">📤 Envoyer l'invitation</button>
          </form>

          <h2 style={{marginTop: '30px'}}>📤 Invitations envoyées ({sentInvitations.length})</h2>
          <div className="invitations-list">
            {sentInvitations.length === 0 ? (
              <p className="empty-message">Aucune invitation envoyée</p>
            ) : (
              sentInvitations.map(inv => (
                <div key={inv.id} className="invitation-card sent">
                  <div className="invitation-info">
                    <p>Défi à <strong>{inv.receiver?.pseudo}</strong></p>
                    <p className="game-info">Jeu: {inv.jeu?.titre}</p>
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
