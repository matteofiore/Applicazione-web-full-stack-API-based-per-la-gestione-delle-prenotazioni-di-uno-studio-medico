//COSTRUZIONE URL DINAMICO
const API_BASE = `${location.protocol}//${location.hostname}:5000`;

//FUNZIONE PER MOSTRARE MESSAGGI DI ERRORE O SUCCESSO NEL BOX HTML
function mostraMessaggio(message, type = 'danger') {
  const box = document.getElementById('api-error');

  //VERIFICA ESISTENZA ELEMENTO
  if (!box){
    return;
  }
  box.textContent = message;
  box.classList.remove('d-none', 'alert-danger', 'alert-success');
  box.classList.add(`alert-${type}`);
}

//DEFINIZIONE PER CANCELLARE MESSAGGIO NELLA BOX
function cancellaMessaggio() {
  const box = document.getElementById('api-error');
  if (!box) return;

  box.textContent = '';
  box.classList.add('d-none');
  box.classList.remove('alert-danger', 'alert-success');
}

//LISTENER PER LA GESTIONE DEL SUBMIT DEL FORM DI REGISTRAZIONE
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  cancellaMessaggio();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  if (location.pathname.includes('registrazione.html')) {
    data.ruolo = 'Paziente';
  } else if (location.pathname.includes('registra_medico.html')) {
    data.ruolo = 'Medico';
  }
  //VERIFICA COINCIDENZA PASSWORD
  if (data.password !== data.password1) {
    mostraMessaggio('Le password non corrispondono', 'danger');
    return;
  }

  delete data.password1; //ELIMINO PASSWORD1 NON NECESSARIO

  //CHIAMATA API PER REGISTRARE UTENTE
  try {
    const res = await fetch(`${API_BASE}/registrazione`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      mostraMessaggio(body.errore || 'Errore durante la registrazione', 'danger');
      return;
    }
    mostraMessaggio('Registrazione avvenuta con successo!', 'success');
    e.target.querySelector('input[type="submit"]').disabled = true;
    setTimeout(() => {window.location.href = `../index.html`;}, 3000); 
  } catch (err) {
    console.error('Errore di rete:', err);
    mostraMessaggio('Problema di connessione, riprova più tardi', 'danger');
  }
});

//EVENTO ESEGUITO AL COMPLETO CARICAMENTO DEL DOM
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('start');
  if (!input) return;

  const todayIso = new Date().toLocaleDateString('en-CA');
  input.value = todayIso;
  input.max = todayIso;
});