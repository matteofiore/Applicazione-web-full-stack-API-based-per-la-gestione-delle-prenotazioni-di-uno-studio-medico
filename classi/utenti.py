from utils.database import db

class Utente(db.Model):
    __abstract__ = True

    id = db.Column('id', db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column('nome', db.String(50), nullable=False)
    cognome = db.Column('cognome', db.String(50), nullable=False)
    data_di_nascita = db.Column('data_di_nascita', db.Date, nullable=False)
    luogo_di_nascita = db.Column('luogo_di_nascita', db.String(50), nullable=False)
    codice_fiscale = db.Column('codice_fiscale', db.String(16), unique=True, nullable=False)
    email = db.Column('email', db.String(255), unique=True, nullable=False)
    password = db.Column('password', db.String(255), nullable=False)