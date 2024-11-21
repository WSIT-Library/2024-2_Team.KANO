import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Collapsible from "react-native-collapsible";
import * as Progress from "react-native-progress"; // 원형 그래프 사용

const TodoList = () => {
    const [tasks, setTasks] = useState([
        { id: "1", text: "아침 식사하기", completed: false, default: true },
        { id: "2", text: "점심 식사하기", completed: false, default: true },
        { id: "3", text: "저녁 식사하기", completed: false, default: true },
    ]);
    const [newTask, setNewTask] = useState("");
    const [accordionCollapsed, setAccordionCollapsed] = useState(true); // 기본적으로 닫힌 상태

    // 할 일 추가 함수
    const addTask = () => {
        if (newTask.trim()) {
            setTasks([
                ...tasks,
                {
                    id: Date.now().toString(),
                    text: newTask,
                    completed: false,
                    default: false,
                },
            ]);
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
        setTasks(
            tasks.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };

    // 완료율 계산 함수
    const calculateCompletionRate = () => {
        if (tasks.length === 0) return 0; // 비어 있을 때 0 반환
        const completedTasks = tasks.filter((task) => task.completed).length;
        return completedTasks / tasks.length;
    };

    const toggleAccordion = () => {
        setAccordionCollapsed(!accordionCollapsed);
    };

    const completionRate = calculateCompletionRate();

    return (
        <View style={styles.container}>
            {/* "오늘의 할 일" 문구 */}
            <Text style={styles.headingText}>오늘의 할 일</Text>

            {/* 입력 영역 */}
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

            {/* 아코디언 헤더 */}
            <TouchableOpacity style={styles.accordionHeader} onPress={toggleAccordion}>
                <Text style={styles.accordionHeaderText}>오늘의 일정</Text>
                <Ionicons
                    name={accordionCollapsed ? "chevron-down" : "chevron-up"}
                    size={24}
                    color="#007AFF"
                />
            </TouchableOpacity>

            {/* 아코디언 내용 */}
            <Collapsible collapsed={accordionCollapsed}>
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View
                            style={[
                                styles.taskItem,
                                item.default ? styles.defaultTask : styles.userTask,
                            ]}
                        >
                            <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)}>
                                <Ionicons
                                    name={
                                        item.completed ? "checkmark-circle" : "radio-button-off"
                                    }
                                    size={24}
                                    color={item.completed ? "green" : "gray"}
                                />
                            </TouchableOpacity>
                            <Text
                                style={[
                                    styles.taskText,
                                    item.completed && styles.completedTask,
                                ]}
                            >
                                {item.text}
                            </Text>
                            {!item.default && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => deleteTask(item.id, item.default)}
                                >
                                    <Ionicons name="trash" size={24} color="red" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
            </Collapsible>

            {/* 달성도 */}
            <View style={styles.completionContainer}>
                <Text style={styles.completionText}>달성도</Text>
                <Progress.Circle
                    size={150}
                    progress={completionRate}
                    showsText={true}
                    formatText={() => `${Math.round(completionRate * 100)}%`}
                    color="#007AFF"
                    textStyle={styles.progressText}
                    thickness={10}
                    borderWidth={2}
                    borderColor="#e0e0e0"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f8f9fa",
    },
    headingText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#007AFF",
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
        justifyContent: "space-between", // 요소를 양쪽 끝으로 정렬
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
