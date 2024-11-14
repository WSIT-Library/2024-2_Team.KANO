// home_page.js
import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import ChatbotPage from "./chatbot_page";
import DatePage from "./date_page";
import SettingsPage from './Setting_page';
import HomeScreen from './home_screen';

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
                name="Settings"
                component={SettingsPage}
                options={{ title: "설정" }}
            />
        </Tab.Navigator>
    );
};

export default HomePage;