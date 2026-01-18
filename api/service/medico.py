from flask import jsonify
from classi.medico import Medico
from datetime import datetime
from werkzeug.security import generate_password_hash

def check_data_format(data_str):
    try:
        return datetime.strptime(data_str.strip(), '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'errore': 'Formato data_di_nascita non valido, usare DD-MM-YYYY'}), 400
    
def password_hash(password):    
    return generate_password_hash(password)

def lista_medici():
    return Medico.query.all()

def ricerca_medici(query):
    if not query:
        return []
    return Medico.query.filter(
        (Medico.nome.ilike(f'%{query}%')) |
        (Medico.cognome.ilike(f'%{query}%'))
    ).all()

def get_medico_by_email(email):
    return Medico.query.filter_by(email=email).all()

def delete_medico_by_email(email):
    deleted = Medico.query.filter_by(email=email).delete()
    if deleted:
        Medico.query.session.commit()
        return True
    return False

def aggiorna(data):
    required_fields = ['email', 'nome', 'cognome', 'specializzazione', 'luogo_di_nascita', 'data_di_nascita', 'codice_fiscale']
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Parametro {field} mancante")

    medico = Medico.query.filter_by(email=data['email']).first()
    if not medico:
        raise LookupError("Medico non trovato")
    
    if 'password' in data and data['password']:
        hashed_password = password_hash(data['password'])
        medico.password = hashed_password

    data_di_nascita = check_data_format(data['data_di_nascita'])

    medico.nome = data['nome']
    medico.cognome = data['cognome']
    medico.specializzazione = data['specializzazione']
    medico.luogo_di_nascita = data['luogo_di_nascita']
    medico.data_di_nascita = data_di_nascita
    medico.codice_fiscale = data['codice_fiscale']

    Medico.query.session.commit()

    return medico