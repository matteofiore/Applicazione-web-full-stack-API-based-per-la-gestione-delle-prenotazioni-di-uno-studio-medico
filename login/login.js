//COSTRUZIONE URL DINAMICO
const API_BASE = `${location.protocol}//${location.hostname}:5000`;

//FUNZIONE PER MOSTRARE MESSAGGI DI ERRORE O SUCCESSO NEL BOX HTML
function mostraMessaggio(message, type = 'danger', boxId = 'login-error') {
  const box = document.getElementById(boxId);
  if (!box) return;

  box.textContent = message;
  box.classList.remove('d-none', 'alert-danger', 'alert-success');
  box.classList.add(`alert-${type}`);
}

//DEFINIZIONE PER CANCELLARE MESSAGGIO NELLA BOX
function cancellaMessaggio(boxId = 'login-error') {
  const box = document.getElementById(boxId);
  if (!box) return;

  box.textContent = '';
  box.classList.add('d-none');
  box.classList.remove('alert-danger', 'alert-success');
}

//VERIFICA COOKIE DI SESSIONE
async function controlloSessione() {
  try {
    //CHIAMATA API PER VERIFICA ESISTENZA DEL COOKIE DI SESSIONE
    const res = await fetch(`${API_BASE}/session`, {
      credentials: "include"
    });

    //SE IL COOKIE NON ESISTE INTERROMPI LA FUNZIONE
    if (!res.ok){
      return;
    }

    const data = await res.json();
    if (!data) return;

    if (data.ruolo === "Paziente") {
      window.location.href = `../appuntamenti/appuntamenti_Paziente.html`;
    } else if (data.ruolo === "Medico") {
      window.location.href = `../appuntamenti/appuntamenti_medico.html`;
    } else if (data.ruolo === "Amministratore") {
      window.location.href = `../amministratore/gestione_medici.html`;
    }
  } catch (e) {
    mostraMessaggio(e, 'danger');
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await controlloSessione();

  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    cancellaMessaggio();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    //IMPOSTO IL RUOLO IN BASE ALLA PAGINA HTML
    if (location.pathname.includes("login_paziente.html")) {
      data.ruolo = "Paziente";
    } else if (location.pathname.includes("login_medico.html")) {
      data.ruolo = "Medico";
    } else if (location.pathname.includes("amministratore_login.html")) {
      data.ruolo = "Amministratore";
    }

    try {
      //CHIAMATA API PER EFFETTUARE IL LOGIN
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      let body = {};
      //PARSING DELLE RISPOSTE HTTP
      try {
        body = await res.json();
      } catch (err) {
        console.warn("Risposta non JSON", err);
      }

      if (!res.ok) {
        mostraMessaggio(body.errore || "Email o password non valide", 'danger');
        return;
      }

      // Login riuscito → redirect
      mostraMessaggio("Login effettuato con successo!", 'success');
      setTimeout(() => {window.location.href = `http://${url}/Tesi/index.html`;}, 2000);

      if (data.ruolo === "Paziente") {
        setTimeout(() => {window.location.href = `../appuntamenti/appuntamenti_paziente.html`;}, 3000);
      } else if (data.ruolo === "Medico") {
        setTimeout(() => {window.location.href = `../appuntamenti/appuntamenti_medico.html`;}, 3000);
      } else if (data.ruolo === "Amministratore") {
        setTimeout(() => {window.location.href = `../amministratore/gestione_medici.html`;}, 3000);
      }

    } catch (err) {
      mostraMessaggio("Problema di connessione, riprova più tardi", 'danger');
    }
  });
});