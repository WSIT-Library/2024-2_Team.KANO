# utils/response.py

from flask import jsonify

def create_response(status_code, message, data=None):
    response = {
        "StatusCode": status_code,
        "message": message
    }
    if data is not None:
        response["data"] = data
    return jsonify(response), status_code
