from api.service import paziente
from api.service.session import controllo_ruoli
from flask import Blueprint, jsonify

#CREAZIONE BLUEPRINT PER LA GESTIONE DELLE OPERAZIONI DEI PAZIENTI
pazienti_bp = Blueprint('pazienti', __name__)

#CHIAMATA API PER OTTENERE LA LISTA DI TUTTI I PAZIENTI
@pazienti_bp.route('/pazienti', methods=['GET'])
def get_pazienti():
    #RICHIAMO FUNZIONE PER CONTROLLARE CHE LA RICHIESTA AVVENGA DA UTENTI AUTORIZZATI
    error, status = controllo_ruoli(['Medico', 'Amministratore'])
    if error:
        return jsonify({'errore': error}), status
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