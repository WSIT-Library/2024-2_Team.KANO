# routes/chat.py

from flask import Blueprint, request
import google.generativeai as genai
import os
import sys
import uuid  # UUID를 확인하기 위해 추가
from dotenv import load_dotenv
import json

# .env 파일 로드 및 환경 변수에서 API 키 및 모델명 가져오기
load_dotenv()

# ../db 경로를 sys.path에 추가하여 db_config 모듈을 불러올 수 있도록 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.join(current_dir, '..', 'db')
sys.path.append(parent_dir)

from db_config import get_connection  # db_config 임포트
from utils.response import create_response

chat_bp = Blueprint('chat', __name__)

# API 키 설정
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME")
genai.configure(api_key=GOOGLE_API_KEY)

# 모델 및 채팅 설정
model = genai.GenerativeModel(MODEL_NAME)
chat = model.start_chat(history=[])

# 시스템 프롬프트 설정
with open("./prompt.md", "r", encoding="utf-8") as file:
    system_prompt = file.read()
chat.send_message(system_prompt)

# 생성 설정
generation_config = {
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 8096,
}

# user_uuid 유효성 확인 함수
def is_valid_uuid(user_uuid):
    try:
        # UUID 형식 확인
        uuid_obj = uuid.UUID(user_uuid, version=4)
        print(f"UUID 형식 확인: {uuid_obj}")  # 디버그: UUID 형식 확인

        # DB 연결 설정
        connection = get_connection()
        cursor = connection.cursor()

        # logins 테이블에서 uuid가 존재하는지 확인
        cursor.execute("SELECT COUNT(*) AS count FROM logins WHERE uuid = %s", (user_uuid,))
        result = cursor.fetchone()
        # print(f"쿼리 결과: {result}")  # 디버그: 쿼리 결과 확인
        
        # 결과가 딕셔너리라면 'count' 키로 접근하여 값 확인
        return result['count'] > 0 if result else False
    
    except Exception as e:
        # print(f"유효성 확인 중 오류 발생: {str(e)}")  # 디버그: 오류 메시지 출력
        # 에러 발생 시 False 반환
        return False

@chat_bp.route('/chat', methods=['GET', 'POST'])
def chat_route():
    try:
        if request.method == 'GET':
            text = request.args.get('text')
            user_uuid = request.args.get('user_uuid')
            chat_uuid = request.args.get('chat_uuid')
        elif request.method == 'POST':
            if request.is_json:
                data = request.get_json()
                text = data.get('text')
                user_uuid = data.get('user_uuid')
                chat_uuid = data.get('chat_uuid')
            else:
                return create_response(400, "Content-Type must be application/json for POST requests")
        
        # 입력 값 검증
        if not text:
            return create_response(400, "Missing 'text' parameter")
        if not user_uuid:
            return create_response(400, "Missing 'user_uuid' parameter")
        
        # user_uuid 유효성 검증
        if not is_valid_uuid(user_uuid):
            return create_response(403, "Invalid user_uuid")

        # DB 연결 설정
        connection = get_connection()
        cursor = connection.cursor()

        # chat_uuid가 없으면 새 채팅방 생성
        if not chat_uuid:
            chat_uuid = str(uuid.uuid4())
            chat_history = [{"role": "user", "parts": text}]
            cursor.execute(
                "INSERT INTO chats (user_id, chat_uuid, chat_history, created_at, last_message_at) VALUES (%s, %s, %s, NOW(), NOW())",
                (user_uuid, chat_uuid, json.dumps(chat_history))
            )
            connection.commit()
            chat = model.start_chat(history=chat_history)
        else:
            # chat_uuid가 있으면 기존 채팅방 불러오기
            cursor.execute("SELECT chat_history FROM chats WHERE chat_uuid = %s", (chat_uuid,))
            result = cursor.fetchone()
            if not result:
                return create_response(404, "Chat room not found")

            chat_history = result[0]
            chat = model.start_chat(history=chat_history + [{"role": "user", "parts": text}])

        # Gemini를 사용하여 응답 생성
        response = chat.send_message(text, generation_config=generation_config)
        
        # 채팅 히스토리 업데이트
        chat_history.append({"role": "model", "parts": response.text})
        cursor.execute(
            "UPDATE chats SET chat_history = %s, last_message_at = NOW() WHERE chat_uuid = %s",
            (json.dumps(chat_history), chat_uuid)
        )
        connection.commit()

        data = {"chat_uuid": chat_uuid, "input": text, "response": response.text}
        return create_response(200, "Success to response", data)
    
    except Exception as e:
        # Log the exception details in a real-world scenario
        return create_response(500, f"Internal Server Error: {str(e)}")
    
    finally:
        # DB 연결 종료
        cursor.close()
        connection.close()
