import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme, View } from "react-native";

function tab(
    name: string,
    title: string,
    icon: unknown, // sorry :(
    iconOutline: any = `${icon}-outline` // optional. set this only if the default value isn't valid.
) {
    return (
        <Tabs.Screen
            name={name}
            options={{
                title,
                tabBarIcon: ({ color, focused }) => (
                    <Ionicons
                        name={focused ? icon : iconOutline}
                        color={color}
                        size={24}
                    />
                ),
            }}
        />
    );
}

const header = () => (
    <View style={{
        paddingTop: 45,
        paddingLeft: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    }}>
        <Ionicons name="person-circle-outline" size={32} color="#65645F" />
    </View>
);

export default function TabLayout() {
    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#68C5DB",
                header: header,
                tabBarStyle: {
                    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                    // borderTopWidth: 0,
                    elevation: 0, // Android shadow
                    shadowOpacity: 0, // iOS shadow
                },
                sceneStyle: {
                    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                },
            }}
        >
            {tab("index", "Home", "home")}
            {tab("consultations", "Consultas", "calendar")}
            {tab("history", "Histórico", "time")}
            {tab("profile", "Perfil", "person")}
        </Tabs>
    );
}
