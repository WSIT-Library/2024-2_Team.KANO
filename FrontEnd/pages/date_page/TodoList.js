import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Collapsible from "react-native-collapsible";
import * as Progress from "react-native-progress";
import { LinearGradient } from "expo-linear-gradient";
import { DOMAIN, TIMEOUT } from "../../utils/service_info";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const TodoList = () => {
    const [tasks, setTasks] = useState([
        { id: "1", text: "아침 식사하기", completed: false, default: true },
        { id: "2", text: "점심 식사하기", completed: false, default: true },
        { id: "3", text: "저녁 식사하기", completed: false, default: true },
    ]);
    const [newTask, setNewTask] = useState("");
    const [accordionCollapsed, setAccordionCollapsed] = useState(true);

    // 할 일 추가 함수
    const addTask = () => {
        if (newTask.trim()) {
            setTasks([...tasks, { id: Date.now().toString(), text: newTask, completed: false, default: false }]);
            setNewTask("");
            Keyboard.dismiss();
        }
    };

    // 할 일 삭제 함수
    const deleteTask = (id, isDefault) => {
        if (!isDefault) {
            setTasks(tasks.filter((task) => task.id !== id));
        }
    };

    // 완료 상태 토글 함수
    const toggleTaskCompletion = (id) => {
        setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
    };

    // 완료율 계산 함수
    const calculateCompletionRate = () => {
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter((task) => task.completed).length;
        return completedTasks / tasks.length;
    };

    // 완료율이 100%일 때 호출되는 함수
    const handleCompletionAchieved = async () => {
        try {
            // CountTodoList100 값 가져오기 및 숫자로 변환
            let count = await SecureStore.getItemAsync("CountTodoList100");
            count = count ? parseInt(count) + 1 : 1;

            // CountTodoList100 값 저장
            await SecureStore.setItemAsync("CountTodoList100", count.toString());

            // 특정 횟수마다 CompleteArchive에 값 추가
            const milestones = [1, 5, 10, 20, 30, 40, 50, 100];
            const archiveValues = [11, 12, 13, 14, 15, 16, 17, 18];

            if (milestones.includes(count)) {
                let archive = await SecureStore.getItemAsync("CompleteArchive");
                archive = archive ? JSON.parse(archive) : [];
                const archiveValue = archiveValues[milestones.indexOf(count)];
                archive.push(archiveValue);
                await SecureStore.setItemAsync("CompleteArchive", JSON.stringify(archive));

                // user_uuid 가져오기
                const user_uuid = await SecureStore.getItemAsync("user_uuid");

                // 서버로 요청 보내기
                if (user_uuid) {
                    await axios.post(`${DOMAIN}/challenge/register`, {
                        user_uuid: user_uuid,
                        challenge_id: archiveValue,
                    }, { timeout: TIMEOUT });
                } else {
                    console.error("user_uuid가 없습니다.");
                }
            }
        } catch (error) {
            console.error("Error updating completion count:", error);
        }
    };

    const completionRate = calculateCompletionRate();

    // 완료율이 100%가 되면 함수 호출
    useEffect(() => {
        if (completionRate === 1) {
            handleCompletionAchieved();
        }
    }, [completionRate]);

    return (
        <LinearGradient colors={["#E8DFF5", "#F5FFFA"]} style={styles.gradient}>
            <View style={styles.container}>
                <Text style={styles.headingText}>오늘의 할 일</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="할 일을 입력하세요"
                        value={newTask}
                        onChangeText={setNewTask}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addTask}>
                        <Text style={styles.addButtonText}>추가</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.accordionHeader} onPress={() => setAccordionCollapsed(!accordionCollapsed)}>
                    <Text style={styles.accordionHeaderText}>오늘의 일정</Text>
                    <Ionicons name={accordionCollapsed ? "chevron-down" : "chevron-up"} size={24} color="#007AFF" />
                </TouchableOpacity>

                <Collapsible collapsed={accordionCollapsed}>
                    <FlatList
                        data={tasks}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={[styles.taskItem, item.default ? styles.defaultTask : styles.userTask]}>
                                <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)}>
                                    <Ionicons
                                        name={item.completed ? "checkmark-circle" : "radio-button-off"}
                                        size={24}
                                        color={item.completed ? "green" : "gray"}
                                    />
                                </TouchableOpacity>
                                <Text style={[styles.taskText, item.completed && styles.completedTask]}>
                                    {item.text}
                                </Text>
                                {!item.default && (
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(item.id, item.default)}>
                                        <Ionicons name="trash" size={24} color="red" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    />
                </Collapsible>

                <View style={styles.completionContainer}>
                    <Text style={styles.completionText}>달성도</Text>
                    <Progress.Circle
                        size={150}
                        progress={completionRate}
                        showsText={true}
                        formatText={() => `${Math.round(completionRate * 100)}%`}
                        color="#007AFF"
                        thickness={10}
                    />
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    headingText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 20,
        textAlign: "center",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#007AFF",
        borderRadius: 10,
        padding: 10,
        fontSize: 18,
        marginRight: 10,
        color: "black",
    },
    addButton: {
        backgroundColor: "#007AFF",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
    },
    addButtonText: {
        color: "#fff",
        fontSize: 18,
    },
    accordionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        backgroundColor: "#007AFF",
        borderRadius: 10,
        marginBottom: 10,
    },
    accordionHeaderText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    taskItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 15,
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 10,
    },
    defaultTask: {
        borderColor: "#007AFF",
        backgroundColor: "#e0f0ff",
    },
    userTask: {
        borderColor: "#007AFF",
        backgroundColor: "#f0fff0",
    },
    taskText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 18,
    },
    completedTask: {
        textDecorationLine: "line-through",
        color: "gray",
    },
    deleteButton: {
        marginLeft: 10,
    },
    completionContainer: {
        marginVertical: 20,
        alignItems: "center",
    },
    completionText: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
    },
});

export default TodoList;
