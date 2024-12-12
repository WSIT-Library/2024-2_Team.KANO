import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, SafeAreaView, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import SunCalc from "suncalc";
import { DOMAIN } from "../utils/service_info";
import weatherStats from "../utils/weather_stats.json"; // JSON 파일 import

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyWeather, setHourlyWeather] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [locationData, setLocationData] = useState("");
  const [sunTimes, setSunTimes] = useState({ sunrise: "", sunset: "" });
  const [loading, setLoading] = useState(true);
  const [genAiText, setGenAiText] = useState("");

  const translateWeather = (key) => {
    const lowerKey = key.toLowerCase();
    const translations = Object.fromEntries(
      Object.entries(weatherStats).map(([k, v]) => [k.toLowerCase(), v])
    );
    return translations[lowerKey] || key; // 번역이 없으면 원래 값 반환
  };

  const convertToCelsius = (kelvin) => (kelvin - 273.15).toFixed(1);

  const userUuid = SecureStore.getItemAsync("user_uuid");

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          alert("위치 권한이 필요합니다.");
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // 일출, 일몰 정보 계산
        const times = SunCalc.getTimes(new Date(), latitude, longitude);
        const sunrise = times.sunrise.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const sunset = times.sunset.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSunTimes({ sunrise, sunset });

        // 위치 정보 가져오기
        console.log("[DEBUG] 위치 정보 요청:",
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const locationResponse = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        console.log("[DEBUG] 위치 정보 응답:", locationResponse.data);

        const address = locationResponse.data.address;
        const detailedLocation = `${address.state || ""} ${address.city || ""} ${
          address.town || address.village || address.suburb || ""
        }`;
        setLocationData(detailedLocation);

        // user_uuid 값 확인
        const resolvedUserUuid = await userUuid;
        console.log("[DEBUG] user_uuid:", resolvedUserUuid);

        // 현재 날씨 데이터 요청
        const weatherPayload = {
          user_uuid: resolvedUserUuid,
          lat: latitude,
          lon: longitude,
        };
        console.log("[DEBUG] 현재 날씨 요청 URL:", `${DOMAIN}/weather`);
        console.log("[DEBUG] 현재 날씨 요청 Payload:", weatherPayload);
        const weatherResponse = await axios.post(`${DOMAIN}/weather`, weatherPayload);
        console.log("[DEBUG] 현재 날씨 응답:", weatherResponse.data);
        setWeatherData(weatherResponse.data.message.weather_data);

        // 3시간 단위 날씨 데이터 요청
        const hourlyPayload = {
          user_uuid: resolvedUserUuid,
          lat: latitude,
          lon: longitude,
        };
        console.log("[DEBUG] 3시간 날씨 요청 URL:", `${DOMAIN}/weather/3hourly`);
        console.log("[DEBUG] 3시간 날씨 요청 Payload:", hourlyPayload);
        const hourlyResponse = await axios.post(`${DOMAIN}/weather/3hourly`, hourlyPayload);
        console.log("[DEBUG] 3시간 날씨 응답:", hourlyResponse.data);
        setHourlyWeather(hourlyResponse.data.message.hourly_weather_data.list || []);

        // 미세먼지 데이터 요청
        const airPayload = {
          user_uuid: resolvedUserUuid,
          lat: latitude,
          lon: longitude,
        };
        console.log("[DEBUG] 미세먼지 요청 URL:", `${DOMAIN}/weather/air`);
        console.log("[DEBUG] 미세먼지 요청 Payload:", airPayload);
        const airResponse = await axios.post(`${DOMAIN}/weather/air`, airPayload);
        console.log("[DEBUG] 미세먼지 응답:", airResponse.data);
        const airComponents = airResponse.data.message.air_pollution_data.list[0].components || {};
        setAirQuality(airComponents);

        // GenAI 추천 텍스트 요청
        const currentDate = new Date().toISOString().slice(0, 19).replace("T", " ");
        const genAiPayload = {
          user_uuid: resolvedUserUuid,
          data: {
            date: currentDate,
            current_temp: `${convertToCelsius(weatherResponse.data.message.weather_data.main.temp)}°C`,
            current_weather: weatherResponse.data.message.weather_data.weather[0].main
              .toLowerCase()
              .replace(" ", "_"),
            current_wind: `${weatherResponse.data.message.weather_data.wind.speed}m/s`,
            current_pm10: `${airComponents.pm10}µg/m³`,
            current_pm2_5: `${airComponents.pm2_5}µg/m³`,
            "3hourly_weather": hourlyResponse.data.message.hourly_weather_data.list
              .slice(0, 8)
              .map((hour) => ({
                time: hour.dt_txt.split(" ")[1].slice(0, 5),
                temp: `${convertToCelsius(hour.main.temp)}°C`,
                weather: hour.weather[0].main.toLowerCase().replace(" ", "_"),
              })),
          },
        };
        console.log("[DEBUG] GenAI 추천 텍스트 요청 URL:", `${DOMAIN}/weather/gensentence`);
        console.log("[DEBUG] GenAI 추천 텍스트 요청 Payload:", genAiPayload);
        const genAiResponse = await axios.post(`${DOMAIN}/weather/gensentence`, genAiPayload);
        console.log("[DEBUG] GenAI 추천 텍스트 응답:", genAiResponse.data);
        setGenAiText(genAiResponse.data.data.text);

        // CountWeatherHealth 증가 로직
        let countStr = await SecureStore.getItemAsync("CountWeatherHealth");
        let count = parseInt(countStr) || 0;
        count += 1;
        await SecureStore.setItemAsync("CountWeatherHealth", count.toString());

        const milestones = {
          1: 40,
          5: 41,
          10: 42,
          15: 43,
          20: 44,
          30: 45,
          50: 46,
        };

        if (milestones[count]) {
          let archiveValuesStr = await SecureStore.getItemAsync("CompleteArchive");
          let archiveValues = archiveValuesStr ? JSON.parse(archiveValuesStr) : [];

          if (!archiveValues.includes(milestones[count])) {
            archiveValues.push(milestones[count]);
            await SecureStore.setItemAsync("CompleteArchive", JSON.stringify(archiveValues));

            console.log("[DEBUG] 챌린지 달성 user_uuid:", resolvedUserUuid);
            console.log("[DEBUG] 업데이트된 archiveValues:", archiveValues);

            // 챌린지 등록 요청
            const challengePayload = {
              user_uuid: resolvedUserUuid,
              challenge_id: archiveValues
            };
            console.log("[DEBUG] 챌린지 등록 요청 URL:", `${DOMAIN}/challenge/register`);
            console.log("[DEBUG] 챌린지 등록 요청 Payload:", challengePayload);
            const challengeResponse = await axios.post(`${DOMAIN}/challenge/register`, challengePayload);
            console.log("[DEBUG] 챌린지 등록 응답:", challengeResponse.data);
          }
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response) {
          console.log("[DEBUG] 에러 응답 상태:", error.response.status);
          console.log("[DEBUG] 에러 응답 데이터:", error.response.data);
        } else {
          console.log("[DEBUG] 응답 없음 또는 네트워크 에러:", error.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>날씨 데이터를 불러오는 중입니다...</Text>
      </View>
    );
  }

  if (!weatherData || !hourlyWeather.length || !airQuality) {
    return (
      <View style={styles.loadingContainer}>
        <Text>데이터를 불러오는 데 실패했습니다.</Text>
      </View>
    );
  }

  const { temp, temp_min, temp_max } = weatherData.main;
  const weather = weatherData.weather[0];
  const wind = weatherData.wind;

  const iconUrl = `https://openweathermap.org/img/wn/${
    weather.icon.endsWith("n") ? weather.icon.replace("n", "d") : weather.icon
  }@2x.png`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#6DB3F2", "#1E90FF"]} style={styles.container}>
        <ScrollView>
          <View style={styles.topSection}>
            <Text style={styles.location}>{locationData}</Text>
            <Image source={{ uri: iconUrl }} style={styles.weatherIcon} />
            <Text style={styles.temperature}>{convertToCelsius(temp)}°</Text>
            <Text style={styles.weatherCondition}>{translateWeather(weather.main)}</Text>
            <Text style={styles.temperatureInfo}>
              최고 {convertToCelsius(temp_max)}° / 최저 {convertToCelsius(temp_min)}°
            </Text>
            <Text style={styles.windInfo}>바람: {wind.speed} m/s</Text>
          </View>

          {/* GenAI 추천 텍스트 섹션 */}
          <View style={styles.genAiSection}>
            <Text style={styles.sectionTitle}>오늘의 날씨 추천</Text>
            <View style={styles.genAiTextContainer}>
              <Text style={styles.genAiText}>{genAiText}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>일출/일몰 정보</Text>
            <View style={styles.sunInfoContainer}>
              <View style={styles.sunInfo}>
                <Image
                  source={{ uri: "https://img.icons8.com/ios-filled/50/FFFFFF/sun.png" }}
                  style={styles.sunIcon}
                />
                <Text style={styles.sunText}>{sunTimes.sunrise}</Text>
              </View>
              <View style={styles.sunInfo}>
                <Image
                  source={{ uri: "https://img.icons8.com/ios-filled/50/FFFFFF/crescent-moon.png" }}
                  style={styles.sunIcon}
                />
                <Text style={styles.sunText}>{sunTimes.sunset}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3시간 단위 날씨</Text>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
              {hourlyWeather.map((hour, index) => {
                const date = new Date(hour.dt_txt);
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const time = hour.dt_txt.split(" ")[1].slice(0, 5);
                return (
                  <View key={index} style={styles.hourlyItem}>
                    <Text style={styles.dateText}>{month}/{day}</Text>
                    <Text style={styles.hourText}>{time}</Text>
                    <Image
                      source={{
                        uri: `https://openweathermap.org/img/wn/${
                          hour.weather[0].icon.endsWith("n")
                            ? hour.weather[0].icon.replace("n", "d")
                            : hour.weather[0].icon
                        }@2x.png`,
                      }}
                      style={styles.hourlyIcon}
                    />
                    <Text style={styles.hourTemp}>{convertToCelsius(hour.main.temp)}°</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>미세먼지 정보</Text>
            <View style={styles.airQualityContainer}>
              <View style={styles.airQualityItem}>
                <AnimatedCircularProgress
                  size={100}
                  width={10}
                  fill={(airQuality.pm10 / 100) * 100}
                  tintColor={airQuality.pm10 > 80 ? "#FF0000" : "#32CD32"}
                  backgroundColor="#EFEFEF"
                  rotation={360}
                >
                  {() => (
                    <Text style={styles.airQualityText}>
                      {airQuality.pm10} µg/m³
                    </Text>
                  )}
                </AnimatedCircularProgress>
                <Text style={styles.airQualityLabel}>미세먼지(PM10)</Text>
              </View>
              <View style={styles.airQualityItem}>
                <AnimatedCircularProgress
                  size={100}
                  width={10}
                  fill={(airQuality.pm2_5 / 100) * 100}
                  tintColor={airQuality.pm2_5 > 50 ? "#32CD32" : "#FFA500"}
                  backgroundColor="#EFEFEF"
                  rotation={360}
                >
                  {() => (
                    <Text style={styles.airQualityText}>
                      {airQuality.pm2_5} µg/m³
                    </Text>
                  )}
                </AnimatedCircularProgress>
                <Text style={styles.airQualityLabel}>초미세먼지(PM2.5)</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1E90FF",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topSection: {
    alignItems: "center",
    padding: 20,
  },
  location: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  weatherIcon: {
    width: 120,
    height: 120,
  },
  temperature: {
    fontSize: 48,
    color: "#fff",
    fontWeight: "bold",
    marginVertical: 10,
  },
  weatherCondition: {
    fontSize: 18,
    color: "#fff",
    marginVertical: 5,
  },
  temperatureInfo: {
    fontSize: 16,
    color: "#fff",
  },
  windInfo: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
  },
  sunInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 10,
  },
  sunInfo: {
    alignItems: "center",
  },
  sunIcon: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  sunText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 2,
  },
  hourlyItem: {
    alignItems: "center",
    marginRight: 16,
  },
  hourText: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
  },
  hourTemp: {
    fontSize: 17,
    color: "#fff",
    marginTop: 5,
  },
  hourlyIcon: {
    width: 50,
    height: 50,
    marginVertical: 5,
  },
  airQualityContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  airQualityItem: {
    alignItems: "center",
  },
  airQualityText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
  },
  airQualityLabel: {
    marginTop: 10,
    fontSize: 14,
    color: "#fff",
  },
  genAiSection: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  genAiTextContainer: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    padding: 15,
  },
  genAiText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
