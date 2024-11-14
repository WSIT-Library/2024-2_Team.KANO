from flask import Blueprint, request
import os
import sys
import json
import traceback

# 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.join(current_dir, '..', 'db')
sys.path.append(parent_dir)

from db_config import get_connection
from utils.response import create_response
from utils.get_user_id_from_uuid import get_user_id_from_uuid

# Blueprint 생성
challenge_bp = Blueprint('challenge', __name__)

def fetch_challenge_data():
    """JSONL 파일에서 도전 과제 ID를 가져옵니다."""
    try:
        with open('./challenge_list.jsonl', 'r', encoding='utf-8') as f:
            challenges = {json.loads(line)['id'] for line in f}
            print(f"Loaded Challenge IDs: {challenges}")  # 디버깅 출력
            return challenges
    except Exception as e:
        print(f"Error reading challenge_list.jsonl: {str(e)}")
        return set()

def is_user_challenge_registered(user_id, challenge_id, connection):
    """유저가 특정 도전 과제를 등록했는지 확인합니다."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM ChallengeList WHERE user_id = %s AND challenge_id = %s", (user_id, challenge_id))
            return cursor.fetchone() is not None
    except Exception as e:
        print(f"Error in is_user_challenge_registered: {str(e)}")
        return False

# Challenge 존재 여부를 사전에 로드
CHALLENGE_IDS = fetch_challenge_data()

# /challenge/register 엔드포인트
@challenge_bp.route('/challenge/register', methods=['POST'])
def register_challenge():
    data = request.get_json()
    user_uuid, challenge_id = data.get('user_uuid'), data.get('challenge_id')

    if not user_uuid or not challenge_id:
        return create_response(400, "Missing 'user_uuid' or 'challenge_id' parameter")

    if challenge_id not in CHALLENGE_IDS:
        return create_response(404, "Challenge ID does not exist")

    try:
        connection = get_connection()
        user_id = get_user_id_from_uuid(user_uuid, connection)
        if user_id is None:
            return create_response(403, "Invalid user_uuid")

        if is_user_challenge_registered(user_id, challenge_id, connection):
            return create_response(409, "Challenge already registered for this user")

        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO ChallengeList (user_id, challenge_id, created_at) VALUES (%s, %s, NOW())",
                (user_id, challenge_id)
            )
            connection.commit()

        return create_response(200, "Challenge registered successfully")

    except Exception as e:
        print("".join(traceback.format_exception(None, e, e.__traceback__)))
        return create_response(500, "Internal Server Error")

    finally:
        if 'connection' in locals():
            connection.close()

# /challenge/list 엔드포인트
@challenge_bp.route('/challenge/list', methods=['POST'])
def challenge_list():
    data = request.get_json()
    user_uuid = data.get('user_uuid')

    if not user_uuid:
        return create_response(400, "Missing 'user_uuid' parameter")

    try:
        connection = get_connection()
        user_id = get_user_id_from_uuid(user_uuid, connection)
        if user_id is None:
            return create_response(403, "Invalid user_uuid")

        with connection.cursor() as cursor:
            cursor.execute("SELECT challenge_id FROM ChallengeList WHERE user_id = %s", (user_id,))
            challenges = [record['challenge_id'] for record in cursor.fetchall()]

        return create_response(200, "Challenge list retrieved successfully", {"challenges": challenges})

    except Exception as e:
        print("".join(traceback.format_exception(None, e, e.__traceback__)))
        return create_response(500, "Internal Server Error")

    finally:
        if 'connection' in locals():
            connection.close()
