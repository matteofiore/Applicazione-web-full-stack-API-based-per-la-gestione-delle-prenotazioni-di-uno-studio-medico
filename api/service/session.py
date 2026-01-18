from utils import cookie
from classi.paziente import Paziente
from classi.medico import Medico
from classi.amministratore import Amministratore

def sessione_utente():
    session_id = cookie.get_cookie()
    if not session_id:
        return None

    try:
        ruolo, user_id = session_id.split('_')
    except ValueError:
        return None

    if ruolo == "Paziente":
        user = Paziente.query.get(user_id)
    elif ruolo == "Medico":
        user = Medico.query.get(user_id)
    elif ruolo == "Amministratore":
        user = Amministratore.query.get(user_id)
    else:
        return None

    if not user:
        return None

    return {"id": user.id, "ruolo": ruolo, "nome": user.nome, "cognome": user.cognome}

def elimina_sessione(response):
    response.delete_cookie("sessionId", path="/")
    return response

