// home_page.js
import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import ChatbotPage from "./chatbot_page/index";
import DatePage from "./date_page/index";
import SettingsPage from './Setting_page/index';
import HomeScreen from './home_screen';
import WeatherPage from './weather_page';
import AchievementsPage from './AchievementsPage';

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
                    } else if (route.name === "Weather") {
                        iconName = focused ? "cloud" : "cloud-outline";
                    } else if (route.name === "AchievementsPage") {
                        iconName = focused ? "trophy" : "trophy-outline";
                    } else if (route.name === "Settings") {
                        iconName = focused ? "settings" : "settings-outline";
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: "#007AFF",
                tabBarInactiveTintColor: "gray",
                headerShown: false,
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
                name="Weather"
                component={WeatherPage}
                options={{ title: "날씨" }}
            />
            <Tab.Screen
                name="AchievementsPage"
                component={AchievementsPage}
                options={{ title: "도전과제" }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsPage}
                options={{ title: "설정" }}
            />
        </Tab.Navigator>
    );
};

export default HomePage;
