from flask import Blueprint, request, jsonify
from api.service.login import autenticazione
import utils.cookie as cookie

#CREAZIONE BLUEPRINT PER LA GESTIONE DELLE OPERAZIONI DI LOGIN
login_bp = Blueprint('login', __name__)

#CHIAMATA API PER EFFETTUARE LOGIN
@login_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')
    ruolo = data.get('ruolo')

    #CONTROLLO CHE I CAMPI OBBLIGATORI SIANO PRESENTI
    if not email or not password or not ruolo:
        return jsonify({'errore': 'Email, password obbligatori'}), 400

    #RICHIAMO FUNZIONE AUTENTICAZIONE
    utente, error = autenticazione(email, password, ruolo)

    #GESTIONE RETURN FUNZIONE
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

    #IMPOSTO IL COOKIE DI SESSIONE
    cookie.set_cookie(response, session_value)

    return response