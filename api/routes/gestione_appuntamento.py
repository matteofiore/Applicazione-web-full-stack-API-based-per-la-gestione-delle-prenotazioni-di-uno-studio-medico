from flask import Blueprint, request, jsonify
from api.service.session import sessione_utente
from api.service.gestione_appuntamento import elimina_appuntamento, accetta_appuntamento, crea_appuntamento, modifica_appuntamento, lista_appuntamenti

gestione_appuntamento_bp = Blueprint("gestione_appuntamento", __name__, url_prefix="/gestione_appuntamento")

@gestione_appuntamento_bp.route("/elimina", methods=["DELETE"])
def elimina():
    ok, err = elimina_appuntamento(request.args.get("id"))
    if not ok:
        return jsonify({"error": err}), 404
    return jsonify({"message": "Appuntamento eliminato"}), 200


@gestione_appuntamento_bp.route("/accetta", methods=["POST"])
def accetta():
    ok, err = accetta_appuntamento(request.args.get("id"))
    if not ok:
        return jsonify({"error": err}), 409
    return jsonify({"message": "Appuntamento confermato"}), 200


@gestione_appuntamento_bp.route("/crea", methods=["POST"])
def crea():
    nuovo, err = crea_appuntamento(request.get_json())
    if err:
        print(err)
        return jsonify({"error": err}), 400
    return jsonify({"id_appuntamento": nuovo.id}), 201


@gestione_appuntamento_bp.route("/modifica", methods=["POST"])
def modifica():
    ok, err = modifica_appuntamento(request.get_json())
    if not ok:
        return jsonify({"error": err}), 400
    return jsonify({"message": "Appuntamento modificato"}), 200


@gestione_appuntamento_bp.route("/lista", methods=["GET"])
def lista():
    user = sessione_utente()
    if not user:
        return jsonify({"error": "Non autenticato"}), 401

    stati = request.args.get("stato", "")
    start = request.args.get("start")
    end = request.args.get("end")

    return jsonify(lista_appuntamenti(user, stati, start, end)), 200
