import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Calendar } from "react-native-calendars";
import * as CalendarAPI from "expo-calendar";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function App() {
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

  useEffect(() => {
    (async () => {
      const { status } = await CalendarAPI.requestCalendarPermissionsAsync();
      if (status === "granted") {
        const calendarsData = await CalendarAPI.getCalendarsAsync(
          CalendarAPI.EntityTypes.EVENT
        );
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
    end.setMonth(end.getMonth() + 1); // 다음 달로 설정

    const eventsData = await CalendarAPI.getEventsAsync(
      [calendarId],
      start,
      end
    );

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

    await CalendarAPI.createEventAsync(selectedCalendarId, {
      title: newEventTitle,
      startDate,
      endDate,
      timeZone: "GMT",
    });

    setNewEventTitle("");
    loadEvents(selectedCalendarId);
    setModalVisible(false);
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
    <View style={styles.container}>
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
        data={Object.values(events).flat()} // 모든 이벤트를 한 리스트로 만들기
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
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#e6f7ff",
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginVertical: 10,
        textAlign: "center",
        color: "#007AFF",
    },
    subHeader: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 15,
        color: "#007AFF",
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
        backgroundColor: "#ffffff", // 배경색 추가
        borderRadius: 10, // 둥근 모서리
        marginBottom: 10, // 각 이벤트 간격
        elevation: 2, // 그림자 효과 추가
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: "bold", // 굵게 변경
        color: "#007AFF", // 제목 색상 변경
    },
    eventDate: {
        color: "#555",
        fontSize: 14, // 글자 크기 조정
    },
});