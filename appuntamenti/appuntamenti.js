const API_BASE = `${location.protocol}//${location.hostname}:5000`;
let flatpickrRegistra = null;
let flatpickrModifica = null;
let pendingModificaOra = null;

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

function calcolaFine30Minuti(data, ora) {
  const d = new Date(`${data}T${ora}`);
  d.setMinutes(d.getMinutes() + 30);
  return d.toISOString();
}

function normalizzaDataPerInput(dateStr) {
  // accetta DD/MM/YYYY o MM/DD/YYYY
  const parts = dateStr.includes("/")
    ? dateStr.split("/")
    : dateStr.split("-");

  if (parts[0].length === 4) return dateStr; // già YYYY-MM-DD

  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}


function initFlatpickr(selector, defaultOra = "08:00") {
  return flatpickr(selector, {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    minuteIncrement: 15,
    minTime: "08:00",
    maxTime: "19:00",
    defaultDate: defaultOra
  });
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


/************************************************************
 * API APPUNTAMENTI (CRUD)
 ************************************************************/
async function eliminaAppuntamento(id) {
  const res = await fetch(
    `${API_BASE}/gestione_appuntamento/elimina?id=${id}`,
    { method: "DELETE", credentials: "include" }
  );

  if (!res.ok) {
    alert("Errore durante l'eliminazione");
    return;
  }

  window.location.reload();
}

async function confermaAppuntamento(id) {
  const res = await fetch(
    `${API_BASE}/gestione_appuntamento/accetta?id=${id}`,
    { method: "POST", credentials: "include" }
  );

  if (!res.ok) {
    try {
      const data = await res.json();
      alert(data.error || "Errore durante la conferma");
    } catch (e) {
      alert(e);
    }
    return;
  }
  window.location.reload();
}

async function registraAppuntamento() {
  const session = await getSessionData();
  if (!session) return;

  const payload = {
    data: document.getElementById("data").value,
    ora: document.getElementById("registraOra").value,
    descrizione: document.getElementById("descrizione").value,
    ruolo: session.ruolo
  };

  if (session.ruolo === "Medico") {
    payload.medico_id = session.id;
    payload.paziente_id = document.getElementById("paziente").value;
  } else {
    payload.paziente_id = session.id;
    payload.medico_id = document.getElementById("medico").value;
  }

  try {
    const res = await fetch(
      `${API_BASE}/gestione_appuntamento/crea`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Errore backend:", err);
      alert("Errore durante la registrazione");
      return;
    }

    window.location.reload();
  } catch (err) {
    console.error("Errore rete:", err);
    alert("Errore di connessione");
  }
}

function modificaAppuntamento(id, data, ora, descrizione) {
  document.getElementById("modificaAppId").value = id;

  // DATA → formato corretto
  document.getElementById("modificaData").value =
    normalizzaDataPerInput(data);

  // DESCRIZIONE
  document.getElementById("modificaDescrizione").value =
    descrizione || "";

  // ORA
  if (flatpickrModifica) {
    flatpickrModifica.destroy();
  }
  flatpickrModifica = initFlatpickr("#modificaOra", ora);

  $("#modificaAppuntamentoModal").modal("show");
}


/************************************************************
 * CALENDARIO
 ************************************************************/
async function inizializzaCalendario(session) {
  const calendarEl = document.getElementById("calendario");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    locale: "it",
    slotMinTime: "08:00:00",
    slotMaxTime: "20:00:00",
    slotDuration: "00:30:00",
    allDaySlot: false,

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },

    events: async (info, success, failure) => {
      const stato =
        session.ruolo === "Medico"
          ? "confermato,in attesa di conferma dal paziente"
          : "confermato,in attesa di conferma dal medico";

      try {
        const res = await fetch(
          `${API_BASE}/gestione_appuntamento/lista` +
          `?start=${info.startStr.split("T")[0]}` +
          `&end=${info.endStr.split("T")[0]}` +
          `&stato=${encodeURIComponent(stato)}`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("Errore eventi");

        const data = await res.json();
        success(
          data.map(app => ({
            id: app.id,
            title: app.medico || app.paziente,
            start: `${app.data}T${app.ora}`,
            end: calcolaFine30Minuti(app.data, app.ora),
            color: app.stato.includes("attesa") ? "gray" : "",
            extendedProps: app
          }))
        );
      } catch (err) {
        console.error(err);
        failure(err);
      }
    },

    eventClick(info) {
      const app = info.event.extendedProps;

      document.getElementById("modalBodyEvento").innerHTML = `
        <b>Data:</b> ${app.data}<br>
        <b>Ora:</b> ${app.ora}<br>
        <b>Descrizione:</b> ${app.descrizione || ""}<br>
        <b>Stato:</b> ${app.stato}<br>

        <div style="margin-top:10px">
          <img src="../immagini/negative-minus-svgrepo-com.svg"
              width="25" height="25"
              onclick="eliminaAppuntamento('${app.id}')"/>

          <img src="../immagini/pencil-svgrepo-com (1).svg"
              width="25" height="25"
              onclick="modificaAppuntamento('${app.id}', '${app.data}', '${app.ora}', '${(app.descrizione)}')"/>

          <img src="../immagini/accept-check-good-mark-ok-tick-svgrepo-com.svg"
              width="25" height="25"
              onclick="confermaAppuntamento('${app.id}')"/>
        </div>
      `;

      $("#eventoModal").modal("show");
    }
  });

  calendar.render();
}

/************************************************************
 * TABELLA
 ************************************************************/
async function generaTabella(session) {
  const stato =
    session.ruolo === "Medico"
      ? "in attesa di conferma dal medico"
      : "in attesa di conferma dal paziente";

  try {
    const res = await fetch(
      `${API_BASE}/gestione_appuntamento/lista?stato=${encodeURIComponent(stato)}`,
      { credentials: "include" }
    );

    if (!res.ok) throw new Error("Errore tabella");

    const data = await res.json();
    const tbody = document.querySelector("#tabella-appuntamenti tbody");
    tbody.innerHTML = "";

    data.forEach(app => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${app.data}</td>
        <td>${app.ora}</td>
        <td>${app.medico || app.paziente}</td>
        <td>${app.descrizione || ""}</td>
        <td>
          <img src="../immagini/negative-minus-svgrepo-com.svg" id="${app.id}" width="25" height="25" onclick="eliminaAppuntamento('${app.id}')"/>
          <img src=../immagini/pencil-svgrepo-com (1).svg" width="25" height="25" onclick="modificaAppuntamento('${app.id}','${app.data}','${app.ora}','${(app.descrizione)}')"/>
          <img src="../immagini/accept-check-good-mark-ok-tick-svgrepo-com.svg" id="${app.id}" width="25" height="25" onclick="confermaAppuntamento('${app.id}')"/>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    alert("Errore caricamento tabella");
  }
}

/************************************************************
 * SELECT MEDICO / PAZIENTE
 ************************************************************/
async function initSelectRuolo(session) {
  if (session.ruolo === "Medico" && document.getElementById("paziente")) {
    const res = await fetch(`${API_BASE}/utenti`, {
      credentials: "include"
    });
    const data = await res.json();

    $("#paziente").select2({
      dropdownParent: $("#registraAppuntamentoModal"),
      width: "100%",
      data: data.map(u => ({
        id: u.id,
        text: `${u.nome} ${u.cognome}`
      }))
    });
  }

  if (session.ruolo === "Paziente" && document.getElementById("medico")) {
    const res = await fetch(`${API_BASE}/medico/lista_medici`, {
      credentials: "include"
    });
    const data = await res.json();

    $("#medico").select2({
      dropdownParent: $("#registraAppuntamentoModal"),
      width: "100%",
      data: data.map(m => ({
        id: m.id,
        text: `${m.nome} ${m.cognome} - ${m.specializzazione}`
      }))
    });
  }
}

/************************************************************
 * EVENTI & INIT
 ************************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  const session = await getSessionData();
  if (!session) {
    window.location.href = "/Tesi/index.html";
    return;
  }

  inizializzaCalendario(session);
  generaTabella(session);
});

$('#registraAppuntamentoModal').on('shown.bs.modal', async function () {
  if (flatpickrRegistra) flatpickrRegistra.destroy();
  flatpickrRegistra = initFlatpickr("#registraOra");

  const session = await getSessionData();
  if (session) initSelectRuolo(session);
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registraAppuntamentoForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await registraAppuntamento();
  });
});

document.addEventListener("DOMContentLoaded", async () => {
    const session = await getSessionData();
    if (!session) {
        window.location.href = "/Tesi/index.html";
        return;
    }
    if (session.ruolo === 'Medico') {
        const h = document.getElementById('medico');
    if (h) h.textContent = "Dr. " + session.nome + " " + session.cognome;
    } else {
        const h = document.getElementById('utente');
        if (h) h.textContent += session.nome + " " + session.cognome;
    }
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("modificaAppuntamentoForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const session = await getSessionData();
    if (!session) {
      alert("Sessione non valida");
      return;
    }

    const payload = {
      id: document.getElementById("modificaAppId").value,
      data: document.getElementById("modificaData").value,
      ora: document.getElementById("modificaOra").value,
      descrizione: document.getElementById("modificaDescrizione").value,
      ruolo: session.ruolo
    };

    try {
      const res = await fetch(
        `${API_BASE}/gestione_appuntamento/modifica`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.error("Errore backend:", err);
        alert("Errore durante la modifica");
        return;
      }

      $("#modificaAppuntamentoModal").modal("hide");
      window.location.reload();
    } catch (err) {
      console.error("Errore rete:", err);
      alert("Errore di connessione");
    }
  });
});

/************************************************************
 * ESPOSIZIONE GLOBALE
 ************************************************************/
window.eliminaAppuntamento = eliminaAppuntamento;
window.confermaAppuntamento = confermaAppuntamento;
window.registraAppuntamento = registraAppuntamento;
window.modificaAppuntamento = modificaAppuntamento;
window.logout = logout;
