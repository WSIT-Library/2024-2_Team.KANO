import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { DOMAIN, TIMEOUT } from "../utils/service_info";
import Toast from "react-native-toast-message";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import AacButton from "./aac_button"; // AAC 버튼 컴포넌트 임포트
import { useNavigation } from "@react-navigation/native";

const CustomToast = ({ text1, text2 }) => (
	<View style={styles.customToast}>
	  <View style={styles.toastContent}>
		<View style={styles.toastIcon}>
		  <Text style={styles.toastCheckMark}>✔</Text>
		</View>
		<View style={styles.toastTextContainer}>
		  <Text style={styles.toastTitle}>{text1}</Text>
		  <Text style={styles.toastMessage}>{text2}</Text>
		</View>
		<TouchableOpacity style={styles.toastCloseButton}>
		  <Text style={styles.toastCloseText}>✖</Text>
		</TouchableOpacity>
	  </View>
	</View>
  );

const healthTips = [
  {
    title: "충분한 수면",
    image: require("../assets/sleep.png"),
    description: "수면은 자폐장애인들의 정서 안정과 일상생활 리듬 형성에 도움을 줍니다.",
  },
  {
    title: "규칙적인 운동",
    image: require("../assets/exercise.png"),
    description: "운동은 신체 건강을 증진시키고 과잉 행동이나 스트레스를 완화하는 데 유용합니다.",
  },
  {
    title: "균형 잡힌 식사",
    image: require("../assets/healthy_food.png"),
    description: "적절한 영양 섭취는 신체 및 뇌 기능 발달에 긍정적인 영향을 줍니다.",
  },
  {
    title: "충분한 대화",
    image: require("../assets/talk.png"),
    description: "대화와 상호작용은 자폐장애인의 언어 및 사회적 기술 발달에 도움을 줍니다.",
  },
  {
    title: "스트레스 관리",
    image: require("../assets/stress_relief.png"),
    description: "명상, 요가 등의 스트레스 관리 활동은 정서적 안정과 긍정적인 태도를 유도합니다.",
  },
];

const HomeScreen = () => {
  const [username, setUsername] = useState("");
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [customAacButtons, setCustomAacButtons] = useState([]);
  const [quote, setQuote] = useState("명언을 불러오는 중...");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const quoteOpacity = useSharedValue(1);
	const maxAacButtons = 5;
	const navigation = useNavigation();

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const user_uuid = await SecureStore.getItemAsync("user_uuid");
        if (user_uuid) {
          const response = await axios.post(
            `${DOMAIN}/auth/checkuuid`,
            { user_uuid },
            { timeout: TIMEOUT }
          );
          if (response.data.StatusCode === 200) {
            const fetchedUsername = response.data.data.username;
            setUsername(fetchedUsername);

            Toast.show({
              type: "custom_success",
              text1: "환영합니다!",
              text2: `${fetchedUsername || "사용자"}님, 안녕하세요!`,
              visibilityTime: 3000,
            });
          } else {
            Alert.alert("오류", "사용자 이름을 불러오는 데 실패했습니다.");
          }
        } else {
          Alert.alert("오류", "UUID가 저장되어 있지 않습니다. 다시 로그인해주세요.");
        }
      } catch (error) {
        console.error("Fetch username error:", error);
        Alert.alert("오류", "서버와 연결할 수 없습니다.");
      }
    };

    const fetchQuote = async () => {
      setLoadingQuote(true);
      try {
        const response = await axios.get("https://apis.uiharu.dev/famous_sayings/api.php");
        if (response.status === 200 && response.data?.text) {
          setQuote(response.data.text);
        } else {
          setQuote("명언을 불러오는 데 실패했습니다.");
        }
      } catch (error) {
        console.error("Fetch quote error:", error);
        setQuote("명언을 불러오는 데 실패했습니다.");
      } finally {
        setLoadingQuote(false);
      }
    };

    fetchUsername();
    fetchQuote();

    const interval = setInterval(() => {
		handleQuoteChange();
		handleNextTip();
    }, 10000); // 10초마다 명언 변경

    return () => clearInterval(interval);
  }, []);

  const handleQuoteChange = async () => {
    quoteOpacity.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) });
    try {
      const response = await axios.get("https://apis.uiharu.dev/famous_sayings/api.php");
      if (response.status === 200 && response.data?.text) {
        setTimeout(() => {
          setQuote(response.data.text);
          quoteOpacity.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) });
        }, 500); // 새 명언 적용 전 딜레이
      } else {
        setQuote("명언을 불러오는 데 실패했습니다.");
      }
    } catch (error) {
      console.error("Fetch quote error:", error);
      setQuote("명언을 불러오는 데 실패했습니다.");
    }
  };

  const handleNextTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex + 1) % healthTips.length);
  };

  const handlePreviousTip = () => {
    setCurrentTipIndex((prevIndex) =>
      prevIndex === 0 ? healthTips.length - 1 : prevIndex - 1
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
  }));

  return (
    <LinearGradient colors={["#E8DFF5", "#F5FFFA"]} style={styles.container}>
		  <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 100 }}>
			  
		  <TouchableOpacity
        style={styles.helpButton}
        onPress={() => navigation.navigate("Tutorial")} // Tutorial 페이지로 이동
      >
          <Text style={styles.helpButtonText}>?</Text>
			  </TouchableOpacity>
			  
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.tipContainer}>
          <TouchableOpacity
            style={styles.roundButton}
            onPress={handlePreviousTip}
          >
            <Text style={styles.buttonText}>◀</Text>
          </TouchableOpacity>
          <View style={styles.tipContent}>
            <Image
              source={healthTips[currentTipIndex].image}
              style={styles.tipImage}
              resizeMode="contain"
            />
            <Text style={styles.tipTitle}>{healthTips[currentTipIndex].title}</Text>
            <Text style={styles.tipDescription}>
              {healthTips[currentTipIndex].description}
            </Text>
          </View>
          <TouchableOpacity style={styles.roundButton} onPress={handleNextTip}>
            <Text style={styles.buttonText}>▶</Text>
          </TouchableOpacity>
        </View>
        <AacButton
          maxAacButtons={maxAacButtons}
          customAacButtons={customAacButtons}
          setCustomAacButtons={setCustomAacButtons}
        />
        <Animated.View style={[styles.quoteContainer, animatedStyle]}>
          <TouchableOpacity onPress={handleQuoteChange}>
            <Text style={styles.quoteText}>{quote}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Toast config={{ custom_success: CustomToast }} />
      </SafeAreaView>
    </LinearGradient>
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
    height: 80,
    alignSelf: "center",
    marginBottom: 20,
    marginTop: -50,
  },
  customToastContainer: {
    width: "90%",
    padding: 20,
    backgroundColor: "#f4f2f5",
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 20,
	},
    customToast: {
		width: "90%",
		padding: 15,
		backgroundColor: "#dff0d8", // 사진에서의 연한 녹색 배경
		borderRadius: 5,
		alignSelf: "center",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 5,
	  },
	  toastContent: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	  },
	  toastIcon: {
		width: 30,
		height: 30,
		backgroundColor: "#3c763d", // 초록색 배경
		borderRadius: 15,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 10,
	  },
	  toastCheckMark: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "bold",
	  },
	  toastTextContainer: {
		flex: 1,
	  },
	  toastTitle: {
		color: "#3c763d", // 짙은 초록색 텍스트
		fontSize: 18,
		fontWeight: "bold",
	  },
	  toastMessage: {
		color: "#3c763d", // 짙은 초록색 텍스트
		fontSize: 16,
	},
	  toastCloseButton: {
		marginLeft: 10,
		padding: 5,
	},
	  toastCloseText: {
		color: "#3c763d", // 짙은 초록색
		fontSize: 18,
		fontWeight: "bold",
	},
    helpButton: {
	position: "absolute",
	top: 10,
	right: 10,
	backgroundColor: "#FFF",
	width: 40,
	height: 40,
	borderRadius: 20,
	justifyContent: "center",
	alignItems: "center",
	shadowColor: "#000",
	shadowOffset: { width: 0, height: 2 },
	shadowOpacity: 0.2,
	shadowRadius: 3,
	elevation: 5,
	marginTop: 20,
	},
	helpButtonText: {
	fontSize: 20,
		fontWeight: "bold",
		color: "#333",
	},
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 20,
    paddingHorizontal: 10,
    paddingVertical: 50,
    backgroundColor: "#D4D4D425",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  tipContent: {
    alignItems: "center",
    flex: 1,
  },
  tipImage: {
    width: 150,
    height: 150,
    marginBottom: 30,
    borderRadius: 25,
  },
  tipTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  tipDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  roundButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
  },
  quoteContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  quoteText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default HomeScreen;
