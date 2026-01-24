from flask_sqlalchemy import SQLAlchemy
from flask import Flask

db = SQLAlchemy()

#DEFINIZIONE CONNESSIONE DATABASE
def init_app(app: Flask):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root@localhost/centromedico'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)