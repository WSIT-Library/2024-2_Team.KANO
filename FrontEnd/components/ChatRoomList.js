import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const chatRooms = [
  { id: '1', name: '일반 문의' },
  { id: '2', name: '기술 지원' },
  { id: '3', name: '계정 관련' },
  // 필요한 만큼 채팅방을 추가할 수 있습니다.
];

const ChatRoomList = () => {
  const navigation = useNavigation();

  const selectChatRoom = (roomId) => {
    navigation.navigate('ChatbotPage', { roomId }); // 선택한 채팅방으로 이동
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>채팅방 목록</Text>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatRoomButton} onPress={() => selectChatRoom(item.id)}>
            <Text style={styles.chatRoomText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f7ff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007AFF',
    textAlign: 'center',
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
});

export default ChatRoomList;
