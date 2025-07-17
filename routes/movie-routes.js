const express = require('express');
const db = require('../database/db');
const path = require('path');
const fs = require('fs');

// Importa i middleware centralizzati
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// API per ottenere i film
router.get('/api/movies', (req, res) => {
  const { genre, type, search, year, q } = req.query;let query = 'SELECT * FROM movies';
  let params = [];
  let conditions = [];
  
  // Costruisci la query in base ai parametri
  if (genre) {
    conditions.push('genre = ?');
    params.push(genre);
  }
  
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  
  if (year && !isNaN(parseInt(year))) {
    conditions.push('release_year = ?');
    params.push(parseInt(year));
  }
  
  // Se ci sono condizioni, aggiungile alla query
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  // Ordina per anno di uscita decrescente
  query += ' ORDER BY release_year DESC';
  
  // Esegui la query
  db.all(query, params, (err, movies) => {
    if (err) {return res.status(500).json({ error: 'Errore database', details: err.message });
    }
    
    // Se c'è un termine di ricerca, filtra ulteriormente i risultati in JavaScript
    let results = movies;
    
    // Usa search o q se disponibile (per supportare entrambi i formati)
    const searchTerm = search || q;
    
    if (searchTerm && typeof searchTerm === 'string') {const searchLower = searchTerm.toLowerCase();
      results = results.filter(movie => 
        (movie.title && movie.title.toLowerCase().includes(searchLower)) ||
        (movie.description && movie.description.toLowerCase().includes(searchLower)) ||
        (movie.cast && movie.cast.toLowerCase().includes(searchLower)) ||
        (movie.director && movie.director.toLowerCase().includes(searchLower))
      );
      
      // Limita i risultati per i suggerimenti di ricerca
      if (!genre && !type && !year && results.length > 10) {
        results = results.slice(0, 10);
      }
    }res.json(results);
  });
});

// API per ottenere un film specifico
router.get('/api/movies/:id', (req, res) => {
  db.get('SELECT * FROM movies WHERE id = ?', [req.params.id], (err, movie) => {
    if (err) {
      return res.status(500).json({ error: 'Errore durante il recupero del film' });
    }
    
    if (!movie) {
      return res.status(404).json({ error: 'Film non trovato' });
    }
    
    res.json(movie);
  });
});

// API per ottenere i generi disponibili
router.get('/api/genres', (req, res) => {
  db.all('SELECT DISTINCT genre FROM movies ORDER BY genre', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Errore durante il recupero dei generi' });
    }
    
    const genres = rows.map(row => row.genre);
    res.json(genres);
  });
});

// API per ottenere gli anni disponibili
router.get('/api/years', (req, res) => {
  db.all('SELECT DISTINCT release_year FROM movies ORDER BY release_year DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Errore durante il recupero degli anni' });
    }
    
    const years = rows.map(row => row.release_year);
    res.json(years);
  });
});

// API per noleggiare un film
router.post('/api/rent/:id', requireAuth, (req, res) => {
  const movieId = req.params.id;
  const userId = req.session.user.id;
  
  // Controlla se l'utente ha già l'abbonamento
  if (req.session.user.subscription === 'premium') {
    return res.status(400).json({ error: 'Gli utenti con abbonamento hanno già accesso a tutti i contenuti' });
  }
  
  // Controlla se il film è disponibile per il noleggio
  db.get('SELECT * FROM movies WHERE id = ? AND rentable = 1', [movieId], (err, movie) => {
    if (err) {
      return res.status(500).json({ error: 'Errore durante la verifica del film' });
    }
    
    if (!movie) {
      return res.status(404).json({ error: 'Film non disponibile per il noleggio' });
    }
    
    // Controlla se l'utente ha già noleggiato questo film
    db.get(
      'SELECT * FROM rentals WHERE user_id = ? AND movie_id = ? AND expiry_date > datetime("now")',
      [userId, movieId],
      (err, existingRental) => {
        if (err) {
          return res.status(500).json({ error: 'Errore durante la verifica del noleggio esistente' });
        }
        
        if (existingRental) {
          return res.status(400).json({ error: 'Hai già noleggiato questo film' });
        }
        
        // Date per il noleggio (48 ore)
        const rentalDate = new Date();
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 48);
        
        // Crea il noleggio
        db.run(
          'INSERT INTO rentals (user_id, movie_id, rental_date, expiry_date) VALUES (?, ?, ?, ?)',
          [userId, movieId, rentalDate.toISOString(), expiryDate.toISOString()],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'Errore durante la creazione del noleggio' });
            }
            
            res.json({
              success: true,
              message: `Hai noleggiato "${movie.title}" con successo! Puoi guardarlo per le prossime 48 ore.`,
              rental: {
                id: this.lastID,
                movieId,
                title: movie.title,
                rentalDate: rentalDate.toISOString(),
                expiryDate: expiryDate.toISOString()
              }
            });
          }
        );
      }
    );
  });
});

// Verifica se un utente può guardare un film
router.get('/api/can-watch/:id', requireAuth, (req, res) => {
  const movieId = req.params.id;
  const userId = req.session.user.id;
  
  // IMPORTANT: Gli utenti abbonati possono sempre guardare
  if (req.session.user.subscription === 'premium') {return res.json({ 
      canWatch: true, 
      reason: 'subscription',
      userSubscription: req.session.user.subscription 
    });
  }// Controlla se l'utente ha noleggiato il film
  db.get(
    'SELECT * FROM rentals WHERE user_id = ? AND movie_id = ? AND expiry_date > datetime("now")',
    [userId, movieId],
    (err, rental) => {
      if (err) {return res.status(500).json({ error: 'Errore durante la verifica del noleggio' });
      }
      
      if (rental) {// Calcola il tempo rimanente in ore
        const expiryDate = new Date(rental.expiry_date);
        const now = new Date();
        const hoursLeft = Math.round((expiryDate - now) / (1000 * 60 * 60));
        
        return res.json({
          canWatch: true,
          reason: 'rental',
          expiryDate: rental.expiry_date,
          hoursLeft
        });
      } else {return res.json({ 
          canWatch: false,
          userSubscription: req.session.user.subscription,
          message: 'No active subscription or rental found' 
        });
      }
    }
  );
});

// Pagina di dettaglio del film
router.get('/movie/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'movie-detail.html'));
});

// Pagina per guardare il film 
router.get('/watch/:id', requireAuth, (req, res) => {res.sendFile(path.join(__dirname, '..', 'views', 'watch.html'));
});

// Rotta di test che restituisce dati hardcoded
router.get('/api/movies-test', (req, res) => {
  const testMovies = [
    {
      id: 1,
      title: "Test Movie 1",
      description: "Test description",
      genre: "azione",
      release_year: 2022,
      type: "movie",
      image_path: "/placeholder.jpg"
    },
    {
      id: 2,
      title: "Test Movie 2",
      description: "Another test",
      genre: "commedia",
      release_year: 2023,
      type: "movie",
      image_path: "/placeholder.jpg"
    }
  ];
  
  res.json(testMovies);
});

module.exports = router;
