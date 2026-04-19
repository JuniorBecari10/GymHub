import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#65645F",
            }}
        >
            <Tabs.Screen name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />
                    ),
                }}
            />
            <Tabs.Screen name="consultations"
                options={{
                    title: "Consultas",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={24} />
                    ),
                }}
            />
            <Tabs.Screen name="history"
                options={{
                    title: "Histórico",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "time" : "time-outline"} color={color} size={24} />
                    ),
                }}
            />
            <Tabs.Screen name="profile"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} color={color} size={24} />
                    ),
                }}
            />
        </Tabs>
    );
}
