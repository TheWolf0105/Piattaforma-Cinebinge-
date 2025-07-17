const express = require('express');
const router = express.Router();
const path = require('path');
const SubscriptionController = require('../controllers/subscription-controller');
const db = require('../database/db');

// Middleware di autenticazione direttamente qui
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// API per ottenere i dettagli di un abbonamento
router.get('/api/subscriptions', requireAuth, (req, res) => {
  SubscriptionController.getAllSubscriptions((err, subscriptions) => {
    if (err) {return res.status(500).json({ error: 'Errore durante il recupero dei piani di abbonamento' });
    }
    
    // Rimuovi l'abbonamento base dall'elenco
    const availablePlans = subscriptions.filter(sub => sub.name !== 'base');
    
    res.json(availablePlans);
  });
});

// Pagina di selezione abbonamento
router.get('/plans', requireAuth, (req, res) => {
  // Recupera tutti gli abbonamenti disponibili
  SubscriptionController.getAllSubscriptions((err, subscriptions) => {
    if (err) {return res.status(500).send('Errore durante il recupero dei piani di abbonamento');
    }
    
    // Usa sendFile per inviare un file HTML statico
    res.sendFile(path.join(__dirname, '..', 'views', 'subscription', 'plans.html'));
  });
});

// Rotta specifica per l'abbonamento premium PRIMA della rotta parametrizzata
router.get('/checkout/premium', requireAuth, (req, res) => {
  // Recupera l'ID dell'abbonamento premium
  SubscriptionController.getSubscriptionByName('premium', (err, subscription) => {
    if (err) {
      return res.status(404).send('Abbonamento premium non trovato (errore)');
    }
    
    if (!subscription) {// Se l'abbonamento premium non esiste, inizializza la tabella
      SubscriptionController.initializeSubscriptionsTable((err) => {
        if (err) {
          return res.status(500).send('Errore durante l\'inizializzazione degli abbonamenti');
        }
        
        // Riprova a ottenere l'abbonamento premium
        SubscriptionController.getSubscriptionByName('premium', (err, subscription) => {
          if (err || !subscription) {
            return res.status(404).send('Abbonamento premium non trovato anche dopo inizializzazione');
          }const redirectUrl = `/subscription/checkout/${subscription.id}`;res.redirect(redirectUrl);
        });
      });
      return;
    }const redirectUrl = `/subscription/checkout/${subscription.id}`;// Reindirizza alla pagina di checkout con l'ID corretto
    res.redirect(redirectUrl);
  });
});

// Pagina di pagamento per un abbonamento specifico
router.get('/checkout/:id', requireAuth, (req, res) => {
  const subscriptionId = req.params.id;
  const userId = req.session.user.id;
  
  // Prima verifica se l'utente ha già un abbonamento attivo
  db.get('SELECT subscription, subscription_expiry FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).send(`Errore durante la verifica dell'abbonamento: ${err.message}`);
    }
    
    // Controlla se l'utente ha già un abbonamento attivo
    if (user && user.subscription && user.subscription !== 'base') {
      const expiryDate = new Date(user.subscription_expiry);
      const now = new Date();
      
      // Se l'abbonamento è ancora valido, reindirizza alla dashboard
      if (expiryDate > now) {
        return res.redirect('/dashboard?message=Hai già un abbonamento attivo');
      }
    }
    
    // Se non ha un abbonamento attivo, procedi con il checkout
    // Recupera i dettagli dell'abbonamento
    SubscriptionController.getSubscriptionById(subscriptionId, (err, subscription) => {
      if (err) {
        return res.status(500).send(`Errore durante il recupero dell'abbonamento: ${err.message}`);
      }
      
      if (!subscription) {
        return res.status(404).send('Abbonamento non trovato');
      }
      
      // Invia la pagina di pagamento
      res.sendFile(path.join(__dirname, '..', 'views', 'subscription', 'payment.html'));
    });
  });
});

// Elaborazione del pagamento
router.post('/process-payment', requireAuth, (req, res) => {
  const { subscriptionType, subscriptionId } = req.body;
  const userId = req.session.user.id;
  
  // Prima verifica se l'utente ha già un abbonamento attivo
  db.get('SELECT subscription, subscription_expiry FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: `Errore durante la verifica dell'abbonamento: ${err.message}` 
      });
    }
    
    // Controlla se l'utente ha già un abbonamento attivo
    if (user && user.subscription && user.subscription !== 'base') {
      const expiryDate = new Date(user.subscription_expiry);
      const now = new Date();
      
      // Se l'abbonamento è ancora valido, impedisci il doppio pagamento
      if (expiryDate > now) {
        return res.status(400).json({
          success: false,
          message: 'Hai già un abbonamento attivo. Non puoi acquistare un altro abbonamento.'
        });
      }
    }
    
    // Se non ha un abbonamento attivo, procedi con il pagamento
    // Determina l'ID dell'abbonamento
    const getSubscription = (callback) => {
      if (subscriptionId) {
        SubscriptionController.getSubscriptionById(subscriptionId, callback);
      } else if (subscriptionType) {
        SubscriptionController.getSubscriptionByName(subscriptionType, callback);
      } else {
        callback(new Error('Dati di abbonamento mancanti'), null);
      }
    };
    
    // Verifica che l'abbonamento esista
    getSubscription((err, subscription) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: `Errore durante la verifica dell'abbonamento: ${err.message}` 
        });
      }
      
      if (!subscription) {
        return res.status(404).json({ 
          success: false, 
          message: 'Abbonamento non trovato' 
        });
      }// Genera un ID di transazione simulato
    const transactionId = 'TRX' + Date.now() + Math.floor(Math.random() * 1000);
    
    // Calcola la data di scadenza dell'abbonamento
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + subscription.duration_days);
    const expiryDateStr = expiryDate.toISOString();
    
    // Avvia una transazione per garantire l'integrità dei dati
    db.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) {return res.status(500).json({ 
          success: false, 
          message: 'Errore durante l\'elaborazione del pagamento' 
        });
      }
      
      // Aggiorna l'utente con le informazioni dell'abbonamento
      db.run(
        'UPDATE users SET subscription = ?, subscription_id = ?, subscription_expiry = ?, needs_payment = 0 WHERE id = ?',
        [subscription.name, subscription.id, expiryDateStr, userId],
        (updateErr) => {
          if (updateErr) {db.run('ROLLBACK');
            return res.status(500).json({ 
              success: false, 
              message: `Errore durante l'aggiornamento dell'utente: ${updateErr.message}` 
            });
          }
          
          // Ora registra il pagamento
          const paymentDate = new Date().toISOString();
          
          db.run(
            `INSERT INTO payments (
              user_id, 
              subscription_id, 
              amount, 
              payment_date, 
              payment_method, 
              transaction_id, 
              status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              userId, 
              subscription.id, 
              subscription.price, 
              paymentDate, 
              req.body.paymentMethod || 'card', 
              transactionId, 
              'completed'
            ],
            (paymentErr) => {
              if (paymentErr) {db.run('ROLLBACK');
                return res.status(500).json({ 
                  success: false, 
                  message: `Errore durante la registrazione del pagamento: ${paymentErr.message}` 
                });
              }
              
              // Commit della transazione
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {return res.status(500).json({ 
                    success: false, 
                    message: 'Errore durante il completamento del pagamento' 
                  });
                }
                
                // Distruggi e ricrea la sessione per forzare l'aggiornamento completo
                req.session.regenerate((regErr) => {
                  if (regErr) {return res.status(500).json({ 
                      success: false, 
                      message: 'Errore durante il completamento del pagamento' 
                    });
                  }
                  
                  // Ottieni l'email dell'utente originale dal database
                  db.get('SELECT email, role FROM users WHERE id = ?', [userId], (emailErr, userData) => {
                    if (emailErr) {}
                    
                    // Ricrea la sessione con i dati aggiornati
                    req.session.user = {
                      id: userId,
                      email: userData ? userData.email : req.body.email || 'user@example.com',
                      subscription: subscription.name,
                      subscription_id: subscription.id,
                      subscription_expiry: expiryDateStr,
                      needsPayment: false,
                      role: userData ? userData.role : 'user'
                    };
                    
                    // Salva esplicitamente la sessione
                    req.session.save((saveErr) => {
                      if (saveErr) {
                        
                      }
                      
                      res.json({ 
                        success: true, 
                        message: 'Pagamento elaborato con successo', 
                        redirectUrl: '/subscription/success' 
                      });
                    });
                  });
                });
              });
            }
          );
        }
      );
    });
    }); // Chiusura del controllo subscription
  }); // Chiusura del controllo utente attivo
});

// Pagina di successo dopo il pagamento
router.get('/success', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'subscription', 'success.html'));
});

// Pagina di selezione del piano di abbonamento
router.get('/select', requireAuth, (req, res) => {
  // Recupera tutti gli abbonamenti disponibili
  SubscriptionController.getAllSubscriptions((err, subscriptions) => {
    if (err) {return res.status(500).send('Errore durante il recupero dei piani di abbonamento');
    }
    
    // Invia il file HTML per la selezione dell'abbonamento
    res.sendFile(path.join(__dirname, '..', 'views', 'subscription', 'select.html'));
  });
});

// API per ottenere tutti gli abbonamenti disponibili
router.get('/api/subscriptions', requireAuth, (req, res) => {
  SubscriptionController.getAllSubscriptions((err, subscriptions) => {
    if (err) {return res.status(500).json({ error: 'Errore durante il recupero dei piani di abbonamento' });
    }
    
    // Rimuovi l'abbonamento base dall'elenco
    const availablePlans = subscriptions.filter(sub => sub.name !== 'base');
    
    res.json(availablePlans);
  });
});

// Annulla abbonamento
router.post('/cancel', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  
  // Aggiorna l'utente al piano base
  SubscriptionController.getSubscriptionByName('base', (err, baseSubscription) => {
    if (err) {return res.status(500).json({ 
        success: false, 
        message: 'Errore durante l\'annullamento dell\'abbonamento' 
      });
    }
    
    if (!baseSubscription) {return res.status(404).json({ 
        success: false, 
        message: 'Abbonamento base non trovato' 
      });
    }
    
    // Aggiorna l'utente con l'abbonamento base
    db.run(
      'UPDATE users SET subscription = ?, subscription_id = ?, subscription_expiry = NULL WHERE id = ?',
      ['base', baseSubscription.id, userId],
      function(err) {
        if (err) {return res.status(500).json({ 
            success: false, 
            message: `Errore durante l'annullamento dell'abbonamento: ${err.message}` 
          });
        }
        
        // Aggiorna le informazioni di sessione
        req.session.user.subscription = 'base';
        req.session.user.subscription_id = baseSubscription.id;
        req.session.user.subscription_expiry = null;
        req.session.user.needsPayment = false;
        
        res.json({ 
          success: true, 
          message: 'Abbonamento annullato con successo' 
        });
      }
    );
  });
});

module.exports = router;