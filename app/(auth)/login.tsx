import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

export default function Login() {
    const colors = useColors();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function signIn() {
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        setLoading(false);
    }

    async function signUp() {
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        setLoading(false);
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Healthlen</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Senha"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.teal }]}
                onPress={signIn}
                disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={signUp} disabled={loading}>
                <Text style={[styles.link, { color: colors.teal }]}>Criar conta</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 32, gap: 12 },
    title: { fontSize: 32, fontWeight: "500", marginBottom: 24 },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
    button: { padding: 14, borderRadius: 10, alignItems: "center" },
    buttonText: { color: "white", fontSize: 16, fontWeight: "500" },
    link: { textAlign: "center", fontSize: 14, marginTop: 8 },
    error: { color: "#E24B4A", fontSize: 13 },
});
