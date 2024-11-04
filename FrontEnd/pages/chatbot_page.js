import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ActivityIndicator, Modal } from 'react-native';
import { useTTS } from './hooks/useTTS'; // TTS 훅 import
import { useSTT } from './hooks/useSTT'; // STT 훅 import
import axios from 'axios'; // axios import 추가
import { Ionicons } from '@expo/vector-icons';

const ChatbotPage = () => {
	const { speak, stop, isSpeaking } = useTTS();
	const { handleRecording, isRecording, isLoading } = useSTT();
	const [messages, setMessages] = useState([
		{
			id: '1',
			text: '원하시는 상황을 입력해주세요.',
			sender: 'bot',
		},
	]);
	const [inputText, setInputText] = useState('');
	const [modalVisible, setModalVisible] = useState(false);
	const flatListRef = useRef(null);

	useEffect(() => {
		speak('안녕하세요! 원하시는 상황을 입력해주세요!');

		return () => {
			stop();
		};
	}, []);

	useEffect(() => {
		setTimeout(() => {
			flatListRef.current?.scrollToEnd({ animated: true });
		}, 100);
	}, [messages]);

	const sendMessage = async () => {
		if (inputText.trim()) {
			const newMessage = {
				id: Date.now().toString(),
				text: inputText,
				sender: 'user',
			};
			setMessages([...messages, newMessage]);
			setInputText('');

			try {
				const response = await axios.post('http://61.81.99.111:5000/chat', { text: inputText });

				if (response.data && response.data.data && response.data.data.response) {
					const botResponse = {
						id: Date.now().toString(),
						text: response.data.data.response,
						sender: 'bot',
					};
					setMessages((prevMessages) => [...prevMessages, botResponse]);

					speak(response.data.data.response);
				}
			} catch (error) {
				console.error('메시지 전송 오류:', error);
			}
		}
	};

	// STT 결과를 받아와서 inputText에 자동 입력하는 함수
	const handleRecordingResult = async () => {
		const result = await handleRecording();
		if (result) {
			setInputText(result); // STT 결과를 inputText에 입력
		}
	};

	const renderMessage = ({ item }) => (
		<View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
			<Text style={styles.messageText}>{item.text}</Text>
		</View>
	);

	const renderTTSControl = () => (
		isSpeaking && (
			<TouchableOpacity style={styles.stopTTSButton} onPress={stop}>
				<Text style={styles.stopTTSButtonText}>TTS 중지</Text>
			</TouchableOpacity>
		)
	);

	const chatRooms = [
		{ id: '1', name: '1번방' },
		{ id: '2', name: '2번방' },
		{ id: '3', name: '3번방' },
		// 추가 채팅방을 원하면 여기에 더 추가하세요
	];
	
	const toggleModal = () => {
		setModalVisible(!modalVisible);
	  };

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
		>
			<View style={styles.appBar}>
        		<TouchableOpacity onPress={toggleModal}>
          		<Ionicons name="menu" size={28} color="#fff" />
        		</TouchableOpacity>
        		<Text style={styles.appBarTitle}>채팅</Text>
			</View>
			
			<View style={styles.innerContainer}>
				<FlatList
					ref={flatListRef}
					data={messages}
					renderItem={renderMessage}
					keyExtractor={(item) => item.id}
					style={styles.messageList}
					onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
					onLayout={() => flatListRef.current?.scrollToEnd()}
				/>
				{renderTTSControl()}
				{isLoading && (
					<View style={styles.loadingOverlay}>
						<ActivityIndicator size="large" color="#007AFF" />
						<Text style={styles.loadingText}>처리 중...</Text>
					</View>
				)}

				{/* 채팅방 리스트 모달 */}
				<Modal visible={modalVisible} transparent animationType="slide">
        			<TouchableWithoutFeedback onPress={toggleModal}>
          				<View style={styles.modalOverlay} />
        			</TouchableWithoutFeedback>
        			<View style={styles.modalContent}>
          				<Text style={styles.modalTitle}>채팅방 목록</Text>
          				<FlatList
           					data={chatRooms}
            				keyExtractor={(item) => item.id}
            				renderItem={({ item }) => (
              					<TouchableOpacity style={styles.chatRoomButton} onPress={() => console.log(`${item.name} 선택됨`)}>
                					<Text style={styles.chatRoomText}>{item.name}</Text>
              					</TouchableOpacity>
            				)}
          				/>
        			</View>
      			</Modal>

				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.textInput}
							value={inputText}
							onChangeText={setInputText}
							placeholder="메시지를 입력하세요"
							placeholderTextColor="#aaa"
						/>
						<TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
							<Text style={styles.sendButtonText}>전송</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.micButton, isRecording && styles.micButtonRecording]}
							onPress={handleRecordingResult}
						>
							<Text style={styles.micButtonText}>{isRecording ? '중지' : '녹음'}</Text>
						</TouchableOpacity>
					</View>
				</TouchableWithoutFeedback>
			</View>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#e6f7ff',
	},
	innerContainer: {
		flex: 1,
		justifyContent: 'space-between',
	},
	messageList: {
		flex: 1,
		padding: 10,
	},
	messageContainer: {
		marginVertical: 8,
		padding: 15,
		borderRadius: 15,
		maxWidth: '80%',
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	userMessage: {
		alignSelf: 'flex-end',
		backgroundColor: '#cce5ff',
	},
	botMessage: {
		alignSelf: 'flex-start',
		backgroundColor: '#eaeaea',
	},
	messageText: {
		fontSize: 17,
	},
	inputContainer: {
		flexDirection: 'row',
		padding: 10,
		borderTopWidth: 1,
		borderColor: '#EAEAEA',
		alignItems: 'center',
	},
	textInput: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#007AFF',
		borderRadius: 20,
		padding: 10,
		fontSize: 18,
		backgroundColor: '#fff',
	},
	sendButton: {
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 10,
		backgroundColor: '#007AFF',
		borderRadius: 20,
		paddingHorizontal: 15,
		paddingVertical: 12,
	},
	sendButtonText: {
		color: '#fff',
		fontSize: 18,
	},
	micButton: {
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 10,
		backgroundColor: '#FF4081',
		borderRadius: 20,
		paddingHorizontal: 15,
		paddingVertical: 12,
	},
	micButtonRecording: {
		backgroundColor: '#ff0000',
	},
	micButtonText: {
		color: '#fff',
		fontSize: 18,
	},
	loadingOverlay: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: [{ translateX: -50 }, { translateY: -50 }],
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.7)',
		borderRadius: 10,
		padding: 20,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: '#007AFF',
	},
	stopTTSButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		backgroundColor: '#FF4081',
		padding: 8,
		borderRadius: 15,
		zIndex: 1,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	stopTTSButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
	appBar: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#007AFF',
		padding: 15,
		elevation: 4,
	 },
	 appBarTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
		marginLeft: 10,
	 },
	 modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	 },
	 modalContent: {
		position: 'absolute',
		top: 30,
		left: 0,
		width: '70%',
		height: '100%',
		backgroundColor: '#fff',
		padding: 20,
		elevation: 5,
	 },
	 modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 20,
		color: '#007AFF',
	 },
	 chatRoomButton: {
		padding: 15,
		backgroundColor: '#007AFF',
		borderRadius: 10,
		marginBottom: 10,
	 },
	 chatRoomText: {
		color: '#fff',
		fontSize: 18,
		textAlign: 'center',
	 },
});

export default ChatbotPage;
