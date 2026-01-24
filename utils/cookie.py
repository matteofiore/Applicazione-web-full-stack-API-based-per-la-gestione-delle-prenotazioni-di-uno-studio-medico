from flask import request

COOKIE_NAME = "sessionId"

#DEFINIZIONE PER IMPOSTARE COOKIE DI SESSIONE
def set_cookie(response, value):
    response.set_cookie(COOKIE_NAME, value=value, httponly=True, samesite="Lax", secure=False, path="/")
    return response

#DEFINIZIONE PER RITORNRARE IL COOKIE DI SESSIONE
def get_cookie():
    return request.cookies.get(COOKIE_NAME)