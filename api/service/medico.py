from classi.medico import Medico
from datetime import datetime
from werkzeug.security import generate_password_hash

#FUNZIONE PER CONTROLLOD ATA
def controllo_formato_data(data_str):
    try:
        return datetime.strptime(data_str.strip(), '%Y-%m-%d').date()
    except ValueError:
        raise ValueError("Formato data_di_nascita non valido, usare YYYY-MM-DD")

#FUNZIONE PER CRIPTARE PASSWORD
def password_hash(password):    
    return generate_password_hash(password)

#FUNZIONE PER OTTENERE LISTA MEDICI
def lista_medici():
    return Medico.query.all()

#FUNZIONE PER OTTENERE LE INFORMAZIONI DI UN MEDICO DA ID
def ottieni_medico_by_id(id):
    return Medico.query.filter_by(id=id).first()

#FUNZIONE PER ELIMINARE UN MEDICO TRMITE UN ID
def elimina_medico_by_id(id):
    eliminato = Medico.query.filter_by(id=id).delete()
    if eliminato:
        Medico.query.session.commit()
        return True
    return False

#FUNZIONE PER AGGIORNARE I DATI DI UN MEDICO TRAMITE ID
def aggiorna(data):
    #CONTROLLO LA PRESENZA DI TUTTI I DATI RICHIESTI
    campi_obbligatori = ['medico_id','email', 'nome', 'cognome', 'specializzazione', 'luogo_di_nascita', 'data_di_nascita', 'codice_fiscale']
    for campo in campi_obbligatori:
        if campo not in data:
            raise ValueError(f"Parametro {campo} mancante")

    medico = Medico.query.filter_by(id=data['medico_id']).first()
    if not medico:
        raise LookupError("Medico non trovato")
    
    if 'password' in data and data['password']:
        hashed_password = password_hash(data['password'])
        medico.password = hashed_password

    data_di_nascita = controllo_formato_data(data['data_di_nascita'])

    medico.nome = data['nome']
    medico.cognome = data['cognome']
    medico.specializzazione = data['specializzazione']
    medico.luogo_di_nascita = data['luogo_di_nascita']
    medico.email= data['email']
    medico.data_di_nascita = data_di_nascita
    medico.codice_fiscale = data['codice_fiscale']

    #AGGIORNO DATI DB DEL MEDICO
    Medico.query.session.commit()

    return medico, True