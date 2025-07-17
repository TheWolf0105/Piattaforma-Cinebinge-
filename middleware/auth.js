// Middleware per autenticazione
const requireAuth = (req, res, next) => {
  // Aggiungi header anti-caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (!req.session.user) {
    // Per richieste AJAX, restituisci un 401
    if (req.xhr || req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(401).json({ authenticated: false, message: 'Autenticazione richiesta' });
    }
    
    // Per richieste normali, reindirizza
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  
  // Verifica la validità della sessione (potrebbe essere scaduta)
  if (req.session.user) {
    // Aggiorna il timestamp dell'ultima attività (opzionale)
    req.session.lastActivity = Date.now();
  }
  
  next();
};

// Middleware per verificare il ruolo admin
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  next();
};

// Middleware per controllare se l'utente ha l'abbonamento
const requireSubscription = (req, res, next) => {
  if (!req.session.user || req.session.user.subscription !== 'premium') {
    return res.status(403).json({ error: 'Richiesto abbonamento premium' });
  }
  next();
};

// Middleware per controllare se l'utente può vedere un contenuto (abbonamento o noleggio)
const canAccessContent = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }
  
  // Gli utenti con abbonamento possono sempre accedere
  if (req.session.user.subscription === 'premium') {
    return next();
  }
  
  // Per gli utenti senza abbonamento, controlla se hanno noleggiato il film
  const movieId = req.params.id;
  const userId = req.session.user.id;
  
  const db = require('../database/db');
  db.get(
    'SELECT * FROM rentals WHERE user_id = ? AND movie_id = ? AND expiry_date > datetime("now")',
    [userId, movieId],
    (err, rental) => {
      if (err) {
        return res.status(500).json({ error: 'Errore durante la verifica del noleggio' });
      }
      
      if (!rental) {
        return res.status(403).json({ error: 'Contenuto non disponibile. È necessario noleggiare questo contenuto.' });
      }
      
      next();
    }
  );
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireSubscription,
  canAccessContent
};
