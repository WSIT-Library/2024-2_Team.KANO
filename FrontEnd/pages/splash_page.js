import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreenComponent() {
	const navigation = useNavigation();

	useEffect(() => {
		const initializeApp = async () => {
			try {
				// 스플래시 화면이 자동으로 숨겨지지 않도록 설정
				await SplashScreen.preventAutoHideAsync();

				// 주석: 튜토리얼을 다시 보기 위해 기존 설정값 제거
				// let RestartTutorial = await SecureStore.deleteItemAsync('FinishedTutorial');

				// FinishedTutorial 키 값 확인
				let finishedTutorial = await SecureStore.getItemAsync('FinishedTutorial');
				console.log("초기 FinishedTutorial 값:", finishedTutorial);

				// 키가 없으면 기본값을 0으로 설정
				if (finishedTutorial === null) {
					await SecureStore.setItemAsync('FinishedTutorial', '0');
					finishedTutorial = '0';
					console.log("FinishedTutorial 기본값 설정:", finishedTutorial);
				}

				// 2초 대기
				await new Promise(resolve => setTimeout(resolve, 2000));

				// 스플래시 화면을 숨기고 페이지 이동
				await SplashScreen.hideAsync();

				// 튜토리얼 완료 여부에 따라 페이지 이동
				if (finishedTutorial !== '1') {
					console.log("튜토리얼 미완료 또는 키 없음: 튜토리얼 페이지로 이동");
					navigation.replace('Tutorial');
				} else {
					console.log("튜토리얼 완료: 로그인 페이지로 이동");
					navigation.replace('Login');
				}
			} catch (error) {
				console.error("초기화 오류:", error);
			}
		};

		initializeApp();
	}, []);

	return (
		<View style={styles.container}>
			<Image source={require('../assets/logo.png')} style={styles.logo} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#00BCD4',
		justifyContent: 'center',
		alignItems: 'center',
	},
	logo: {
		width: 100,
		height: 100,
		resizeMode: 'contain',
	},
});
