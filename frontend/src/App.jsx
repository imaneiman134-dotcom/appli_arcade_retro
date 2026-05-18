import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import LobbyPage from './pages/LobbyPage';
import TicTacToeGame from './pages/games/TicTacToeGame';
import Connect4Game from './pages/games/Connect4Game';
import BattleshipGame from './pages/games/BattleshipGame';
import BrawlbotsGame from './pages/games/BrawlbotsGame';
import MatchMastersGame from './pages/games/MatchMastersGame';
import AsteroidDuelGame from './pages/games/AsteroidDuelGame';
import './App.css';

function NavBar() {
  const navigate = useNavigate();
  const userPseudo = localStorage.getItem('userPseudo');
  const handleLogout = () => {
    localStorage.removeItem('userPseudo');
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    navigate('/');
    window.location.reload();
  };
  return (
    <header className="app-header">
      <h1>Arcade Rétro Multijoueur</h1>
      <nav>
        <Link to="/">Accueil</Link>
        {userPseudo ? (
          <>
            <Link to="/lobby">Lobby</Link>
            <Link to="/profile">{userPseudo}</Link>
            <button className="nav-btn" onClick={handleLogout}>Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/login">Connexion</Link>
            <Link to="/register">S'inscrire</Link>
          </>
        )}
      </nav>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <NavBar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/game/tictactoe/:jeuId" element={<TicTacToeGame />} />
            <Route path="/game/connect4/:jeuId" element={<Connect4Game />} />
            <Route path="/game/battleship/:jeuId" element={<BattleshipGame />} />
            <Route path="/game/brawlbots/:jeuId" element={<BrawlbotsGame />} />
            <Route path="/game/matchmasters/:jeuId" element={<MatchMastersGame />} />
            <Route path="/game/asteroid/:jeuId" element={<AsteroidDuelGame />} />
          </Routes>
        </main>
        <footer className="app-footer"><p>Arcade Rétro - Multijoueur</p></footer>
      </div>
    </Router>
  );
}

export default App;
