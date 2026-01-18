from flask import Blueprint, request, jsonify
from api.service import medico

medico_bp = Blueprint('medico', __name__, url_prefix='/medico')

@medico_bp.route('/lista_medici', methods=['GET'])
def medici():
    medici = medico.lista_medici()

    return jsonify([{
        'id': m.id,
        'nome': m.nome,
        'cognome': m.cognome,
        'specializzazione': m.specializzazione,
        'email': m.email
        } for m in medici
    ]), 200


@medico_bp.route('/ricerca_medico', methods=['GET'])
def ricerca():
    q = request.args.get('q', '')
    medici = medico.ricerca_medici(q)

    return jsonify([{
        'id': m.id,
        'nome': m.nome,
        'cognome': m.cognome
        } for m in medici]), 200


@medico_bp.route('/getmedico', methods=['GET'])
def get_medico():
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'email mancante'}), 400

    medici = medico.get_medico_by_email(email)

    info_medico = []
    for m in medici:
        data_nascita = m.data_di_nascita
        data_formattata = (
            data_nascita.strftime('%Y-%m-%d')
            if data_nascita else None
        )

        info_medico.append({
            'nome': m.nome,
            'cognome': m.cognome,
            'specializzazione': m.specializzazione,
            'email': m.email,
            'codice_fiscale': m.codice_fiscale,
            'luogo_di_nascita': m.luogo_di_nascita,
            'data_di_nascita': data_formattata
        })

    return jsonify(info_medico), 200


@medico_bp.route('/elimina', methods=['DELETE'])
def elimina():
    session_id = request.cookies.get("sessionId")

    if not session_id:
        return jsonify({'errore': 'Non autenticato'}), 401

    ruolo = session_id.split('_')[0]
    if ruolo != 'Amministratore':
        return jsonify({'errore': 'Operazione riservata all’amministratore'}), 403
    
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'errore': 'Parametro email mancante'}), 400

    success = medico.delete_medico_by_email(email)

    if success:
        return jsonify({'messaggio': 'Medico eliminato con successo'}), 200
    else:
        return jsonify({'errore': 'Medico non trovato'}), 404

@medico_bp.route('/aggiorna', methods=['POST'])
def aggiorna_medico():
    session_id = request.cookies.get("sessionId")
    if not session_id:
        return jsonify({'errore': 'Non autenticato'}), 401

    ruolo = session_id.split('_')[0]
    if ruolo != 'Amministratore':
        return jsonify({'errore': 'Operazione riservata all’amministratore'}), 403
    try:
        medico.aggiorna(request.get_json())
        return jsonify({'messaggio': 'Medico aggiornato con successo'}), 200

    except ValueError as e:
        return jsonify({'errore': str(e)}), 400

    except LookupError as e:
        return jsonify({'errore': str(e)}), 404
