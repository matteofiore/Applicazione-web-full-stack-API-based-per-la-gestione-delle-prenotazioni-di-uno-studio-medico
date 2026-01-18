from flask import Blueprint, request, jsonify
from utils.database import db  # importa la connessione
from classi.paziente import Paziente
from classi.medico import Medico
from classi.amministratore import Amministratore
from datetime import datetime
from werkzeug.security import generate_password_hash

def check_required_fields(data, required_fields):
    for field in required_fields:
        if field not in data:
            return f'Manca il campo {field}'
    return True
        
def password_hash(password):    
    return generate_password_hash(password)

def check_data_format(data_str):
    try:
        return datetime.strptime(data_str.strip(), '%Y-%m-%d').date()
    except ValueError:
        return 'Formato data_di_nascita non valido, usare DD-MM-YYYY'

def controllo_codice_fiscale(codice_fiscale, ruolo):
    model = Paziente if ruolo == 'Paziente' else Medico
    if model.query.filter_by(codice_fiscale=codice_fiscale).first():
        return f'{ruolo} già registrato'
    return True

def controllo_email(email, ruolo):
    model = Paziente if ruolo == 'Paziente' else Medico
    if model.query.filter_by(email=email).first():
        return f'Email già in uso per un altro {ruolo}'
    return True

def crea_oggetto(data, ruolo, data_di_nascita, hashed_password):
    base_kwargs = dict(
        nome=data['nome'],
        cognome=data['cognome'],
        data_di_nascita=data_di_nascita,
        luogo_di_nascita=data['luogo_di_nascita'],
        codice_fiscale=data['codice_fiscale'],
        email=data['email'],
        password=hashed_password
    )

    if ruolo == 'Paziente':
        return Paziente(**base_kwargs)
    elif ruolo == 'Medico':
        base_kwargs['specializzazione'] = data['specializzazione']
        return Medico(**base_kwargs)
    elif ruolo == 'Amministratore':
        return Amministratore(**base_kwargs)
    else:
        return None

def registra(dati):
    ruolo = dati.get('ruolo')
    if ruolo not in ['Paziente', 'Medico', 'Amministratore']:
        return 'Ruolo non valido o mancante'

    required_fields = [
        'nome', 'cognome', 'data_di_nascita', 'luogo_di_nascita',
        'codice_fiscale', 'email', 'password', 'ruolo'
    ]
    if ruolo == 'Medico':
        required_fields.append('specializzazione')

    check_fields = check_required_fields(dati, required_fields)
    if check_fields is not True:
        return check_fields

    data_di_nascita = check_data_format(dati['data_di_nascita'])
    if not data_di_nascita:
        return 'Formato data non valido, usa DD-MM-YYYY'

    check_cf = controllo_codice_fiscale(dati['codice_fiscale'], ruolo)
    if check_cf is not True:
        return check_cf
    
    check_mail = controllo_email(dati['email'], ruolo)
    if check_mail is not True:
        return check_mail

    hashed_password = password_hash(dati['password'])
    registrazione_oggetto = crea_oggetto(dati, ruolo, data_di_nascita, hashed_password)

    if not registrazione_oggetto:
        return 'Errore interno: ruolo non gestito'

    db.session.add(registrazione_oggetto)
    db.session.commit()

    return True