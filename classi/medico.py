from classi.utenti import Utente
from utils.database import db

class Medico(Utente):
    __tablename__ = "medico"
    specializzazione = db.Column('specializzazione', db.String(50))

    appuntamenti = db.relationship('Appuntamento', backref='medico', lazy=True)