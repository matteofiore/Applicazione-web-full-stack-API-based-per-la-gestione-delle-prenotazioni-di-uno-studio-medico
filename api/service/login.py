from classi import paziente, medico, amministratore
from werkzeug.security import check_password_hash

CLASSI = {
    "Paziente": paziente.Paziente,
    "Medico": medico.Medico,
    "Amministratore": amministratore.Amministratore
}

#FUNZIONE PER AUTENTICARE UTENTE
def autenticazione(email, password, ruolo):
    #CONTROLLO RUOLO
    if ruolo not in CLASSI:
        return None, "ruolo non valido"
    model = CLASSI[ruolo]
    #RICERCA PRESENZA UTENTE NEL DATABASE
    utente = model.query.filter_by(email=email).first()

    if not utente:
        return None, "non registrato"
    if not check_password_hash(utente.password, password):
        return None, "password errata"

    return utente, None