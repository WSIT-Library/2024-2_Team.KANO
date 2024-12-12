import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet, Alert, PanResponder, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DOMAIN, TIMEOUT } from "../utils/service_info";
import * as Speech from "expo-speech";
import * as SecureStore from "expo-secure-store";
import axios from "axios";


const AacButton = ({ maxAacButtons, customAacButtons, setCustomAacButtons }) => {
	const [aacVisible, setAacVisible] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [newAacText, setNewAacText] = useState("");
	const [selectedIcon, setSelectedIcon] = useState("add-circle-outline");
	const position = useState(new Animated.ValueXY({ x: 270, y: 90 }))[0]; // 초기 위치 설정
	const [userUUID, setUserUUID] = useState("");
	const [archiveValues, setArchiveValues] = useState([]);
	const clickMilestones = [1, 3, 5, 7, 10, 15, 20, 30];
	const archiveNumbers = [32, 33, 34, 35, 36, 37, 38, 39];

	useEffect(() => {
		const getUserUUID = async () => {
			const uuid = await SecureStore.getItemAsync("user_uuid");
			setUserUUID(uuid);
		};
		getUserUUID();
	}, []);

	// PanResponder 정의
	const panResponder = PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onMoveShouldSetPanResponder: () => true,
		onPanResponderGrant: () => {
			position.setOffset({
				x: position.x._value,
				y: position.y._value,
			});
			position.setValue({ x: 0, y: 0 });
		},
		onPanResponderMove: Animated.event(
			[null, { dx: position.x, dy: position.y }],
			{ useNativeDriver: false }
		),
		onPanResponderRelease: () => {
			position.flattenOffset(); // 위치를 고정
		},
	});

	const toggleAacVisibility = () => {
		setAacVisible(!aacVisible);
	};

	const addCustomAacButton = async () => {
		if (newAacText.trim() && customAacButtons.length < maxAacButtons) {
			setCustomAacButtons([
				...customAacButtons,
				{ id: Date.now().toString(), text: newAacText, icon: selectedIcon },
			]);

			let count = await SecureStore.getItemAsync("CountAddAACButton");
			count = count ? parseInt(count) + 1 : 1;
			await SecureStore.setItemAsync("CountAddAACButton", count.toString());

			if (clickMilestones.includes(count)) {
				const index = clickMilestones.indexOf(count);
				const newArchiveValue = archiveNumbers[index];

				let currentArchive = await SecureStore.getItemAsync("CompleteArchive");
				currentArchive = currentArchive ? JSON.parse(currentArchive) : [];
				if (!currentArchive.includes(newArchiveValue)) {
					const updatedArchive = [...currentArchive, newArchiveValue];
					await SecureStore.setItemAsync("CompleteArchive", JSON.stringify(updatedArchive));
					setArchiveValues(updatedArchive);
					await sendChallengeData(updatedArchive);
				}
			}

			setNewAacText("");
			setSelectedIcon("add-circle-outline");
			setModalVisible(false);
		} else {
			Alert.alert("최대 5개의 버튼만 추가할 수 있습니다.");
		}
	};

	const sendChallengeData = async (updatedArchive) => {
		try {
			const response = await axios.post(`${DOMAIN}/challenge/register`, {
				user_uuid: userUUID,
				challenge_id: updatedArchive,
			},{ timeout: TIMEOUT } );
			console.log("도전과제 등록 성공:", response.data);
		} catch (error) {
			//console.error("도전과제 등록 실패:", error);
		}
	};

	const deleteCustomAacButton = (id) => {
		setCustomAacButtons(customAacButtons.filter((button) => button.id !== id));
	};

	const iconOptions = [
		"water-outline",
		"chatbox-ellipses-outline",
		"fast-food-outline",
		"bicycle-outline",
		"desktop-outline",
		"body-outline",
		"help-circle-outline",
		"bed-outline",
		"megaphone-outline",
		"notifications-outline",
		"thumbs-up-outline",
		"thumbs-down-outline",
		"trash-outline",
		"sunny-outline",
		"add-circle-outline",
	];

	return (
		<Animated.View
			style={[styles.draggableContainer, position.getLayout()]}
			{...panResponder.panHandlers} // PanResponder 연결
		>
			<TouchableOpacity style={styles.aacButton} onPress={toggleAacVisibility}>
				<Text style={styles.aacButtonText}>음성도움</Text>
			</TouchableOpacity>

			{aacVisible && (
				<>
					{customAacButtons.map((button) => (
						<View key={button.id} style={styles.aacButtonContainer}>
							<TouchableOpacity
								style={styles.deleteButton}
								onPress={() => deleteCustomAacButton(button.id)}
							>
								<Ionicons name="trash-outline" size={24} color="white" />
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.customButton} // 사용자 정의 버튼 스타일
								onPress={() => Speech.speak(button.text, { language: "ko" })}
							>
								<Ionicons name={button.icon} size={30} color="white" />
								<Text style={styles.customButtonText}>{button.text}</Text>
							</TouchableOpacity>
						</View>
					))}

					<TouchableOpacity style={styles.aacButton} onPress={() => setModalVisible(true)}>
						<Ionicons name="add-circle-outline" size={30} color="black" />
						<Text style={styles.aacButtonText}>버튼 추가</Text>
					</TouchableOpacity>
				</>
			)}

			<Modal
				animationType="slide"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>새 음성버튼 추가</Text>
						<TextInput
							style={styles.textInput}
							placeholder="문장을 입력하세요"
							placeholderTextColor="#aaa"
							value={newAacText}
							onChangeText={setNewAacText}
						/>
						<View style={styles.iconPicker}>
							{iconOptions.map((icon) => (
								<TouchableOpacity
									key={icon}
									onPress={() => setSelectedIcon(icon)}
									style={[
										styles.iconOption,
										selectedIcon === icon && styles.selectedIcon,
									]}
								>
									<Ionicons name={icon} size={30} color="black" />
								</TouchableOpacity>
							))}
						</View>

						<View style={styles.buttonRow}>
							<TouchableOpacity
								style={styles.ModaladdButton}
								onPress={addCustomAacButton}
							>
								<Text style={styles.addButtonText}>추가</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={() => setModalVisible(false)}
							>
								<Text style={styles.addButtonText}>닫기</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	draggableContainer: {
		position: "absolute",
		zIndex: 1,
	},
	aacButton: {
		backgroundColor: "#fff",
		width: 80,
		height: 80,
		borderRadius: 50,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 4.84,
		elevation: 5,
		borderWidth: 2,
		borderColor: "#000",
	},
	aacButtonText: {
		color: "black",
		fontWeight: "bold",
		fontSize: 16,
	},
	customButton: {
		backgroundColor: "#000", 
		width: 80,
		height: 80,
		borderRadius: 50,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 4.84,
		elevation: 5,
		borderWidth: 2,
		borderColor: "#fff",
	},
	customButtonText: {
		color: "white",
		fontSize: 14,
	},
	aacButtonContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
	},
	deleteButton: {
		backgroundColor: "red",
		borderRadius: 50,
		padding: 10,
		marginRight: 10,
	},
	modalContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	modalContent: {
		backgroundColor: "white",
		padding: 20,
		borderRadius: 10,
		width: "80%",
		alignItems: "center",
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	textInput: {
		width: '100%',
		height: 50,
		borderWidth: 1,
		borderColor: '#007AFF',
		borderRadius: 10,
		padding: 10,
		fontSize: 18,
		color: 'black',
		backgroundColor: 'white',
		textAlignVertical: 'top',
	},
	iconPicker: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginVertical: 10,
		width: "100%",
	},
	iconOption: {
		width: "18%",
		alignItems: "center",
		marginVertical: 5,
	},
	selectedIcon: {
		borderColor: "#007AFF",
		borderWidth: 2,
		borderRadius: 10,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	ModaladdButton: {
		backgroundColor: "#007AFF",
		padding: 15,
		borderRadius: 10,
		alignItems: "center",
		flex: 1,
		marginRight: 10,
	},
	closeButton: {
		backgroundColor: "#FF5C5C",
		padding: 15,
		borderRadius: 10,
		alignItems: "center",
		flex: 1,
	},
	addButtonText: {
		color: "#fff",
		fontSize: 16,
	},
});

export default AacButton;
