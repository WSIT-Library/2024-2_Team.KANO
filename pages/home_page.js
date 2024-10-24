import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, Alert, Keyboard, Modal, Button } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import ChatbotPage from "./chatbot_page";
import DatePage from "./date_page";
import SettingsPage from './Setting_page';
import * as Speech from "expo-speech";
import { ProgressBar } from "react-native-paper";
import Collapsible from "react-native-collapsible";  // Collapsible import

const HomeScreen = () => {
  const [tasks, setTasks] = useState([
    { id: "1", text: "아침 식사하기", completed: false, default: true },
    { id: "2", text: "점심 식사하기", completed: false, default: true },
    { id: "3", text: "저녁 식사하기", completed: false, default: true },
  ]);
  const [newTask, setNewTask] = useState("");
  const [aacVisible, setAacVisible] = useState(false); // AAC 버튼 표시 상태
  const [accordionCollapsed, setAccordionCollapsed] = useState(true); // 아코디언 상태
  const [modalVisible, setModalVisible] = useState(false);  // 모달 표시 상태
  const [newAacText, setNewAacText] = useState("");  // 새로 추가할 AAC 문장
  const [selectedIcon, setSelectedIcon] = useState("add-circle-outline");  // 기본 아이콘
  const [customAacButtons, setCustomAacButtons] = useState([]);  // 사용자 커스텀 AAC 버튼들

  const maxAacButtons = 5;  // 최대 AAC 버튼 갯수

  // 기존 할일 추가 함수
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

  // 기본 투두리스트 항목 수정 함수
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
        taskToEdit.text // 기존 텍스트를 기본값으로 설정
      );
    }
  };

  // 달성도를 계산하는 함수
  const calculateCompletionRate = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((task) => task.completed).length;
    return completedTasks / tasks.length;
  };

  const toggleAacVisibility = () => {
    setAacVisible(!aacVisible); // AAC 버튼의 표시 상태 토글
  };

  // 아코디언 열고 닫기 함수 추가
  const toggleAccordion = () => {
    setAccordionCollapsed(!accordionCollapsed);
  };

  const addCustomAacButton = () => {
    if (newAacText.trim() && customAacButtons.length < maxAacButtons) {
      setCustomAacButtons([
        ...customAacButtons,
        { id: Date.now().toString(), text: newAacText, icon: selectedIcon },
      ]);
      setNewAacText("");  // 입력 필드 초기화
      setSelectedIcon("add-circle-outline");  // 아이콘 초기화
      setModalVisible(false);  // 모달 닫기
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
    <View style={styles.container}>
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>오늘의 할 일</Text>

      {/* 입력 박스와 추가 버튼을 가로로 배치 */}
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

      {/* 아코디언 시작 */}
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

      {/* 달성도를 표시하는 부분을 FlatList 아래로 이동 */}
      <Text style={styles.completionText}>달성도</Text>
      <ProgressBar
        progress={calculateCompletionRate()}
        color={"#007AFF"}
        style={styles.progressBar}
      />

      {/* 플로팅 AAC 버튼들 */}
      <View style={styles.aacContainer}>
        <TouchableOpacity
          style={styles.aacButton}
          onPress={toggleAacVisibility}
        >
          <Text style={styles.aacButtonText}>음성도움</Text>
        </TouchableOpacity>

        {/* AAC 버튼이 보일 때만 나머지 버튼 표시 */}
        {aacVisible && (
  <>
  {/* 사용자 커스텀 AAC 버튼들 */}
  {customAacButtons.map((button) => (
    <View key={button.id} style={styles.aacButtonContainer}>
      {/* 삭제 버튼을 왼쪽에 배치 */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteCustomAacButton(button.id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>

      {/* AAC 버튼 */}
      <TouchableOpacity
        style={styles.aacButton}
        onPress={() => Speech.speak(button.text, { language: "ko" })}
      >
        <Ionicons name={button.icon} size={30} color="white" />
        <Text style={styles.aacButtonText}>{button.text}</Text>
      </TouchableOpacity>
    </View>
  ))}

  {/* 음성버튼 추가 버튼 */}
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

      {/* 음성버튼 추가 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 음성버튼 추가</Text>

            {/* 문장 입력창을 크게 만듦 */}
            <TextInput
              style={styles.textInput}
              placeholder="문장을 입력하세요"
              placeholderTextColor="#aaa"  // 플레이스홀더 색상 지정
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

            {/* 버튼을 가로로 나란히 배치 */}
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
    </View>
  );
};

const Tab = createBottomTabNavigator();

const HomePage = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Main") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Chatbot") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          } else if (route.name === "Schedule") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Main"
        component={HomeScreen}
        options={{ title: "홈" }}
      />
      <Tab.Screen
        name="Chatbot"
        component={ChatbotPage}
        options={{ title: "챗봇" }}
      />
      <Tab.Screen
        name="Schedule"
        component={DatePage}
        options={{ title: "일정 관리" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsPage}
        options={{ title: "설정" }}
      />
    </Tab.Navigator>
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
  inputContainer: {
    flexDirection: "row", // 입력 박스와 추가 버튼을 가로로 배치
    alignItems: "center",
    marginBottom: 15,
  },
  input: {
    flex: 1, // 입력 필드가 가능한 공간을 차지하도록 설정
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 10,
    padding: 10,
    fontSize: 20,
    marginRight: 10, // 버튼과의 간격 설정
    color: 'black',
  },
  buttonRow: {
    flexDirection: 'row',  // 버튼들을 가로로 배치
    justifyContent: 'space-between',  // 버튼 사이의 간격 설정
    width: '100%',  // 버튼들이 전체 너비를 차지하도록 설정
  },

  addButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  ModaladdButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,  // 두 버튼이 같은 크기를 갖도록 설정
    marginRight: 10,  // 두 버튼 사이 간격 설정
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
    textAlign: "center",  // 텍스트를 가운데로 정렬
    flex: 1,  // 텍스트가 아이콘과 함께 중앙에 위치하도록 설정
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
    backgroundColor: "red",  // 버튼 배경색을 빨간색으로 설정
    borderRadius: 50,  // 둥근 버튼 모양을 위해 경계선 반경 추가
    padding: 10,  // 버튼에 패딩을 추가해 더 커 보이게 함
    marginRight: 10,  // 삭제 버튼과 AAC 버튼 사이의 간격 설정
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
    height: 50,  // 텍스트 입력창 높이 설정
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    padding: 10,
    fontSize: 18,
    color: 'black',  // 텍스트 색상 검정색으로 설정
    backgroundColor: 'white',  // 배경색 추가
    textAlignVertical: 'top',  // 텍스트가 위에서부터 시작하도록 설정
  },
  iconPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
    width: "100%",
  },
  iconOption: {
    width: "18%",  // 한 줄에 5개 배치되도록 설정 (5개에 100%를 나눈 값)
    alignItems: "center",
    marginVertical: 5,  // 아이콘 사이 간격 설정
  },
  selectedIcon: {
    borderColor: "#007AFF",
    borderWidth: 2,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: "#FF5C5C",  // 닫기 버튼에 빨간색 배경 추가
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,  // 두 버튼이 같은 크기를 갖도록 설정
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default HomePage;
