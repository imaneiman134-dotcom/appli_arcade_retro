import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { scoreService } from '../../services/api';

const ROWS = 9, COLS = 9, MINES = 10;

function makeBoard() {
  const cells = Array.from({ length: ROWS * COLS }, (_, i) => ({
    id: i, mine: false, revealed: false, flagged: false, count: 0
  }));
  let placed = 0;
  while (placed < MINES) {
    const i = Math.floor(Math.random() * ROWS * COLS);
    if (!cells[i].mine) { cells[i].mine = true; placed++; }
  }
  // count neighbors
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (cells[r*COLS+c].mine) continue;
      let cnt = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r+dr, nc = c+dc;
          if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && cells[nr*COLS+nc].mine) cnt++;
        }
      cells[r*COLS+c].count = cnt;
    }
  return cells;
}

function floodReveal(cells, idx) {
  const newCells = [...cells.map(c => ({...c}))];
  const stack = [idx];
  while (stack.length) {
    const i = stack.pop();
    if (newCells[i].revealed || newCells[i].flagged) continue;
    newCells[i].revealed = true;
    if (newCells[i].count === 0 && !newCells[i].mine) {
      const r = Math.floor(i / COLS), c = i % COLS;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r+dr, nc = c+dc;
          if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS) stack.push(nr*COLS+nc);
        }
    }
  }
  return newCells;
}

export default function MinesweeperGame() {
  const [cells, setCells] = useState(makeBoard);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const { jeuId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const saveScore = async (s) => {
    if (!userId || !jeuId) return;
    try { await scoreService.saveScore(parseInt(userId), parseInt(jeuId), s); } catch(e) {}
  };

  const handleClick = (i) => {
    if (gameOver || won || cells[i].revealed || cells[i].flagged) return;
    if (cells[i].mine) {
      const newCells = cells.map(c => ({...c, revealed: c.mine ? true : c.revealed}));
      setCells(newCells); setGameOver(true); return;
    }
    const newCells = floodReveal(cells, i);
    const revealed = newCells.filter(c => c.revealed && !c.mine).length;
    const pts = revealed * 10;
    setScore(pts);
    const allSafe = newCells.filter(c => !c.mine).every(c => c.revealed);
    if (allSafe) { setWon(true); saveScore(pts + 100); setScore(pts + 100); }
    setCells(newCells);
  };

  const handleRightClick = (e, i) => {
    e.preventDefault();
    if (cells[i].revealed) return;
    const newCells = cells.map((c,idx) => idx===i ? {...c, flagged: !c.flagged} : c);
    setCells(newCells);
  };

  const restart = () => { setCells(makeBoard()); setGameOver(false); setWon(false); setScore(0); };

  const COUNT_COLORS = ['','#0000ff','#006600','#ff0000','#000080','#800000','#008080','#000000','#808080'];

  return (
    <div className="game-page">
      <h2>Minesweeper</h2>
      <p className="game-hint">Clic gauche = révéler | Clic droit = drapeau | {MINES} mines</p>
      <p style={{color:'#ffff00', marginBottom:'10px'}}>Score : {score}</p>
      <div className="ms-grid">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`ms-cell ${cell.revealed ? 'ms-revealed' : 'ms-hidden'} ${cell.mine && cell.revealed ? 'ms-mine' : ''}`}
            onClick={() => handleClick(i)}
            onContextMenu={(e) => handleRightClick(e, i)}
            style={{ color: COUNT_COLORS[cell.count] || '#000' }}
          >
            {cell.revealed
              ? cell.mine ? '💥' : cell.count > 0 ? cell.count : ''
              : cell.flagged ? '🚩' : ''}
          </div>
        ))}
      </div>
      {(gameOver || won) && (
        <div className="game-overlay">
          <h3>{won ? '🏆 Déminé ! +100 bonus !' : '💥 BOOM !'}</h3>
          <p>Score : {score}</p>
          <button onClick={restart}>Nouvelle partie</button>
          <button onClick={() => navigate('/')}>Retour</button>
        </div>
      )}
    </div>
  );
}
