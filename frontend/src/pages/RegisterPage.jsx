import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { utilisateurService } from '../services/api';

function RegisterPage() {
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!pseudo || !email || !motDePasse) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    try {
      await utilisateurService.register({ pseudo, email, motDePasse });
      setSuccess('Inscription réussie ! Redirection...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Pseudo déjà utilisé ou erreur serveur');
    }
  };

  return (
    <div className="login-page">
      <h1>Inscription</h1>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        <button type="submit">S'inscrire</button>
      </form>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <p>Déjà inscrit ? <a href="/login">Se connecter</a></p>
    </div>
  );
}

export default RegisterPage;
