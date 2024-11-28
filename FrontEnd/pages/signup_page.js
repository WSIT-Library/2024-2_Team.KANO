import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient"; // LinearGradient 추가
import { DOMAIN, TIMEOUT } from "../utils/service_info";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigation = useNavigation();

  const handleSignup = async () => {
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("입력 오류", "모든 필드를 입력하세요.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("비밀번호 불일치", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const response = await axios.post(`${DOMAIN}/auth/signup`, { username, password }, { timeout: TIMEOUT });
      const data = response.data;

      if (data.StatusCode === 201) {
        Alert.alert("회원가입 성공", data.message);
        navigation.navigate("Login");
      } else if (data.StatusCode === 400) {
        Alert.alert("회원가입 실패", data.message);
      }
    } catch (error) {
      Alert.alert("에러", "서버와 연결할 수 없습니다.");
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <LinearGradient colors={["#E8DFF5", "#F5FFFA"]} style={styles.gradient}>
          <Text style={styles.title}>회원가입</Text>
          <TextInput
            style={styles.input}
            placeholder="사용자 이름"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            returnKeyType="next"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="next"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호 확인"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleSignup}
          />
          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>회원가입</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>로그인</Text>
          </TouchableOpacity>
        </LinearGradient>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 10,
    padding: 10,
    fontSize: 18,
    marginBottom: 15,
    color: "black",
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
    fontSize: 16,
    textAlign: "center",
  },
});

export default SignupPage;
