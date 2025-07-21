const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('./database/db');
const fs = require('fs');

// Importa la configurazione
const config = require('./config/app-config');

// Importa il controller delle sottoscrizioni
const SubscriptionController = require('./controllers/subscription-controller');

// Importa le rotte
const subscriptionRoutes = require('./routes/subscription-routes');
const authRoutes = require('./routes/auth-routes');
const movieRoutes = require('./routes/movie-routes');
const userRoutes = require('./routes/user-routes');
const adminRoutes = require('./routes/admin-routes');
const staticRoutes = require('./routes/static-routes');

// Importa i middleware
const { requireAuth, requireAdmin } = require('./middleware/auth');

const app = express();

// Middleware per il parsing dei dati
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Assicurati che le cartelle per le immagini esistano
const createDirectoryIfNotExists = (dirPath) => {
  const fullPath = path.join(__dirname, 'public', dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
};

app.use((req, res, next) => {
  // Aggiungi header anti-caching per le pagine protette e le dashboard
  if (req.path.includes('/dashboard') || 
      req.path.includes('/my-rentals') || 
      req.path.includes('/watch') || 
      req.path.includes('/manage') ||
      req.path.includes('/subscription')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
  next();
});

// Crea le cartelle necessarie per le immagini
config.genres.forEach(genre => {
  createDirectoryIfNotExists(`assets/${genre}`);
});

// Crea cartelle per placeholders e assets
createDirectoryIfNotExists('placeholders');
createDirectoryIfNotExists('assets');

// Crea un placeholder generico se non esiste
const placeholderPath = path.join(__dirname, 'public', 'placeholder.jpg');
if (!fs.existsSync(placeholderPath)) {
  try {
    // Copia il placeholder da assets se disponibile o crea uno vuoto
    const defaultSource = path.join(__dirname, 'public', 'assets', 'placeholder.jpg');
    if (fs.existsSync(defaultSource)) {
      fs.copyFileSync(defaultSource, placeholderPath);
    } else {
      // Crea un file vuoto come placeholder
      fs.writeFileSync(placeholderPath, '');
    }
  } catch (err) {
    // Errore durante la creazione del placeholder
  }
}

// Middleware per la gestione delle sessioni
app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: './database',
    }),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.server.environment === 'production',
      maxAge: config.session.maxAge,
    },
  })
);

// Middleware per verificare lo stato della sessione su pagine protette
app.use((req, res, next) => {
  const protectedPaths = ['/dashboard', '/my-rentals', '/watch', '/manage'];
  const isProtectedPath = protectedPaths.some(path => req.path.startsWith(path));
  
  if (isProtectedPath && (!req.session || !req.session.user)) {
    // Se la richiesta è AJAX, restituisci un errore JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({ error: 'Sessione scaduta', redirectTo: '/login' });
    }
    // Altrimenti reindirizza al login
    return res.redirect('/login?expired=true');
  }
  
  next();
});

// Monta le rotte
app.use('/subscription', subscriptionRoutes);
app.use('/', authRoutes);
app.use('/', movieRoutes);
app.use('/', userRoutes);
app.use('/', adminRoutes);
app.use('/', staticRoutes);

// Rotta per qualsiasi altra richiesta (404)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Avvio del server
const PORT = config.server.port;
app.listen(PORT, () => {
  // Server avviato sulla porta specificata
});