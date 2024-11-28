import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { VoiceContext } from '../../Context';
import { DOMAIN, TIMEOUT } from '../../utils/service_info';

const DEFAULT_VOICE = 'ko-KR-InJoonNeural';

const SettingsPage = () => {
  const { selectedVoice, updateVoice } = useContext(VoiceContext);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [currentValue, setCurrentValue] = useState(selectedVoice || DEFAULT_VOICE);
  const navigation = useNavigation();

  useEffect(() => {
    fetchVoices();
  }, []);

  useEffect(() => {
    if (selectedVoice) {
      setCurrentValue(selectedVoice);
    }
  }, [selectedVoice]);

  const fetchVoices = async () => {
    try {
      const response = await axios.get('https://api.gaon.xyz/tts?action=langlist&service=edgetts');
      if (response.data?.data) {
        const koVoices = response.data.data
          .filter(voice => voice.Locale === 'ko-KR' && voice.ShortName !== 'ko-KR-HyunsuNeural')
          .map(voice => ({
            label: formatVoiceLabel(voice),
            value: voice.ShortName,
          }));

        setItems(koVoices);

        if (!koVoices.some(item => item.value === currentValue)) {
          setCurrentValue(DEFAULT_VOICE);
        }
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      Alert.alert('오류', '음성 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatVoiceLabel = (voice) => {
    const nameParts = voice.ShortName.split('-');
    const displayName = nameParts.slice(2).join('');
    return `${displayName} (${voice.Locale})`;
  };

  const handleValueChange = (value) => {
    if (value) {
      setCurrentValue(value);
      setIsSaved(false);
    }
  };

  const saveVoiceSetting = async () => {
    try {
      if (!currentValue) {
        Alert.alert('알림', '목소리를 선택해주세요.');
        return;
      }
      await updateVoice(currentValue);
      setIsSaved(true);
      Alert.alert('성공', 'TTS 목소리 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('오류', '설정을 저장하는 데 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      const userUuid = await SecureStore.getItemAsync('user_uuid');
      if (!userUuid) {
        Alert.alert('오류', '로그인 상태가 아닙니다.');
        return;
      }

      const response = await axios.post(
        `${DOMAIN}/auth/logout`,
        { user_uuid: userUuid },
        { timeout: TIMEOUT }
      );

      if (response.data.StatusCode === 200) {
        await SecureStore.deleteItemAsync('user_uuid');
        ToastAndroid.show('로그아웃되었습니다.', ToastAndroid.SHORT);
        navigation.replace('Login');
      } else {
        Alert.alert('로그아웃 실패', response.data.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('알림', '서버와 연결할 수 없습니다.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={['#E8DFF5', '#F5FFFA']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.section}>
          <Text style={styles.title}>TTS 목소리 변경</Text>
          <DropDownPicker
            open={open}
            value={currentValue}
            items={items}
            setOpen={setOpen}
            setValue={setCurrentValue}
            setItems={setItems}
            onChangeValue={handleValueChange}
            placeholder="목소리를 선택하세요"
            style={styles.picker}
            dropDownContainerStyle={styles.dropDownContainer}
            listMode="SCROLLVIEW"
            scrollViewProps={{
              nestedScrollEnabled: true,
            }}
            zIndex={3000}
            zIndexInverse={1000}
          />
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSaved && styles.savedButton,
              !currentValue && styles.disabledButton,
            ]}
            onPress={saveVoiceSetting}
            disabled={isSaved || !currentValue}
          >
            <Text style={styles.saveButtonText}>{isSaved ? '저장됨' : '설정 저장'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>계정 관리</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 40,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  picker: {
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropDownContainer: {
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  savedButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsPage;
