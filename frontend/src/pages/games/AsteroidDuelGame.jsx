import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AsteroidDuelGame = () => {
  const { jeuId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const [player1, setPlayer1] = useState({
    x: 100,
    y: 250,
    width: 30,
    height: 30,
    health: 100,
    bullets: []
  });

  const [player2, setPlayer2] = useState({
    x: 750,
    y: 250,
    width: 30,
    height: 30,
    health: 100,
    bullets: []
  });

  const [asteroids, setAsteroids] = useState([]);
  const [keys, setKeys] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };
    const handleKeyUp = (e) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const gameLoop = setInterval(() => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw players
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
      ctx.fillStyle = '#0066ff';
      ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

      // Draw asteroids
      ctx.fillStyle = '#888';
      asteroids.forEach(asteroid => {
        ctx.fillRect(asteroid.x, asteroid.y, asteroid.size, asteroid.size);
      });

      // Draw bullets
      ctx.fillStyle = '#ffff00';
      player1.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, 5, 5);
      });
      ctx.fillStyle = '#00ff00';
      player2.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, 5, 5);
      });

      // Draw scores
      ctx.fillStyle = '#00ff00';
      ctx.font = '20px Courier New';
      ctx.fillText(`P1: ${player1Score}`, 20, 30);
      ctx.fillText(`P2: ${player2Score}`, canvas.width - 150, 30);
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, player1, player2, asteroids, player1Score, player2Score]);

  const startGame = () => {
    setGameStarted(true);
    // Generate initial asteroids
    const newAsteroids = [];
    for (let i = 0; i < 5; i++) {
      newAsteroids.push({
        x: Math.random() * 600 + 100,
        y: Math.random() * 400,
        size: 20,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1
      });
    }
    setAsteroids(newAsteroids);
  };

  const returnToLobby = () => {
    navigate('/lobby');
  };

  if (!gameStarted) {
    return (
      <div className="asteroid-duel-container">
        <h1>Asteroid Duel</h1>
        <div className="game-intro">
          <p>Contrôles:</p>
          <p>Player 1: Z/Q/S/D pour se déplacer, Espace pour tirer</p>
          <p>Player 2: Flèches pour se déplacer, Entrée pour tirer</p>
          <button onClick={startGame} className="btn-start-game">
            Commencer
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="asteroid-duel-container">
        <h1>Asteroid Duel - Fin</h1>
        <div className="game-result">
          <h2>🏆 {winner} gagne!</h2>
          <div className="final-scores">
            <div>Player 1: {player1Score}</div>
            <div>Player 2: {player2Score}</div>
          </div>
          <button onClick={returnToLobby} className="btn-back-lobby">
            Retour au Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="asteroid-duel-container">
      <h1>Asteroid Duel</h1>
      <div className="game-scores">
        <div>Player 1: {player1Score}</div>
        <div>Player 2: {player2Score}</div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="game-canvas"
        style={{ border: '2px solid #00ff00', backgroundColor: '#0a0a0a' }}
      />
    </div>
  );
};

export default AsteroidDuelGame;
