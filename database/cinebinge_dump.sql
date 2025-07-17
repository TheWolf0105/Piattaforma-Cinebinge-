-- ===============================================
-- CineBinge Database Dump - Standard SQL Version
-- Database: SQLite (Standard SQL Compatible)
-- Generated: July 10, 2025
-- ===============================================

-- Note: Per SQLite, eseguire prima: PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- ===============================================
-- TABLE: users
-- Gestione utenti del sistema
-- ===============================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    subscription TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    subscription_id INTEGER,
    subscription_expiry TEXT,
    needs_payment INTEGER DEFAULT 0
);

-- Dati utenti di default
-- Password: admin (per admin), test123 (per altri utenti)
INSERT INTO users (id, email, password, subscription, role, subscription_id, subscription_expiry, needs_payment) 
VALUES (1, 'admin@cinebinge.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'premium', 'admin', 3, NULL, 0);

INSERT INTO users (id, email, password, subscription, role, subscription_id, subscription_expiry, needs_payment)
VALUES (43, 'mario@test.com', '831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb', 'premium', 'user', 3, '2025-08-09T19:38:30.485Z', 0);

INSERT INTO users (id, email, password, subscription, role, subscription_id, subscription_expiry, needs_payment)
VALUES (44, 'lucia@test.com', '831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb', 'senza_abbonamento', 'user', NULL, NULL, 0);

-- ===============================================
-- TABLE: subscriptions
-- Piani di abbonamento
-- ===============================================
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    duration_days INTEGER NOT NULL,
    features TEXT
);

INSERT INTO subscriptions (id, name, description, price, duration_days, features)
VALUES (1, 'base', 'Accesso base alla piattaforma', 0.0, 0, 'Noleggio film, Catalogo limitato');

INSERT INTO subscriptions (id, name, description, price, duration_days, features)
VALUES (2, 'standard', 'Accesso a tutti i film e serie TV', 9.99, 30, 'Accesso illimitato, HD, Nessuna pubblicità');

INSERT INTO subscriptions (id, name, description, price, duration_days, features)
VALUES (3, 'premium', 'Esperienza completa con contenuti esclusivi', 14.99, 30, 'Accesso illimitato, 4K, Contenuti esclusivi, Download offline');

-- ===============================================
-- TABLE: movies
-- Catalogo film e serie TV
-- ===============================================
CREATE TABLE movies (
    id INTEGER PRIMARY KEY,
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
    type TEXT DEFAULT 'movie'
);

-- Film di azione
INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (1, 'Avengers: Endgame', 'Dopo gli eventi devastanti di Infinity War, l''universo è in rovina. Con l''aiuto degli alleati rimasti, gli Avengers si riuniscono per annullare le azioni di Thanos e ripristinare l''ordine nell''universo.', 'azione', 2019, 181, 'Anthony Russo, Joe Russo', 'Robert Downey Jr., Chris Evans, Mark Ruffalo', '/assets/azione/endgame.jpg', 'https://www.youtube.com/embed/TcMBFSGVi1c', 1, 3.99, 'movie');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (2, 'Interstellar', 'Un gruppo di esploratori utilizza un wormhole appena scoperto per superare i limiti del viaggio spaziale umano e conquistare le vaste distanze di un viaggio interstellare.', 'fantascienza', 2014, 169, 'Christopher Nolan', 'Matthew McConaughey, Anne Hathaway, Jessica Chastain', '/assets/fantascienza/interstellar.jpg', 'https://www.youtube.com/embed/2LqzF5WauAw', 1, 4.99, 'movie');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (3, 'La Grande Bellezza', 'Jep Gambardella ha seducente gli altri per 65 anni con il suo fascino. Ha sempre voluto diventare uno scrittore. Invece, è rimasto intrappolato nel suo mondo mondano.', 'drammatico', 2013, 142, 'Paolo Sorrentino', 'Toni Servillo, Carlo Verdone, Sabrina Ferilli', '/assets/drammatico/bellezza.jpg', 'https://www.youtube.com/embed/fJfvX6zPAuQ', 1, 2.99, 'movie');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (4, 'Pulp Fiction', 'Le vite di due sicari, un pugile, la moglie di un gangster e una coppia di rapinatori di ristoranti si intrecciano in quattro racconti di violenza e redenzione.', 'azione', 1994, 154, 'Quentin Tarantino', 'John Travolta, Uma Thurman, Samuel L. Jackson', '/assets/azione/pulpfiction.jpg', 'https://www.youtube.com/embed/s7EdQ4FqbhY', 1, 4.99, 'movie');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (5, 'Joker', 'In Gotham City, il comico mentalmente instabile Arthur Fleck viene ignorato ed abusato dalla società. Poi inizia una lenta discesa verso la follia, trasformandosi nel criminale noto come Joker.', 'drammatico', 2019, 122, 'Todd Phillips', 'Joaquin Phoenix, Robert De Niro, Zazie Beetz', '/assets/drammatico/joker.jpg', 'https://www.youtube.com/embed/zAGVQLHvwOY', 1, 3.99, 'movie');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (6, 'Inception', 'Un ladro che ruba segreti aziendali attraverso l''uso della tecnologia di condivisione dei sogni, riceve il compito inverso di impiantare un''idea nella mente di un CEO.', 'fantascienza', 2010, 148, 'Christopher Nolan', 'Leonardo DiCaprio, Joseph Gordon-Levitt, Ellen Page', '/assets/fantascienza/inception.jpg', 'https://www.youtube.com/embed/YoHD9XEInc0', 1, 3.99, 'movie');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (7, 'Breaking Bad', 'Un insegnante di chimica del liceo a cui viene diagnosticato un cancro ai polmoni inoperabile si dà alla produzione e alla vendita di metanfetamine per assicurare il futuro finanziario della sua famiglia.', 'drammatico', 2008, 49, 'Vince Gilligan', 'Bryan Cranston, Aaron Paul, Anna Gunn', '/assets/drammatico/bad.jpg', 'https://www.youtube.com/embed/HhesaQXLuRY', 1, 3.99, 'series');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (8, 'Stranger Things', 'Quando un ragazzino scompare, una piccola città scopre un mistero che coinvolge esperimenti segreti, terrificanti forze soprannaturali e una strana bambina.', 'fantascienza', 2016, 51, 'The Duffer Brothers', 'Millie Bobby Brown, Finn Wolfhard, Winona Ryder', '/assets/fantascienza/stranger.jpg', 'https://www.youtube.com/embed/b9EkMc79ZSU', 1, 3.99, 'series');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (9, 'The Office', 'Una commedia mockumentary sulla vita quotidiana dei dipendenti di una filiale di medie dimensioni di una società di carta.', 'commedia', 2005, 22, 'Greg Daniels, Ricky Gervais, Stephen Merchant', 'Steve Carell, John Krasinski, Jenna Fischer', '/assets/commedia/office.jpg', 'https://www.youtube.com/embed/LHOtME2DL4g', 1, 5.99, 'series');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (10, 'Il Padrino', 'Il patriarca di una dinastia del crimine organizzato trasferisce il controllo del suo impero clandestino al riluttante figlio.', 'drammatico', 1972, 175, 'Francis Ford Coppola', 'Marlon Brando, Al Pacino, James Caan', '/assets/drammatico/ilpadrino.jpg', 'https://www.youtube.com/embed/sY1S34NSfxI', 1, 3.99, 'movie');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (11, 'La casa di carta', 'La serie si concentra su una banda di ladri, ognuno con una sua specializzazione (hacker, scassinatore, falsario, ecc.), che vengono reclutati dal Professore per portare a termine il colpo più ambizioso della storia.', 'azione', 2017, 55, 'Álex Pina', 'Álvaro Morte, Úrsula Corberó, Pedro Alonso', '/assets/azione/casadicarta.jpg', 'https://www.youtube.com/embed/M8tbvWujpWA', 1, 3.99, 'series');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (12, 'Peaky Blinders', 'Nel 1919, in seguito alla Grande Guerra, i Peaky Blinders, guidati da Thomas Tommy Shelby, un ex sergente maggiore decorato, si appropriarono di un accumulo di armi dalla fabbrica locale.', 'drammatico', 2013, 60, 'Steven Knight', 'Cillian Murphy, Paul Anderson, Sophie Rundle', '/assets/drammatico/blinders.jpg', 'https://www.youtube.com/embed/oVzVdvGIC7U?start=3', 1, 3.99, 'series');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (13, 'Greys Anatomy', 'Le vicende di alcuni medici di Seattle che si districano tra lavoro e problemi quotidiani. Tra di essi Meredith, figlia di un noto chirurgo, costretta a gestire non solo i propri rapporti interpersonali, ma anche il peso di una importante eredità.', 'drammatico', 2005, 54, 'Shonda Rhimes', 'Ellen Pompeo, Chandra Wilson, Patrick Dempsey', '/assets/drammatico/greys.jpg', 'https://www.youtube.com/embed/Pk84NpYpmM4', 1, 3.99, 'series');

INSERT INTO movies (id, title, description, genre, release_year, duration, director, cast, image_path, trailer_url, rentable, rent_price, type)
VALUES (14, 'Suits', 'Harvey è un brillante avvocato, molto abile negli affari ma dotato di scarsa sensibilità. Mike Ross è un ragazzo dalle doti singolari che la vita ha portato sulla cattiva strada. I due lavorano insieme per soddisfare i propri clienti.', 'commedia', 2011, 55, 'Kevin Bray, Michael Smith, e Anton Cropper', 'Gabriel Macht, Sarah Rafferty, Abigail Spencer', '/assets/drammatico/suits.jpg', 'https://www.youtube.com/embed/cUnkjEIW2-o', 1, 3.99, 'series');

-- ===============================================
-- TABLE: rentals
-- Noleggi utenti
-- ===============================================
CREATE TABLE rentals (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    rental_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (movie_id) REFERENCES movies (id)
);

-- Noleggio di esempio: lucia ha noleggiato Joker
INSERT INTO rentals (id, user_id, movie_id, rental_date, expiry_date)
VALUES (13, 44, 5, '2025-07-10T19:54:36.665Z', '2025-07-12T19:54:36.665Z');

-- ===============================================
-- TABLE: payments
-- Cronologia pagamenti
-- ===============================================
CREATE TABLE payments (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
);

-- Pagamento premium di mario
INSERT INTO payments (id, user_id, subscription_id, amount, payment_date, payment_method, transaction_id, status)
VALUES (27, 43, 3, 14.99, '2025-07-10T19:38:30.502Z', 'card', 'TRX1752176310485227', 'completed');

-- ===============================================
-- INDEXES
-- Indici per migliorare le performance
-- ===============================================
CREATE INDEX idx_movies_genre ON movies(genre);
CREATE INDEX idx_movies_type ON movies(type);
CREATE INDEX idx_movies_year ON movies(release_year);
CREATE INDEX idx_rentals_user_id ON rentals(user_id);
CREATE INDEX idx_rentals_movie_id ON rentals(movie_id);
CREATE INDEX idx_rentals_expiry ON rentals(expiry_date);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);

COMMIT;
