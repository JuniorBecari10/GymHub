import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";
import { Colors, useColors } from "@/hooks/useColors";

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

// TODO: change icon to be the actual user profile picture
const header = (colors: Colors) => (
        <View style={{
            paddingTop: 45,
            paddingLeft: 15,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        }}>
            <Ionicons name="person-circle-outline" size={32} color={colors.tabInactive} />
        </View>
);

export default function TabLayout() {
    const colors = useColors();
    
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.tabActive,
                header: () => header(colors),

                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopWidth: 0,
                    elevation: 0, // Android shadow
                    shadowOpacity: 0, // iOS shadow
                },

                sceneStyle: {
                    backgroundColor: colors.background,
                },
            }}>
            { tab("index", "Home", "home") }
            { tab("consultations", "Consultas", "calendar") }
            { tab("history", "Histórico", "time") }
            { tab("profile", "Perfil", "person") }
        </Tabs>
    );
}
