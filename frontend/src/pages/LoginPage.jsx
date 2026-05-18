import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { utilisateurService } from '../services/api';

function LoginPage() {
  const [pseudo, setPseudo] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await utilisateurService.login(pseudo, motDePasse);
      // Stocker le token ou l'ID utilisateur
      localStorage.setItem('userId', response.data.id);
      localStorage.setItem('userPseudo', response.data.pseudo);
      navigate('/');
    } catch (err) {
      setError('Pseudo ou mot de passe incorrect');
    }
  };

  return (
    <div className="login-page">
      <h1>Connexion</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        <button type="submit">Se connecter</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>Pas encore inscrit ? <a href="/register">S'inscrire</a></p>
    </div>
  );
}

export default LoginPage;
