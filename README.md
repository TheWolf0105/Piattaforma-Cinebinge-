# CineBinge - Piattaforma Streaming

Un sito web simile a Netflix fatto con Node.js. Puoi registrarti, guardare film, cercare contenuti e gestire abbonamenti.

## Come iniziare

```bash
npm install
npm start
```

Poi vai su: `http://localhost:3000`

## Account di prova

**Admin:**
- Email: admin@cinebinge.com
- Password: admin123

**Utente:**
- Email: mario@test.com
- Password: user1234

## Cosa fa

- **Registrazione**: Crei un account e fai login
- **Catalogo**: Sfoglia film per genere
- **Ricerca**: Cerca film per titolo
- **Abbonamenti**: Base (gratis) o Premium (a pagamento)
- **Admin**: Aggiungi, modifica o elimina film

## Tecnologie

- Node.js e Express per il server
- SQLite per salvare i dati
- HTML, CSS e JavaScript per il frontend
- Tailwind CSS per lo styling

## Struttura

```
CineBinge/
├── main.js          # Server principale
├── config/          # Impostazioni
├── database/        # Database SQLite
├── controllers/     # Logica backend
├── routes/          # URL e pagine
├── views/           # Pagine HTML
└── public/          # CSS, JS, immagini
```

## Funzionalità

**Per tutti:**
- Registrazione e login
- Sfoglia film per genere
- Ricerca nel catalogo
- Guarda trailer su YouTube

**Solo Premium:**
- Accesso a tutti i contenuti
- Nessuna pubblicità

**Solo Admin:**
- Aggiungi nuovi film
- Modifica film esistenti
- Elimina contenuti
- Gestisci il catalogo

## Sicurezza

- Password criptate
- Sessioni sicure
- Protezione da attacchi web comuni

## Come testarlo

1. Avvia il server
2. Registrati come nuovo utente
3. Prova a cercare un film
4. Fai login come admin
5. Aggiungi un nuovo film





## Database

Il database si crea automaticamente al primo avvio. Contiene:
- Utenti registrati
- Catalogo film
- Abbonamenti
- Sessioni

## API principali

- `/register` - Registrazione
- `/login` - Login
- `/api/movies` - Lista film
- `/api/search-suggestions` - Ricerca
- `/subscription/checkout` - Abbonamenti


