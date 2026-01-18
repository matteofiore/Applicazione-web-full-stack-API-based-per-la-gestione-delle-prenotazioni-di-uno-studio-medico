from flask import Blueprint, jsonify, make_response
from api.service.session import sessione_utente, elimina_sessione

session_bp = Blueprint('session', __name__)

@session_bp.route('/session', methods=['GET'])
def check_session():
    user = sessione_utente()
    if not user:
        return jsonify({'errore': 'Nessuna sessione attiva'}), 401

    return jsonify(user), 200

@session_bp.route("/session", methods=["DELETE"])
def logout():
    response = make_response(jsonify({"message": "Logout effettuato"}))
    response = elimina_sessione(response)
    return response, 200
