from flask import Blueprint, request
import os
import sys
import traceback
from dotenv import load_dotenv
import requests
import json
import google.generativeai as genai
from datetime import datetime
from db_config import get_connection
from utils.response import create_response
from utils.get_user_id_from_uuid import get_user_id_from_uuid

# .env 파일 로드 및 환경 변수에서 API 키 가져오기
load_dotenv()
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")  # OpenWeatherMap API 키
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")  # Google Generative AI API 키
MODEL_NAME = os.getenv("MODEL_NAME")  # Google Generative AI 모델 이름
genai.configure(api_key=GOOGLE_API_KEY)

# 공통 설정: AI 생성 요청 시 사용할 파라미터 설정
generation_config = {
    "temperature": 0.7,  # 응답의 창의성 수준
    "top_p": 0.8,        # 응답의 샘플링 방식 조정 (상위 확률)
    "top_k": 40,         # 응답 샘플링 시 고려할 최대 후보 개수
    "max_output_tokens": 8096,  # 최대 출력 토큰 수
}

# Blueprint 생성: weather 관련 API 그룹화
weather_bp = Blueprint('weather', __name__)

# 시스템 프롬프트 로드 함수
def load_system_prompt():
    """
    시스템에서 사용할 프롬프트 파일을 읽어오는 함수.
    파일이 없으면 FileNotFoundError 발생.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, 'weather_prompt.md')
    if not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Prompt file not found at {prompt_path}")
    with open(prompt_path, 'r', encoding='utf-8') as file:
        return file.read()

# 요청 데이터 유효성 검사 함수
def validate_request_data(data, keys):
    """
    요청 데이터에서 필수 키가 모두 존재하는지 확인.
    누락된 키가 있으면 400 상태 코드 응답 반환.
    """
    missing_keys = [key for key in keys if key not in data]
    if missing_keys:
        return create_response(400, f"Missing parameters: {', '.join(missing_keys)}")
    return None

# 사용자 행동 기록 함수
def log_user_action(connection, user_id, action_id, doing_action):
    """
    사용자의 특정 행동을 DB에 기록하는 함수.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO useractions (user_id, action_id, doing_action, time) 
                VALUES (%s, %s, %s, %s)
                """,
                (user_id, action_id, doing_action, datetime.now())
            )
            connection.commit()
    except Exception as e:
        print(f"Error logging user action: {str(e)}")
        raise

# API 호출 및 사용자 행동 기록 함수
def call_api_and_record_action(user_uuid, lat, lon, api_url, action_id, doing_action, data_key):
    """
    외부 API를 호출하고 사용자 행동을 기록하는 함수.
    """
    try:
        # 외부 API 호출
        response = requests.get(api_url)
        if response.status_code != 200:
            return create_response(response.status_code, f"Failed to fetch {data_key} data")

        data = response.json()  # API 응답 데이터를 JSON 형태로 파싱

        # DB 연결 및 사용자 행동 기록
        with get_connection() as connection:
            user_id = get_user_id_from_uuid(user_uuid, connection)
            if user_id is None:
                return create_response(403, "Invalid user_uuid")  # 유효하지 않은 사용자 ID

            log_user_action(connection, user_id, action_id, doing_action)

        return create_response(200, {
            "message": f"{doing_action} recorded successfully",
            data_key: data
        })

    except Exception as e:
        print("".join(traceback.format_exception(None, e, e.__traceback__)))
        return create_response(500, "Internal Server Error")

# /weather 엔드포인트: 현재 날씨 조회 및 기록
@weather_bp.route('/weather', methods=['POST'])
def register_weather_action():
    """
    현재 날씨 정보를 OpenWeatherMap에서 조회하고 DB에 행동을 기록하는 엔드포인트.
    """
    data = request.get_json()
    validation_error = validate_request_data(data, ['user_uuid', 'lat', 'lon'])
    if validation_error:
        return validation_error

    weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={data['lat']}&lon={data['lon']}&appid={OPENWEATHERMAP_API_KEY}"
    return call_api_and_record_action(
        data['user_uuid'], data['lat'], data['lon'], weather_url, action_id=7,
        doing_action='Get weather info', data_key='weather_data'
    )

# /weather/air 엔드포인트: 공기질 조회 및 기록
@weather_bp.route('/weather/air', methods=['POST'])
def register_air_pollution_action():
    """
    공기질 정보를 OpenWeatherMap에서 조회하고 DB에 행동을 기록하는 엔드포인트.
    """
    data = request.get_json()
    validation_error = validate_request_data(data, ['user_uuid', 'lat', 'lon'])
    if validation_error:
        return validation_error

    air_pollution_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={data['lat']}&lon={data['lon']}&appid={OPENWEATHERMAP_API_KEY}"
    return call_api_and_record_action(
        data['user_uuid'], data['lat'], data['lon'], air_pollution_url, action_id=8,
        doing_action='Get air pollution info', data_key='air_pollution_data'
    )

# /weather/3hourly 엔드포인트: 3시간 간격 날씨 조회 및 기록
@weather_bp.route('/weather/3hourly', methods=['POST'])
def register_hourly_weather_action():
    """
    3시간 간격 날씨 정보를 OpenWeatherMap에서 조회하고 DB에 행동을 기록하는 엔드포인트.
    """
    data = request.get_json()
    validation_error = validate_request_data(data, ['user_uuid', 'lat', 'lon'])
    if validation_error:
        return validation_error

    hourly_weather_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={data['lat']}&lon={data['lon']}&appid={OPENWEATHERMAP_API_KEY}"
    return call_api_and_record_action(
        data['user_uuid'], data['lat'], data['lon'], hourly_weather_url, action_id=9,
        doing_action='Get 3hourly weather info', data_key='hourly_weather_data'
    )

# /weather/gensentence 엔드포인트: AI 기반 문장 생성
@weather_bp.route('/weather/gensentence', methods=['POST'])
def gensentence_route():
    """
    OpenWeatherMap 데이터를 기반으로 AI 모델을 사용해 문장을 생성하고 응답하는 엔드포인트.
    """
    connection = get_connection()
    try:
        # 시스템 프롬프트 로드
        system_prompt = load_system_prompt()
        
        # 요청 데이터 확인
        if not request.is_json:
            return create_response(400, "Content-Type must be application/json")
        
        data = request.get_json()
        user_uuid = data.get('user_uuid')
        weather_data = data.get('data')
        
        if not user_uuid or not weather_data:
            return create_response(400, "Missing required parameters: user_uuid and data")
        
        # user_uuid 확인 및 user_id 가져오기
        user_id = get_user_id_from_uuid(user_uuid, connection)
        if user_id is None:
            return create_response(403, "Invalid user_uuid")
        
        # 사용자 행동 기록
        log_user_action(connection, user_id, action_id=10, doing_action="Generate weather-related suggestions using the Gemini API")
        
        # ChatSession 생성 및 메시지 전송
        chat = genai.GenerativeModel(model_name=MODEL_NAME, system_instruction=system_prompt).start_chat()
        user_message = str(weather_data)
        response = chat.send_message(content=user_message, generation_config=generation_config)
        
        # 결과 데이터 처리
        response_text = response.text.strip()
        
        try:
            # JSON 형식의 응답 데이터 파싱
            while True:
                response_text = response_text.replace('\n', '').replace('\t', '').replace('```json', '').replace('```', '').strip()
                
                try:
                    parsed_data = json.loads(response_text)
                    if isinstance(parsed_data, str):
                        response_text = parsed_data
                        continue
                    if isinstance(parsed_data, dict):
                        return create_response(200, "Success to response", parsed_data)
                
                except json.JSONDecodeError:
                    break
            
            return create_response(200, "Success to response", {"text": response_text})
        
        except Exception:
            return create_response(200, "Success to response", {"text": response_text})
    
    except Exception as e:
        print("".join(traceback.format_exception(None, e, e.__traceback__)))
        return create_response(500, f"Internal Server Error: {str(e)}")
    
    finally:
        connection.close()
