from classi.paziente import Paziente

def lista_utenti():
    utenti = Paziente.query.all()
    return utenti