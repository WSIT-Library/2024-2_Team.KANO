import os
import sys
import uuid
from flask import Blueprint, request, jsonify
import bcrypt

# ../db 경로를 sys.path에 추가하여 db_config 모듈을 불러올 수 있도록 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.join(current_dir, '..', 'db')
sys.path.append(parent_dir)

from db_config import get_connection  # db_config 임포트
from utils.response import create_response  # utils/response의 create_response 사용

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """비밀번호를 bcrypt 해시로 변환"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed

def check_password(hashed_password, password):
    """해시된 비밀번호와 입력된 비밀번호를 검증"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    connection = None  # 초기화
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return create_response(400, "사용자 이름과 비밀번호는 필수입니다.")

        connection = get_connection()
        with connection.cursor() as cursor:
            # 사용자 이름이 이미 존재하는지 확인
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            existing_user = cursor.fetchone()
            if existing_user:
                return create_response(400, "이미 존재하는 사용자 이름입니다.")

            # 비밀번호를 bcrypt 방식으로 해싱 후 저장
            hashed_password = hash_password(password)
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (%s, %s)",
                (username, hashed_password)
            )
            connection.commit()

        return create_response(201, "회원가입 성공")
    
    except Exception as e:
        print(f"Error occurred: {e}")
        return create_response(500, f"회원가입 중 오류가 발생했습니다: {str(e)}")
    finally:
        if connection:
            connection.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    connection = None  # 초기화
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return create_response(400, "사용자 이름과 비밀번호는 필수입니다.")

        connection = get_connection()
        with connection.cursor() as cursor:
            # 사용자 조회 및 비밀번호 검증
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            if user and check_password(user['password'].encode('utf-8'), password):
                # UUID 생성 후 logins 테이블에 삽입
                user_uuid = str(uuid.uuid4())
                cursor.execute(
                    "INSERT INTO logins (user_id, uuid) VALUES (%s, %s)",
                    (user['id'], user_uuid)
                )
                connection.commit()
                return create_response(200, "로그인 성공", {"uuid": user_uuid})
            else:
                return create_response(401, "사용자 이름 또는 비밀번호가 잘못되었습니다.")
    
    except Exception as e:
        print(f"Error occurred: {e}")
        return create_response(500, f"로그인 중 오류가 발생했습니다: {str(e)}")
    finally:
        if connection:
            connection.close()

@auth_bp.route('/logout', methods=['POST'])
def logout():
    connection = None  # 초기화
    try:
        data = request.get_json()
        user_uuid = data.get('user_uuid')

        if not user_uuid:
            return create_response(400, "UUID는 필수입니다.")

        connection = get_connection()
        with connection.cursor() as cursor:
            # logins 테이블에서 uuid로 레코드 삭제
            cursor.execute("DELETE FROM logins WHERE uuid = %s", (user_uuid,))
            connection.commit()
            return create_response(200, "로그아웃 성공")
    
    except Exception as e:
        print(f"Error occurred: {e}")
        return create_response(500, f"로그아웃 중 오류가 발생했습니다: {str(e)}")
    finally:
        if connection:
            connection.close()
