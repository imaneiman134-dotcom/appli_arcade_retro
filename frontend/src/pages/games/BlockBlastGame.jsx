import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { scoreService } from '../../services/api';

const COLS = 8, ROWS = 8;
const COLORS = ['#ff0000','#ff7700','#ffff00','#00ff00','#00ffff','#ff00ff'];

function makeGrid() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
  );
}

function findGroup(grid, row, col, color, visited) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return [];
  const key = `${row},${col}`;
  if (visited.has(key) || grid[row][col] !== color) return [];
  visited.add(key);
  return [
    [row, col],
    ...findGroup(grid, row+1, col, color, visited),
    ...findGroup(grid, row-1, col, color, visited),
    ...findGroup(grid, row, col+1, color, visited),
    ...findGroup(grid, row, col-1, color, visited),
  ];
}

function applyGravity(grid) {
  const newGrid = grid.map(row => [...row]);
  for (let c = 0; c < COLS; c++) {
    let filled = newGrid.map(r => r[c]).filter(v => v !== null);
    let nulls = Array(ROWS - filled.length).fill(null);
    let col = [...nulls, ...filled];
    for (let r = 0; r < ROWS; r++) newGrid[r][c] = col[r];
  }
  return newGrid;
}

export default function BlockBlastGame() {
  const [grid, setGrid] = useState(makeGrid);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highlighted, setHighlighted] = useState([]);
  const { jeuId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const saveScore = async (s) => {
    if (!userId || !jeuId) return;
    try { await scoreService.saveScore(parseInt(userId), parseInt(jeuId), s); } catch(e) {}
  };

  const checkGameOver = useCallback((g) => {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (!g[r][c]) continue;
        const group = findGroup(g, r, c, g[r][c], new Set());
        if (group.length >= 2) return false;
      }
    return true;
  }, []);

  const handleClick = (row, col) => {
    if (gameOver || !grid[row][col]) return;
    const group = findGroup(grid, row, col, grid[row][col], new Set());
    if (group.length < 2) return;

    const newGrid = grid.map(r => [...r]);
    group.forEach(([r, c]) => { newGrid[r][c] = null; });
    const afterGravity = applyGravity(newGrid);
    const pts = group.length * group.length * 10;
    const newScore = score + pts;
    setScore(newScore);
    setGrid(afterGravity);

    if (checkGameOver(afterGravity)) {
      setGameOver(true);
      saveScore(newScore);
    }
  };

  const handleHover = (row, col) => {
    if (!grid[row][col]) return;
    const group = findGroup(grid, row, col, grid[row][col], new Set());
    if (group.length >= 2) setHighlighted(group.map(([r,c]) => `${r},${c}`));
    else setHighlighted([]);
  };

  const restart = () => {
    setGrid(makeGrid());
    setScore(0); setGameOver(false); setHighlighted([]);
  };

  return (
    <div className="game-page">
      <h2>Block Blast</h2>
      <p className="game-hint">Clique sur un groupe de 2+ blocs de même couleur pour les supprimer</p>
      <p style={{color:'#ffff00', marginBottom:'10px'}}>Score : {score}</p>
      <div className="bb-grid" onMouseLeave={() => setHighlighted([])}>
        {grid.map((row, r) =>
          row.map((color, c) => (
            <div
              key={`${r},${c}`}
              className={`bb-cell ${highlighted.includes(`${r},${c}`) ? 'bb-highlight' : ''}`}
              style={{ backgroundColor: color || '#111', opacity: color ? 1 : 0.2 }}
              onClick={() => handleClick(r, c)}
              onMouseEnter={() => handleHover(r, c)}
            />
          ))
        )}
      </div>
      {gameOver && (
        <div className="game-overlay">
          <h3>Plus de coups possibles !</h3>
          <p>Score final : {score}</p>
          <button onClick={restart}>Nouvelle partie</button>
          <button onClick={() => navigate('/')}>Retour</button>
        </div>
      )}
    </div>
  );
}
