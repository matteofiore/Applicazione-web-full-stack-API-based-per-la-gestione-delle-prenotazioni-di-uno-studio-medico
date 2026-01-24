from classi.paziente import Paziente

#FUNZIONE PER OTTENERE LISTA UTENTI
def lista_utenti():
    utenti = Paziente.query.all()
    return utenti