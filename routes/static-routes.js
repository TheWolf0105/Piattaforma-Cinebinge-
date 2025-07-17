const express = require('express');
const path = require('path');

const router = express.Router();

// Pagina principale
router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

// Pagina di ricerca 
router.get('/browse', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'browse.html'));
});

// Aggiunta della nuova rotta per sfoglia 
router.get('/sfoglia', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'browse.html'));
});

// Rotta per la pagina "Chi Siamo"
router.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'about.html'));
});

// Imposta index.html come parte della cartella views
router.get('/views/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

module.exports = router;
