//COSTRUZIONE URL DINAMICO
const API_BASE = `${location.protocol}//${location.hostname}:5000`;

// Funzione per leggere il cookie di sessione e estrarre nome
async function controlloSessione() {
  try {
    //CHIAMATA API PER CHCECK COOKIE DI SESSIONE
    const res = await fetch(`${API_BASE}/session`,
      {
        credentials: "include"
      });

    if (!res.ok){
      return;
     }

    const data = await res.json();
    return { ruolo: data.ruolo, id: data.id, nome: data.nome, cognome: data.cognome };

  } catch (err) {
    console.error("Errore sessione:", err);
    return null;
  }
}

//FUNZIONE PER REDIRECT
function registra() {
  window.location.href = "../amministratore/registra_medico.html";
}

//FUNZIONE PER MOSTRARE MESSAGGI DI ERRORE O SUCCESSO NEL BOX HTML
function mostraMessaggio(testo, tipo = 'danger') {
  const box = document.getElementById('msg-box');
  if (!box) return;

  box.className = `alert alert-${tipo} mx-3 mt-3`;
  box.textContent = testo;
  box.classList.remove('d-none');
}

//FUNZIONE PER NASCONDERE MESSAGGIO
function nascondiMessaggio() {
  const box = document.getElementById('msg-box');
  if (box) box.classList.add('d-none');
}

//FUNZIONE PER EFFETTUARE LOGOUT
async function logout() {
  try {
    //CHIAMATA API PER ELIMINARE LA SESSIONE
    const res = await fetch(`${API_BASE}/session`,
      {
        method: "DELETE",
        credentials: "include"
      });

    const data = await res.json()
    if (!res.ok) {
      mostraMessaggio(data.errore || "Errore durante il logout", "danger");
      return;
    }
    
    window.location.href = "../index.html";
  } catch (err) {
    mostraMessaggio("Errore di connessione con il server", "danger");
  }
}

//FUNZIONE PER ELIMINARE UN MEDICO
async function eliminaMedico(id) {
  try {
    //CHIAMATA API PER ELIMINARE MEDICO
    const res = await fetch(`${API_BASE}/medico/elimina`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medico_id: id }),
      credentials: 'include'
    });

    const data = await res.json();

    //GESTIONE RISPOSTA HTTP
    if (res.ok) {
      mostraMessaggio(data.messaggio, 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      mostraMessaggio(data.errore || 'Errore sconosciuto', 'danger');
    }

  } catch (error) {
    console.error('Errore fetch:', error);
    mostraMessaggio('Errore di connessione o server', 'danger');
  }
}

//FUNZIONE PER REDIRECT PER MODIFICARE IL MEDICO
function modificaMedico(id) {
  localStorage.setItem('medico_id', id);
  window.location.href = `../amministratore/modifica_medico.html`;
}

//FUNZIONE PER AGGIORARE MEDICO
async function aggiornaMedico() {
  nascondiMessaggio();
  //OTTENGO TUTTI I DATI INSERITI IN HTML
  const datiMedico = {
    medico_id: document.getElementById('medico_id').value,
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
    //CHIAMATA API PER AGGIORANRE CON I NUOVI DATI
    const response = await fetch(`${API_BASE}/medico/aggiorna`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datiMedico),
        credentials: 'include'
      });
    //GESTIONE RISPOSTE HTTP
    const result = await response.json();
    if (!response.ok) {
      mostraMessaggio(result.errore || 'Errore durante l’aggiornamento', 'danger');
      return;
    }
    mostraMessaggio(result.messaggio, 'success');
  } catch (error) {
    console.error(error);
    mostraMessaggio('Errore di connessione con il server', 'danger');
  }
}

//FUNZIONE PER CARICARE LISTA MEDICI
async function caricaMedici() {
  const session = await controlloSessione();
  if (!session) {
    window.location.href = `../amministratore/amministratore_login.html`;
    return;
  }

  if (location.pathname.includes('gestione_medici.html')) {
    try {
      const response = await fetch(`${API_BASE}/medico/lista`, {
        method: 'GET',
        credentials: 'include'
      });

      const medici = await response.json();
      const tbody = document.querySelector("#gestione-medici tbody");
      tbody.innerHTML = '';
       //CREAZIONE DELLE RIGHE CON LE INFORMAZIONI DEI MEDICI
      medici.forEach(medico => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <img src="/Tesi/immagini/negative-minus-svgrepo-com.svg"
                 data-id="${medico.id}"
                 width="20" height="20"
                 onclick="eliminaMedico(this.dataset.id)" />
            <img src="/Tesi/immagini/pencil-svgrepo-com.svg"
                 data-id="${medico.id}"
                 width="20" height="20"
                 onclick="modificaMedico(this.dataset.id)" />
            ${medico.cognome}
          </td>
          <td>${medico.nome}</td>
          <td>${medico.specializzazione}</td>
        `;
        tbody.appendChild(row);
      });

    } catch (error) {
      console.error(error);
      mostraMessaggio('Errore nel caricamento dei medici');
    }
  }
}

//FUNZIONE PER CARICARE NELLO SPECIFICO LE INFORMAZIONI DI UN MEDICO
async function caricaMedicoDettaglio() {
  const id = localStorage.getItem('medico_id');
  if (!id) {
    mostraMessaggio('ID medico mancante. Tornare alla lista.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/medico/getmedico?medico_id=${encodeURIComponent(id)}`,
    {
      credentials: 'include'
    });

    if (!response.ok) throw new Error();

    const medico = await response.json();
    const tbody = document.querySelector('#gestione-medico tbody');
    tbody.innerHTML = '';

    //INSERIMENTO DINAMICO DELLE RIGHE CON LE INFORMAZIONI DEL MEDICO
    const row = document.createElement('tr');
    row.innerHTML = `
      <input type="hidden" id="medico_id" value="${medico.id}">
      <td><input type="text" id="cognome" value="${medico.cognome}"></td>
      <td><input type="text" id="nome" value="${medico.nome}"></td>
      <td><input type="text" id="specializzazione" value="${medico.specializzazione}"></td>
      <td><input type="text" id="luogo_di_nascita" value="${medico.luogo_di_nascita}"></td>
      <td><input type="date" id="data_di_nascita" value="${medico.data_di_nascita}"></td>
      <td><input type="text" id="codice_fiscale" value="${medico.codice_fiscale}"></td>
      <td><input type="email" id="email" value="${medico.email}"></td>
      <td><input type="password" id="password"></td>
    `;
    tbody.appendChild(row);

  } catch (error) {
    console.error(error);
    mostraMessaggio('Errore nel caricamento dei dati del medico');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (location.pathname.includes('gestione_medici.html')) {
    const session = await controlloSessione();
    caricaMedici();
    if (session && session.ruolo === 'Amministratore') {
      const h = document.getElementById('amministratore');
      if (h) h.textContent += ` ${session.nome} ${session.cognome}`;
    }
  } else if (location.pathname.includes('modifica_medico.html')) {
    await controlloSessione();
    caricaMedicoDettaglio();
  }
});

window.addEventListener('pageshow', async () => {
  const session = await controlloSessione();
  if (!session) {
    window.location.href = `../index.html`;
  }
});

const btnAggiorna = document.getElementById('aggiorna-medico');
if (btnAggiorna) {
  btnAggiorna.addEventListener('click', aggiornaMedico);
}