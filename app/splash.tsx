import { View, Image, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function Splash() {
    const router = useRouter();

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.replace("/home");
        }, 2000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <View style={styles.container}>
            <Image
                source={require("../assets/logo.png")}
                style={styles.image}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8e8d5",
        alignItems: "center",
        justifyContent: "center",
    },
    image: {
        width: 200,
        height: 200,
    },
});
