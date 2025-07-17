const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Percorso del database
const dbPath = path.join(__dirname, 'cinebinge.db');

// Funzione per hashare le password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Crea un nuovo database o si connette a quello esistente
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    process.exit(1);
  }
  
  // Abilita le chiavi esterne
  db.run('PRAGMA foreign_keys = ON');
  
  // Crea la tabella degli abbonamenti se non esiste
  db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    duration_days INTEGER NOT NULL,
    features TEXT
  )`, function(err) {
    if (err) {
      return;
    }
    
    // Inserisci gli abbonamenti di default se non esistono
    db.get('SELECT COUNT(*) as count FROM subscriptions', (err, row) => {
      if (err) {
        return;
      }
      
      if (row.count === 0) {
        const subscriptions = [
          {
            name: 'base',
            description: 'Accesso base alla piattaforma',
            price: 0.0,
            duration_days: 0,
            features: 'Noleggio film, Catalogo limitato'
          },
          {
            name: 'premium',
            description: 'Esperienza completa con contenuti esclusivi',
            price: 14.99,
            duration_days: 30,
            features: 'Accesso illimitato, 4K, Contenuti esclusivi, Download offline, Accesso anticipato ai nuovi titoli'
          }
        ];
        
        const stmt = db.prepare('INSERT INTO subscriptions (name, description, price, duration_days, features) VALUES (?, ?, ?, ?, ?)');
        
        subscriptions.forEach(sub => {
          stmt.run(sub.name, sub.description, sub.price, sub.duration_days, sub.features);
        });
        
        stmt.finalize();
      }
    });
  });
  
  // Crea la tabella dei pagamenti se non esiste
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
  )`, function(err) {
    if (err) {
      return;
    }
    
    // Crea indici per migliorare le performance
    db.run('CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');
  });
  
  // Crea la tabella degli utenti se non esiste
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  subscription TEXT NOT NULL,
  subscription_id INTEGER,
  subscription_expiry TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  needs_payment INTEGER DEFAULT 0
)`, function(err) {
  if (err) {
    return;
  }
  
  // Resto del codice per la creazione dell'utente admin
  db.get('SELECT * FROM users WHERE email = ?', ['admin@cinebinge.com'], (err, row) => {
    if (err) {
      return;
    }
    
    // Se l'admin non esiste, lo crea
    if (!row) {
      const adminEmail = 'admin@cinebinge.com';
      const adminPassword = 'admin123';
      const hashedPassword = hashPassword(adminPassword);
      
      // Recupera l'ID dell'abbonamento premium
      db.get('SELECT id FROM subscriptions WHERE name = ?', ['premium'], (err, subscription) => {
        const premiumId = subscription ? subscription.id : null;
        
        db.run(
          'INSERT INTO users (email, password, subscription, subscription_id, role, needs_payment) VALUES (?, ?, ?, ?, ?, ?)',
          [adminEmail, hashedPassword, 'premium', premiumId, 'admin', 0],
          function(err) {
            if (err) {
              // Errore durante la creazione dell'admin
            }
          }
        );
      });
    }
  });
});
  
  // Crea la tabella dei film se non esiste
  db.run(`CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    genre TEXT NOT NULL,
    release_year INTEGER,
    duration INTEGER,
    director TEXT,
    cast TEXT,
    image_path TEXT,
    trailer_url TEXT,
    rentable INTEGER DEFAULT 1,
    rent_price REAL DEFAULT 3.99,
    type TEXT DEFAULT 'movie' CHECK(type IN ('movie', 'series')),
    subscription_required TEXT DEFAULT 'base'
  )`, function(err) {
    if (err) {
      return;
    }
    
    // Crea indici per migliorare le performance
    db.run('CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre)');
    db.run('CREATE INDEX IF NOT EXISTS idx_movies_type ON movies(type)');
    db.run('CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(release_year)');
  });
  
  // Crea la tabella dei noleggi se non esiste
  db.run(`CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    rental_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (movie_id) REFERENCES movies (id)
  )`, function(err) {
    if (err) {
      return;
    }
    
    // Crea indici per migliorare le performance
    db.run('CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_rentals_movie_id ON rentals(movie_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_rentals_expiry ON rentals(expiry_date)');
  });
});

module.exports = db;