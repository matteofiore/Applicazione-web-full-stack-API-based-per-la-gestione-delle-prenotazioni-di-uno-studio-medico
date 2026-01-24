from utils.database import db

#DEFINIZIONE CLASSE APPUNTAMENTO
class Appuntamento(db.Model):
    __tablename__ = 'appuntamento'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    data = db.Column(db.Date, nullable=False)
    ora = db.Column(db.Time, nullable=False)
    descrizione = db.Column(db.String(255))
    medico_id = db.Column(db.Integer, db.ForeignKey('medico.id'), nullable=False)
    paziente_id = db.Column(db.Integer, db.ForeignKey('paziente.id'), nullable=False)
    stato = db.Column(db.String(50), nullable=False)