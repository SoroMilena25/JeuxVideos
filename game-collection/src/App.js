import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, BarChart3, Download, Star } from 'lucide-react';

// Configuration de l'API
const API_URL = '/api';

const GameCollectionAPI = () => {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_jeux: 0,
    jeux_termines: 0,
    temps_total_heures: 0,
    score_moyen: 0,
    favoris: 0
  });

  const [formData, setFormData] = useState({
    titre: '',
    genre: [],
    plateforme: [],
    editeur: '',
    developpeur: '',
    annee_sortie: new Date().getFullYear(),
    metacritic_score: 0,
    temps_jeu_heures: 0,
    termine: false
  });

  const [errors, setErrors] = useState({});

  const genresDisponibles = ['Action', 'Aventure', 'RPG', 'Stratégie', 'FPS', 'Sport', 'Course', 'Puzzle', 'Simulation'];
  const plateformesDisponibles = ['PC', 'PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'];

  // Charger les jeux au démarrage
  useEffect(() => {
    loadGames();
    loadStats();
  }, []);

  // Appliquer les filtres localement
  useEffect(() => {
    let result = games;

    if (searchTerm) {
      result = result.filter(game => 
        game.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.editeur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.developpeur.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterGenre) {
      result = result.filter(game => game.genre.includes(filterGenre));
    }

    if (filterPlatform) {
      result = result.filter(game => game.plateforme.includes(filterPlatform));
    }

    setFilteredGames(result);
  }, [games, searchTerm, filterGenre, filterPlatform]);

  // ==================== API CALLS ====================

  // Charger tous les jeux
  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/games`);
      const data = await response.json();
      
      if (data.success) {
        setGames(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des jeux:', error);
      alert('Erreur de connexion au serveur. Assurez-vous que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  // Ajouter un jeu
  const addGame = async (gameData) => {
    try {
      const response = await fetch(`${API_URL}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      });

      const data = await response.json();

      if (data.success) {
        await loadGames();
        await loadStats();
        setErrors({});
        return { success: true };
      } else {
        setErrors(data.errors || {});
        return { success: false, errors: data.errors };
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du jeu:', error);
      alert('Erreur de connexion au serveur');
      return { success: false };
    }
  };

  // Modifier un jeu
  const updateGame = async (id, gameData) => {
    try {
      const response = await fetch(`${API_URL}/games/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      });

      const data = await response.json();

      if (data.success) {
        await loadGames();
        await loadStats();
        setErrors({});
        return { success: true };
      } else {
        setErrors(data.errors || {});
        return { success: false, errors: data.errors };
      }
    } catch (error) {
      console.error('Erreur lors de la modification du jeu:', error);
      alert('Erreur de connexion au serveur');
      return { success: false };
    }
  };

  // Supprimer un jeu
  const deleteGame = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/games/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadGames();
        await loadStats();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du jeu:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  // Toggle favoris
  const toggleFavorite = async (id) => {
    try {
      const response = await fetch(`${API_URL}/games/${id}/favorite`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        await loadGames();
        await loadStats();
      }
    } catch (error) {
      console.error('Erreur lors du toggle favoris:', error);
    }
  };

  // Export des données
  const exportData = async () => {
    try {
      const response = await fetch(`${API_URL}/export`);
      const data = await response.json();
      
      if (data.success) {
        const dataStr = JSON.stringify(data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `collection_jeux_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  // ==================== HANDLERS ====================

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let result;
    if (editingGame) {
      result = await updateGame(editingGame.id, formData);
    } else {
      result = await addGame(formData);
    }

    if (result.success) {
      setShowForm(false);
      setEditingGame(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      genre: [],
      plateforme: [],
      editeur: '',
      developpeur: '',
      annee_sortie: new Date().getFullYear(),
      metacritic_score: 0,
      temps_jeu_heures: 0,
      termine: false
    });
    setErrors({});
  };

  const handleEdit = (game) => {
    setEditingGame(game);
    setFormData({
      titre: game.titre,
      genre: game.genre,
      plateforme: game.plateforme,
      editeur: game.editeur,
      developpeur: game.developpeur,
      annee_sortie: game.annee_sortie,
      metacritic_score: game.metacritic_score,
      temps_jeu_heures: game.temps_jeu_heures,
      termine: game.termine
    });
    setShowForm(true);
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // ==================== RENDER ====================

  if (loading && games.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Collection de Jeux Vidéo</h1>
          <p className="text-white/80">API RESTful avec MongoDB - Gestion de collection</p>
        </div>

        {/* Actions principales */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => { setShowForm(!showForm); setEditingGame(null); resetForm(); }}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <Plus size={20} />
            Ajouter un jeu
          </button>
          <button
            onClick={() => { setShowStats(!showStats); if (!showStats) loadStats(); }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <BarChart3 size={20} />
            Statistiques
          </button>
          <button
            onClick={exportData}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <Download size={20} />
            Exporter
          </button>
        </div>

        {/* Statistiques */}
        {showStats && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Statistiques</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-white">{stats.total_jeux}</div>
                <div className="text-white/70 text-sm">Total jeux</div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-400">{stats.jeux_termines}</div>
                <div className="text-white/70 text-sm">Terminés</div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.temps_total_heures}h</div>
                <div className="text-white/70 text-sm">Temps total</div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.score_moyen}</div>
                <div className="text-white/70 text-sm">Score moyen</div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-pink-400">{stats.favoris}</div>
                <div className="text-white/70 text-sm">Favoris</div>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingGame ? '✏️ Modifier' : '➕ Nouveau jeu'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Titre *</label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/50 placeholder-white/50"
                  />
                  {errors.titre && <p className="text-red-400 text-sm mt-1">{errors.titre}</p>}
                </div>

                <div>
                  <label className="block text-white mb-2">Éditeur</label>
                  <input
                    type="text"
                    value={formData.editeur}
                    onChange={(e) => setFormData({ ...formData, editeur: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/50 placeholder-white/50"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Développeur</label>
                  <input
                    type="text"
                    value={formData.developpeur}
                    onChange={(e) => setFormData({ ...formData, developpeur: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/50 placeholder-white/50"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Année de sortie</label>
                  <input
                    type="number"
                    value={formData.annee_sortie}
                    onChange={(e) => setFormData({ ...formData, annee_sortie: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/50"
                  />
                  {errors.annee_sortie && <p className="text-red-400 text-sm mt-1">{errors.annee_sortie}</p>}
                </div>

                <div>
                  <label className="block text-white mb-2">Score Metacritic (0-100)</label>
                  <input
                    type="number"
                    value={formData.metacritic_score}
                    onChange={(e) => setFormData({ ...formData, metacritic_score: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/50"
                  />
                  {errors.metacritic_score && <p className="text-red-400 text-sm mt-1">{errors.metacritic_score}</p>}
                </div>

                <div>
                  <label className="block text-white mb-2">Temps de jeu (heures)</label>
                  <input
                    type="number"
                    value={formData.temps_jeu_heures}
                    onChange={(e) => setFormData({ ...formData, temps_jeu_heures: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/50"
                  />
                  {errors.temps_jeu_heures && <p className="text-red-400 text-sm mt-1">{errors.temps_jeu_heures}</p>}
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">Genres *</label>
                <div className="flex flex-wrap gap-2">
                  {genresDisponibles.map(genre => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleArrayChange('genre', genre)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        formData.genre.includes(genre)
                          ? 'bg-green-500 text-white'
                          : 'bg-white/20 text-white/70 hover:bg-white/30'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                {errors.genre && <p className="text-red-400 text-sm mt-1">{errors.genre}</p>}
              </div>

              <div>
                <label className="block text-white mb-2">Plateformes *</label>
                <div className="flex flex-wrap gap-2">
                  {plateformesDisponibles.map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => handleArrayChange('plateforme', platform)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        formData.plateforme.includes(platform)
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/20 text-white/70 hover:bg-white/30'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
                {errors.plateforme && <p className="text-red-400 text-sm mt-1">{errors.plateforme}</p>}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.termine}
                  onChange={(e) => setFormData({ ...formData, termine: e.target.checked })}
                  className="w-5 h-5"
                />
                <label className="text-white">Jeu terminé</label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg transition-all"
                >
                  {editingGame ? 'Mettre à jour' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingGame(null); resetForm(); }}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-white/50" size={20} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/50 placeholder-white/50"
              />
            </div>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/50"
            >
              <option value="">Tous les genres</option>
              {genresDisponibles.map(genre => (
                <option key={genre} value={genre} className="bg-gray-800">{genre}</option>
              ))}
            </select>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white/50"
            >
              <option value="">Toutes les plateformes</option>
              {plateformesDisponibles.map(platform => (
                <option key={platform} value={platform} className="bg-gray-800">{platform}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des jeux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map(game => (
            <div key={game.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white flex-1">{game.titre}</h3>
                <button
                  onClick={() => toggleFavorite(game.id)}
                  className="ml-2"
                >
                  <Star
                    size={24}
                    className={game.favoris ? 'text-yellow-400 fill-yellow-400' : 'text-white/50'}
                  />
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-white/80 text-sm">
                  <span className="font-semibold">Éditeur:</span> {game.editeur}
                </p>
                <p className="text-white/80 text-sm">
                  <span className="font-semibold">Développeur:</span> {game.developpeur}
                </p>
                <p className="text-white/80 text-sm">
                  <span className="font-semibold">Année:</span> {game.annee_sortie}
                </p>
                <div className="flex flex-wrap gap-1">
                  {game.genre.map(g => (
                    <span key={g} className="px-2 py-1 bg-green-500/30 text-green-200 rounded text-xs">
                      {g}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {game.plateforme.map(p => (
                    <span key={p} className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-xs">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 p-2 rounded text-center">
                  <div className="text-yellow-400 font-bold">{game.metacritic_score}</div>
                  <div className="text-white/60 text-xs">Score</div>
                </div>
                <div className="bg-white/5 p-2 rounded text-center">
                  <div className="text-blue-400 font-bold">{game.temps_jeu_heures}h</div>
                  <div className="text-white/60 text-xs">Temps</div>
                </div>
              </div>

              {game.termine && (
                <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded text-sm mb-4 text-center">
                  ✓ Terminé
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(game)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Edit2 size={16} />
                  Modifier
                </button>
                <button
                  onClick={() => deleteGame(game.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <p className="text-white/60 text-lg">Aucun jeu dans la collection</p>
            <p className="text-white/40 text-sm mt-2">Commencez par ajouter votre premier jeu !</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCollectionAPI;
