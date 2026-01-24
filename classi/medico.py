from classi.utenti import Utente
from utils.database import db

class Medico(Utente):
    __tablename__ = "medico"
    specializzazione = db.Column('specializzazione', db.String(50)) #AGGIUNTO ATTRIBUTO SPECIALIZZAZIONE

    appuntamenti = db.relationship('Appuntamento', backref='medico', lazy=True)