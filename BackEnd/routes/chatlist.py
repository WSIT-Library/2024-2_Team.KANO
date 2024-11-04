# routes/chatlist.py

from flask import Blueprint, request
import os
import sys
import uuid
from dotenv import load_dotenv

# .env 파일 로드 및 환경 변수에서 API 키 가져오기
load_dotenv()

# ../db 경로를 sys.path에 추가하여 db_config 모듈을 불러올 수 있도록 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.join(current_dir, '..', 'db')
sys.path.append(parent_dir)

from db_config import get_connection  # db_config 임포트
from utils.response import create_response
from routes.chat import is_valid_uuid  # user_uuid 유효성 검증 함수 사용

chatlist_bp = Blueprint('chatlist', __name__)

@chatlist_bp.route('/chatlist', methods=['POST'])
def chatlist_route():
    connection = None
    cursor = None
    try:
        # JSON 데이터에서 user_uuid 가져오기
        data = request.get_json()
        if not data:
            return create_response(400, "Invalid JSON payload")

        user_uuid = data.get('user_uuid')
        
        # user_uuid 유효성 검증
        if not user_uuid:
            return create_response(400, "Missing 'user_uuid' parameter")
        if not is_valid_uuid(user_uuid):
            return create_response(403, "Invalid user_uuid")
        
        # DB 연결 설정
        connection = get_connection()
        cursor = connection.cursor()
        
        # 해당 유저의 모든 chat_uuid 조회
        cursor.execute("SELECT chat_uuid FROM chats WHERE user_id = %s", (user_uuid,))
        chat_uuids = cursor.fetchall()
        
        # chat_uuid 목록 생성
        chat_uuid_list = [uuid[0] for uuid in chat_uuids]
        
        data = {"chat_uuids": chat_uuid_list}
        return create_response(200, "Success to retrieve chat list", data)
    
    except Exception as e:
        # Log the exception details in a real-world scenario
        return create_response(500, f"Internal Server Error: {str(e)}")
    
    finally:
        # cursor와 connection이 생성된 경우에만 닫기
        if cursor:
            cursor.close()
        if connection:
            connection.close()
