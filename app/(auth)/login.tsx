import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { login } from "@/lib/auth";
import { useColors } from "@/hooks/useColors";

export default function Login() {
    const colors = useColors();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin() {
        setError("");
        setLoading(true);
        const { error } = await login(email, password);
        if (error) {
            setError(error);
            setLoading(false);
            return;
        }
        router.replace("/(tabs)/home");
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Login</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Faça login para continuar.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
            <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholder="email@exemplo.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>Senha</Text>
            <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholder="Sua senha"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.teal }, loading && styles.disabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={[styles.link, { color: colors.teal }]}>Não tem conta? Criar conta</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, justifyContent: "center", padding: 32, gap: 10 },
    title:      { fontSize: 32, fontWeight: "500", marginBottom: 4 },
    subtitle:   { fontSize: 14, marginBottom: 12 },
    label:      { fontSize: 13, marginBottom: 4, marginTop: 8 },
    input:      { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
    button:     { padding: 14, borderRadius: 10, alignItems: "center", marginTop: 16 },
    disabled:   { opacity: 0.6 },
    buttonText: { color: "white", fontSize: 16, fontWeight: "500" },
    link:       { textAlign: "center", fontSize: 14, marginTop: 12 },
    error:      { color: "#E24B4A", fontSize: 13 },
});
