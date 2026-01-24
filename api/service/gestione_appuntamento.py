from datetime import date, datetime
from api.service import session
from classi.appuntamento import Appuntamento
from classi.medico import Medico
from classi.paziente import Paziente


#ELIMINA
def elimina_appuntamento(id_appuntamento):
    #RICERCA DI UN APPUNTAMENTO NEL DATABASE TRAMITE ID
    appuntamento = Appuntamento.query.filter_by(id=id_appuntamento).first()
    if not appuntamento:
        return False, "Appuntamento non trovato"

    #ELIMINAZIONE DELL'APPUNTAMENTO
    Appuntamento.query.session.delete(appuntamento)
    Appuntamento.query.session.commit()
    return True, None


#ACCETTA
def accetta_appuntamento(id_appuntamento):
    #RICERCA APPUNTAMENTO NEL DATABASE TRAMITE ID
    appuntamento = Appuntamento.query.filter_by(id=id_appuntamento).first()
    sessione = session.sessione_utente()
    if not appuntamento:
        return False, "Appuntamento non trovato"

    #VERIFICA CHE LO SLOT SIA LIBERO TRAMITE LA RICERCA DI UN ALTRO APPUNTAMENTO FILTRATO CON I SEGUENTI PARAMETRI
    slot = Appuntamento.query.filter_by(
        medico_id=appuntamento.medico_id,
        data=appuntamento.data,
        ora=appuntamento.ora
    ).first()

    if slot and slot.id != appuntamento.id:
        return False, "Slot già occupato"

    if sessione["ruolo"] == "Medico" and appuntamento.stato != "in attesa di conferma dal medico":
        return False,  "Operazione non consentita"

    if sessione["ruolo"] == "Paziente" and appuntamento.stato != "in attesa di conferma dal paziente":
        return False, "Operazione non consentita"

    appuntamento.stato = "confermato"
    #MODIFICA DESCRIZIONE APPUNTAMENTO CON CONFERMATO
    Appuntamento.query.session.commit()
    return True, None


#CREA
def crea_appuntamento(payload):
    #CONTROLLO DATI NECESSARI
    required = ["medico_id", "paziente_id", "descrizione", "data", "ora", "ruolo"]
    if not all(payload.get(k) for k in required):
        return None, "Parametri mancanti"
    
    #CONTROLLO DATA
    try:
        data_obj = datetime.strptime(payload["data"], "%Y-%m-%d").date()
        if data_obj < date.today():
            return None, "Data precedente ad oggi"
    except ValueError:
        return None, "Formato data non valido"

    #DEFINIZIONE STATO APPUNTAMENTO IN BASE AL RUOLO E IMPOSTO I FILTRI DA RICERCARE
    if payload["ruolo"] == "Medico":
        stato = "confermato"
        slot = Appuntamento.query.filter_by(medico_id=payload["medico_id"], data=payload["data"], ora=payload["ora"]).first()
    else: 
        stato = "in attesa di conferma dal medico"
        slot = Appuntamento.query.filter_by(paziente_id=payload["paziente_id"], data=payload["data"], ora=payload["ora"]).first()
    
    #VERIFICA SLOT
    if slot:
        return None, "Slot già occupato"

    #DEFINIZIONE ATTRIBUTI
    nuovo = Appuntamento(
        medico_id=payload["medico_id"],
        paziente_id=payload["paziente_id"],
        descrizione=payload["descrizione"],
        data=payload["data"],
        ora=payload["ora"],
        stato=stato
    )
    #INSERIMENTO DEGLI ATTRIBUTI NEL DATABASE
    Appuntamento.query.session.add(nuovo)
    Appuntamento.query.session.commit()
    return nuovo, None


#MODIFICA
def modifica_appuntamento(payload):
    id_app = payload.get("id")
    ruolo = payload.get("ruolo")

    ##RICERCA APPUNTAMENTO NEL DATABASE TRAMITE ID
    appuntamento = Appuntamento.query.filter_by(id=id_app).first()
    if not appuntamento:
        return False, "Appuntamento non trovato"
    try:
        #CONVERSIONE STRINGA DATA IN UN OGGETTO DATA
        data_appuntamento = datetime.strptime(payload["data"], "%Y-%m-%d").date()
    except ValueError:
        return False, "Formato data non valido"
    
    #VERIFICA CHE LO SLOT SIA LIBERO TRAMITE LA RICERCA DI UN ALTRO APPUNTAMENTO FILTRATO CON I SEGUENTI PARAMETRI
    slot = Appuntamento.query.filter_by(
        medico_id=appuntamento.medico_id,
        data=data_appuntamento,
        ora=payload["ora"]
    ).first()

    if slot and slot.id != appuntamento.id:
        return False, "Slot già occupato"

    appuntamento.data = data_appuntamento
    appuntamento.ora = payload["ora"]
    appuntamento.descrizione = payload["descrizione"]
    appuntamento.stato = ("in attesa di conferma dal paziente" if ruolo == "Medico" else "in attesa di conferma dal medico")

    #MODIFICA DEL DATABASE CON LE NUOVE MODIFICHE
    Appuntamento.query.session.commit()
    return True, None


#LISTA
def lista_appuntamenti(user, stati, start=None, end=None):
    stati_list = [s.strip() for s in stati.split(",") if s.strip()]

    if user["ruolo"] == "Medico":
        #RICERCA DEGLI APPUNTAMENTI MEDICO IN BASE ID MEDICO
        query = Appuntamento.query.filter_by(medico_id=user["id"])
    elif user["ruolo"] == "Paziente":
        #RICERCA APPUNTAMENTI PAZIENTE IN BASE ID PAZIENTE
        query = Appuntamento.query.filter_by(paziente_id=user["id"])
    else:
        return None, "Ruolo non valido"
    
    if stati_list:
        query = query.filter(Appuntamento.stato.in_(stati_list))

    if start and end:
        try:
            start_dt = datetime.strptime(start, "%Y-%m-%d")
            end_dt = datetime.strptime(end, "%Y-%m-%d")
            query = query.filter(Appuntamento.data >= start_dt, Appuntamento.data < end_dt)
        except ValueError:
            return None, "Formato data non valido"

    appuntamenti = query.all()
    result = []

    for a in appuntamenti:
        p = Paziente.query.get(a.paziente_id)
        m = Medico.query.get(a.medico_id)
        result.append({
            "id": a.id,
            "data": a.data.strftime("%Y-%m-%d"),
            "ora": a.ora.strftime("%H:%M"),
            "descrizione": a.descrizione,
            "paziente": f"{p.nome} {p.cognome}",
            "medico": f"{m.nome} {m.cognome} - {m.specializzazione}",
            "stato": a.stato
        })
    return result, None
