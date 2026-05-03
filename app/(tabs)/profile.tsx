import { useState, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useColors } from "@/hooks/useColors";
import { User, getSession, logout } from "@/lib/auth";

export default function Profile() {
    const colors = useColors();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    useFocusEffect(
        useCallback(() => {
            getSession().then((session) => {
                if (session) {
                    setUser(session);
                    setName(session.fullName);
                    setEmail(session.email);
                }
            });
        }, [])
    );

    function initials() {
        return (user?.fullName ?? "")
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }

    function handleSave() {
        if (user) setUser({ ...user, fullName: name, email });
        setEditing(false);
    }

    function handleCancelEdit() {
        setName(user?.fullName ?? "");
        setEmail(user?.email ?? "");
        setEditing(false);
    }

    
    async function handleLogout() {
        if (Platform.OS === "web") {
            const confirmed = window.confirm("Tem certeza que deseja sair?");
            if (confirmed) {
                await logout();
                router.replace("/(auth)/login");
            }
        } else {
            Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sair",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace("/(auth)/login");
                    },
                },
            ]);
        }
    }
    return (
        <ScrollView
            contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials()}</Text>
                </View>
                <Text style={[styles.displayName, { color: colors.text }]}>
                    {user?.fullName}
                </Text>
                <Text style={[styles.displayEmail, { color: colors.textMuted }]}>
                    {user?.email}
                </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.textMuted }]}>
                        Informações da conta
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.editBtn,
                            {
                                borderColor: editing ? "#1D9E75" : colors.border,
                                backgroundColor: colors.background,
                            },
                        ]}
                        onPress={() => editing ? handleCancelEdit() : setEditing(true)}
                    >
                        <Ionicons
                            name={editing ? "close-outline" : "pencil-outline"}
                            size={16}
                            color={editing ? "#1D9E75" : colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>

                <Field
                    label="Nome completo"
                    value={name}
                    editing={editing}
                    onChangeText={setName}
                    colors={colors}
                    autoCapitalize="words"
                />
                <Field
                    label="E-mail"
                    value={email}
                    editing={editing}
                    onChangeText={setEmail}
                    colors={colors}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                {editing && (
                    <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                        <Text style={styles.btnSaveText}>Salvar alterações</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={[styles.btnLogout, { borderColor: colors.border }]}
                onPress={handleLogout}
            >
                <Ionicons name="log-out-outline" size={18} color="#E24B4A" />
                <Text style={styles.btnLogoutText}>Sair da conta</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

type FieldProps = {
    label: string;
    value: string;
    editing: boolean;
    onChangeText: (v: string) => void;
    colors: ReturnType<typeof useColors>;
    keyboardType?: "default" | "email-address";
    autoCapitalize?: "none" | "words";
};

function Field({ label, value, editing, onChangeText, colors, keyboardType = "default", autoCapitalize = "words" }: FieldProps) {
    return (
        <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
            {editing ? (
                <TextInput
                    style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.background, borderColor: "#1D9E75" }]}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                />
            ) : (
                <View style={[styles.fieldValue, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.fieldValueText, { color: colors.text }]}>{value}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container:      { flexGrow: 1, padding: 24, gap: 16 },
    avatarSection:  { alignItems: "center", paddingBottom: 24, gap: 6 },
    avatar: {
        width: 72, height: 72,
        borderRadius: 36,
        backgroundColor: "#085041",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    avatarText:     { fontSize: 24, fontWeight: "500", color: "#E1F5EE" },
    displayName:    { fontSize: 20, fontWeight: "500", letterSpacing: -0.3 },
    displayEmail:   { fontSize: 14 },
    card: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        gap: 14,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    cardTitle:      { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.15 },
    editBtn: {
        width: 30, height: 30,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    field:          { gap: 5 },
    fieldLabel:     { fontSize: 12 },
    fieldValue:     { borderWidth: 1, borderRadius: 10, padding: 12 },
    fieldValueText: { fontSize: 15 },
    fieldInput:     { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
    btnSave: {
        backgroundColor: "#085041",
        borderRadius: 12,
        padding: 13,
        alignItems: "center",
        marginTop: 4,
    },
    btnSaveText:    { color: "#E1F5EE", fontSize: 14, fontWeight: "500" },
    btnLogout: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        borderRadius: 12,
        padding: 13,
    },
    btnLogoutText:  { color: "#E24B4A", fontSize: 14 },
});
