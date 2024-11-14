// home_screen.js
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Modal } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import TodoList from './TodoList';
import * as Speech from "expo-speech";
import * as SecureStore from "expo-secure-store";
import axios from 'axios';

const HomeScreen = () => {
    const [aacVisible, setAacVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newAacText, setNewAacText] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("add-circle-outline");
    const [customAacButtons, setCustomAacButtons] = useState([]);
    const [username, setUsername] = useState("");

    const maxAacButtons = 5;

    useEffect(() => {
        const fetchUsername = async () => {
            try {
                const user_uuid = await SecureStore.getItemAsync('user_uuid');
                if (user_uuid) {
                    const response = await axios.post('http://61.81.99.111:5000/auth/checkuuid', { user_uuid });
                    if (response.data.StatusCode === 200) {
                        setUsername(response.data.data.username);
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

        fetchUsername();
    }, []);

    const toggleAacVisibility = () => {
        setAacVisible(!aacVisible);
    };

    const addCustomAacButton = () => {
        if (newAacText.trim() && customAacButtons.length < maxAacButtons) {
            setCustomAacButtons([
                ...customAacButtons,
                { id: Date.now().toString(), text: newAacText, icon: selectedIcon },
            ]);
            setNewAacText("");
            setSelectedIcon("add-circle-outline");
            setModalVisible(false);
        } else {
            Alert.alert("최대 5개의 버튼만 추가할 수 있습니다.");
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

                <TodoList />

                <View style={styles.aacContainer}>
                    <TouchableOpacity
                        style={styles.aacButton}
                        onPress={toggleAacVisibility}
                    >
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
                                        style={styles.aacButton}
                                        onPress={() => Speech.speak(button.text, { language: "ko" })}
                                    >
                                        <Ionicons name={button.icon} size={30} color="white" />
                                        <Text style={styles.aacButtonText}>{button.text}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <TouchableOpacity
                                style={styles.aacButton}
                                onPress={() => setModalVisible(true)}
                            >
                                <Ionicons name="add-circle-outline" size={30} color="white" />
                                <Text style={styles.aacButtonText}>버튼 추가</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

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
	aacContainer: {
		position: "absolute",
		bottom: 40,
		right: 20,
		alignItems: "flex-end",
	},
	aacButton: {
		backgroundColor: "#007AFF",
		width: 80,
		height: 80,
		borderRadius: 50,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},
	aacButtonText: {
		color: "white",
		fontSize: 16,
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
		flex: 2,
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
	closeButton: {
		backgroundColor: "#FF5C5C",
		padding: 15,
		borderRadius: 10,
		alignItems: "center",
		flex: 1,
	},
	closeButtonText: {
		color: "#fff",
		fontSize: 16,
	},
});

export default HomeScreen;
