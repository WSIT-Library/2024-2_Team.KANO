import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image, // Image 추가
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  const handleLogin = () => {
    // 임시 로그인 처리 로직
    if (username.trim() && password.trim()) {
      console.log("로그인:", username, password);
      navigation.navigate("Home"); // 로그인 성공 시 Home 화면으로 이동
    } else {
      alert("사용자 이름과 비밀번호를 입력하세요."); // 입력이 없을 경우 경고 메시지
    }
  };

  return (
    <View style={styles.container}>
      {/* 로고 이미지 추가 */}
      <Image
        source={require("../assets/logo.png")} // 로고 이미지 경로
        style={styles.logo}
        resizeMode="contain"
      />
      <TextInput
        style={styles.input}
        placeholder="사용자 이름"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.link}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center", // 로고 위치를 화면 중앙으로
    marginBottom: 20, // 타이틀과 간격 조정
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  link: {
    marginTop: 15,
    color: "blue",
    textAlign: "center",
  },
});

export default LoginPage;