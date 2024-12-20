import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Button, FlatList, Alert, Modal, TextInput, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import * as CalendarAPI from "expo-calendar";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { DOMAIN, TIMEOUT } from "../../utils/service_info";
import * as SecureStore from 'expo-secure-store'; // SecureStore 추가
import axios from 'axios'; // axios 추가

export default function CalendarPage() {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());

  // 특정 횟수에 대응하는 배열 (1, 5, 10, 20, 30, 50번 클릭될 때 추가할 값들)
  const triggerCounts = [1, 5, 10, 20, 30, 50];
  const correspondingValues = [5, 6, 7, 8, 9, 10];

  useEffect(() => {
    (async () => {
      const { status } = await CalendarAPI.requestCalendarPermissionsAsync();
      if (status === "granted") {
        const calendarsData = await CalendarAPI.getCalendarsAsync(CalendarAPI.EntityTypes.EVENT);
        setCalendars(calendarsData);
        if (calendarsData.length > 0) {
          setSelectedCalendarId(calendarsData[0].id);
          loadEvents(calendarsData[0].id);
        }
      } else {
        Alert.alert("권한 오류", "캘린더 접근 권한을 허용해야 합니다.");
      }
    })();
  }, []);

  const loadEvents = async (calendarId) => {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);

    const eventsData = await CalendarAPI.getEventsAsync([calendarId], start, end);
    
    const groupedEvents = eventsData.reduce((acc, event) => {
      const date = event.startDate.split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {});
    setEvents(groupedEvents);
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const addEvent = async () => {
    if (!newEventTitle) {
      Alert.alert("이벤트 제목이 필요합니다.");
      return;
    }

    const startDate = new Date(selectedDate);
    startDate.setHours(startTime.getHours(), startTime.getMinutes());
    const endDate = new Date(selectedDate);
    endDate.setHours(endTime.getHours(), endTime.getMinutes());

    try {
      await CalendarAPI.createEventAsync(selectedCalendarId, {
        title: newEventTitle,
        startDate,
        endDate,
        timeZone: "Asia/Seoul",
      });

      // SecureStore에서 CountAddDate 값 읽기
      let countStr = await SecureStore.getItemAsync("CountAddDate");
      let count = countStr ? parseInt(countStr, 10) : 0;
      count += 1;
      await SecureStore.setItemAsync("CountAddDate", count.toString());

      // 특정 횟수에 해당하는지 확인
      const index = triggerCounts.indexOf(count);
      if (index !== -1) {
        // CompleteArchive 키에서 기존 배열 가져오기
        let archiveStr = await SecureStore.getItemAsync('CompleteArchive');
        let archiveArr = archiveStr ? JSON.parse(archiveStr) : [];
        // 해당 횟수에 해당하는 값 추가
        const challengeId = correspondingValues[index];
        archiveArr.push(challengeId);
        await SecureStore.setItemAsync("CompleteArchive", JSON.stringify(archiveArr));

        // 이후 /challenge/register 요청 보내기 (axios 사용)
        const user_uuid = await SecureStore.getItemAsync("user_uuid");
        if (user_uuid) {
          const response = await axios.post(
            `${DOMAIN}/challenge/register`,
            { user_uuid, challenge_id: challengeId },
            { headers: { "Content-Type": "application/json" } },
            { timeout: TIMEOUT }
          );

          if (response.data.StatusCode === 200) {
            Alert.alert("성공", "도전과제가 성공하였습니다!");
          } else {
            Alert.alert("알림", "서버 응답을 확인해주세요.");
          }
        } else {
          Alert.alert("오류", "user_uuid가 없습니다.");
        }
      }


      setNewEventTitle("");
      loadEvents(selectedCalendarId);
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert("이벤트 생성 오류", "이벤트를 생성하는 중 오류가 발생했습니다.");
    }
  };

  const handleStartTimeChange = (event, selectedDate) => {
    if (selectedDate) {
      setTempStartTime(selectedDate);
      setStartTime(selectedDate); // 자동으로 startTime 설정
    }
  };

  const handleEndTimeChange = (event, selectedDate) => {
    if (selectedDate) {
      setTempEndTime(selectedDate);
      setEndTime(selectedDate); // 자동으로 endTime 설정
    }
  };

  return (
    <LinearGradient colors={["#E8DFF5", "#F5FFFA"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>캘린더</Text>
        <Calendar
          onDayPress={onDayPress}
          markingType={"multi-dot"}
          markedDates={Object.keys(events).reduce((acc, date) => {
            acc[date] = {
              dots: events[date].map((event) => ({ color: "blue" })),
            };
            return acc;
          }, {})}
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#b6c1cd",
            textSectionTitleDisabledColor: "#d9e1e8",
            selectedDayBackgroundColor: "#007AFF",
            todayTextColor: "#007AFF",
            dayTextColor: "#2d4150",
            textDisabledColor: "#d9e1e8",
            dotColor: "#007AFF",
            selectedDotColor: "#ffffff",
            arrowColor: "#007AFF",
            monthTextColor: "#2d4150",
            indicatorColor: "#007AFF",
          }}
          style={styles.calendar}
        />

        <Modal visible={isModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>일정 추가: {selectedDate}</Text>
              <TextInput
                style={styles.input}
                placeholder="일정 제목"
                value={newEventTitle}
                onChangeText={setNewEventTitle}
              />
              <View style={styles.timeContainer}>
                <Text>시작 시간:</Text>
                <DateTimePicker
                  value={tempStartTime}
                  mode="time"
                  is24Hour={true}
                  onChange={handleStartTimeChange}
                />
              </View>
              <View style={styles.timeContainer}>
                <Text>종료 시간:</Text>
                <DateTimePicker
                  value={tempEndTime}
                  mode="time"
                  is24Hour={true}
                  onChange={handleEndTimeChange}
                />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="추가" onPress={addEvent} />
                <Button
                  title="취소"
                  onPress={() => setModalVisible(false)}
                  color="red"
                />
              </View>
            </View>
          </View>
        </Modal>

        <Text style={styles.subHeader}>이번 달 일정</Text>
        <FlatList
          data={Object.values(events).flat()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventDate}>
                {new Date(item.startDate).toLocaleString()} -{" "}
                {new Date(item.endDate).toLocaleString()}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
    color: "#000",
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 15,
    color: "#000",
  },
  calendar: {
    borderRadius: 20,
    overflow: "hidden",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  modalHeader: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 10,
  },
  eventItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  eventDate: {
    color: "#555",
    fontSize: 14,
  },
});
