import { useState, useContext, useCallback } from 'react';
import { Audio } from 'expo-av';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { VoiceContext } from '../../Context';

export const useTTS = () => {
	const { selectedVoice } = useContext(VoiceContext);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [sound, setSound] = useState(null);

	const speak = useCallback(async (text) => {
		try {
			// 이미 재생 중인 음성이 있다면 중지
			if (isSpeaking && sound) {
				await sound.stopAsync();
				await sound.unloadAsync();
				setSound(null);
			}

			setIsSpeaking(true);

			// TTS API로 GET 요청 보내기
			const response = await axios.get(`https://api.gaon.xyz/tts`, {
				params: {
					action: 'tts',
					service: 'edgetts',
					language: selectedVoice,
					text: text,
				},
			});

			// // EdgeTTS가 현재 API 오류나서 임시로 Google TTS 사용
			// const response = await axios.get(`https://api.gaon.xyz/tts`, {
			// 	params: {
			// 		action: 'tts',
			// 		service: 'gtts',
			// 		language: selectedVoice.substring(0, 2),
			// 		text: text,
			// 	},
			// });

			const audioBase64 = response.data.data.audio;

			// base64로 인코딩된 오디오를 디코딩하여 재생
			const { sound: newSound } = await Audio.Sound.createAsync({
				uri: `data:audio/wav;base64,${audioBase64}`,
			});

			setSound(newSound);
			await newSound.playAsync();

			newSound.setOnPlaybackStatusUpdate((status) => {
				if (status.didJustFinish) {
					setIsSpeaking(false);
				}
			});
		} catch (apiError) {
			console.error('API TTS Error, falling back to local TTS:', apiError);

			// API 요청이 실패하면 로컬 TTS로 대체
			try {
				await Speech.stop(); // 이미 재생 중인 음성이 있다면 중지
				Speech.speak(text, {
					voice: selectedVoice,
					rate: 1.0,
					onDone: () => setIsSpeaking(false),
					onError: (localError) => {
						console.error('Local TTS Error:', localError);
						setIsSpeaking(false);
					}
				});
			} catch (localTtsError) {
				console.error('TTS Fallback Error:', localTtsError);
			}
		}
	}, [selectedVoice, isSpeaking, sound]);

	const stop = useCallback(async () => {
		try {
			if (sound) {
				await sound.stopAsync();
				await sound.unloadAsync();
				setSound(null);
			}
			await Speech.stop(); // 로컬 TTS도 중지
			setIsSpeaking(false);
		} catch (error) {
			console.error('TTS Stop Error:', error);
		}
	}, [sound]);

	return {
		speak,
		stop,
		isSpeaking,
	};
};
