from flask import Blueprint, request, jsonify
from api.service.session import controllo_ruoli
from api.service import medico

#CREAZIONE BLUEPRINT PER LA GESTIONE DELLE OPERAZIONI SUI MEDICI
medico_bp = Blueprint('medico', __name__, url_prefix='/medico')

#CHIAMATA API PER OTTENERE LA LISTA DI TUTTI I MEDICI
@medico_bp.route('/lista', methods=['GET'])
def medici():
    #RICHIAMO FUNZIONE PER CONTROLLARE CHE LA RICHIESTA AVVENGA DA UTENTI AUTORIZZATI
    error, status = controllo_ruoli(['Paziente', 'Amministratore'])
    if error:
        return jsonify({'errore': error}), status
    medici = medico.lista_medici()

    return jsonify([{
        'id': m.id,
        'nome': m.nome,
        'cognome': m.cognome,
        'specializzazione': m.specializzazione,
        'email': m.email
        } for m in medici
    ]), 200

#CHIAMATA API PER OTTENERE LE INFORMAZIONI DI UN SINGOLO MEDICO DA UN ID
@medico_bp.route('/getmedico', methods=['GET'])
def get_medico():
    #RICHIAMO FUNZIONE PER CONTROLLARE CHE LA RICHIESTA AVVENGA DA UTENTI AUTORIZZATI
    error, status = controllo_ruoli(['Amministratore'])
    if error:
        return jsonify({'errore': error}), status
    id = request.args.get('medico_id')
    if not id:
        return jsonify({'error': 'id mancante'}), 400

    medici = medico.ottieni_medico_by_id(id)

    medico_ricevuto = {
        'id': medici.id,
        'nome': medici.nome,
        'cognome': medici.cognome,
        'specializzazione': medici.specializzazione,
        'luogo_di_nascita': medici.luogo_di_nascita,
        'data_di_nascita': medici.data_di_nascita.isoformat() if medici.data_di_nascita else None,
        'codice_fiscale': medici.codice_fiscale,
        'email': medici.email
    }
    print(medico_ricevuto)
    return jsonify(medico_ricevuto), 200

#CHIAMATA API PER ELIMINARE UN MEDICO DA ID
@medico_bp.route('/elimina', methods=['DELETE'])
def elimina():
    #RICHIAMO FUNZIONE PER CONTROLLARE CHE LA RICHIESTA AVVENGA DA UTENTI AUTORIZZATI
    error, status = controllo_ruoli(['Amministratore'])
    if error:
        return jsonify({'errore': error}), status
    
    data = request.get_json()
    id = data.get('medico_id')
    if not id:
        return jsonify({'errore': 'Parametro id mancante'}), 400
    
    success = medico.elimina_medico_by_id(id)

    if success:
        return jsonify({'messaggio': 'Medico eliminato con successo'}), 200
    else:
        return jsonify({'errore': 'Medico non trovato'}), 404

#CHIAMATA API PER AGGIORNARE I DATI DEL MEDICO DA ID
@medico_bp.route('/aggiorna', methods=['POST'])
def aggiorna_medico():
    #RICHIAMO FUNZIONE PER CONTROLLARE CHE LA RICHIESTA AVVENGA DA UTENTI AUTORIZZATI
    error, status = controllo_ruoli(['Amministratore'])
    if error:
        return jsonify({'errore': error}), status
    try:
        medico.aggiorna(request.get_json())
        return jsonify({'messaggio': 'Medico aggiornato con successo'}), 200

    except ValueError as e:
        return jsonify({'errore': str(e)}), 400

    except LookupError as e:
        return jsonify({'errore': str(e)}), 404