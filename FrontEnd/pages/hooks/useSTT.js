import { useState } from 'react';
import { Audio } from 'expo-av';
import axios from 'axios';

export const useSTT = () => {
	const [recording, setRecording] = useState(null);
	const [isRecording, setIsRecording] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const startRecording = async () => {
		try {
			const { granted } = await Audio.requestPermissionsAsync();
			if (!granted) {
				alert('마이크 접근 권한이 필요합니다.');
				return;
			}

			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				playThroughEarpieceAndroid: false,
			});

			const newRecording = new Audio.Recording();
			await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
			await newRecording.startAsync();
			setRecording(newRecording);
			setIsRecording(true);
		} catch (error) {
			console.error('녹음 시작 오류: ', error);
		}
	};

	const stopRecording = async () => {
		try {
			await recording.stopAndUnloadAsync();
			const uri = recording.getURI();
			setRecording(null);
			setIsRecording(false);
			setIsLoading(true);

			const formData = new FormData();
			formData.append('audio', {
				uri,
				type: 'audio/m4a',
				name: 'recording.m4a',
			});

			try {
				const response = await axios.post('https://api.gaon.xyz/stt', formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});

				if (response.data && response.data.data) {
					return response.data.data.text;
				} else {
					console.log('STT 실패: ', response.data);
					return null;
				}
			} catch (error) {
				console.error('STT 요청 오류: ', error.response || error.message);
				return null;
			} finally {
				setIsLoading(false);
			}
		} catch (error) {
			console.error('녹음 중지 오류: ', error);
		}
	};

	const handleRecording = async () => {
		if (isRecording) {
			return await stopRecording();
		} else {
			await startRecording();
		}
	};

	return {
		handleRecording,
		isRecording,
		isLoading,
	};
};
