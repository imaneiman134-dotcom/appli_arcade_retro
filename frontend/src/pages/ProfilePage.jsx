import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const [userPseudo, setUserPseudo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const pseudo = localStorage.getItem('userPseudo');
    if (!pseudo) {
      navigate('/login');
    } else {
      setUserPseudo(pseudo);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userPseudo');
    navigate('/login');
  };

  return (
    <div className="profile-page">
      <h1>Mon Profil</h1>
      <p>Pseudo: {userPseudo}</p>
      
      <section className="stats">
        <h2>Mes Statistiques</h2>
        <p>Scores à venir...</p>
      </section>

      <button onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}

export default ProfilePage;
