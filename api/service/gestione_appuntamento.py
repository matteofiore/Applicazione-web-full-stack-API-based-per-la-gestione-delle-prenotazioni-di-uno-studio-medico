from datetime import date, datetime
from api.service import session

from flask import app, jsonify
from classi.appuntamento import Appuntamento
from classi.medico import Medico
from classi.paziente import Paziente


# ---------------- ELIMINA ----------------
def elimina_appuntamento(id_appuntamento):
    appuntamento = Appuntamento.query.filter_by(id=id_appuntamento).first()
    if not appuntamento:
        return False, "Appuntamento non trovato"

    Appuntamento.query.session.delete(appuntamento)
    Appuntamento.query.session.commit()
    return True, None


# ---------------- ACCETTA ----------------
def accetta_appuntamento(id_appuntamento):
    appuntamento = Appuntamento.query.filter_by(id=id_appuntamento).first()
    sessione = session.sessione_utente()
    if not appuntamento:
        return False, "Appuntamento non trovato"

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
    Appuntamento.query.session.commit()
    return True, None


# ---------------- CREA ----------------
def crea_appuntamento(payload):
    print(payload)
    required = ["medico_id", "paziente_id", "descrizione", "data", "ora", "ruolo"]
    if not all(payload.get(k) for k in required):
        return None, "Parametri mancanti"

    ruolo = payload["ruolo"]
    stato = "confermato" if ruolo == "Medico" else "in attesa di conferma dal medico"

    slot = Appuntamento.query.filter_by(medico_id=payload["medico_id"], data=payload["data"], ora=payload["ora"]).first()

    if slot:
        return None, "Slot già occupato"

    try:
        data_obj = datetime.strptime(payload["data"], "%Y-%m-%d").date()
        if data_obj < date.today():
            return None, "Data precedente ad oggi"
    except ValueError:
        return None, "Formato data non valido"

    nuovo = Appuntamento(
        medico_id=payload["medico_id"],
        paziente_id=payload["paziente_id"],
        descrizione=payload["descrizione"],
        data=payload["data"],
        ora=payload["ora"],
        stato=stato
    )

    Appuntamento.query.session.add(nuovo)
    Appuntamento.query.session.commit()
    return nuovo, None


# ---------------- MODIFICA ----------------
def modifica_appuntamento(payload):
    id_app = payload.get("id")
    ruolo = payload.get("ruolo")
    print(payload)

    if not id_app or ruolo not in ["Medico", "Paziente"]:
        return False, "Parametri non validi"

    appuntamento = Appuntamento.query.filter_by(id=id_app).first()
    if not appuntamento:
        return False, "Appuntamento non trovato"

    slot = Appuntamento.query.filter_by(
        medico_id=appuntamento.medico_id,
        data=payload["data"],
        ora=payload["ora"]
    ).first()

    if slot and slot.id != appuntamento.id:
        return False, "Slot già occupato"

    appuntamento.data = payload["data"]
    appuntamento.ora = payload["ora"]
    appuntamento.descrizione = payload["descrizione"]
    appuntamento.stato = (
        "in attesa di conferma dal paziente"
        if ruolo == "Medico"
        else "in attesa di conferma dal medico"
    )

    Appuntamento.query.session.commit()
    return True, None


# ---------------- LISTA ----------------
def lista_appuntamenti(user, stati, start=None, end=None):
    stati_list = [s.strip() for s in stati.split(",") if s.strip()]

    if user["ruolo"] == "Medico":
        query = Appuntamento.query.filter_by(medico_id=user["id"])
    else:
        query = Appuntamento.query.filter_by(paziente_id=user["id"])

    if stati_list:
        query = query.filter(Appuntamento.stato.in_(stati_list))

    if start and end:
        start_dt = datetime.strptime(start, "%Y-%m-%d")
        end_dt = datetime.strptime(end, "%Y-%m-%d")
        query = query.filter(Appuntamento.data >= start_dt, Appuntamento.data < end_dt)

    appuntamenti = query.all()
    result = []

    for a in appuntamenti:
        if user["ruolo"] == "Medico":
            p = Paziente.query.get(a.paziente_id)
            result.append({
                "id": a.id,
                "data": a.data.strftime("%Y-%m-%d"),
                "ora": a.ora.strftime("%H:%M"),
                "descrizione": a.descrizione,
                "paziente": f"{p.nome} {p.cognome}",
                "stato": a.stato
            })
        else:
            m = Medico.query.get(a.medico_id)
            result.append({
                "id": a.id,
                "data": a.data.strftime("%Y-%m-%d"),
                "ora": a.ora.strftime("%H:%M"),
                "descrizione": a.descrizione,
                "medico": f"{m.nome} {m.cognome} - {m.specializzazione}",
                "stato": a.stato
            })

    return result
