const API_BASE = `${location.protocol}//${location.hostname}:5000`;

function showMessage(message, type = 'danger', boxId = 'login-error') {
  const box = document.getElementById(boxId);
  if (!box) return;

  box.textContent = message;
  box.classList.remove('d-none', 'alert-danger', 'alert-success');
  box.classList.add(`alert-${type}`);
}

function clearMessage(boxId = 'login-error') {
  const box = document.getElementById(boxId);
  if (!box) return;

  box.textContent = '';
  box.classList.add('d-none');
  box.classList.remove('alert-danger', 'alert-success');
}

async function checkSession() {
  try {
    const res = await fetch(`${API_BASE}/session`, {
      credentials: "include"
    });

    if (!res.ok) return;

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
    showMessage(e, 'danger');
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await checkSession();

  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Imposta ruolo in base alla pagina
    if (location.pathname.includes("login_paziente.html")) {
      data.ruolo = "Paziente";
    } else if (location.pathname.includes("login_medico.html")) {
      data.ruolo = "Medico";
    } else if (location.pathname.includes("amministratore_login.html")) {
      data.ruolo = "Amministratore";
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      let body = {};
      try {
        body = await res.json();
      } catch (err) {
        console.warn("Risposta non JSON", err);
      }

      if (!res.ok) {
        showMessage(body.errore || "Email o password non valide", 'danger');
        return;
      }

      // Login riuscito → redirect
      showMessage("Login effettuato con successo!", 'success');
      setTimeout(() => {window.location.href = `http://${url}/Tesi/index.html`;}, 2000);

      if (data.ruolo === "Paziente") {
        window.location.href = `../appuntamenti/appuntamenti_Paziente.html`;
      } else if (data.ruolo === "Medico") {
        window.location.href = `../appuntamenti/appuntamenti_medico.html`;
      } else if (data.ruolo === "Amministratore") {
        window.location.href = `../amministratore/gestione_medici.html`;
      }

    } catch (err) {
      showMessage("Problema di connessione, riprova più tardi", 'danger');
    }
  });
});