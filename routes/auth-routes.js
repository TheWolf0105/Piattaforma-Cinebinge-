const express = require('express');
const crypto = require('crypto');
const db = require('../database/db');
const path = require('path');

const router = express.Router();

// Funzione per hashare le password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Pagina di login
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

// API di login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Prima verifica se l'utente esiste e la password è corretta
  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Errore database' });
      }
      
      if (!row) {
        return res.status(401).json({ success: false, message: 'Credenziali non valide' });
      }
      
      const hashedPassword = hashPassword(password);
      
      if (hashedPassword === row.password) {
        // Ottieni i dati più recenti dell'abbonamento da un'altra query per essere sicuri
        db.get(
          'SELECT id, email, subscription, role, needs_payment, subscription_id, subscription_expiry FROM users WHERE id = ?',
          [row.id],
          (err, freshUserData) => {
            if (err) {
              return res.status(500).json({ error: 'Errore database' });
            }
            
            // Usa i dati più recenti per la sessione
            req.session.user = {
              id: freshUserData.id,
              email: freshUserData.email,
              subscription: freshUserData.subscription,
              subscription_id: freshUserData.subscription_id,
              subscription_expiry: freshUserData.subscription_expiry,
              role: freshUserData.role,
              needsPayment: freshUserData.needs_payment === 1
            };// Salva esplicitamente la sessione
            req.session.save((err) => {
              if (err) {}
              
              res.json({ 
                success: true, 
                message: 'Login effettuato con successo',
                user: {
                  subscription: freshUserData.subscription,
                  needsPayment: freshUserData.needs_payment === 1
                }
              });
            });
          }
        );
      } else {
        res.status(401).json({ success: false, message: 'Credenziali non valide' });
      }
    }
  );
});

// Pagina di registrazione
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
});

// API di registrazione
router.post('/register', (req, res) => {const { email, password, confirmPassword, subscription, needsPayment } = req.body;

  // controlla se i campi richiesti sono presenti
  if (!email || !password || !confirmPassword || !subscription) {return res.status(400).json({
      success: false,
      message: 'Tutti i campi sono obbligatori',
    });
  }

  if (password !== confirmPassword) {return res.status(400).json({
      success: false,
      message: 'Le password non corrispondono',
    });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {return res.status(500).json({
        success: false,
        message: 'Errore database durante il controllo email',
      });
    }

    if (row) {return res.status(400).json({
        success: false,
        message: 'Email già registrata',
      });
    }

    // Hash della password prima di salvarla
    const hashedPassword = hashPassword(password);

    // Aggiungi il flag needsPayment nella sessione se l'utente ha scelto premium
    const subscriptionValue = subscription === 'premium' ? 'base' : subscription;

    db.run(
      'INSERT INTO users (email, password, subscription, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, subscriptionValue, 'user'],
      function (err) {
        if (err) {return res.status(500).json({
            success: false,
            message: 'Errore durante la creazione dell\'account utente',
          });
        }

        // Salva i dati dell'utente nella sessione
        req.session.user = {
          id: this.lastID,
          email,
          subscription: subscriptionValue,
          role: 'user',
          needsPayment: needsPayment || false
        };res.json({
          success: true,
          message: 'Registrazione effettuata con successo',
        });
      }
    );
  });
});

// API di logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Errore durante il logout' });
    }
    
    // Cancella il cookie di sessione
    res.clearCookie('connect.sid');
    
    // Imposta header anti-cache 
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.json({ success: true });
  });
});

module.exports = router;
