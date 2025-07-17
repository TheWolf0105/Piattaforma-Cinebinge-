const express = require('express');
const db = require('../database/db');
const path = require('path');

// Importa i middleware centralizzati
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Rotta per la dashboard
router.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
});

// API per ottenere i dati dell'utente
router.get('/api/user', requireAuth, (req, res) => {
  // Recupera i dati più recenti dal database invece di usare quelli in sessione
  const userId = req.session.user.id;
  
  db.get(
    'SELECT id, email, subscription, role, needs_payment, subscription_id, subscription_expiry FROM users WHERE id = ?',
    [userId],
    (err, userData) => {
      if (err) {
        return res.status(500).json({ error: 'Errore database' });
      }
      
      if (!userData) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }
      
      // Aggiorna anche la sessione con i dati più recenti
      req.session.user = {
        id: userData.id,
        email: userData.email,
        subscription: userData.subscription,
        subscription_id: userData.subscription_id,
        subscription_expiry: userData.subscription_expiry,
        role: userData.role,
        needsPayment: userData.needs_payment === 1
      };
      
      // Salva la sessione aggiornata
      req.session.save((err) => {
        // Invia i dati aggiornati al client
        const responseData = {
          id: userData.id,
          email: userData.email,
          subscription: userData.subscription,
          role: userData.role,
          needsPayment: userData.needs_payment === 1,
          subscription_id: userData.subscription_id,
          subscription_expiry: userData.subscription_expiry
        };
        
        res.json(responseData);
      });
    }
  );
});

// API per controllare lo stato dell'abbonamento
router.get('/api/check-subscription-status', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  
  db.get(
    'SELECT subscription FROM users WHERE id = ?', 
    [userId], 
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Errore database' });
      }
      
      // Considera attivo solo l'abbonamento 'premium'
      const hasActiveSubscription = row && row.subscription === 'premium';
      
      res.json({ 
        hasActiveSubscription: hasActiveSubscription,
        currentSubscription: row ? row.subscription : null
      });
    }
  );
});

// API per ottenere i film noleggiati da un utente
router.get('/api/rentals', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  
  db.all(
    `SELECT r.*, m.title, m.image_path, m.genre, m.type 
     FROM rentals r 
     JOIN movies m ON r.movie_id = m.id 
     WHERE r.user_id = ? 
     AND r.expiry_date > datetime('now')
     ORDER BY r.rental_date DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Errore durante il recupero dei noleggi' });
      }
      
      res.json(rows);
    }
  );
});

// Pagina dei film noleggiati
router.get('/my-rentals', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'my-rentals.html'));
});

// API per aggiornare lo stato del pagamento
router.post('/api/update-payment-status', requireAuth, (req, res) => {
  const { subscription } = req.body;
  const userId = req.session.user.id;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante l\'aggiornamento' 
      });
    }

    db.run(
      'UPDATE users SET subscription = ?, needs_payment = 0 WHERE id = ?', 
      [subscription, userId], 
      function(err) {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Errore durante l\'aggiornamento' 
          });
        }

        // Aggiorna la sessione con tutti i dati dell'utente
        req.session.user = {
          id: user.id,
          email: user.email,
          subscription: subscription,
          role: user.role,
          needsPayment: false
        };

        // Salva esplicitamente la sessione
        req.session.save((saveErr) => {
          res.json({ 
            success: true, 
            message: 'Abbonamento aggiornato con successo' 
          });
        });
      }
    );
  });
});

// API per verificare se l'utente deve completare il pagamento dopo la registrazione
router.get('/api/check-pending-payment', requireAuth, (req, res) => {
  db.get(
    'SELECT needs_payment FROM users WHERE id = ?', 
    [req.session.user.id], 
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Errore database' });
      }
      
      res.json({ 
        needsPayment: row ? row.needs_payment === 1 : false 
      });
    }
  );
});

// API per verificare lo stato della sessione
router.get('/api/check-session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ 
      authenticated: true, 
      user: {
        email: req.session.user.email,
        subscription: req.session.user.subscription
      }
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

module.exports = router;
