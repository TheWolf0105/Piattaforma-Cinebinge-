// Utility per la gestione dell'autenticazione e del logout

// Funzione per eseguire il logout
function performLogout() {
  fetch('/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Pulisce la cache del browser
      if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
          return Promise.all(
            cacheNames.map(function(cacheName) {
              return caches.delete(cacheName);
            })
          );
        });
      }
      
      // Forza il refresh della pagina e reindirizza
      window.location.replace('/login');
      
      // Previene il back button
      window.history.pushState(null, null, '/login');
      window.addEventListener('popstate', function(event) {
        window.location.replace('/login');
      });
    }
  })
  .catch(error => {// Anche in caso di errore, reindirizza al login
    window.location.replace('/login');
  });
}

// Funzione per prevenire il back button dopo il logout
function preventBackAfterLogout() {
  // Controlla se l'utente è autenticato
  fetch('/api/check-session', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })
  .then(response => {
    if (response.status === 401) {
      // Sessione scaduta, reindirizza al login
      window.location.replace('/login');
    }
  })
  .catch(error => {
    // In caso di errore di rete, reindirizza al login per sicurezza
    window.location.replace('/login');
  });
}

// Funzione per gestire il back button su pagine protette
function handleBackButton() {
  window.addEventListener('pageshow', function(event) {
    // Se la pagina viene mostrata dalla cache (back button)
    if (event.persisted) {
      preventBackAfterLogout();
    }
  });
  
  // Gestisce il popstate per prevenire il back button
  window.addEventListener('popstate', function(event) {
    preventBackAfterLogout();
  });
}

// Inizializza la gestione del back button quando il DOM è caricato
document.addEventListener('DOMContentLoaded', function() {
  // Solo su pagine protette
  const protectedPaths = ['/dashboard', '/my-rentals', '/watch', '/manage', '/browse'];
  const currentPath = window.location.pathname;
  
  if (protectedPaths.some(path => currentPath.startsWith(path))) {
    handleBackButton();
    
    // Controlla periodicamente lo stato della sessione
    setInterval(preventBackAfterLogout, 30000); // Ogni 30 secondi
  }
});

// Esporta le funzioni per uso globale
window.performLogout = performLogout;
window.preventBackAfterLogout = preventBackAfterLogout;
