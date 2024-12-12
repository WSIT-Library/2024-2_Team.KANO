import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // LinearGradient를 사용하려면 설치 필요

const conditionKeys = [
    'CountLogin',
    'CountAddDate',
    'CountTodoList100',
    'CountAIChatOneRoom',
    'CountAddChatRoom',
    'CountAddAACButton',
    'CountWeatherHealth',
    'CountAchievements',
    'CountUsingDays',
];

export default function SplashScreenComponent() {
    const navigation = useNavigation();

    useEffect(() => {
		const initializeApp = async () => {
			try {
				// 스플래시 화면이 자동으로 숨겨지지 않도록 설정
				await SplashScreen.preventAutoHideAsync();
	
				// 각 조건 확인 키가 존재하는지 확인하고 없으면 기본값으로 생성
				for (const key of conditionKeys) {
					let value = await SecureStore.getItemAsync(key);
					if (value === null) {
						await SecureStore.setItemAsync(key, '0'); // 기본값 0으로 설정
						console.log(`${key} 기본값 설정: 0`);
						value = '0'; // 기본값을 설정한 후 value에 '0' 할당
					}
					console.log(`${key}: ${value}`); // 각 키와 값을 출력
				}
	
				// CompleteArchive 키 확인 및 기본값 설정
				let completeArchive = await SecureStore.getItemAsync('CompleteArchive');
				if (completeArchive === null) {
					await SecureStore.setItemAsync('CompleteArchive', JSON.stringify([])); // 빈 배열로 설정
					console.log('CompleteArchive 기본값 설정: []');
					completeArchive = '[]';
				}
				console.log(`CompleteArchive: ${completeArchive}`);
	
				// FinishedTutorial 키 확인 및 기본값 설정
				let finishedTutorial = await SecureStore.getItemAsync('FinishedTutorial');
				if (finishedTutorial === null) {
					await SecureStore.setItemAsync('FinishedTutorial', '0');
					finishedTutorial = '0';
					console.log('FinishedTutorial 기본값 설정: 0');
				}
				console.log(`FinishedTutorial: ${finishedTutorial}`);
	
				// 2초 대기
				await new Promise(resolve => setTimeout(resolve, 2000));
	
				// 스플래시 화면을 숨기고 페이지 이동
				await SplashScreen.hideAsync();
	
				// 튜토리얼 완료 여부에 따라 페이지 이동
				if (finishedTutorial !== '1') {
					console.log('튜토리얼 미완료 또는 키 없음: 튜토리얼 페이지로 이동');
					navigation.replace('Tutorial');
				} else {
					console.log('튜토리얼 완료: 로그인 페이지로 이동');
					navigation.replace('Login');
				}
			} catch (error) {
				console.error('초기화 오류:', error);
			}
		};
	
		initializeApp();
	}, []);

    return (
        <LinearGradient
            colors={['#E8DFF5', '#F5FFFA']} // 그라데이션 색상 설정
            style={styles.container}
        >
            <Image source={require('../assets/logo.png')} style={styles.logo} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 300,
        height: 300,
        resizeMode: 'contain',
    },
});
