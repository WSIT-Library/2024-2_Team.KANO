import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import * as SecureStore from "expo-secure-store";
import { DOMAIN, TIMEOUT } from "../utils/service_info";
import Toast from 'react-native-toast-message';
import AacButton from './aac_button'; // AAC 버튼 컴포넌트 임포트

const CustomToast = ({ text1, text2 }) => (
	<View style={styles.customToastContainer}>
		<Text style={styles.customToastTitle}>{text1}</Text>
		<Text style={styles.customToastMessage}>{text2}</Text>
	</View>
);

const HomeScreen = () => {
	const [username, setUsername] = useState("");
	const [quote, setQuote] = useState("");
	const [loadingQuote, setLoadingQuote] = useState(false);

	const [customAacButtons, setCustomAacButtons] = useState([]);
	const maxAacButtons = 5;

	useEffect(() => {
		const fetchUsername = async () => {
			try {
				const user_uuid = await SecureStore.getItemAsync('user_uuid');
				if (user_uuid) {
					const response = await axios.post(`${DOMAIN}/auth/checkuuid`, { user_uuid }, { timeout: TIMEOUT });
					if (response.data.StatusCode === 200) {
						const fetchedUsername = response.data.data.username;
						setUsername(fetchedUsername);

						Toast.show({
							type: 'custom_success',
							text1: '환영합니다!',
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
	}, []);

	const handleQuoteTouch = async () => {
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

	return (
		<LinearGradient
			colors={['#E8DFF5', '#F5FFFA']}
			style={styles.container}
		>
			<SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 100 }}>
				<Image
					source={require("../assets/logo.png")}
					style={styles.logo}
					resizeMode="contain"
				/>
				<Text style={styles.title}>
					<Text style={styles.username}>{username || "사용자"}</Text>님, 안녕하세요!
				</Text>

				<TouchableOpacity
					style={styles.quoteContainer}
					onPress={handleQuoteTouch}
					activeOpacity={0.8}
				>
					{loadingQuote ? (
						<ActivityIndicator size="large" color="#007AFF" />
					) : (
						<View style={styles.quoteContent}>
							<Text style={styles.quoteMark}>“</Text>
							<Text style={styles.quoteText}>{quote}</Text>
							<Text style={[styles.quoteMark, styles.rightQuote]}>”</Text>
						</View>
					)}
				</TouchableOpacity>

				<AacButton
					maxAacButtons={maxAacButtons}
					customAacButtons={customAacButtons}
					setCustomAacButtons={setCustomAacButtons}
				/>

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
		width: '90%',
		padding: 20,
		backgroundColor: '#f4f2f5',
		borderRadius: 10,
		alignSelf: 'center',
		marginTop: 20,
	},
	customToastTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#000',
		textAlign: 'center',
	},
	customToastMessage: {
		fontSize: 20,
		color: '#000',
		textAlign: 'center',
		marginTop: 10,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
		color: "#007AFF",
	},
	username: {
		color: "black",
		fontSize: 32,
	},
	quoteContainer: {
		marginVertical: 20,
		paddingHorizontal: 15,
		paddingVertical: 10,
		backgroundColor: "#D4D4D425",
		borderRadius: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 5,
		alignItems: "center",
	},
	quoteContent: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "center",
		flexWrap: "wrap",
	},
	quoteMark: {
		fontSize: 40,
		color: "#808080",
		fontFamily: "Georgia",
		fontWeight: "bold",
	},
	rightQuote: {
		marginTop: -10,
		marginLeft: 5,
	},
	quoteText: {
		fontSize: 20,
		fontStyle: "italic",
		textAlign: "center",
		color: "#333",
		marginHorizontal: 10,
		flexShrink: 1,
	},
});

export default HomeScreen;
