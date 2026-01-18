from flask import Blueprint, request, jsonify
from api.service.login import autenticazione
import utils.cookie_old as cookie

login_bp = Blueprint('login', __name__)

@login_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    print(data)

    email = data.get('email')
    password = data.get('password')
    ruolo = data.get('ruolo')

    if not email or not password or not ruolo:
        return jsonify({'errore': 'Email, password obbligatori'}), 400

    utente, error = autenticazione(email, password, ruolo)

    if error == "ruolo non valido":
        return jsonify({'errore': 'Ruolo non valido'}), 400
    if error == "non registrato":
        return jsonify({'errore': f'{ruolo} non registrato'}), 404
    if error == "password errata":
        return jsonify({'errore': 'Password errata'}), 401

    session_value = f"{ruolo}_{utente.id}"

    response = jsonify({
        'nome': utente.nome,
        'cognome': utente.cognome,
        'id': utente.id,
        'ruolo': ruolo,
        'messaggio': f'Login riuscito'
    })

    cookie.set_cookie(response, session_value)

    return response