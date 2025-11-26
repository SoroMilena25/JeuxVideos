const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "game_collection_db";
const COLLECTION_NAME = "games";

let db;
let gamesCollection;

// Connexion à MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connecté à MongoDB avec succès');
    
    db = client.db(DB_NAME);
    gamesCollection = db.collection(COLLECTION_NAME);
    
    // Créer des index pour améliorer les performances
    await gamesCollection.createIndex({ titre: 1 });
    await gamesCollection.createIndex({ genre: 1 });
    await gamesCollection.createIndex({ plateforme: 1 });
    await gamesCollection.createIndex({ favoris: 1 });
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
}

// Fonction de validation des données
function validateGame(gameData) {
  const errors = {};
  
  if (!gameData.titre || gameData.titre.trim().length === 0) {
    errors.titre = 'Le titre est requis';
  }
  
  if (!Array.isArray(gameData.genre) || gameData.genre.length === 0) {
    errors.genre = 'Au moins un genre est requis';
  }
  
  if (!Array.isArray(gameData.plateforme) || gameData.plateforme.length === 0) {
    errors.plateforme = 'Au moins une plateforme est requise';
  }
  
  const currentYear = new Date().getFullYear();
  if (gameData.annee_sortie < 1970 || gameData.annee_sortie > currentYear) {
    errors.annee_sortie = `L'année doit être entre 1970 et ${currentYear}`;
  }
  
  if (gameData.metacritic_score < 0 || gameData.metacritic_score > 100) {
    errors.metacritic_score = 'Le score doit être entre 0 et 100';
  }
  
  if (gameData.temps_jeu_heures < 0) {
    errors.temps_jeu_heures = 'Le temps de jeu doit être positif';
  }
  
  return errors;
}

// ==================== ROUTES API ====================

// POST /api/games - Ajouter un nouveau jeu
app.post('/api/games', async (req, res) => {
  try {
    const gameData = req.body;
    
    // Validation
    const validationErrors = validateGame(gameData);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
    
    // Préparer le document
    const newGame = {
      ...gameData,
      date_ajout: new Date(),
      date_modification: new Date(),
      favoris: gameData.favoris || false
    };
    
    // Insérer dans MongoDB
    const result = await gamesCollection.insertOne(newGame);
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newGame
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du jeu:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'ajout du jeu'
    });
  }
});

// GET /api/games - Lister tous les jeux avec filtres
app.get('/api/games', async (req, res) => {
  try {
    const { genre, plateforme, search, favoris } = req.query;
    
    // Construire le filtre
    const filter = {};
    
    if (genre) {
      filter.genre = genre;
    }
    
    if (plateforme) {
      filter.plateforme = plateforme;
    }
    
    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { editeur: { $regex: search, $options: 'i' } },
        { developpeur: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (favoris === 'true') {
      filter.favoris = true;
    }
    
    // Récupérer les jeux
    const games = await gamesCollection.find(filter).toArray();
    
    // Transformer _id en id pour le frontend
    const formattedGames = games.map(game => ({
      ...game,
      id: game._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedGames,
      count: formattedGames.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des jeux:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des jeux'
    });
  }
});

// GET /api/games/:id - Obtenir un jeu spécifique
app.get('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide'
      });
    }
    
    const game = await gamesCollection.findOne({ _id: new ObjectId(id) });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Jeu non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...game,
        id: game._id.toString(),
        _id: undefined
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du jeu:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du jeu'
    });
  }
});

// PUT /api/games/:id - Modifier un jeu
app.put('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gameData = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide'
      });
    }
    
    // Validation
    const validationErrors = validateGame(gameData);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
    
    // Mettre à jour
    const updateData = {
      ...gameData,
      date_modification: new Date()
    };
    
    const result = await gamesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Jeu non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Jeu mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la modification du jeu:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la modification du jeu'
    });
  }
});

// DELETE /api/games/:id - Supprimer un jeu
app.delete('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide'
      });
    }
    
    const result = await gamesCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Jeu non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Jeu supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du jeu:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du jeu'
    });
  }
});

// POST /api/games/:id/favorite - Toggle favoris
app.post('/api/games/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide'
      });
    }
    
    const game = await gamesCollection.findOne({ _id: new ObjectId(id) });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Jeu non trouvé'
      });
    }
    
    const result = await gamesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { favoris: !game.favoris, date_modification: new Date() } }
    );
    
    res.json({
      success: true,
      favoris: !game.favoris
    });
  } catch (error) {
    console.error('Erreur lors du toggle favoris:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du toggle favoris'
    });
  }
});

// GET /api/stats - Statistiques
app.get('/api/stats', async (req, res) => {
  try {
    const totalGames = await gamesCollection.countDocuments();
    const finishedGames = await gamesCollection.countDocuments({ termine: true });
    const favoriteGames = await gamesCollection.countDocuments({ favoris: true });
    
    // Calculer le temps total et score moyen
    const games = await gamesCollection.find().toArray();
    const totalHours = games.reduce((acc, game) => acc + (game.temps_jeu_heures || 0), 0);
    const avgScore = games.length > 0
      ? (games.reduce((acc, game) => acc + (game.metacritic_score || 0), 0) / games.length).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      data: {
        total_jeux: totalGames,
        jeux_termines: finishedGames,
        temps_total_heures: totalHours,
        score_moyen: parseFloat(avgScore),
        favoris: favoriteGames
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des stats'
    });
  }
});

// GET /api/games/export - Export des données
app.get('/api/export', async (req, res) => {
  try {
    const games = await gamesCollection.find().toArray();
    
    const formattedGames = games.map(game => ({
      ...game,
      id: game._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedGames,
      exportDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'export'
    });
  }
});

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API opérationnelle',
    database: db ? 'Connectée' : 'Déconnectée'
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
  });
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n⏹️  Arrêt du serveur...');
  process.exit(0);
});
