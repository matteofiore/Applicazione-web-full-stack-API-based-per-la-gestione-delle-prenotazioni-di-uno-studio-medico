from flask import Blueprint, jsonify, make_response
from api.service.session import sessione_utente, elimina_sessione

#CREAZIONE BLUEPRINT PER LA GESTIONE DELLE OPERAZIONI DI SESSIONE
session_bp = Blueprint('session', __name__)

#API PER VERIFICARE PRESENZA DEI COOKIE DI SESSIONE
@session_bp.route('/session', methods=['GET'])
def check_session():
    #RICHIAMO FUNZIONE
    user = sessione_utente()
    if not user:
        return jsonify({'errore': 'Nessuna sessione attiva'}), 401

    return jsonify(user), 200

#API PER ELIMINARE IL COOKIE DI SESSIONE
@session_bp.route("/session", methods=["DELETE"])
def logout():
    response = make_response(jsonify({"message": "Logout effettuato"}))
    response = elimina_sessione(response)
    return response, 200