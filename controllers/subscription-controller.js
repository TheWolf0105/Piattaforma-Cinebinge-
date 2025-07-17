
const db = require('../database/db');

const SubscriptionController = {
  // Ottieni tutti gli abbonamenti
  getAllSubscriptions: function(callback) {
    db.all('SELECT * FROM subscriptions ORDER BY price', callback);
  },
  
  // Ottieni un abbonamento specifico per ID
  getSubscriptionById: function(id, callback) {
    db.get('SELECT * FROM subscriptions WHERE id = ?', [id], callback);
  },
  
  // Ottieni un abbonamento per nome
  getSubscriptionByName: function(name, callback) {
    db.get('SELECT * FROM subscriptions WHERE name = ?', [name], callback);
  },
  
  // Crea un pagamento
  createPayment: function(paymentData, callback) {
    const {
      user_id,
      subscription_id,
      subscription_name,
      amount,
      payment_method,
      transaction_id,
      status
    } = paymentData;
    
    // Ottieni la durata dell'abbonamento
    db.get('SELECT duration_days FROM subscriptions WHERE id = ?', [subscription_id], (err, subscription) => {
      if (err) {
        return callback(err, null);
      }
      
      // Calcola la data di scadenza in base alla durata
      const duration_days = subscription ? subscription.duration_days : 30; // Default a 30 giorni
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + duration_days);
      const expiryDateStr = expiryDate.toISOString();
      
      // Prima aggiorna l'utente con le informazioni dell'abbonamento
      db.run(
        'UPDATE users SET subscription = ?, subscription_id = ?, subscription_expiry = ? WHERE id = ?',
        [
          subscription_name || 'premium', // Default a premium se non specificato
          subscription_id,
          expiryDateStr,
          user_id
        ],
        function(err) {
          if (err) {
            return callback(err, null);
          }
          
          // Ora registra il pagamento
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
              user_id, 
              subscription_id, 
              amount, 
              now.toISOString(), 
              payment_method, 
              transaction_id, 
              status
            ],
            function(err) {
              if (err) {
                return callback(err, null);
              }
              
              // Restituisci i dati del pagamento con la data di scadenza
              const payment = {
                id: this.lastID,
                user_id,
                subscription_id,
                subscription_name,
                amount,
                payment_date: now.toISOString(),
                payment_method,
                transaction_id,
                status,
                expiry_date: expiryDateStr
              };
              
              callback(null, payment);
            }
          );
        }
      );
    });
  },
  
  // Verifica se la tabella subscriptions esiste e creala se necessario
  initializeSubscriptionsTable: function(callback) {
    // Verifica se la tabella esiste
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='subscriptions'", (err, table) => {
      if (err) {
        return callback && callback(err);
      }
      
      if (!table) {
        // Crea la tabella
        db.run(`
          CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            features TEXT,
            duration_days INTEGER DEFAULT 30
          )
        `, (err) => {
          if (err) {
            return callback && callback(err);
          }
          
          // Inserisci solo i piani di abbonamento base e premium
          db.run(`
            INSERT INTO subscriptions (name, price, description, features, duration_days) VALUES
            ('base', 0, 'Piano base con funzionalità limitate', 'Noleggio film a pagamento, Catalogo limitato', 0),
            ('premium', 14.99, 'Esperienza completa con contenuti esclusivi', 'Accesso illimitato al catalogo, Streaming in 4K Ultra HD, Contenuti esclusivi, Download offline, Accesso anticipato ai nuovi titoli', 30)
          `, (err) => {
            callback && callback(err);
          });
        });
      } else {
        callback && callback(null);
      }
    });
  }
};

// Esporta il controller
module.exports = SubscriptionController;