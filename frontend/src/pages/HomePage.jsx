import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jeuService, scoreService } from '../services/api';

const GAME_ROUTES = {
  'Bataille Navale': 'battleship',
  'Puissance 4': 'connect4',
  'Tic Tac Toe': 'tictactoe',
  'Asteroid Duel': 'asteroid',
  'Brawlbots': 'brawlbots',
  'Match Masters': 'matchmasters',
};

function HomePage() {
  const [jeux, setJeux] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userPseudo = localStorage.getItem('userPseudo');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jeuxRes = await jeuService.getAllJeux();
        setJeux(jeuxRes.data);
        const scoresData = {};
        for (const jeu of jeuxRes.data) {
          try {
            const scoreRes = await scoreService.getLeaderboard(jeu.id);
            scoresData[jeu.id] = scoreRes.data;
          } catch (e) {
            scoresData[jeu.id] = [];
          }
        }
        setScores(scoresData);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Chargement de l'arcade...</div>;

  if (!userPseudo) {
    return (
      <div className="home-page">
        <h1>Bienvenue dans Arcade Rétro Multijoueur</h1>
        <p className="login-prompt">Connectez-vous pour jouer</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <h1>Sélection des Jeux Multijoueur</h1>
      <div className="games-grid">
        {jeux.map((jeu) => {
          const route = GAME_ROUTES[jeu.titre];
          const isAsteroid = jeu.titre === 'Asteroid Duel';

          return (
            <div key={jeu.id} className="game-card">
              <h3>{jeu.titre}</h3>
              <p>{jeu.description}</p>
              <div className="leaderboard">
                <h4>Meilleurs Scores</h4>
                {scores[jeu.id] && scores[jeu.id].length > 0 ? (
                  <ul>
                    {scores[jeu.id].slice(0, 5).map((s, i) => (
                      <li key={i}>
                        <span className="rank">#{i + 1}</span>
                        <span className="player">{s.utilisateur.pseudo}</span>
                        <span className="score-val">{s.valeur}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-score">Aucun score encore</p>
                )}
              </div>
              <div className="game-actions">
                {isAsteroid && (
                  <button 
                    onClick={() => route && navigate(`/game/${route}/${jeu.id}`)}
                    className="btn-play"
                  >
                    JOUER
                  </button>
                )}

                <button 
                  onClick={() => navigate('/lobby')}
                  className="btn-challenge"
                  style={!isAsteroid ? { width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold' } : {}}
                >
                  {isAsteroid ? "DEFIER" : "DEFIER UN JOUEUR"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;