// Configurazione centrale del progetto
module.exports = {
  // Configurazione server
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  },

  // Configurazione sessioni
  session: {
    secret: process.env.SESSION_SECRET || 'superSecretKey',
    maxAge: 1000 * 60 * 60 * 24, // 24 ore
    name: 'cinebinge_session'
  },

  // Configurazione database
  database: {
    path: './database/cinebinge.db',
    sessionsPath: './database/sessions.db'
  },

  // Configurazione percorsi
  paths: {
    views: './views',
    public: './public',
    uploads: './public/assets',
    placeholders: './public/placeholders'
  },

  // Configurazione noleggi
  rental: {
    durationHours: 48,
    defaultPrice: 3.99
  },

  // Configurazione cache
  cache: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  },

  // Generi disponibili
  genres: [
    'azione',
    'avventura',
    'animazione',
    'biografico',
    'commedia',
    'crimine',
    'documentario',
    'drammatico',
    'famiglia',
    'fantasy',
    'fantascienza',
    'guerra',
    'horror',
    'musica',
    'mistero',
    'romance',
    'sportivo',
    'storia',
    'thriller',
    'western'
  ],

  // Tipi di contenuto
  contentTypes: [
    'movie',
    'series',
    'documentary',
    'short'
  ],

  // Ruoli utente
  userRoles: [
    'user',
    'admin',
    'moderator'
  ],

  // Tipi di abbonamento
  subscriptionTypes: [
    'base',
    'premium'
  ]
};
