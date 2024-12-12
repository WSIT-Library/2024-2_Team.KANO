import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ActivityIndicator, Modal, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTTS } from './hooks/useTTS';
import { useSTT } from './hooks/useSTT';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { DOMAIN, TIMEOUT } from "../../utils/service_info";
import * as SecureStore from "expo-secure-store";
import Markdown from 'react-native-markdown-display';
import Toast from 'react-native-toast-message';

const formatChatRoomDate = (dateString) => {
	const date = new Date(dateString);
	const month = (`0${date.getMonth() + 1}`).slice(-2);
	const day = (`0${date.getDate()}`).slice(-2);
	const hours = (`0${date.getHours()}`).slice(-2);
	const minutes = (`0${date.getMinutes()}`).slice(-2);
	return `${month}월 ${day}일 ${hours}시 ${minutes}분`;
};

const formatChatTitle = (text) => {
	if (!text) return '제목 없음';
	if (text.length > 6) {
		return `${text.slice(0, 6)}...`;
	}
	return text;
};

const milestoneMap = {
	3: 24,
	5: 25,
	10: 26,
	15: 27,
	23: 28,
	30: 29,
	40: 30,
	50: 31
};

const messageMilestoneMap = {
	1: 19,
	10: 20,
	20: 21,
	30: 22,
	50: 23
};

// SecureStore에 값 설정
async function secureSetItem(key, value) {
	try {
		await SecureStore.setItemAsync(key, value);
	} catch (err) {
		console.error(`Error setting ${key}:`, err);
	}
}

// SecureStore에서 값 가져오기
async function secureGetItem(key) {
	try {
		return await SecureStore.getItemAsync(key);
	} catch (err) {
		console.error(`Error getting ${key}:`, err);
		return null;
	}
}

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

	const getFirstMessage = async (chat_uuid) => {
		try {
			const storedUuid = await secureGetItem("user_uuid");
			const response = await axios.post(`${DOMAIN}/chat/detail`, {
				user_uuid: storedUuid,
				chat_uuid,
			}, { timeout: TIMEOUT });

			if (response.data.StatusCode === 200) {
				const chatHistory = response.data.data.chat_history;
				if (chatHistory && chatHistory.length > 0) {
					const firstMessage = chatHistory.find((message) => message.role === 'user');
					return firstMessage ? firstMessage.parts : '제목 없음';
				}
			}
			return '제목 없음';
		} catch (error) {
			console.error(`첫 번째 메시지 가져오기 오류 (${chat_uuid}):`, error);
			return '제목 없음';
		}
	};

	const loadChatRooms = async () => {
		try {
			const storedUuid = await secureGetItem("user_uuid");
			const response = await axios.post(`${DOMAIN}/chat/list`, { user_uuid: storedUuid }, { timeout: TIMEOUT });

			if (response.data.StatusCode === 200) {
				const chats = response.data.data.chats;
				const chatRoomsWithTitles = await Promise.all(
					chats.map(async (chat) => {
						const firstMessage = await getFirstMessage(chat.chat_uuid);
						return {
							...chat,
							title: formatChatTitle(firstMessage),
							last_message_at: formatChatRoomDate(chat.last_message_at),
						};
					})
				);
				setChatRooms(chatRoomsWithTitles);
			}
		} catch (error) {
			console.error('채팅방 목록 로드 오류:', error);
		}
	};

	const loadChatHistory = async (chat_uuid) => {
		try {
			const storedUuid = await secureGetItem("user_uuid");
			const response = await axios.post(`${DOMAIN}/chat/detail`, { user_uuid: storedUuid, chat_uuid }, { timeout: TIMEOUT });
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
		setMessages([{ id: '1', text: '원하시는 상황을 입력해주세요.', sender: 'bot' }]);
		setSelectedChat(null);

		try {
			const storedUuid = await secureGetItem("user_uuid");
			let countString = await secureGetItem("CountAddChatRoom");
			let count = countString ? parseInt(countString, 10) : 0;
			count += 1;
			await secureSetItem("CountAddChatRoom", count.toString());

			if (milestoneMap[count]) {
				const challengeId = milestoneMap[count];
				let archiveString = await secureGetItem("CompleteArchive");
				let archiveValues = archiveString ? JSON.parse(archiveString) : [];
				if (!archiveValues.includes(challengeId)) {
					archiveValues.push(challengeId);
					await secureSetItem("CompleteArchive", JSON.stringify(archiveValues));

					await axios.post(`${DOMAIN}/challenge/register`, {
						"user_uuid": storedUuid,
						"challenge_id": challengeId
					}, { timeout: TIMEOUT });
				}
			}

		} catch (err) {
			console.error('채팅방 생성 처리 오류:', err);
		}

		Toast.show({
			type: 'success',
			text1: '채팅방 생성',
			text2: '새로운 채팅방이 생성되었습니다.',
		});
	};

	const deleteChatRoom = async (chat_uuid) => {
		try {
			const storedUuid = await secureGetItem("user_uuid");
			await axios.post(`${DOMAIN}/chat/delete`, { user_uuid: storedUuid, chat_uuid }, { timeout: TIMEOUT });
			loadChatRooms();
			setMessages([{ id: '1', text: '원하시는 상황을 입력해주세요.', sender: 'bot' }]);
			Toast.show({
				type: 'error',
				text1: '채팅방 삭제',
				text2: '채팅방이 삭제되었습니다.',
			});
		} catch (error) {
			console.error('채팅방 삭제 오류:', error);
		}
	};

	const handleMessageAchievement = async () => {
		try {
			const storedUuid = await secureGetItem("user_uuid");
			let countString = await secureGetItem("CountAchievements");
			let count = countString ? parseInt(countString, 10) : 0;

			count += 1;
			await secureSetItem("CountAchievements", count.toString());
			
			const afterCountString = await secureGetItem("CountAchievements");
			console.log(`CountAchievements 저장 확인: ${afterCountString}`);

			if (messageMilestoneMap[count]) {
				const challengeId = messageMilestoneMap[count];
				let archiveString = await secureGetItem("CompleteArchive");
				let archiveValues = archiveString ? JSON.parse(archiveString) : [];

				if (!archiveValues.includes(challengeId)) {
					archiveValues.push(challengeId);
					await secureSetItem("CompleteArchive", JSON.stringify(archiveValues));

					const afterArchiveString = await secureGetItem("CompleteArchive");
					console.log(`CompleteArchive 저장 확인: ${afterArchiveString}`);

					await axios.post(`${DOMAIN}/challenge/register`, {
						"user_uuid": storedUuid,
						"challenge_id": challengeId
					}, { timeout: TIMEOUT });
				} else {

				}
			}
		} catch (err) {
			console.error('메시지 전송 도전과제 처리 오류:', err);
			Toast.show({
				type: 'error',
				text1: '도전과제 처리 오류',
				text2: `${err.message}`
			});
		}
	};

	const sendMessage = async () => {
		Keyboard.dismiss();

		if (inputText.trim()) {
			const newMessage = { id: Date.now().toString(), text: inputText, sender: 'user' };
			setMessages([...messages, newMessage]);

			await handleMessageAchievement();

			setInputText('');

			try {
				const storedUuid = await secureGetItem("user_uuid");
				const response = await axios.post(`${DOMAIN}/chat`, {
					text: inputText,
					user_uuid: storedUuid,
					chat_uuid: selectedChat
				}, { timeout: TIMEOUT });

				if (response.data && response.data.data) {
					if (!selectedChat) {
						setSelectedChat(response.data.data.chat_uuid);
					}

					const botResponseText = response.data.data.response;
					const botResponse = { id: Date.now().toString(), text: '', sender: 'bot' };
					setMessages((prevMessages) => [...prevMessages, botResponse]);

					typingEffect(botResponseText, (updatedText) => {
						setMessages((prevMessages) =>
							prevMessages.map((msg) => (msg.id === botResponse.id ? { ...msg, text: updatedText } : msg))
						);
					});

					speak(botResponseText);
				}
			} catch (error) {
				console.error('메시지 전송 오류:', error);
			}
		}
	};

	const handleMicPress = async () => {
		const sttResult = await handleRecording();
		if (sttResult) {
			setInputText(sttResult);
		}
	};

	const typingEffect = (text, callback) => {
		let index = 0;
		const intervalId = setInterval(() => {
			callback(text.slice(0, index + 1));
			index++;
			if (index === text.length) {
				clearInterval(intervalId);
			}
		}, 50);
	};

	useEffect(() => {
		if (modalVisible) loadChatRooms();
	}, [modalVisible]);

	const renderMessage = ({ item }) => (
		<View
			key={item.id}
			style={[
				styles.messageContainer,
				item.sender === 'user' ? styles.userMessage : styles.botMessage
			]}
		>
			{item.sender === 'bot' ? (
				<Markdown style={styles.messageText}>{item.text}</Markdown>
			) : (
				<Text style={styles.messageText}>{item.text}</Text>
			)}
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<Toast />
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
									<View style={styles.chatRoomContainer}>
										<TouchableOpacity style={styles.chatRoomButton} onPress={() => loadChatHistory(item.chat_uuid)}>
											<Text style={styles.chatRoomTitle}>{item.title}</Text>
											<Text style={styles.chatRoomDate}>{item.last_message_at}</Text>
										</TouchableOpacity>
										<TouchableOpacity onPress={() => deleteChatRoom(item.chat_uuid)} style={styles.deleteButton}>
											<Ionicons name="trash" size={24} color="red" />
										</TouchableOpacity>
									</View>
								)}
							/>
						</Animated.View>
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
							<TouchableOpacity style={[styles.micButton, isRecording && styles.micButtonRecording]} onPress={handleMicPress}>
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
		justifyContent: 'space-between',
		zIndex: -9,
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
	chatRoomContainer: {
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#EAEAEA',
	},
	chatRoomButton: {
		padding: 15,
		backgroundColor: '#b5eaf5',
		borderRadius: 10,
		marginBottom: 10,
	},
	chatRoomTitle: {
		color: '#000',
		fontSize: 18,
		fontWeight: 'bold',
	},
	chatRoomDate: {
		color: '#000',
		fontSize: 14,
		marginTop: 5,
		opacity: 0.8,
	},
	deleteButton: {
		position: 'absolute',
		right: 10,
		top: '50%',
		transform: [{ translateY: -12 }],
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
