import { useColors } from "@/hooks/useColors";
import { Text, View } from "react-native";

export default function History() {
    const colors = useColors();
    
    return (
        <View style={{ flex: 1, flexDirection: "column", alignItems: "center" }}>
            <Text style={{ color: colors.text }}>Histórico</Text>
        </View>
    );
}
