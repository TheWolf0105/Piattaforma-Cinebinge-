# CineBinge - Come Installare

## Cosa ti serve

Prima di iniziare, scarica e installa:
- **Node.js** (versione 16 o più recente) dal sito ufficiale
- Un editor di testo (VS Code va benissimo)

## Installazione

### 1. Scarica il progetto
- Scarica il file ZIP del progetto
- Estrailo in una cartella sul desktop
- Apri il terminale/prompt dei comandi nella cartella

### 2. Installa tutto
```bash
npm install
```

### 3. Avvia il server
```bash
npm start
```

### 4. Apri il browser
Vai su: `http://localhost:3000`

## Account per testare

**Admin:**
- Email: admin@cinebinge.com
- Password: admin123

**Utente normale:**
- Email: mario@test.com  
- Password: user1234

## Se qualcosa non funziona

**Errore "porta già in uso":**
- Chiudi tutti i terminali
- Riapri e prova di nuovo

**Errore "modulo non trovato":**
```bash
npm install
```

**Il sito non si carica:**
- Controlla che nel terminale non ci siano errori in rosso
- Prova a riavviare con `npm start`

## Cosa testare

1. **Registrazione** - Crea un nuovo account
2. **Login** - Entra con le credenziali
3. **Catalogo** - Sfoglia i film
4. **Ricerca** - Cerca un film
5. **Admin** - Entra come admin e aggiungi un film

## Struttura progetto

```
CineBinge/
├── main.js              # File principale
├── package.json         # Dipendenze
├── config/              # Configurazioni
├── database/            # Database
├── controllers/         # Logica applicazione
├── routes/              # Pagine
├── views/               # Template HTML
└── public/              # CSS, JS, immagini
```

## Tecnologie usate

- **Backend**: Node.js + Express
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript
- **Styling**: Tailwind CSS

## Reset database

Se vuoi ricominciare da zero:
1. Ferma il server (Ctrl+C)
2. Cancella i file nella cartella `database/`
3. Riavvia con `npm start`


