# 공통 유효성 검사 함수
def get_user_id_from_uuid(user_uuid, connection):
    """주어진 user_uuid로 사용자 ID를 조회합니다."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id FROM logins WHERE uuid = %s", (user_uuid.strip(),))
            result = cursor.fetchone()
            return result['user_id'] if result else None
    except Exception as e:
        print(f"Error in get_user_id_from_uuid: {str(e)}")
        return None