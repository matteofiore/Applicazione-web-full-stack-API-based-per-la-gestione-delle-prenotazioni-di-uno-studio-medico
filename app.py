from flask import Flask
from utils.database import db, init_app
from flask_cors import CORS
from api.routes.registrazione import registrazione_bp
from api.routes.login import login_bp
from api.routes.medico import medico_bp
from api.routes.gestione_appuntamento import gestione_appuntamento_bp
from api.routes.paziente import pazienti_bp
from api.routes.session import session_bp

#CREAZIONE APP FLASK
app = Flask(__name__)
CORS(app, supports_credentials=True)
init_app(app)

#CREAZIONE TABELLE DB SE NON ESISTONO
with app.app_context():
    db.create_all()

#REGISTRAZIONE DEI VARI BLUEPRINT CHE ESPONGONO LE API
app.register_blueprint(registrazione_bp)
app.register_blueprint(login_bp)
app.register_blueprint(medico_bp)
app.register_blueprint(gestione_appuntamento_bp)
app.register_blueprint(pazienti_bp)
app.register_blueprint(session_bp)

#AVVIO APPLICAZIONE FLASK SU TUTTE LE INTERFACCE DI RETE
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)