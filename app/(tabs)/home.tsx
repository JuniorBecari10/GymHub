import { useColors } from "@/hooks/useColors";
import { Text, View } from "react-native";

export default function Home() {
    const colors = useColors();
    
    return (
        <View style={{ flex: 1, flexDirection: "column", alignItems: "center" }}>
            <Text style={{ color: colors.text }}>Home</Text>
        </View>
    );
}
