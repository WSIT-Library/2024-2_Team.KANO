// App.js

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomePage from "./pages/home_page";
import ChatbotPage from "./pages/chatbot_page";
import DatePage from "./pages/date_page";
import LoginPage from "./pages/login_page";
import SignupPage from "./pages/signup_page";
import SplashScreenComponent from './pages/splash_page';
import TutorialPage from "./pages/tutorial_page";
import { VoiceProvider } from "./Context";

const Stack = createStackNavigator();

const App = () => {
   return (
      // VoiceProvider로 전체 앱을 감싸서 컨텍스트를 모든 컴포넌트에 제공
      <VoiceProvider>
         <NavigationContainer>
            <Stack.Navigator initialRouteName="Splash"> 
               <Stack.Screen
                  name="Splash"
                  component={SplashScreenComponent}
                  options={{ headerShown: false }}
               />
               <Stack.Screen
                  name="Login"
                  component={LoginPage}
                  options={{ headerShown: false }}
               />
               <Stack.Screen
                  name="Signup"
                  component={SignupPage}
                  options={{ headerShown: false }}
               />
               <Stack.Screen
                  name="Home"
                  component={HomePage}
                  options={{ headerShown: false }}
               />
               <Stack.Screen name="Tutorial" component={TutorialPage} options={{ headerShown: false }} />
               <Stack.Screen name="Chatbot" component={ChatbotPage} />
               <Stack.Screen name="Date" component={DatePage} />
            </Stack.Navigator>
         </NavigationContainer>
      </VoiceProvider>
   );
};

export default App;
