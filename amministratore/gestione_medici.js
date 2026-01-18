const API_BASE = `${location.protocol}//${location.hostname}:5000`;

// Funzione per leggere il cookie di sessione e estrarre nome
async function getSessionData() {
  try {
    const res = await fetch(`${API_BASE}/session`, {
      credentials: "include"
    });

    if (!res.ok) return null;

    const data = await res.json();
    return { ruolo: data.ruolo, id: data.id, nome: data.nome, cognome: data.cognome};

  } catch (err) {
    console.error("Errore sessione:", err);
    alert("Errore nel recupero della sessione");
    return null;
  }
}

function registra(){
  window.location.href = "../amministratore/registra_medico.html";
}

async function logout() {
  try {
    const res = await fetch(`${API_BASE}/session`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) {
      alert("Errore durante il logout");
      return;
    }

    window.location.href = "../index.html";
  } catch (err) {
    console.error("Errore logout:", err);
    alert("Errore di connessione");
  }
}

// Funzione per eliminare un medico via DELETE
async function eliminaMedico(email) {
  try {
    const res = await fetch(`${API_BASE}/medico/elimina`, {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: email }),
      credentials: 'include' 
    });

    if (res.status === 200) {
      alert('Medico eliminato con successo');
      window.location.reload();
    } else {
      alert('Errore nell\'eliminazione del medico');
    }
  } catch (error) {
    console.error('Errore fetch:', error);
    alert('Errore di connessione o server');
  }
}

// Funzione per avviare la modifica medico: salva email e fa redirect
function modificaMedico(email) {
  localStorage.setItem('medicoEmail', email);
  window.location.href = `../amministratore/modifica_medico.html`;
}

async function aggiornaMedico() {
  // Prendi i valori dagli input
  const datiMedico = {
    email: document.getElementById('email').value,
    nome: document.getElementById('nome').value,
    cognome: document.getElementById('cognome').value,
    specializzazione: document.getElementById('specializzazione').value,
    luogo_di_nascita: document.getElementById('luogo_di_nascita').value,
    data_di_nascita: document.getElementById('data_di_nascita').value,
    codice_fiscale: document.getElementById('codice_fiscale').value,
    password: document.getElementById('password').value
  };

  try {
    const response = await fetch(`${API_BASE}/medico/aggiorna`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datiMedico),
      credentials: 'include' 
    });
    const result = await response.json();
    if (response.ok) {
      window.location.reload();
      alert(result.messaggio);
    } else {
      alert(result.errore || 'Errore aggiornamento');
    }
  } catch (error) {
    console.error('Errore fetch:', error);
    alert('Errore connessione o server!');
  }
  };

// Funzione per caricare la lista completa dei medici in gestione_medici.html
async function caricaMedici() {
  const session = await getSessionData();

  if (!session) {
    // Se non c’è sessione valida, redirect alla login
    window.location.href = `../amministratore/amministratore_login.html`;
    return;
  }

  if (location.pathname.includes('gestione_medici.html')) {
    try {
      const response = await fetch(`${API_BASE}/medico/lista_medici`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'},
        credentials: 'include'
      });
      const medici = await response.json();

      const tbody = document.querySelector("#gestione-medici tbody");
      tbody.innerHTML = ''; // Pulisce la tabella

      medici.forEach(medico => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td> 
            <img src="/Tesi/immagini/negative-minus-svgrepo-com.svg" id="${medico.email}" width="20" height="20" onclick="eliminaMedico(this.getAttribute('id'))"/> 
            <img src="/Tesi/immagini/pencil-svgrepo-com (1).svg" id="${medico.email}" width="20" height="20" onclick="modificaMedico(this.getAttribute('id'))" /> 
            ${medico.cognome}
          </td>
          <td>${medico.nome}</td>
          <td>${medico.specializzazione}</td>
        `;
        tbody.appendChild(row);
      });

    } catch (error) {
      console.error('Errore nel caricamento dei medici:', error);
    }
  }
}

// Funzione da inserire nel file JS di modifica_medico.html per caricare dati dettaglio medico
async function caricaMedicoDettaglio() {
  const email = localStorage.getItem('medicoEmail');
  if (!email) {
    alert('Nessuna email medico specificata.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/medico/getmedico?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      credentials: 'include' 
    });

    if (!response.ok) throw new Error('Errore nel caricamento del medico');

    const medici = await response.json();

    const tbody = document.querySelector('#gestione-medico tbody');
    tbody.innerHTML = ''; // Pulisce la tabella

    medici.forEach(medico => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="text" id="cognome" value="${medico.cognome}"></td>
        <td><input type="text" id="nome" value="${medico.nome}"></td>
        <td><input type="text" id="specializzazione" value="${medico.specializzazione}"></td>
        <td><input type="text" id="luogo_di_nascita" value="${medico.luogo_di_nascita}"></td>
        <td><input type="date" id="data_di_nascita" value="${medico.data_di_nascita}"></td>
        <td><input type="text" id="codice_fiscale" pattern="^[a-zA-Z]{6}[0-9]{2}[a-zA-Z][0-9]{2}[a-zA-Z][0-9]{3}[a-zA-Z]$" value="${medico.codice_fiscale}"></td>
        <td><input type="email" id="email" pattern="[^@]+@[^@]+\.[a-zA-Z]{2,}" value="${medico.email}"></td>
        <td><input type="password" id="password" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"></td>
      `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Errore nel caricamento del medico:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (location.pathname.includes('gestione_medici.html')) {
    const session = await getSessionData();
    caricaMedici();
    if (session.ruolo === 'Amministratore') {
      const h = document.getElementById('amministratore');
      if (h) h.textContent +=  session.nome + " " + session.cognome;
    }
  } else if (location.pathname.includes('modifica_medico.html')) {
    getSessionData();
    caricaMedicoDettaglio();
  }
});

window.addEventListener('pageshow', async () => {
  const session = await getSessionData();
  if (!session) {
    window.location.href = `../index.html`;
    return;
  }
});

document.getElementById('aggiorna-medico')
  .addEventListener('click', aggiornaMedico);