from flask import Blueprint, request
import os
import sys
import traceback

# ../db 경로를 sys.path에 추가하여 db_config 모듈을 불러올 수 있도록 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.join(current_dir, '..', 'db')
sys.path.append(parent_dir)

from db_config import get_connection
from utils.response import create_response
from utils.get_user_id_from_uuid import get_user_id_from_uuid

# Blueprint 생성
action_bp = Blueprint('action', __name__)

# /action/register 엔드포인트
@action_bp.route('/action/register', methods=['POST'])
def register_action():
    data = request.get_json()
    user_uuid = data.get('user_uuid')
    action_id = data.get('action_id')
    doing_action = data.get('doing_action')

    if not all([user_uuid, action_id, doing_action]):
        return create_response(400, "Missing 'user_uuid', 'action_id' or 'doing_action' parameter")

    try:
        with get_connection() as connection:
            user_id = get_user_id_from_uuid(user_uuid, connection)
            if user_id is None:
                return create_response(403, "Invalid user_uuid")

            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO UserActions (user_id, action_id, doing_action) VALUES (%s, %s, %s)",
                    (user_id, action_id, doing_action)
                )
                connection.commit()

        return create_response(200, "Action recorded successfully")

    except Exception as e:
        print("".join(traceback.format_exception(None, e, e.__traceback__)))
        return create_response(500, "Internal Server Error")

# /action/list 엔드포인트
@action_bp.route('/action/list', methods=['POST'])
def action_list():
    data = request.get_json()
    user_uuid = data.get('user_uuid')

    if not user_uuid:
        return create_response(400, "Missing 'user_uuid' parameter")

    try:
        with get_connection() as connection:
            user_id = get_user_id_from_uuid(user_uuid, connection)
            if user_id is None:
                return create_response(403, "Invalid user_uuid")

            with connection.cursor() as cursor:
                cursor.execute("SELECT action_id, doing_action FROM UserActions WHERE user_id = %s", (user_id,))
                actions = [{"action_id": record['action_id'], "doing_action": record['doing_action']} for record in cursor.fetchall()]

        return create_response(200, "Action list retrieved successfully", {"actions": actions})

    except Exception as e:
        print("".join(traceback.format_exception(None, e, e.__traceback__)))
        return create_response(500, "Internal Server Error")
