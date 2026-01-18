from api.service import paziente
from flask import Blueprint, jsonify

pazienti_bp = Blueprint('pazienti', __name__)

@pazienti_bp.route('/pazienti', methods=['GET'])
def get_pazienti():
    pazienti = paziente.lista_utenti()
    lista_utenti = [{
        'id':p.id,
        'nome': p.nome,
        'cognome': p.cognome,
        'codice_fiscale': p.codice_fiscale,
        'luogo_di_nascita': p.luogo_di_nascita,
        "data_di_nascita": p.data_di_nascita.strftime('%m-%d-%Y')
    } for p in pazienti]
    return jsonify(lista_utenti), 200