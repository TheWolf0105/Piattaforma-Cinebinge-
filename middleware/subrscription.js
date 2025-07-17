const db = require('../database/db');

// Middleware per controllare se l'utente ha un abbonamento attivo
const hasActiveSubscription = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      error: 'Autenticazione richiesta',
      success: false 
    });
  }
  
  // Controlla se l'utente ha un abbonamento
  db.get(
    'SELECT subscription_id, subscription, subscription_expiry FROM users WHERE id = ?',
    [req.session.user.id],
    (err, user) => {
      if (err) {
        console.error('Database error in hasActiveSubscription:', err);
        return res.status(500).json({ 
          error: 'Errore durante la verifica dell\'abbonamento',
          success: false 
        });
      }
      
      if (!user) {
        return res.status(404).json({ 
          error: 'Utente non trovato',
          success: false 
        });
      }
      
      // Controlla se l'utente ha un abbonamento attivo
      if (user.subscription === 'base' || !user.subscription_id) {
        return res.status(403).json({ 
          error: 'Abbonamento richiesto', 
          message: 'Per accedere a questo contenuto è richiesto un abbonamento Premium',
          success: false
        });
      }
      
      // Controlla se l'abbonamento è scaduto
      if (user.subscription_expiry) {
        const expiryDate = new Date(user.subscription_expiry);
        const now = new Date();
        
        if (expiryDate < now) {
          return res.status(403).json({ 
            error: 'Abbonamento scaduto', 
            message: 'Il tuo abbonamento è scaduto. Rinnova per continuare ad accedere ai contenuti Premium',
            success: false
          });
        }
      }
      
      // Se l'abbonamento è valido, continua
      req.subscription = {
        id: user.subscription_id,
        type: user.subscription,
        expiry: user.subscription_expiry,
        success: true
      };
      next();
    }
  );
};

// Middleware per controllare se un contenuto richiede un abbonamento premium
const checkContentAccess = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }
  
  const movieId = req.params.id;
  
  // Recupera le informazioni sul film/serie
  db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      return res.status(500).json({ error: 'Errore durante il recupero del contenuto' });
    }
    
    if (!movie) {
      return res.status(404).json({ error: 'Contenuto non trovato' });
    }
    
    // Controlla se il contenuto richiede un abbonamento premium
    if (movie.subscription_required === 'premium') {
      // Controlla se l'utente ha un abbonamento premium
      if (req.session.user.subscription !== 'premium') {
        // Controlla se l'utente ha noleggiato il film
        db.get(
          'SELECT * FROM rentals WHERE user_id = ? AND movie_id = ? AND expiry_date > datetime("now")',
          [req.session.user.id, movieId],
          (err, rental) => {
            if (err) {
              return res.status(500).json({ error: 'Errore durante la verifica del noleggio' });
            }
            
            if (!rental) {
              return res.status(403).json({ 
                error: 'Accesso negato', 
                message: 'Questo contenuto richiede un abbonamento Premium o un noleggio'
              });
            }
            
            // L'utente ha noleggiato il film, può accedere
            next();
          }
        );
      } else {
        // L'utente ha un abbonamento premium, può accedere
        next();
      }
    } else {
      // Il contenuto è disponibile per tutti gli utenti
      next();
    }
  });
};

module.exports = {
  hasActiveSubscription,
  checkContentAccess
};