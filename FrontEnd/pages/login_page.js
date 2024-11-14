import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const storedUuid = await SecureStore.getItemAsync("user_uuid");

      if (storedUuid) {
        try {
          const response = await axios.post("http://61.81.99.111:5000/auth/checkuuid", {
            user_uuid: storedUuid,
          });

          const data = response.data;
          if (data.StatusCode === 200) {
            console.log(`자동 로그인 성공 - 유저 이름: ${data.data.username}, UUID: ${storedUuid}`);
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
        const response = await axios.post("http://61.81.99.111:5000/auth/login", {
          username,
          password,
        });

        const data = response.data;

        if (data.StatusCode === 200) {
          console.log("로그인 성공:", data);
          const uuid = data.data.uuid;
          await SecureStore.setItemAsync("user_uuid", uuid);

          const storedUuid = await SecureStore.getItemAsync("user_uuid");
          console.log(`저장된 uuid - user_uuid: ${storedUuid}`);

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
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
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
            onSubmitEditing={() => passwordInputRef.current.focus()}
          />
          <TextInput
            ref={(input) => (passwordInputRef = input)}
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
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e6f7ff",
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
