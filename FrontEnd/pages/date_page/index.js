import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import CalendarPage from "./CalendarPage";
import TodoList from "./TodoList";

const Tab = createMaterialTopTabNavigator();

export default function MainApp() {
	return (
		<SafeAreaProvider>
			<SafeAreaView style={{ flex: 1, backgroundColor: "#007AFF" }}>
					<Tab.Navigator
						screenOptions={{
							tabBarStyle: { backgroundColor: "#007AFF" },
							tabBarLabelStyle: { fontSize: 14, color: "white" },
							tabBarIndicatorStyle: { backgroundColor: "white" },
						}}
					>
						<Tab.Screen name="캘린더" component={CalendarPage} />
						<Tab.Screen name="할 일" component={TodoList} />
					</Tab.Navigator>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
