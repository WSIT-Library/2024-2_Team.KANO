import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { useTTS } from './hooks/useTTS'; // TTS 훅 import
import { useSTT } from './hooks/useSTT'; // STT 훅 import

const ChatbotPage = () => {
  const { speak, stop, isSpeaking } = useTTS();
  const { handleRecording, isRecording, isLoading } = useSTT();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: '원하시는 상황을 입력해주세요.',
      sender: 'bot',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    speak('안녕하세요! 원하시는 상황을 입력해주세요!');

    return () => {
      stop();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = async () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      
      try {
        const response = await axios.post('http://61.81.99.111:5000/chat', { text: inputText });

        if (response.data && response.data.data && response.data.data.response) {
          const botResponse = {
            id: Date.now().toString(),
            text: response.data.data.response,
            sender: 'bot',
          };
          setMessages((prevMessages) => [...prevMessages, botResponse]);

          speak(response.data.data.response);
        }
      } catch (error) {
        console.error('메시지 전송 오류:', error);
      }
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  const renderTTSControl = () => (
    isSpeaking && (
      <TouchableOpacity style={styles.stopTTSButton} onPress={stop}>
        <Text style={styles.stopTTSButtonText}>TTS 중지</Text>
      </TouchableOpacity>
    )
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.innerContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
        />
        {renderTTSControl()}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>처리 중...</Text>
          </View>
        )}
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
            <TouchableOpacity style={[styles.micButton, isRecording && styles.micButtonRecording]} onPress={handleRecording}>
              <Text style={styles.micButtonText}>{isRecording ? '중지' : '녹음'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: '#fff',
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
});

export default ChatbotPage;