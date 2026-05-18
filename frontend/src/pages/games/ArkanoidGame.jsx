import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { scoreService } from '../../services/api';

const W = 600, H = 400;
const PADDLE_W = 90, PADDLE_H = 12;
const BALL_R = 8;
const BRICK_ROWS = 5, BRICK_COLS = 10;
const BRICK_W = 54, BRICK_H = 18, BRICK_GAP = 4;

function makeBricks() {
  const bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++)
    for (let c = 0; c < BRICK_COLS; c++)
      bricks.push({ r, c, alive: true });
  return bricks;
}

export default function ArkanoidGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const { jeuId } = useParams();
  const navigate = useNavigate();
  const pseudo = localStorage.getItem('userPseudo');
  const userId = localStorage.getItem('userId');

  const initState = () => ({
    paddle: { x: W / 2 - PADDLE_W / 2, y: H - 30 },
    ball: { x: W / 2, y: H - 50, vx: 3, vy: -3 },
    bricks: makeBricks(),
    score: 0,
    lives: 3,
  });

  const saveScore = async (finalScore) => {
    if (!userId || !jeuId) return;
    try {
      await scoreService.saveScore(parseInt(userId), parseInt(jeuId), finalScore);
    } catch (e) {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    stateRef.current = initState();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      stateRef.current.paddle.x = Math.max(0, Math.min(W - PADDLE_W, mx - PADDLE_W / 2));
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    const COLORS = ['#ff0000','#ff7700','#ffff00','#00ff00','#00ffff'];

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Bricks
      s.bricks.forEach(b => {
        if (!b.alive) return;
        const x = b.c * (BRICK_W + BRICK_GAP) + 10;
        const y = b.r * (BRICK_H + BRICK_GAP) + 30;
        ctx.fillStyle = COLORS[b.r];
        ctx.fillRect(x, y, BRICK_W, BRICK_H);
      });

      // Paddle
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(s.paddle.x, s.paddle.y, PADDLE_W, PADDLE_H);

      // Ball
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Score & lives
      ctx.fillStyle = '#ffff00';
      ctx.font = '16px Courier New';
      ctx.fillText(`Score: ${s.score}`, 10, 20);
      ctx.fillText(`Vies: ${s.lives}`, W - 80, 20);
    };

    const update = () => {
      if (!started) { draw(); return; }
      const s = stateRef.current;
      const ball = s.ball;

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Walls
      if (ball.x - BALL_R < 0 || ball.x + BALL_R > W) ball.vx *= -1;
      if (ball.y - BALL_R < 0) ball.vy *= -1;

      // Paddle
      if (
        ball.y + BALL_R >= s.paddle.y &&
        ball.y + BALL_R <= s.paddle.y + PADDLE_H &&
        ball.x >= s.paddle.x &&
        ball.x <= s.paddle.x + PADDLE_W
      ) {
        ball.vy = -Math.abs(ball.vy);
        const hit = (ball.x - (s.paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
        ball.vx = hit * 4;
      }

      // Bottom
      if (ball.y + BALL_R > H) {
        s.lives--;
        if (s.lives <= 0) {
          setScore(s.score);
          setGameOver(true);
          saveScore(s.score);
          cancelAnimationFrame(animRef.current);
          return;
        }
        ball.x = W / 2; ball.y = H - 50;
        ball.vx = 3; ball.vy = -3;
      }

      // Bricks
      s.bricks.forEach(b => {
        if (!b.alive) return;
        const bx = b.c * (BRICK_W + BRICK_GAP) + 10;
        const by = b.r * (BRICK_H + BRICK_GAP) + 30;
        if (ball.x + BALL_R > bx && ball.x - BALL_R < bx + BRICK_W &&
            ball.y + BALL_R > by && ball.y - BALL_R < by + BRICK_H) {
          b.alive = false;
          s.score += 10;
          ball.vy *= -1;
        }
      });

      // Win
      if (s.bricks.every(b => !b.alive)) {
        setScore(s.score);
        setWon(true);
        saveScore(s.score);
        cancelAnimationFrame(animRef.current);
        return;
      }

      draw();
      animRef.current = requestAnimationFrame(update);
    };

    animRef.current = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [started]);

  const restart = () => {
    stateRef.current = initState();
    setGameOver(false); setWon(false); setScore(0); setStarted(false);
  };

  return (
    <div className="game-page">
      <h2>Arkanoid</h2>
      {!started && !gameOver && !won && (
        <p className="game-hint">Bougez la souris pour viser — <button className="start-btn" onClick={() => setStarted(true)}>LANCER</button></p>
      )}
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas" />
      {(gameOver || won) && (
        <div className="game-overlay">
          <h3>{won ? '🏆 VICTOIRE !' : 'GAME OVER'}</h3>
          <p>Score : {score}</p>
          {!pseudo && <p className="hint">Connecte-toi pour sauvegarder ton score !</p>}
          <button onClick={restart}>Nouvelle partie</button>
          <button onClick={() => navigate('/')}>Retour</button>
        </div>
      )}
    </div>
  );
}
