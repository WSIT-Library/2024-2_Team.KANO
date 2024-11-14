-- users 테이블 생성
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password CHAR(60) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- logins 테이블 생성
CREATE TABLE logins (
    login_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    uuid CHAR(36) NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- chats 테이블 생성
CREATE TABLE chats (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    chat_uuid CHAR(36) NOT NULL, -- UUID v4 (36 characters)
    chat_history JSON, -- 채팅 히스토리 (JSON 형식)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 채팅방 생성 타임스탬프
    last_message_at TIMESTAMP NULL, -- 마지막 채팅 타임스탬프
    
    -- 외래키 설정
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ChallengeList 테이블 생성
CREATE TABLE ChallengeList (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- UserActions 테이블 생성
CREATE TABLE UserActions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_id INT NOT NULL,
    doing_action TEXT NOT NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
