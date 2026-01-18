from flask import request
from datetime import datetime, timedelta

def expiration_time():
    return datetime.now() + timedelta(minutes=15)

def set_cookie(response, session_value):
    response.set_cookie("sessionId", value=session_value, path="/", expires=expiration_time(),samesite="Lax", httponly=True)
    print("Cookie impostato con sessionId:", response.headers.get("Set-Cookie"))
    return response

def get_cookie():
    return request.cookies.get("sessionId")

def refresh_cookie(response):
    session_id = get_cookie()
    if not session_id:
        return response

    response.set_cookie( "sessionId", value=session_id, path="/", expires=expiration_time(), httponly=True)
    return response

def delete_cookie(response):
    response.delete_cookie("sessionId", path="/")
    return response