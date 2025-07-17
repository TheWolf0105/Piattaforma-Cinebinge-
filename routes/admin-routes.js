const express = require('express');
const db = require('../database/db');
const path = require('path');
const fs = require('fs');

// Importa i middleware centralizzati
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Pagina di gestione admin
router.get('/manage', requireAuth, requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'manage.html'));
});

// API per aggiungere un film (solo admin)
router.post('/api/movies', requireAuth, requireAdmin, (req, res) => {
  const {
    title,
    description,
    genre,
    release_year,
    duration,
    director,
    cast,
    image_path,
    trailer_url,
    rentable,
    rent_price,
    type
  } = req.body;

  if (!title || !description || !genre) {
    return res.status(400).json({ error: 'Titolo, descrizione e genere sono obbligatori' });
  }

  // Converte esplicitamente i valori numerici
  const numericReleaseYear = release_year ? parseInt(release_year) : null;
  const numericDuration = duration ? parseInt(duration) : null;
  const numericRentPrice = rent_price ? parseFloat(rent_price) : 3.99;
  const isRentable = rentable ? 1 : 0;

  // Verifica se la directory dell'immagine esiste
  if (image_path) {
    const imagePath = path.join(__dirname, '..', 'public', image_path);
    const imageDir = path.dirname(imagePath);
    
    if (!fs.existsSync(imageDir)) {
      try {
        fs.mkdirSync(imageDir, { recursive: true });
      } catch (err) {
      }
    }
  }

  db.run(
    `INSERT INTO movies (title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      genre,
      numericReleaseYear,
      numericDuration,
      director || null,
      cast || null,
      image_path || null,
      trailer_url || null,
      isRentable,
      numericRentPrice,
      type || 'movie'
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          error: 'Errore durante l\'aggiunta del film', 
          details: err.message 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Film aggiunto con successo',
        movieId: this.lastID
      });
    }
  );
});

// API per eliminare un film (solo admin)
router.delete('/api/movies/:id', requireAuth, requireAdmin, (req, res) => {
  const movieId = req.params.id;
  db.get('SELECT COUNT(*) as count FROM rentals WHERE movie_id = ? AND expiry_date > datetime("now")', [movieId], (err, result) => {
    if (err) {return res.status(500).json({ error: 'Errore durante la verifica dei noleggi attivi', details: err.message });
    }if (result.count > 0) {
      return res.status(400).json({ error: 'Non è possibile eliminare un film con noleggi attivi' });
    }
    
    // Ottieni i dettagli del film prima di eliminarlo
    db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, movie) => {
      if (err) {
        return res.status(500).json({ error: 'Errore durante il recupero dei dettagli del film' });
      }
      
      // Se non ci sono noleggi attivi, possiamo eliminare il film
      db.run('DELETE FROM movies WHERE id = ?', [movieId], function(err) {
        if (err) {return res.status(500).json({ error: 'Errore durante l\'eliminazione del film', details: err.message });
        }if (this.changes === 0) {
          return res.status(404).json({ error: 'Film non trovato' });
        }
        
        res.json({ 
          success: true, 
          message: 'Film eliminato con successo' 
        });
      });
    });
  });
});

// API per aggiornare un film (solo admin)
router.put('/api/movies/:id', requireAuth, requireAdmin, (req, res) => {
  const movieId = req.params.id;const {
    title,
    description,
    genre,
    release_year,
    duration,
    director,
    cast,
    image_path,
    trailer_url,
    rentable,
    rent_price,
    type
  } = req.body;

  if (!title || !description || !genre) {return res.status(400).json({ error: 'Titolo, descrizione e genere sono obbligatori' });
  }

  // Converte esplicitamente i valori numerici
  const numericReleaseYear = release_year ? parseInt(release_year) : null;
  const numericDuration = duration ? parseInt(duration) : null;
  const numericRentPrice = rent_price ? parseFloat(rent_price) : 3.99;
  const isRentable = rentable ? 1 : 0;

  // Verifica se la directory dell'immagine esiste
  if (image_path) {
    const imagePath = path.join(__dirname, '..', 'public', image_path);
    const imageDir = path.dirname(imagePath);
    
    if (!fs.existsSync(imageDir)) {
      try {
        fs.mkdirSync(imageDir, { recursive: true });} catch (err) {// Non blocchiamo l'aggiornamento del film, continuiamo comunque
      }
    }
  }

  db.run(
    `UPDATE movies SET 
     title = ?,
     description = ?,
     genre = ?,
     release_year = ?,
     duration = ?,
     director = ?,
     cast = ?,
     image_path = ?,
     trailer_url = ?,
     rentable = ?,
     rent_price = ?,
     type = ?
     WHERE id = ?`,
    [
      title,
      description,
      genre,
      numericReleaseYear,
      numericDuration,
      director || null,
      cast || null,
      image_path || null,
      trailer_url || null,
      isRentable,
      numericRentPrice,
      type || 'movie',
      movieId
    ],
    function(err) {
      if (err) {return res.status(500).json({ 
          error: 'Errore durante l\'aggiornamento del film', 
          details: err.message 
        });
      }if (this.changes === 0) {
        return res.status(404).json({ error: 'Film non trovato' });
      }
      
      res.json({ 
        success: true, 
        message: 'Film aggiornato con successo' 
      });
    }
  );
});

module.exports = router;
