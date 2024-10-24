# routes/chat.py

from flask import Blueprint, request
from utils.response import create_response
import google.generativeai as genai

chat_bp = Blueprint('chat', __name__)

# API 키 설정
GOOGLE_API_KEY = 'AIzaSyB_Gp4E2t203pp-97XueVfiz0JyPlCobSY'
genai.configure(api_key=GOOGLE_API_KEY)

# 모델 및 채팅 설정
model = genai.GenerativeModel('gemini-1.5-flash-8b')
chat = model.start_chat(history=[])

# 시스템 프롬프트 설정
system_prompt = "너의 역할은 자폐스펙트럼장애 청소년의 사회성을 기르기 위해 역할극을 하는 거야. 사용자가 상황을 주면 거기서 서로 역할을 나눠 일상적인 대화를 이어나가면 돼. 인공지능임을 반드시 숨기고, 실제 사람인 것 처럼 사용자의 위험상황으로부터 구해야 해. 반드시 존댓말을 해야 해. 실제 대화처럼 부연설명을 하지않고 짧게 말해"
chat.send_message(system_prompt)

# 생성 설정
generation_config = {
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 8096,
}

@chat_bp.route('/chat', methods=['GET', 'POST'])
def chat_route():
    try:
        if request.method == 'GET':
            text = request.args.get('text')
        elif request.method == 'POST':
            if request.is_json:
                data = request.get_json()
                text = data.get('text')
            else:
                return create_response(400, "Content-Type must be application/json for POST requests")
        
        if not text:
            return create_response(400, "Missing 'text' parameter")
        
        # Gemini를 사용하여 응답 생성
        response = chat.send_message(text, generation_config=generation_config)
        
        data = {"input": text, "response": response.text}
        return create_response(200, "Success to response", data)
    
    except Exception as e:
        # Log the exception details in a real-world scenario
        return create_response(500, f"Internal Server Error: {str(e)}")