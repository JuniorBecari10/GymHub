import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";
import { Colors, useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

function tab(
    name: string,
    title: string,
    icon: IoniconsName,
    iconOutline: IoniconsName = `${icon}-outline` as IoniconsName
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
function AppHeader({ colors }: { colors: Colors }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={{
            paddingTop: insets.top + 10,
            paddingLeft: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        }}>
            <Ionicons name="person-circle-outline" size={32} color={colors.tabInactive} />
        </View>
    );
}

export default function TabLayout() {
    const colors = useColors();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.tabActive,
                header: () => <AppHeader colors={colors} />,

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
            { tab("home", "Home", "home") }
            { tab("consultations", "Consultas", "calendar") }
            { tab("history", "Histórico", "time") }
            { tab("profile", "Perfil", "person") }
        </Tabs>
    );
}
