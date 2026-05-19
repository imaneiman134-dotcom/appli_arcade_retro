import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
import './match-masters.css';

const width = 8;
// Palette de couleurs vives pour les blocs
const blockColors = [
  '#ef4444', // Rouge
  '#3b82f6', // Bleu
  '#10b981', // Vert
  '#f59e0b', // Jaune
  '#8b5cf6', // Violet
  '#ec4899'  // Rose
];

const MatchMastersGame = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();

  const [currentBoard, setCurrentBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [movesLeft, setMovesLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  
  const userId = localStorage.getItem('userId');

  // 1. Initialisation du plateau de jeu
  const createBoard = () => {
    const randomBoard = [];
    for (let i = 0; i < width * width; i++) {
      const randomColor = blockColors[Math.floor(Math.random() * blockColors.length)];
      randomBoard.push(randomColor);
    }
    setCurrentBoard(randomBoard);
    setScore(0);
    setMovesLeft(20);
    setGameOver(false);
  };

  useEffect(() => {
    createBoard();
  }, []);

  // 2. MOTEUR DE MATCH-3 : Vérification des colonnes et des lignes
  const checkForColumnOfFour = () => {
    for (let i = 0; i <= 39; i++) {
      const columnOfFour = [i, i + width, i + width * 2, i + width * 3];
      const decidedColor = currentBoard[i];
      const isBlank = currentBoard[i] === '';

      if (columnOfFour.every(square => currentBoard[square] === decidedColor && !isBlank)) {
        setScore((score) => score + 40);
        columnOfFour.forEach(square => currentBoard[square] = '');
        return true;
      }
    }
  };

  const checkForRowOfFour = () => {
    for (let i = 0; i < 64; i++) {
      const rowOfFour = [i, i + 1, i + 2, i + 3];
      const decidedColor = currentBoard[i];
      const notValid = [5, 6, 7, 13, 14, 15, 21, 22, 23, 29, 30, 31, 37, 38, 39, 45, 46, 47, 53, 54, 55, 61, 62, 63];
      const isBlank = currentBoard[i] === '';

      if (notValid.includes(i)) continue;

      if (rowOfFour.every(square => currentBoard[square] === decidedColor && !isBlank)) {
        setScore((score) => score + 40);
        rowOfFour.forEach(square => currentBoard[square] = '');
        return true;
      }
    }
  };

  const checkForColumnOfThree = () => {
    for (let i = 0; i <= 47; i++) {
      const columnOfThree = [i, i + width, i + width * 2];
      const decidedColor = currentBoard[i];
      const isBlank = currentBoard[i] === '';

      if (columnOfThree.every(square => currentBoard[square] === decidedColor && !isBlank)) {
        setScore((score) => score + 30);
        columnOfThree.forEach(square => currentBoard[square] = '');
        return true;
      }
    }
  };

  const checkForRowOfThree = () => {
    for (let i = 0; i < 64; i++) {
      const rowOfThree = [i, i + 1, i + 2];
      const decidedColor = currentBoard[i];
      const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
      const isBlank = currentBoard[i] === '';

      if (notValid.includes(i)) continue;

      if (rowOfThree.every(square => currentBoard[square] === decidedColor && !isBlank)) {
        setScore((score) => score + 30);
        rowOfThree.forEach(square => currentBoard[square] = '');
        return true;
      }
    }
  };

  // 3. MOTEUR DE GRAVITÉ : Fait tomber les blocs
  const moveIntoSquareBelow = () => {
    for (let i = 0; i <= 55; i++) {
      const firstRow = [0, 1, 2, 3, 4, 5, 6, 7];
      const isFirstRow = firstRow.includes(i);

      if (isFirstRow && currentBoard[i] === '') {
        let randomColor = blockColors[Math.floor(Math.random() * blockColors.length)];
        currentBoard[i] = randomColor;
      }

      if ((currentBoard[i + width]) === '') {
        currentBoard[i + width] = currentBoard[i];
        currentBoard[i] = '';
      }
    }
  };

  // Boucle de jeu
  useEffect(() => {
    const timer = setInterval(() => {
      checkForColumnOfFour();
      checkForRowOfFour();
      checkForColumnOfThree();
      checkForRowOfThree();
      moveIntoSquareBelow();
      setCurrentBoard([...currentBoard]);
    }, 100);
    return () => clearInterval(timer);
  }, [checkForColumnOfFour, checkForRowOfFour, checkForColumnOfThree, checkForRowOfThree, moveIntoSquareBelow, currentBoard]);

  // 4. LOGIQUE D'ÉCHANGE (SWAP)
  const handleSquareClick = (index) => {
    if (gameOver) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      const isAdjacent =
        index === selectedIndex - 1 ||
        index === selectedIndex + 1 ||
        index === selectedIndex - width ||
        index === selectedIndex + width;

      if (isAdjacent) {
        const newBoard = [...currentBoard];
        const colorOne = newBoard[selectedIndex];
        const colorTwo = newBoard[index];
        newBoard[selectedIndex] = colorTwo;
        newBoard[index] = colorOne;

        setCurrentBoard(newBoard);
        setMovesLeft((prev) => prev - 1);
      }
      setSelectedIndex(null);
    }
  };

  // 5. FIN DU JEU
  useEffect(() => {
    if (movesLeft <= 0) {
      setGameOver(true);
      if (userId && jeuId && !matchId) {
        scoreService.saveScore(userId, jeuId, score);
      } else if (matchId) {
        matchService.playTurn(matchId, score); 
      }
    }
  }, [movesLeft]);

  return (
    <div className="match-masters-wrapper">
      <div className="match-header">
        <h1>Match Masters</h1>
        <div className="score-board">
          <span>Score : {score}</span> | <span>Mouvements : {movesLeft}</span>
        </div>
      </div>

      <div className="block-board">
        {currentBoard.map((color, index) => (
          <div
            key={index}
            className={`block-cell ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => handleSquareClick(index)}
          >
            {/* Rendu d'un div coloré au lieu d'un emoji */}
            {color && <div className="color-block" style={{ backgroundColor: color }}></div>}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="game-over-overlay">
          <h2>PARTIE TERMINÉE</h2>
          <p style={{fontSize: "24px"}}>Score Final : <strong>{score}</strong></p>
          <button onClick={createBoard} className="btn-arcade" style={{marginRight: '15px'}}>Rejouer</button>
          <button onClick={() => navigate('/lobby')} className="btn-arcade">Retour au Lobby</button>
        </div>
      )}
    </div>
  );
};

export default MatchMastersGame;