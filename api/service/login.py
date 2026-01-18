from classi import paziente, medico, amministratore
from werkzeug.security import check_password_hash

CLASSI = {
    "Paziente": paziente.Paziente,
    "Medico": medico.Medico,
    "Amministratore": amministratore.Amministratore
}

def autenticazione(email: str, password: str, ruolo: str):
    if ruolo not in CLASSI:
        return None, "ruolo non valido"
    model = CLASSI[ruolo]
    utente = model.query.filter_by(email=email).first()

    if not utente:
        return None, "non registrato"
    if not check_password_hash(utente.password, password):
        return None, "password errata"

    return utente, None