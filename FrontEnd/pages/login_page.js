import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { DOMAIN, TIMEOUT } from "../utils/service_info";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const passwordInputRef = useRef(null);

  // 로그인 횟수 및 도전과제 처리 함수
  const handleLoginMilestones = async (uuid) => {
    // CountLogin 증가
    let countStr = await SecureStore.getItemAsync("CountLogin");
    let count = countStr ? parseInt(countStr, 10) : 0;
    count += 1;
    await SecureStore.setItemAsync("CountLogin", count.toString());

    // 특정 횟수 (1, 7, 30, 90) 체크 후 CompleteArchive 업데이트
    const milestones = [1, 7, 30, 90];
    const challengeIds = [1, 2, 3, 4];

    let archiveStr = await SecureStore.getItemAsync("CompleteArchive");
    let archiveArr = archiveStr ? JSON.parse(archiveStr) : [];

    if (milestones.includes(count)) {
      const challengeId = challengeIds[milestones.indexOf(count)];
      archiveArr.push(challengeId);
      await SecureStore.setItemAsync("CompleteArchive", JSON.stringify(archiveArr));

      // 서버로 /challenge/register 요청
      try {
        const registerResponse = await axios.post(
          `${DOMAIN}/challenge/register`,
          {
            user_uuid: uuid,
            challenge_id: challengeId,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: TIMEOUT,
          }
        );

        const registerData = registerResponse.data;
        if (registerData.StatusCode === 200) {
          Alert.alert("성공", "Challenge registered successfully");
        } else {
          Alert.alert("알림", "서버 응답을 확인해주세요.");
        }
      } catch (err) {
        if (err.response && err.response.data) {
          const errData = err.response.data;
          if (errData.StatusCode === 409) {
            Alert.alert("알림", "이미 등록된 챌린지입니다.");
          } else {
            Alert.alert("오류", "서버 오류가 발생했습니다.");
          }
        } else {
          Alert.alert("오류", "네트워크 오류가 발생했습니다.");
        }
      }
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const storedUuid = await SecureStore.getItemAsync("user_uuid");

      if (storedUuid) {
        try {
          const response = await axios.post(`${DOMAIN}/auth/checkuuid`, { user_uuid: storedUuid }, { timeout: TIMEOUT });
          const data = response.data;
          if (data.StatusCode === 200) {
            console.log(`자동 로그인 성공 - 유저 이름: ${data.data.username}, UUID: ${storedUuid}`);
            await handleLoginMilestones(storedUuid);
            navigation.replace("Home");
          } else {
            Alert.alert("세션 만료", "로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
            await SecureStore.deleteItemAsync("user_uuid");
          }
        } catch (error) {
          console.error("UUID 확인 중 오류 발생:", error);
          Alert.alert("오류", "서버와 연결할 수 없습니다.");
        }
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    if (username.trim() && password.trim()) {
      try {
        const response = await axios.post(`${DOMAIN}/auth/login`, { username, password }, { timeout: TIMEOUT });
        const data = response.data;

        if (data.StatusCode === 200) {
          console.log("로그인 성공:", data);
          const uuid = data.data.uuid;
          await SecureStore.setItemAsync("user_uuid", uuid);
          await handleLoginMilestones(uuid);
          navigation.replace("Home");
        } else {
          Alert.alert("로그인 실패", data.message);
        }
      } catch (error) {
        console.error("로그인 중 오류 발생:", error);
        Alert.alert("알림", "사용자가 존재하지 않습니다.");
      }
    } else {
      Alert.alert("알림", "사용자 이름과 비밀번호를 입력하세요.");
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -200}
      >
        <LinearGradient colors={["#E8DFF5", "#F5FFFA"]} style={styles.gradient}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>LOGIN</Text>
            <TextInput
              style={styles.input}
              placeholder="사용자 이름"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current.focus()}
            />
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.link}>회원가입</Text>
            </TouchableOpacity>
          </ScrollView>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
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
    color: "#000",
    marginBottom: 20,
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
    fontSize: 18,
    textAlign: "center",
  },
});

export default LoginPage;
