# 🎮 Collection de Jeux Vidéo - API RESTful avec MongoDB

Application complète de gestion de collection de jeux vidéo avec :
- **Backend** : Node.js + Express + MongoDB
- **Frontend** : React + Tailwind CSS
- **Base de données** : MongoDB

## 📋 Prérequis

1. **Node.js** (version 14 ou supérieure)
2. **MongoDB** installé et en cours d'exécution

### Installation de MongoDB

#### Windows
1. Téléchargez MongoDB Community Server : https://www.mongodb.com/try/download/community
2. Installez MongoDB avec les options par défaut
3. MongoDB devrait démarrer automatiquement comme service Windows

Pour démarrer manuellement MongoDB :
```powershell
# Démarrer le service MongoDB
net start MongoDB

# Ou démarrer manuellement
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

## 🚀 Installation du Projet

### Installer toutes les dépendances

```powershell
cd C:\projetsTD\JeuxVideos\game-collection
npm install
```

## ⚙️ Configuration

Le fichier `.env` dans `game-collection` contient la configuration :

```env
MONGODB_URI=mongodb://localhost:27017
PORT=5000
```

## 🏃 Démarrage de l'Application

### Option 1 : Deux terminaux séparés (Recommandé)

**Terminal 1 - Backend :**
```powershell
cd C:\projetsTD\JeuxVideos\game-collection
npm run server
```
Vous devriez voir :
```
✅ Connecté à MongoDB avec succès
🚀 Serveur démarré sur le port 5000
📡 API disponible sur http://localhost:5000/api
```

**Terminal 2 - Frontend :**
```powershell
cd C:\projetsTD\JeuxVideos\game-collection
npm start
```
L'application React s'ouvrira automatiquement sur http://localhost:3000

### Option 2 : Script PowerShell (à créer)

Créez un fichier `start.ps1` dans `game-collection` :
```powershell
# Démarrer le backend en arrière-plan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\projetsTD\JeuxVideos\game-collection; npm run server"

# Attendre 2 secondes
Start-Sleep -Seconds 2

# Démarrer le frontend
npm start
```

## 📡 Endpoints de l'API

### Jeux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/games` | Ajouter un nouveau jeu |
| GET | `/api/games` | Lister tous les jeux (avec filtres optionnels) |
| GET | `/api/games/:id` | Obtenir un jeu spécifique |
| PUT | `/api/games/:id` | Modifier un jeu |
| DELETE | `/api/games/:id` | Supprimer un jeu |
| POST | `/api/games/:id/favorite` | Toggle favoris |

### Autres

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats` | Statistiques de la collection |
| GET | `/api/export` | Exporter toutes les données |
| GET | `/api/health` | Vérifier l'état de l'API |

## 🎯 Exemples d'Utilisation

### Ajouter un jeu (POST /api/games)

```json
{
  "titre": "The Legend of Zelda: Breath of the Wild",
  "genre": ["Action", "Aventure", "RPG"],
  "plateforme": ["Nintendo Switch"],
  "editeur": "Nintendo",
  "developpeur": "Nintendo EPD",
  "annee_sortie": 2017,
  "metacritic_score": 97,
  "temps_jeu_heures": 85,
  "termine": true
}
```

### Rechercher avec filtres (GET /api/games)

```
GET /api/games?genre=RPG
GET /api/games?plateforme=PC
GET /api/games?search=zelda
GET /api/games?favoris=true
```

## 🗂️ Structure du Projet

```
C:\projetsTD\JeuxVideos\
└── game-collection/         # Projet complet (Frontend + Backend)
    ├── server.js           # Serveur Express + MongoDB
    ├── .env                # Configuration
    ├── package.json        # Toutes les dépendances
    ├── src/
    │   ├── App.js         # Interface graphique React
    │   ├── index.js
    │   └── index.css
    ├── public/
    └── tailwind.config.js
```

## 🛠️ Fonctionnalités

✅ **CRUD complet** : Create, Read, Update, Delete
✅ **Validation des données** côté backend
✅ **Recherche et filtrage** par genre, plateforme, texte
✅ **Système de favoris**
✅ **Statistiques** en temps réel
✅ **Export des données** en JSON
✅ **Interface moderne** avec Tailwind CSS
✅ **Persistance** avec MongoDB

## 🔧 Dépannage

### Le frontend ne se connecte pas au backend

1. Vérifiez que le backend est démarré (`npm run server` dans game-collection)
2. Vérifiez que MongoDB est en cours d'exécution
3. Vérifiez que le proxy est configuré dans `package.json` :
   ```json
   "proxy": "http://localhost:5000"
   ```

### Erreur MongoDB

```powershell
# Vérifier si MongoDB est en cours d'exécution
Get-Service MongoDB

# Démarrer MongoDB si nécessaire
net start MongoDB
```

### Port déjà utilisé

Si le port 5000 est déjà utilisé, modifiez `.env` :
```env
PORT=3001
```

## 📊 Validation des Données

Le backend valide automatiquement :

- **titre** : requis, non vide
- **genre** : tableau avec au moins 1 élément
- **plateforme** : tableau avec au moins 1 élément
- **annee_sortie** : entre 1970 et l'année actuelle
- **metacritic_score** : entre 0 et 100
- **temps_jeu_heures** : nombre positif

## 🎨 Technologies Utilisées

- **Backend** : Express.js, MongoDB Driver
- **Frontend** : React 19, Tailwind CSS, Lucide Icons
- **Base de données** : MongoDB
- **Outils** : dotenv, cors

## 📝 Notes

- Les données sont stockées dans la base de données `game_collection_db`
- La collection s'appelle `games`
- Les IDs MongoDB sont automatiquement convertis en format string pour le frontend
- Les dates d'ajout et de modification sont gérées automatiquement

## 🚦 Tester l'API

### Avec PowerShell

```powershell
# Tester la santé de l'API
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get

# Récupérer les statistiques
Invoke-RestMethod -Uri "http://localhost:5000/api/stats" -Method Get

# Ajouter un jeu
$body = @{
    titre = "Elden Ring"
    genre = @("Action", "RPG")
    plateforme = @("PC", "PlayStation 5")
    editeur = "Bandai Namco"
    developpeur = "FromSoftware"
    annee_sortie = 2022
    metacritic_score = 96
    temps_jeu_heures = 120
    termine = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/games" -Method Post -Body $body -ContentType "application/json"
```

## 🎓 Exercice Complété

✅ Configuration initiale Node.js/Express
✅ Connexion à MongoDB
✅ Tous les endpoints CRUD implémentés
✅ Validation des données
✅ Recherche et filtrage avancés
✅ Statistiques
✅ Système de favoris
✅ Export des données
✅ Interface graphique React complète
✅ Gestion des erreurs
✅ Bonnes pratiques REST

## 📞 Support

En cas de problème, vérifiez :
1. MongoDB est démarré
2. Les dépendances sont installées (`npm install`)
3. Le fichier `.env` existe
4. Les deux serveurs (backend + frontend) sont lancés
