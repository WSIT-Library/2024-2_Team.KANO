import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (username.trim() && password.trim()) {
      try {
        const response = await axios.post("http://61.81.99.111:5000/auth/login", {
          username,
          password,
        });

        const data = response.data;

        if (data.StatusCode === 200) {
          console.log("로그인 성공:", data);

          // UUID를 SecureStore에 저장
          await SecureStore.setItemAsync("user_uuid", data.data.uuid);

          // 홈 화면으로 이동
          navigation.navigate("Home");
        } else {
          Alert.alert("로그인 실패", data.message);
        }
      } catch (error) {
        console.error("로그인 중 오류 발생:", error);
        Alert.alert("로그인 오류", "서버와 연결할 수 없습니다.");
      }
    } else {
      Alert.alert("입력 오류", "사용자 이름과 비밀번호를 입력하세요.");
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>LOGIN</Text>
        <TextInput
          style={styles.input}
          placeholder="사용자 이름"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          returnKeyType="next"
          onSubmitEditing={() => Keyboard.dismiss()} // 엔터키로 다음 필드로 이동 또는 키보드 닫기
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin} // 엔터키로 로그인 시도
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.link}>회원가입</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#e6f7ff",
  },
  logo: {
    width: "50%",
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#007AFF",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 10,
    padding: 10,
    fontSize: 18,
    marginBottom: 15,
    color: 'black',
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    color: "#007AFF",
    fontSize: 18,
    textAlign: "center",
  },
});

export default LoginPage;
