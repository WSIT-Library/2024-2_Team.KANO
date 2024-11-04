import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import { VoiceContext } from '../Context';

const DEFAULT_VOICE = 'ko-KR-InJoonNeural'; // 기본값을 ko-KR-InJoonNeural로 변경

const SettingsPage = () => {
  const { selectedVoice, updateVoice } = useContext(VoiceContext);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [currentValue, setCurrentValue] = useState(selectedVoice || DEFAULT_VOICE);

  useEffect(() => {
    fetchVoices();
  }, []);

  // selectedVoice가 변경될 때 currentValue 업데이트
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
          .filter(voice => voice.Locale === 'ko-KR' && voice.ShortName !== 'ko-KR-HyunsuNeural') // ko-KR-HyunsuNeural 음성 필터링
          .map(voice => ({
            label: formatVoiceLabel(voice),
            value: voice.ShortName
          }));

        setItems(koVoices);

        // 초기 아이템 설정 후 현재 선택된 값이 유효한지 확인
        if (!koVoices.some(item => item.value === currentValue)) {
          setCurrentValue(DEFAULT_VOICE); // 기본값을 ko-KR-InJoonNeural로 설정
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
    console.log('Selected value:', value); // 디버깅용
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TTS 목소리 변경</Text>
      <View style={styles.pickerContainer}>
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
      </View>
      
      <TouchableOpacity 
        style={[
          styles.saveButton, 
          isSaved && styles.savedButton,
          !currentValue && styles.disabledButton
        ]} 
        onPress={saveVoiceSetting}
        disabled={isSaved || !currentValue}
      >
        <Text style={styles.saveButtonText}>
          {isSaved ? '저장됨' : '설정 저장'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 30,
    color: '#333',
  },
  pickerContainer: {
    marginTop: 20,
    marginBottom: 40,
    zIndex: 2000,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsPage;
