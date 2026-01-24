from flask import Blueprint, request, jsonify
from api.service.session import sessione_utente
from api.service.gestione_appuntamento import elimina_appuntamento, accetta_appuntamento, crea_appuntamento, modifica_appuntamento, lista_appuntamenti
from api.service.session import controllo_ruoli

#CREAZIONE BLUEPRINT PER LA GESTIONE DELLE OPERAZIONI DEGLI APPUNTAMENTI
gestione_appuntamento_bp = Blueprint("gestione_appuntamento", __name__, url_prefix="/gestione_appuntamento")

#CHIAMATA API PER ELIMINARE UN APPUNTAMENTO DA ID
@gestione_appuntamento_bp.route("/elimina", methods=["DELETE"])
def elimina():
    #VERIFICA CHE L'ENDPOINT SIA RICHIESTO DA UN RUOLO AUTORIZZATO
    error, status = controllo_ruoli(['Paziente', 'Medico'])
    if error:
        return jsonify({'errore': error}), status
    ok, err = elimina_appuntamento(request.args.get("id"))
    if not ok:
        if err == "Appuntamento non trovato":
            return jsonify({"error": err}), 404

        return jsonify({"error": err}), 409
    return jsonify({"message": "Appuntamento eliminato"}), 200

#CHIAMATA API PER ACCETTARE UN APPUNTAMENTO DA ID
@gestione_appuntamento_bp.route("/accetta", methods=["POST"])
def accetta():
    #VERIFICA CHE L'ENDPOINT SIA RICHIESTO DA UN RUOLO AUTORIZZATO
    error, status = controllo_ruoli(['Paziente', 'Medico'])
    if error:
        return jsonify({'errore': error}), status
    ok, err = accetta_appuntamento(request.args.get("id"))
    if not ok:
        if err == "Appuntamento non trovato":
            return jsonify({"error": err}), 404
        if err in ["Slot già occupato", "Operazione non consentita"]:
            return jsonify({"error": err}), 409
    return jsonify({"message": "Appuntamento confermato"}), 200

#CREAZIONE APPUNTAMENTO
@gestione_appuntamento_bp.route("/crea", methods=["POST"])
def crea():
    #VERIFICA CHE L'ENDPOINT SIA RICHIESTO DA UN RUOLO AUTORIZZATO
    error, status = controllo_ruoli(['Paziente', 'Medico']) 
    if error:
        return jsonify({'errore': error}), status
    
    #RICHIAMO DELLA FUNZIONE PER CREARE UN APPUNTAMENTO
    nuovo, err = crea_appuntamento(request.get_json())

    #GESTIONE DEGLI ERRORI RIPORTATI DALLA FUNZIONE
    if err:
        if err in ["Parametri mancanti", "Formato data non valido"]:
            return jsonify({"error": err}), 400

        if err in ["Slot già occupato", "Data precedente ad oggi"]:
            return jsonify({"error": err}), 409

        return jsonify({"error": "Errore applicativo"}), 400
    return jsonify({"id_appuntamento": nuovo.id}), 201

#CHIAMATA API PER MODIFICARE UN APPUNTAMENTO DA ID
@gestione_appuntamento_bp.route("/modifica", methods=["POST"])
def modifica():
    #VERIFICA CHE L'ENDPOINT SIA RICHIESTO DA UN RUOLO AUTORIZZATO
    error, status = controllo_ruoli(['Paziente', 'Medico'])
    if error:
        return jsonify({'errore': error}), status
    ok, err = modifica_appuntamento(request.get_json())
    if not ok:
        if err in ["Parametri non validi", "Formato data non valido"]:
            return jsonify({"error": err}), 400

        if err == "Appuntamento non trovato":
            return jsonify({"error": err}), 404

        if err == "Slot già occupato":
            return jsonify({"error": err}), 409

        return jsonify({"error": "Errore applicativo"}), 400
    return jsonify({"message": "Appuntamento modificato"}), 200

#CHIAMATA API PER OTTENERE LA LISTA DI TUTTI GLI APPUNTAMENTI DI UN UTENTE
@gestione_appuntamento_bp.route("/lista", methods=["GET"])
def lista():
    #VERIFICA CHE L'ENDPOINT SIA RICHIESTO DA UN RUOLO AUTORIZZATO
    error, status = controllo_ruoli(['Paziente', 'Medico'])
    if error:
        return jsonify({'errore': error}), status
    user = sessione_utente()
    if not user:
        return jsonify({"error": "Non autenticato"}), 401

    stati = request.args.get("stato", "")
    start = request.args.get("start")
    end = request.args.get("end")

    result, err = lista_appuntamenti(user, stati, start, end)

    if err:
        if err == "Formato data non valido":
            return jsonify({"error": err}), 400
        if err == "Ruolo non valido":
            return jsonify({"error": err}), 403

    return jsonify(result), 200