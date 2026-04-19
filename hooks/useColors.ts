import { useColorScheme } from "react-native";

export type Colors = ReturnType<typeof useColors>;

export function useColors() {
    const isDark = useColorScheme() === "dark";

    return {
        background:  isDark ? "#1C1C1E" : "#FFFFFF",
        text:        isDark ? "#FFFFFF" : "#000000",
        textMuted:   isDark ? "#8E8E93" : "#6B6B6B",
        surface:     isDark ? "#2C2C2E" : "#F2F2F7",
        border:      isDark ? "#38383A" : "#E5E5EA",
        tabActive:   "#68C5DB",
        tabInactive: "#8E8E8F",
    };
}
