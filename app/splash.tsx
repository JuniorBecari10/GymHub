import { View, Image, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { getSession } from "@/lib/auth";

export default function Splash() {
    const router = useRouter();
    const colors = useColors();

    useEffect(() => {
        const timeout = setTimeout(async () => {
            const session = await getSession();
            if (session) {
                router.replace("/(tabs)/home");
            } else {
                router.replace("/(auth)/login");
            }
        }, 2000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
        }}>
            <Image
                source={require("../assets/logo.png")}
                style={styles.image}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        width: 100,
        height: 100,
    },
});
