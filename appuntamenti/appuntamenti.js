//COSTRUZIONE URL DINAMICO
const API_BASE = `${location.protocol}//${location.hostname}:5000`;

let flatpickrRegistra = null;
let flatpickrModifica = null;
let pendingModificaOra = null;

//FUNZIONE VERIFICA SESSIONE
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
    return { ruolo: data.ruolo, id: data.id, nome: data.nome, cognome: data.cognome};
  } catch (err) {
    console.error("Errore sessione:", err);
    alert("Errore nel recupero della sessione");
    return null;
  }
}

//FUNZIONE PER CALCOLARE LA FINE DELL'APPUNTAMENTO
function calcolaFine30Minuti(data, ora) {
  const d = new Date(`${data}T${ora}`);
  d.setMinutes(d.getMinutes() + 30);
  return d.toISOString();
}

//FUNZIONE PER TRASFORMARE LA DATA NEL FORMATO YYYY-MM-DD
function normalizzaDataPerInput(dateStr) {
  const parts = dateStr.includes("/")
    ? dateStr.split("/")
    : dateStr.split("-");
  if (parts[0].length === 4) return dateStr; // DATA GIA NEL FORMATO YYYY-MM-DD
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

//FUNZIONE PER INIZIALIZZARE UN SELETTORE DI DATA/ORA
function initFlatpickr(selector, defaultOra = "08:00") {
  return flatpickr(selector, {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    minuteIncrement: 30, //INCREMENTO DI 30 MINUTI IN 30 MINUTI
    minTime: "08:00", //ORARIO MINIMO ACCETTATO
    maxTime: "19:00", //ORARIO MASSIMO ACCETTATO
    defaultDate: defaultOra
  });
}

//FUNZIONE PER EFFETTUARE LOGOUT
async function logout() {
  try {
    //CHIAMATA API PER EFFETTUARE LOGOUT
    const res = await fetch(`${API_BASE}/session`,
      {
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

//FUNZIONE PER ELIMINARE UN APPUNTAMENTO
async function eliminaAppuntamento(id) {
  //CHIAMATA API PER ELIMINARE APPUNTAMENTO IN BASE ALL'ID
  const res = await fetch(`${API_BASE}/gestione_appuntamento/elimina?id=${id}`,
    {
      method: "DELETE",
      credentials: "include"
    }
  );
  if (!res.ok) {
    alert("Errore durante l'eliminazione");
    return;
  }
  window.location.reload();
}

//FUNZIONE PER CONFERMARE APPUNTAMENTO IN BASE ALL'ID
async function confermaAppuntamento(id) {
  //CHIAMATA API PER CONFERMARE L'APPUNTAMENTO
  const res = await fetch(
    `${API_BASE}/gestione_appuntamento/accetta?id=${id}`,
    {
      method: "POST",
      credentials: "include"
    }
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

//FUNZIONE REGISTRAZIONE APPUNTAMENTO
async function registraAppuntamento() {
  const session = await controlloSessione(); //CHECK PRESENZA COOKIE
  if (!session) return;
 
  //CREAZIONE PAYLOAD CON I DATI PRESI DAL FORM
  const payload = {
    data: document.getElementById("data").value,
    ora: document.getElementById("registraOra").value,
    descrizione: document.getElementById("descrizione").value,
    ruolo: session.ruolo
  };

  //DEFINIZIONE DEL RUOLO DELL'UTENTE DA AGGIUNGERE AL PAYLOAD
  if (session.ruolo === "Medico") {
    payload.medico_id = session.id;
    payload.paziente_id = document.getElementById("paziente").value;
  } else {
    payload.paziente_id = session.id;
    payload.medico_id = document.getElementById("medico").value;
  }
  //INVIO TRAMITE API I DATI DEL FORM IN JSON
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
    //GESTIONE RISPOSTA API
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

//FUNZIONE PER APRIRE UN MODAL PER MODIFICARE L'APPUNTAMENTO
function modificaAppuntamento(id, data, ora, descrizione) {
  document.getElementById("modificaAppId").value = id;

  //TRASFORMO LA DATA NELLA VISUALIZZAZIONE CORRETTA
  document.getElementById("modificaData").value =
    normalizzaDataPerInput(data);

  document.getElementById("modificaDescrizione").value = descrizione || "";

  if (flatpickrModifica) {
    flatpickrModifica.destroy();
  }
  flatpickrModifica = initFlatpickr("#modificaOra", ora);

  $("#modificaAppuntamentoModal").modal("show");
}

//FUNZIONE PER COSTRUIRE IL CALENDARIO PRESENTE NELLA PAGINA HTML
async function inizializzaCalendario(session) {
  const calendarEl = document.getElementById("calendario");

  //CREAZIONE DEL NUOVO CALENDARIO
  const calendario = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    locale: "it",
    slotMinTime: "08:00:00",
    slotMaxTime: "20:00:00",
    slotDuration: "00:30:00",
    allDaySlot: false,

    //AGGIUNTA NELL'HEADER IL TITOLO, LA VISUALIZZAZIONE PER MESE, SETTIMANE GIORNO E DUE FRECCE PER SCORRERE
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
        const res = await fetch(`${API_BASE}/gestione_appuntamento/lista`+`?start=${info.startStr.split("T")[0]}`+`&end=${info.endStr.split("T")[0]}`+`&stato=${encodeURIComponent(stato)}`,{
          credentials: "include"
        }
      );

        if (!res.ok){
          return;
        }

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

    //FUNZIONE CHE AL CLICK DELL'EVENTO APRE UN MODAL PER VEDERE NEL DETTAGLIO L'EVENTO
    eventClick(info) {
      const app = info.event.extendedProps;
      document.getElementById("modalBodyEvento").innerHTML = `
        <b>Data:</b> ${app.data}<br>
        <b>Ora:</b> ${app.ora}<br>
        <b>Medico:</b> ${app.medico || "N/A"}<br>
        <b>Paziente:</b> ${app.paziente || "N/A"}<br>
        <b>Descrizione:</b> ${app.descrizione || ""}<br>
        <b>Stato:</b> ${app.stato}<br>

        <div style="margin-top:10px">
          <img src="../immagini/negative-minus-svgrepo-com.svg"
              width="25" height="25"
              onclick="eliminaAppuntamento('${app.id}')"/>

          <img src="../immagini/pencil-svgrepo-com.svg"
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

  calendario.render();
}

//FUNZIONE PER GENERARE LA TABELLA NELLA PAGINA HTML
async function generaTabella(session) {
  const stato =
    session.ruolo === "Medico"
      ? "in attesa di conferma dal medico"
      : "in attesa di conferma dal paziente";

  try {
    const res = await fetch(`${API_BASE}/gestione_appuntamento/lista?stato=${encodeURIComponent(stato)}`,
    {
      credentials: "include"
    }
    );

    if (!res.ok){
      return;
    }

    const data = await res.json();
    const tbody = document.querySelector("#tabella-appuntamenti tbody");
    tbody.innerHTML = "";

    //INSERIMENTO RIGHE TABELLA
    data.forEach(app => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${app.data}</td>
        <td>${app.ora}</td>
        <td>${app.medico || app.paziente}</td>
        <td>${app.descrizione || ""}</td>
        <td>
          <img src="../immagini/negative-minus-svgrepo-com.svg" id="${app.id}" width="25" height="25" onclick="eliminaAppuntamento('${app.id}')"/>
          <img src="../immagini/pencil-svgrepo-com.svg" width="25" height="25" onclick="modificaAppuntamento('${app.id}','${app.data}','${app.ora}','${(app.descrizione)}')"/>
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

//FUNZIONE CHE IN BASE AL RUOLO  ESTRAPOLA LA LISTA DI UTENTI O MEDICI
async function initSelectRuolo(session) {
  if (session.ruolo === "Medico" && document.getElementById("paziente")) {
    const res = await fetch(`${API_BASE}/utenti`,
      {
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
    const res = await fetch(`${API_BASE}/medico/lista`,
      {
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

//LISTENER CHE SI ATTIVA AL CARICAMENTO DELLA PAGINA
document.addEventListener("DOMContentLoaded", async () => {
  const session = await controlloSessione();
  if (!session) {
    window.location.href = "../index.html";
    return;
  }
  if (session.ruolo === 'Medico') {
    const h = document.getElementById('medico');
    if (h) h.textContent = "Dr. " + session.nome + " " + session.cognome;
  } else {
    const h = document.getElementById('utente');
    if (h) h.textContent += session.nome + " " + session.cognome;
  }

  inizializzaCalendario(session);
  generaTabella(session);
});

$('#registraAppuntamentoModal').on('shown.bs.modal', async function () {
  if (flatpickrRegistra) flatpickrRegistra.destroy();
  flatpickrRegistra = initFlatpickr("#registraOra");

  const session = await controlloSessione();
  if (session) initSelectRuolo(session);

  const form = document.getElementById("registraAppuntamentoForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    await registraAppuntamento();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("modificaAppuntamentoForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const session = await controlloSessione();
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

//FUNZIONI GLOBALI
window.eliminaAppuntamento = eliminaAppuntamento;
window.confermaAppuntamento = confermaAppuntamento;
window.registraAppuntamento = registraAppuntamento;
window.modificaAppuntamento = modificaAppuntamento;
window.logout = logout;