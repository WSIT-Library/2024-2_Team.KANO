from flask import Blueprint, request
import google.generativeai as genai
import os
import sys
import uuid
from dotenv import load_dotenv
import json
import traceback

# .env 파일 로드 및 환경 변수에서 API 키 및 모델명 가져오기
load_dotenv()

# ../db 경로를 sys.path에 추가하여 db_config 모듈을 불러올 수 있도록 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.join(current_dir, '..', 'db')
sys.path.append(parent_dir)

from db_config import get_connection
from utils.response import create_response
from utils.get_user_id_from_uuid import get_user_id_from_uuid

# .env 파일 로드 및 환경 변수에서 API 키 및 모델명 가져오기
load_dotenv()

# API 키 설정 및 생성 설정
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME")
genai.configure(api_key=GOOGLE_API_KEY)
generation_config = {
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 8096,
}

# Blueprint 생성
chat_bp = Blueprint('chat', __name__)

def is_valid_chat_for_user(user_id, chat_uuid, connection):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM chats WHERE chat_uuid = %s AND user_id = %s", (chat_uuid, user_id))
            return cursor.fetchone() is not None
    except Exception as e:
        print(f"Error in is_valid_chat_for_user: {str(e)}")
        return False

# 고유 chat_uuid 생성 함수
def generate_unique_chat_uuid(connection):
    try:
        with connection.cursor() as cursor:
            while True:
                chat_uuid = str(uuid.uuid4())
                cursor.execute("SELECT COUNT(*) AS count FROM chats WHERE chat_uuid = %s", (chat_uuid,))
                if cursor.fetchone()['count'] == 0:
                    return chat_uuid
    except Exception as e:
        print(f"Error in generate_unique_chat_uuid: {str(e)}")
        return None

# 시스템 프롬프트 로드 함수
def load_system_prompt():
    prompt_path = os.path.join(current_dir, 'prompt.md')
    with open(prompt_path, 'r', encoding='utf-8') as file:
        return file.read()

# /chat 엔드포인트
@chat_bp.route('/chat', methods=['GET', 'POST'])
def chat_route():
    connection = get_connection()
    try:
        system_prompt = load_system_prompt()
        
        if request.method == 'GET':
            text, user_uuid, chat_uuid = request.args.get('text'), request.args.get('user_uuid'), request.args.get('chat_uuid')
        elif request.method == 'POST' and request.is_json:
            data = request.get_json()
            text, user_uuid, chat_uuid = data.get('text'), data.get('user_uuid'), data.get('chat_uuid')
        else:
            return create_response(400, "Content-Type must be application/json for POST requests")

        if not text or not user_uuid:
            return create_response(400, "Missing required parameters")

        user_id = get_user_id_from_uuid(user_uuid, connection)
        if user_id is None:
            return create_response(403, "Invalid user_uuid")

        # 채팅 uuid가 없거나 유효하지 않다면 새로운 채팅 생성
        if not chat_uuid or not is_valid_chat_for_user(user_id, chat_uuid, connection):
            chat_uuid = generate_unique_chat_uuid(connection)
            chat_history = []
            # 새로운 채팅방 생성
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO chats (user_id, chat_uuid, chat_history, created_at, last_message_at) VALUES (%s, %s, %s, NOW(), NOW())",
                    (user_id, chat_uuid, json.dumps(chat_history))
                )
                connection.commit()
        else:
            # 기존 채팅방의 chat_history 불러오기
            with connection.cursor() as cursor:
                cursor.execute("SELECT chat_history FROM chats WHERE chat_uuid = %s", (chat_uuid,))
                chat_history = json.loads(cursor.fetchone()['chat_history'])

        # 새 메시지를 chat_history에 추가하고 AI 모델로 응답 생성
        chat_history.append({"role": "user", "parts": text})
        chat = genai.GenerativeModel(model_name=MODEL_NAME, system_instruction=system_prompt).start_chat(history=chat_history)
        response = chat.send_message(text, generation_config=generation_config)
        chat_history.append({"role": "model", "parts": response.text})

        # chat_history 업데이트
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE chats SET chat_history = %s, last_message_at = NOW() WHERE chat_uuid = %s",
                (json.dumps(chat_history), chat_uuid)
            )
            connection.commit()

        return create_response(200, "Success to response", {"chat_uuid": chat_uuid, "input": text, "response": response.text})

    except Exception as e:
        print("".join(traceback.format_exception(None, e, e.__traceback__)))
        return create_response(500, f"Internal Server Error: {str(e)}")
    finally:
        connection.close()

# /chat/list 엔드포인트
@chat_bp.route('/chat/list', methods=['POST'])
def chatlist_route():
    try:
        data = request.get_json()
        if not data:
            return create_response(400, "Invalid JSON payload")

        user_uuid = data.get('user_uuid')
        if not user_uuid:
            return create_response(400, "Missing 'user_uuid' parameter")

        connection = get_connection()
        user_id = get_user_id_from_uuid(user_uuid, connection)
        if user_id is None:
            return create_response(403, "Invalid user_uuid")

        with connection.cursor() as cursor:
            cursor.execute("SELECT chat_uuid, created_at, last_message_at FROM chats WHERE user_id = %s", (user_id,))
            chat_list = [
                {"chat_uuid": record['chat_uuid'], "created_at": record['created_at'], "last_message_at": record['last_message_at']}
                for record in cursor.fetchall()
            ]

        return create_response(200, "Success to retrieve chat list", {"chats": chat_list})

    except Exception as e:
        print(f"Error in chatlist_route: {str(e)}")
        return create_response(500, "Internal Server Error")

# /chat/delete 엔드포인트
@chat_bp.route('/chat/delete', methods=['POST'])
def delete_chat_route():
    try:
        data = request.get_json()
        if not data:
            return create_response(400, "Invalid JSON payload")

        user_uuid, chat_uuid = data.get('user_uuid'), data.get('chat_uuid')
        if not user_uuid or not chat_uuid:
            return create_response(400, "Missing 'user_uuid' or 'chat_uuid' parameter")

        connection = get_connection()
        user_id = get_user_id_from_uuid(user_uuid, connection)
        if user_id is None or not is_valid_chat_for_user(user_id, chat_uuid, connection):
            return create_response(403, "Invalid user_uuid or chat_uuid for this user")

        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM chats WHERE chat_uuid = %s AND user_id = %s", (chat_uuid, user_id))
            connection.commit()

        return create_response(200, "Chat room deleted successfully")

    except Exception as e:
        print(f"Error in delete_chat_route: {str(e)}")
        return create_response(500, "Internal Server Error")

@chat_bp.route('/chat/detail', methods=['POST'])
def chat_detail_route():
    try:
        data = request.get_json()
        if not data:
            return create_response(400, "Invalid JSON payload")

        user_uuid, chat_uuid = data.get('user_uuid'), data.get('chat_uuid')
        if not user_uuid or not chat_uuid:
            return create_response(400, "Missing 'user_uuid' or 'chat_uuid' parameter")

        connection = get_connection()
        user_id = get_user_id_from_uuid(user_uuid, connection)
        
        # 유효한 user_uuid와 chat_uuid 확인
        if user_id is None or not is_valid_chat_for_user(user_id, chat_uuid, connection):
            return create_response(403, "Invalid user_uuid or chat_uuid for this user")

        with connection.cursor() as cursor:
            # 해당 채팅방의 채팅 내역 가져오기
            cursor.execute("SELECT chat_history FROM chats WHERE chat_uuid = %s", (chat_uuid,))
            result = cursor.fetchone()

            if not result:
                return create_response(404, "Chat history not found")
            
            chat_history = json.loads(result['chat_history'])

        return create_response(200, "Chat history retrieved successfully", {"chat_uuid": chat_uuid, "chat_history": chat_history})

    except Exception as e:
        print(f"Error in chat_detail_route: {str(e)}")
        return create_response(500, "Internal Server Error")
    finally:
        connection.close()