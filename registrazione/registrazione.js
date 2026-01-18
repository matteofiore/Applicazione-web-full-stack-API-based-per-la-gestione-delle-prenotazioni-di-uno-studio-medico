const API_BASE = `${location.protocol}//${location.hostname}:5000`;

function showMessage(message, type = 'danger') {
  const box = document.getElementById('api-error');
  if (!box) return;

  box.textContent = message;

  // reset classi
  box.classList.remove('d-none', 'alert-danger', 'alert-success');
  box.classList.add(`alert-${type}`);
}

function clearMessage() {
  const box = document.getElementById('api-error');
  if (!box) return;

  box.textContent = '';
  box.classList.add('d-none');
  box.classList.remove('alert-danger', 'alert-success');
}

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  if (location.pathname.includes('registrazione.html')) {
    data.ruolo = 'Paziente';
  } else if (location.pathname.includes('registra_medico.html')) {
    data.ruolo = 'Medico';
  }

  if (data.password !== data.password1) {
    showMessage('Le password non corrispondono', 'danger');
    return;
  }

  delete data.password1;

  try {
    const res = await fetch(`${API_BASE}/registrazione`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    let body = {};
    try {
      body = await res.json();
      } catch (err) {
        console.warn("Risposta non JSON", err);
      }

    if (!res.ok) {
      showMessage(body.errore || 'Errore durante la registrazione', 'danger');
      return;
    }
    showMessage('Registrazione avvenuta con successo!', 'success');
    e.target.querySelector('input[type="submit"]').disabled = true;
    setTimeout(() => {window.location.href = `../index.html`;}, 3000); // 10000 ms = 10 secondi
    

  } catch (err) {
    console.error('Errore di rete:', err);
    showMessage('Problema di connessione, riprova più tardi', 'danger');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('start');
  if (!input) return;

  const todayIso = new Date().toLocaleDateString('en-CA');
  input.value = todayIso;
  input.max = todayIso;
});