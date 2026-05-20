import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './asteroid-duel.css';

const AsteroidDuelGame = () => {
  const { jeuId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);

  // Utilisation de useRef pour des performances fluides (60 FPS) sans bloquer React
  const keys = useRef({});
  const p1Ref = useRef({ x: 50, y: 250, width: 30, height: 30, health: 100, bullets: [], lastShot: 0 });
  const p2Ref = useRef({ x: 720, y: 250, width: 30, height: 30, health: 100, bullets: [], lastShot: 0 });
  const asteroidsRef = useRef([]);

  // 1. Écouteurs d'événements du clavier
  useEffect(() => {
    const handleKeyDown = (e) => { 
      keys.current[e.key.toLowerCase()] = true; 
      keys.current[e.key] = true; 
      // Empêche le scrolling de la page avec Espace ou les flèches
      if(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
      }
    };
    const handleKeyUp = (e) => { 
      keys.current[e.key.toLowerCase()] = false; 
      keys.current[e.key] = false; 
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
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
    let animationFrameId;

    const gameLoop = () => {
      const now = Date.now();
      const speed = 5;
      const bulletSpeed = 10;
      const fireRate = 300; // Millisecondes entre chaque tir

      if (keys.current['z']) p1Ref.current.y = Math.max(0, p1Ref.current.y - speed);
      if (keys.current['s']) p1Ref.current.y = Math.min(canvas.height - 30, p1Ref.current.y + speed);
      if (keys.current['q']) p1Ref.current.x = Math.max(0, p1Ref.current.x - speed);
      if (keys.current['d']) p1Ref.current.x = Math.min(canvas.width / 2 - 30, p1Ref.current.x + speed); // Bloqué à la moitié gauche

      if (keys.current['arrowup']) p2Ref.current.y = Math.max(0, p2Ref.current.y - speed);
      if (keys.current['arrowdown']) p2Ref.current.y = Math.min(canvas.height - 30, p2Ref.current.y + speed);
      if (keys.current['arrowleft']) p2Ref.current.x = Math.max(canvas.width / 2, p2Ref.current.x - speed); // Bloqué à la moitié droite
      if (keys.current['arrowright']) p2Ref.current.x = Math.min(canvas.width - 30, p2Ref.current.x + speed);

      if (keys.current[' '] && now - p1Ref.current.lastShot > fireRate) {
        p1Ref.current.bullets.push({ x: p1Ref.current.x + 30, y: p1Ref.current.y + 15 });
        p1Ref.current.lastShot = now;
      }
      
      if (keys.current['enter'] && now - p2Ref.current.lastShot > fireRate) {
        p2Ref.current.bullets.push({ x: p2Ref.current.x, y: p2Ref.current.y + 15 });
        p2Ref.current.lastShot = now;
      }

      p1Ref.current.bullets.forEach(b => b.x += bulletSpeed);
      p2Ref.current.bullets.forEach(b => b.x -= bulletSpeed);

      p1Ref.current.bullets = p1Ref.current.bullets.filter(b => b.x < canvas.width);
      p2Ref.current.bullets = p2Ref.current.bullets.filter(b => b.x > 0);

      asteroidsRef.current.forEach(ast => {
        ast.x += ast.vx;
        ast.y += ast.vy;
        // Rebond sur les bords de l'écran
        if (ast.x < 0 || ast.x > canvas.width) ast.vx *= -1;
        if (ast.y < 0 || ast.y > canvas.height) ast.vy *= -1;
      });

      p1Ref.current.bullets.forEach((bullet, bIndex) => {
        asteroidsRef.current.forEach((ast, aIndex) => {
          const dist = Math.hypot(bullet.x - ast.x, bullet.y - ast.y);
          if (dist < ast.size) {
            p1Ref.current.bullets.splice(bIndex, 1);
            asteroidsRef.current.splice(aIndex, 1);
            setPlayer1Score(s => s + 10);
          }
        });
      });

      p2Ref.current.bullets.forEach((bullet, bIndex) => {
        asteroidsRef.current.forEach((ast, aIndex) => {
          const dist = Math.hypot(bullet.x - ast.x, bullet.y - ast.y);
          if (dist < ast.size) {
            p2Ref.current.bullets.splice(bIndex, 1);
            asteroidsRef.current.splice(aIndex, 1);
            setPlayer2Score(s => s + 10);
          }
        });
      });

      p1Ref.current.bullets.forEach((bullet, bIndex) => {
        if (bullet.x > p2Ref.current.x && bullet.x < p2Ref.current.x + p2Ref.current.width &&
            bullet.y > p2Ref.current.y && bullet.y < p2Ref.current.y + p2Ref.current.height) {
          p2Ref.current.health -= 10;
          p1Ref.current.bullets.splice(bIndex, 1);
          setPlayer1Score(s => s + 50);
        }
      });

      p2Ref.current.bullets.forEach((bullet, bIndex) => {
        if (bullet.x > p1Ref.current.x && bullet.x < p1Ref.current.x + p1Ref.current.width &&
            bullet.y > p1Ref.current.y && bullet.y < p1Ref.current.y + p1Ref.current.height) {
          p1Ref.current.health -= 10;
          p2Ref.current.bullets.splice(bIndex, 1);
          setPlayer2Score(s => s + 50);
        }
      });

      if (p1Ref.current.health <= 0) {
        setWinner('Player 2');
        setGameOver(true);
      } else if (p2Ref.current.health <= 0) {
        setWinner('Player 1');
        setGameOver(true);
      }

      ctx.fillStyle = 'rgba(10, 10, 15, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dessiner un vaisseau
      const drawShip = (player, color, direction, isThrusting) => {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        if (direction === 'left') ctx.rotate(Math.PI);

        if (isThrusting) {
          ctx.beginPath();
          ctx.moveTo(-15, -5);
          ctx.lineTo(-30 - Math.random() * 10, 0); 
          ctx.lineTo(-15, 5);
          ctx.fillStyle = '#ff9900';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(20, 0);    
        ctx.lineTo(-15, -15); 
        ctx.lineTo(-10, 0);   
        ctx.lineTo(-15, 15);  
        ctx.closePath();
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = 'red';
        ctx.fillRect(player.x, player.y - 15, 30, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(player.x, player.y - 15, (player.health / 100) * 30, 5);
      };

      const drawAsteroid = (ast) => {
        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.beginPath();
        const vertices = 7;
        for (let i = 0; i < vertices; i++) {
          const angle = (i * 2 * Math.PI) / vertices;
          const r = ast.size * (0.8 + Math.sin(angle * 3 + ast.x) * 0.2); 
          if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
          else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
        }
        ctx.closePath();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      };

      const drawLaser = (bullet, color) => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0; 
      };

      asteroidsRef.current.forEach(drawAsteroid);
      p1Ref.current.bullets.forEach(b => drawLaser(b, '#ffff00'));
      p2Ref.current.bullets.forEach(b => drawLaser(b, '#00ffcc'));

      const p1Thrusting = keys.current['z'] || keys.current['s'] || keys.current['q'] || keys.current['d'];
      const p2Thrusting = keys.current['arrowup'] || keys.current['arrowdown'] || keys.current['arrowleft'] || keys.current['arrowright'];
      
      drawShip(p1Ref.current, '#ff6600', 'right', p1Thrusting);
      drawShip(p2Ref.current, '#0066ff', 'left', p2Thrusting);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Courier New';
      ctx.fillText(`P1 Score: ${player1Score}`, 20, 30);
      ctx.fillText(`P2 Score: ${player2Score}`, canvas.width - 170, 30);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted, gameOver]);

  const startGame = () => {
    p1Ref.current = { x: 50, y: 250, width: 30, height: 30, health: 100, bullets: [], lastShot: 0 };
    p2Ref.current = { x: 720, y: 250, width: 30, height: 30, health: 100, bullets: [], lastShot: 0 };
    setPlayer1Score(0);
    setPlayer2Score(0);
    setGameOver(false);
    
    const newAsteroids = [];
    for (let i = 0; i < 8; i++) {
      newAsteroids.push({
        x: Math.random() * 400 + 200, 
        y: Math.random() * 400 + 50,
        size: Math.random() * 15 + 15,
        vx: (Math.random() * 4 - 2), 
        vy: (Math.random() * 4 - 2)  
      });
    }
    asteroidsRef.current = newAsteroids;
    setGameStarted(true);
  };

  const returnToLobby = () => navigate('/lobby');


  if (!gameStarted) {
    return (
      <div className="asteroid-duel-wrapper">
        <h1>Asteroid Duel</h1>
        <div className="game-intro">
          <h2>Systèmes Prêts</h2>
          <p><strong>Player 1 (Orange) :</strong> Z/Q/S/D pour se déplacer, <strong>ESPACE</strong> pour tirer</p>
          <p><strong>Player 2 (Bleu) :</strong> Flèches pour se déplacer, <strong>ENTRÉE</strong> pour tirer</p>
          <button onClick={startGame} className="btn-start-game">Décollage</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="asteroid-duel-wrapper">
        <h1>Asteroid Duel - Fin de transmission</h1>
        <div className="game-intro">
          <h2>🏆 {winner} gagne !</h2>
          <div>Score final P1 : {player1Score}</div>
          <div>Score final P2 : {player2Score}</div>
          <button onClick={startGame} className="btn-start-game" style={{marginRight: '15px'}}>Rejouer</button>
          <button onClick={returnToLobby} className="btn-back-lobby">Retour au Lobby</button>
        </div>
      </div>
    );
  }

  return (
    <div className="asteroid-duel-wrapper">
      <h1>Asteroid Duel</h1>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="game-canvas"
        style={{ border: '3px solid #00ffcc', borderRadius: '8px', boxShadow: '0 0 15px #00ffcc', backgroundColor: '#000' }}
      />
    </div>
  );
};

export default AsteroidDuelGame;