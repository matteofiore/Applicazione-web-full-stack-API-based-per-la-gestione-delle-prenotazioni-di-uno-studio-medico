from flask import Blueprint, request, jsonify
from api.service.registrazione import registra

registrazione_bp = Blueprint('registrazione', __name__)


@registrazione_bp.route('/registrazione', methods=['POST'])
def registrazione():
    data = request.get_json()
    result = registra(data)
    if result is not True:
        return jsonify({'errore': result}), 400

    return jsonify({'messaggio': 'Registrazione avvenuta con successo'}), 201