from utils.database import db
from classi.paziente import Paziente
from classi.medico import Medico
from classi.amministratore import Amministratore
from api.service.session import sessione_utente
from datetime import datetime
from werkzeug.security import generate_password_hash

#FUNZIONE PER VERIFICARE PRESENZA DEI CAMPI OBBLIGAORI
def controllo_campi_obbligatori(data, campi_obbligatori):
    for campo in campi_obbligatori:
        if campo not in data:
            return f'Manca il campo {campo}'
    return True

#FUNZIONE PER CRIPTARE PASSWORD
def password_hash(password):
    return generate_password_hash(password)

#FUNZIONE PER VERIFICARE FORMATO DATA
def controllo_formato_data(data_str):
    try:
        return datetime.strptime(data_str.strip(), '%Y-%m-%d').date()
    except ValueError:
        return None

#FUNZIONE PER VERIFICARE CHE UN ALTRO UTENTE NON SIA GIA' REGISTRATO CON LO STESSO CODICE FISCALE
def controllo_codice_fiscale(codice_fiscale, ruolo):
    model = {
        'Paziente': Paziente,
        'Medico': Medico,
        'Amministratore': Amministratore
    }[ruolo]

    if model.query.filter_by(codice_fiscale=codice_fiscale).first():
        return f'{ruolo} già registrato'
    return True

#FUNZIONE PER VERIFICARE CHE UN ALTRO UTENTE NON SIA GIA' REGISTRATO CON LA STESSA EMAIL
def controllo_email(email, ruolo):
    if ruolo == 'Amministratore':
        model = Amministratore
    elif ruolo == 'Medico':
        model = Medico
    elif ruolo == 'Paziente':
        model = Paziente
    if model.query.filter_by(email=email).first():
        return f'Email già in uso per un altro {ruolo}'
    return True

#FUNZIONE PER CREARE UN NUOVO OGGETTO
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

    if ruolo == 'Medico':
        base_kwargs['specializzazione'] = data['specializzazione']
        return Medico(**base_kwargs)

    if ruolo == 'Amministratore':
        return Amministratore(**base_kwargs)

    return None

#FUNZIONE PER REGISTRARE UN NUOVO UTENTE NEL SISTEMA
def registra(dati):
    ruolo = dati.get('ruolo')
    if ruolo not in ['Paziente', 'Medico', 'Amministratore']:
        return 'Ruolo non valido o mancante'

    if ruolo in ['Medico', 'Amministratore']:
        user = sessione_utente()
        if not user or user['ruolo'] != 'Amministratore':
            return 'Operazione riservata all’amministratore'

    required_fields = [
        'nome', 'cognome', 'data_di_nascita', 'luogo_di_nascita',
        'codice_fiscale', 'email', 'password', 'ruolo'
    ]

    if ruolo == 'Medico':
        required_fields.append('specializzazione')

    controllo_campi = controllo_campi_obbligatori(dati, required_fields)
    if controllo_campi is not True:
        return controllo_campi

    data_di_nascita = controllo_formato_data(dati['data_di_nascita'])
    if not data_di_nascita:
        return 'Formato data_di_nascita non valido, usare YYYY-MM-DD'

    check_cf = controllo_codice_fiscale(dati['codice_fiscale'], ruolo)
    if check_cf is not True:
        return check_cf

    check_mail = controllo_email(dati['email'], ruolo)
    if check_mail is not True:
        return check_mail

    hashed_password = password_hash(dati['password'])
    utente = crea_oggetto(dati, ruolo, data_di_nascita, hashed_password)

    if not utente:
        return 'Errore interno: ruolo non gestito'

    db.session.add(utente)
    db.session.commit()

    return True