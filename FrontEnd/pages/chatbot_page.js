import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ActivityIndicator, Modal, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTTS } from './hooks/useTTS';
import { useSTT } from './hooks/useSTT';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";

// 날짜 포맷 함수
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    const hours = (`0${date.getHours()}`).slice(-2);
    const minutes = (`0${date.getMinutes()}`).slice(-2);
    const seconds = (`0${date.getSeconds()}`).slice(-2);
    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분 ${seconds}초`;
};

const ChatbotPage = () => {
	const { speak, stop, isSpeaking } = useTTS();
	const { handleRecording, isRecording, isLoading } = useSTT();
	const [messages, setMessages] = useState([{ id: '1', text: '원하시는 상황을 입력해주세요.', sender: 'bot' }]);
	const [inputText, setInputText] = useState('');
	const [modalVisible, setModalVisible] = useState(false);
	const [chatRooms, setChatRooms] = useState([]);
	const [selectedChat, setSelectedChat] = useState(null);
	const flatListRef = useRef(null);
	const slideAnim = useRef(new Animated.Value(-300)).current;

	useEffect(() => {
		speak('안녕하세요! 원하시는 상황을 입력해주세요!');
		return () => stop();
	}, []);

	useEffect(() => {
		setTimeout(() => {
			flatListRef.current?.scrollToEnd({ animated: true });
		}, 100);
	}, [messages]);

	const toggleModal = () => {
		setModalVisible((prev) => !prev);
		Animated.timing(slideAnim, {
			toValue: modalVisible ? -300 : 0,
			duration: 500,
			easing: Easing.out(Easing.ease),
			useNativeDriver: true,
		}).start();
	};

	const loadChatRooms = async () => {
		try {
			const storedUuid = await SecureStore.getItemAsync("user_uuid");
			const response = await axios.post('http://61.81.99.111:5000/chat/list', { user_uuid: storedUuid });

			if (response.data.StatusCode === 200) {
				const chats = response.data.data.chats.map((chat) => ({
					...chat,
					last_message_at: formatDate(chat.last_message_at)
				}));
				setChatRooms(chats);
			}
		} catch (error) {
			console.error('채팅방 목록 로드 오류:', error);
		}
	};

	const loadChatHistory = async (chat_uuid) => {
		try {
			const storedUuid = await SecureStore.getItemAsync("user_uuid");
			const response = await axios.post('http://61.81.99.111:5000/chat/detail', { user_uuid: storedUuid, chat_uuid });
			if (response.data.StatusCode === 200) {
				setMessages(response.data.data.chat_history.map((item, index) => ({
					id: index.toString(),
					text: item.parts,
					sender: item.role === "user" ? "user" : "bot"
				})));
				setSelectedChat(chat_uuid);
			}
		} catch (error) {
			console.error('채팅 내역 로드 오류:', error);
		}
	};

	const addChatRoom = async () => {
		setMessages([{ id: '1', text: '새로운 채팅을 시작합니다.', sender: 'bot' }]);
		setSelectedChat(null);
	};

	const deleteChatRoom = async (chat_uuid) => {
		try {
			const storedUuid = await SecureStore.getItemAsync("user_uuid");
			await axios.post('http://61.81.99.111:5000/chat/delete', { user_uuid: storedUuid, chat_uuid });
			loadChatRooms();
			setMessages([{ id: '1', text: '채팅방이 삭제되었습니다.', sender: 'bot' }]);
		} catch (error) {
			console.error('채팅방 삭제 오류:', error);
		}
	};

	const sendMessage = async () => {
		if (inputText.trim()) {
			const newMessage = { id: Date.now().toString(), text: inputText, sender: 'user' };
			setMessages([...messages, newMessage]);
			setInputText('');

			try {
				const storedUuid = await SecureStore.getItemAsync("user_uuid");
				const response = await axios.post('http://61.81.99.111:5000/chat', { text: inputText, user_uuid: storedUuid, chat_uuid: selectedChat });
				if (response.data && response.data.data && response.data.data.response) {
					const botResponse = { id: Date.now().toString(), text: response.data.data.response, sender: 'bot' };
					setMessages((prevMessages) => [...prevMessages, botResponse]);
					speak(response.data.data.response);
				}
			} catch (error) {
				console.error('메시지 전송 오류:', error);
			}
		}
	};

	useEffect(() => {
		if (modalVisible) loadChatRooms();
	}, [modalVisible]);

	const renderMessage = ({ item }) => (
		<View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
			<Text style={styles.messageText}>{item.text}</Text>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView style={styles.innerContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
				<View style={styles.appBar}>
					<TouchableOpacity onPress={toggleModal}>
						<Ionicons name="menu" size={28} color="#fff" />
					</TouchableOpacity>
					<Text style={styles.appBarTitle}>채팅</Text>
					<TouchableOpacity onPress={addChatRoom}>
						<Ionicons name="add-circle" size={28} color="#fff" />
					</TouchableOpacity>
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
					{isSpeaking && (
						<TouchableOpacity style={styles.stopTTSButton} onPress={stop}>
							<Text style={styles.stopTTSButtonText}>TTS 중지</Text>
						</TouchableOpacity>
					)}
					{isLoading && (
						<View style={styles.loadingOverlay}>
							<ActivityIndicator size="large" color="#007AFF" />
							<Text style={styles.loadingText}>처리 중...</Text>
						</View>
					)}

					{/* 채팅방 리스트 모달 */}
					<Modal visible={modalVisible} transparent animationType="none">
						<TouchableWithoutFeedback onPress={toggleModal}>
							<View style={styles.modalOverlay} />
						</TouchableWithoutFeedback>
						<Animated.View style={[styles.modalContent, { transform: [{ translateX: slideAnim }] }]}>
							<Text style={styles.modalTitle}>채팅방 목록</Text>
							<FlatList
								data={chatRooms}
								keyExtractor={(item) => item.chat_uuid}
								renderItem={({ item }) => (
									<View>
										<TouchableOpacity style={styles.chatRoomButton} onPress={() => loadChatHistory(item.chat_uuid)}>
											<Text style={styles.chatRoomText}>{item.last_message_at}</Text>
										</TouchableOpacity>
										<TouchableOpacity onPress={() => deleteChatRoom(item.chat_uuid)}>
											<Text style={{ color: 'red', textAlign: 'center' }}>삭제</Text>
										</TouchableOpacity>
									</View>
								)}
							/>
						</Animated.View>
					</Modal>

					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View style={styles.inputContainer}>
							<TextInput style={styles.textInput} value={inputText} onChangeText={setInputText} placeholder="메시지를 입력하세요" placeholderTextColor="#aaa" />
							<TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
								<Text style={styles.sendButtonText}>전송</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.micButton, isRecording && styles.micButtonRecording]} onPress={handleRecording}>
								<Text style={styles.micButtonText}>{isRecording ? '중지' : '녹음'}</Text>
							</TouchableOpacity>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
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
});

export default ChatbotPage;
