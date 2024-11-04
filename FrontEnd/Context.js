// Context.js
import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const VoiceContext = createContext();

const VOICE_STORAGE_KEY = 'selectedVoice';
const DEFAULT_VOICE = 'ko-KR-InJoonNeural';

export const VoiceProvider = ({ children }) => {
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoice();
  }, []);

  const loadVoice = async () => {
    try {
      const savedVoice = await SecureStore.getItemAsync(VOICE_STORAGE_KEY);
      if (savedVoice) {
        setSelectedVoice(savedVoice);
      } else {
        setSelectedVoice(DEFAULT_VOICE);
        await SecureStore.setItemAsync(VOICE_STORAGE_KEY, DEFAULT_VOICE);
      }
    } catch (error) {
      console.error('음성 설정을 불러오는데 실패했습니다:', error);
      setSelectedVoice(DEFAULT_VOICE); // 에러 발생 시 기본값 사용
    } finally {
      setLoading(false);
    }
  };

  const updateVoice = async (voice) => {
    try {
      if (typeof voice !== 'string' || !voice) {
        throw new Error('유효하지 않은 음성 값입니다. 문자열이어야 합니다.');
      }
      await SecureStore.setItemAsync(VOICE_STORAGE_KEY, voice);
      setSelectedVoice(voice);
    } catch (error) {
      console.error('음성 설정 업데이트에 실패했습니다:', error);
      throw error; // 상위 컴포넌트에서 에러 처리할 수 있도록 에러를 다시 던짐
    }
  };

  if (loading) {
    return null;
  }

  return (
    <VoiceContext.Provider value={{ selectedVoice, updateVoice }}>
      {children}
    </VoiceContext.Provider>
  );
};