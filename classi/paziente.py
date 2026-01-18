from classi.utenti import Utente
from utils.database import db

class Paziente(Utente):
    __tablename__ = "paziente"

    appuntamenti = db.relationship('Appuntamento', backref='paziente', lazy=True)