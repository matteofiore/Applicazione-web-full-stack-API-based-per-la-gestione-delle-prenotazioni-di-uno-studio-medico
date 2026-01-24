from flask import Blueprint, request, jsonify
from api.service.registrazione import registra

#CREAZIONE BLUEPRINT PER LA GESTIONE DELLE OPERAZIONI DI REGISTRAZIONE
registrazione_bp = Blueprint('registrazione', __name__)

#CHIAMATA API PER REGISTRARE UN UTENTE
@registrazione_bp.route('/registrazione', methods=['POST'])
def registrazione():
    data = request.get_json()
    #RICHIAMO FUNZIONE REGISTRA()
    result = registra(data)
    if result is not True:
        return jsonify({'errore': result}), 400

    return jsonify({'messaggio': 'Registrazione avvenuta con successo'}), 201