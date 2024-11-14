import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

const TutorialPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const translateX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  const tutorialData = [
    {
      id: 1,
      icon: 'human-greeting-variant',
      title: '안녕하세요',
      description: '자폐 장애인을 위한 관리 앱',
      description_sub: 'Anti Barrier입니다.',
    },
    {
      id: 2,
      icon: 'format-list-checks',
      title: '일정 관리',
      description: '오늘의 일정을 세워',
      description_sub: '체계적인 삶을 관리해보세요.',
    },
    {
      id: 3,
      icon: 'chat-processing-outline',
      title: '대화 연습',
      description: 'AI 챗봇과의 대화를 통해',
      description_sub: '현실 대화 능력을 증진시켜보세요.',
    },
    {
      id: 4,
      icon: 'calendar-check',
      title: '캘린더',
      description: '매 달 중요한 일정을 기록하여',
      description_sub: '알림을 받아 보세요.',
    },
    {
      id: 5,
      icon: 'arrow-right-bold-circle-outline',
      title: '시작하기',
      description: '지금 바로 시작해보세요!',
      description_sub: '',
    },
  ];

  useEffect(() => {
    const updateWidth = () => {
      const newWidth = Dimensions.get('window').width;
      setWindowWidth(newWidth);
    };
    const subscription = Dimensions.addEventListener('change', updateWidth);
    return () => subscription?.remove();
  }, []);

  const handleNext = async () => {
    if (currentPage < tutorialData.length - 1) {
      Animated.timing(translateX, {
        toValue: -(currentPage + 1) * windowWidth,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(currentPage + 1);
      });
    } else {
      await SecureStore.setItemAsync('FinishedTutorial', '1');
      navigation.replace('Login');
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      Animated.timing(translateX, {
        toValue: -(currentPage - 1) * windowWidth,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(currentPage - 1);
      });
    }
  };

  return (
    <LinearGradient colors={['#E8DFF5', '#F5FFFA']} style={styles.container}>
      <Animated.View
        style={[
          styles.contentContainer,
          { transform: [{ translateX }], width: windowWidth * tutorialData.length },
        ]}
      >
        {tutorialData.map((page) => (
          <View key={page.id} style={[styles.content, { width: windowWidth }]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={page.icon} size={100} color="#007AFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{page.title}</Text>
              <Text style={styles.description}>{page.description}</Text>
              {page.description_sub ? (
                <Text style={styles.description_sub}>{page.description_sub}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </Animated.View>
      <View style={styles.buttonWrapper}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={handlePrev} 
            style={[styles.button, currentPage === 0 && styles.disabledButton]}
          >
            <Text style={styles.buttonText}>이전</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNext} 
            style={[styles.button, currentPage === tutorialData.length - 1 && styles.startButton]}
          >
            <Text style={styles.buttonText}>
              {currentPage === tutorialData.length - 1 ? "시작" : "다음"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  description_sub: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#d3d3d3',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
});

export default TutorialPage;