// TodoList.js

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";
import Collapsible from "react-native-collapsible";

const TodoList = () => {
	const [tasks, setTasks] = useState([
		{ id: "1", text: "아침 식사하기", completed: false, default: true },
		{ id: "2", text: "점심 식사하기", completed: false, default: true },
		{ id: "3", text: "저녁 식사하기", completed: false, default: true },
	]);
	const [newTask, setNewTask] = useState("");
	const [accordionCollapsed, setAccordionCollapsed] = useState(true);

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

	const deleteTask = (id, isDefault) => {
		if (!isDefault) {
			setTasks(tasks.filter((task) => task.id !== id));
		}
	};

	const toggleTaskCompletion = (id) => {
		setTasks(
			tasks.map((task) =>
				task.id === id ? { ...task, completed: !task.completed } : task
			)
		);
	};

	const editDefaultTask = (id) => {
		const taskToEdit = tasks.find((task) => task.id === id);
		if (taskToEdit) {
			Alert.prompt(
				"투두리스트 수정",
				"수정할 내용을 입력하세요:",
				(text) => {
					if (text) {
						setTasks((prevTasks) =>
							prevTasks.map((task) =>
								task.id === id ? { ...task, text } : task
							)
						);
					}
				},
				"plain-text",
				taskToEdit.text
			);
		}
	};

	const calculateCompletionRate = () => {
		if (tasks.length === 0) return 0;
		const completedTasks = tasks.filter((task) => task.completed).length;
		return parseFloat((completedTasks / tasks.length).toFixed(2));
	};

	const toggleAccordion = () => {
		setAccordionCollapsed(!accordionCollapsed);
	};

	return (
		<View>
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

			<TouchableOpacity style={styles.accordionHeader} onPress={toggleAccordion}>
				<Text style={styles.accordionHeaderText}>오늘의 일정</Text>
				<Ionicons
					name={accordionCollapsed ? "chevron-down" : "chevron-up"}
					size={24}
					color="#007AFF"
				/>
			</TouchableOpacity>

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
							<TouchableOpacity onPress={() => editDefaultTask(item.id)}>
								<Text
									style={[
										styles.taskText,
										item.completed && styles.completedTask,
									]}
								>
									{item.text}
								</Text>
							</TouchableOpacity>
							{!item.default && (
								<TouchableOpacity
									onPress={() => deleteTask(item.id, item.default)}
								>
									<Text style={styles.deleteButton}>삭제</Text>
								</TouchableOpacity>
							)}
						</View>
					)}
				/>
			</Collapsible>

			<Text style={styles.completionText}>달성도</Text>
			<ProgressBar
				progress={calculateCompletionRate()}
				color={"#007AFF"}
				style={styles.progressBar}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 15,
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#007AFF",
		borderRadius: 10,
		padding: 10,
		fontSize: 20,
		marginRight: 10,
		color: 'black',
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
		textAlign: "center",
		flex: 1,
	},
	taskItem: {
		flexDirection: "row",
		alignItems: "center",
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
		color: "red",
	},
	completionText: {
		fontSize: 22,
		fontWeight: "bold",
		textAlign: "center",
		marginVertical: 10,
	},
	progressBar: {
		height: 10,
		borderRadius: 5,
	},
});

export default TodoList;
