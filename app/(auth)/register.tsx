import { useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { register } from "@/lib/auth";
import { useColors } from "@/hooks/useColors";

export default function Register() {
    const colors = useColors();
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleRegister() {
        setError("");

        if (!fullName.trim()) { setError("Informe seu nome completo."); return; }
        if (!email.trim())    { setError("Informe seu email."); return; }
        if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
        if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }

        setLoading(true);
        const { error } = await register(fullName, email, password);
        if (error) {
            setError(error);
            setLoading(false);
            return;
        }
        router.replace("/(tabs)/home");
    }

    return (
        <ScrollView
            contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
            keyboardShouldPersistTaps="handled"
        >
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.back, { color: colors.teal }]}>‹ Voltar</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]}>Criar conta</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Preencha os dados para criar sua conta.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={[styles.label, { color: colors.textMuted }]}>Nome completo</Text>
            <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholder="Seu nome completo"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
            />

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
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>Confirmar senha</Text>
            <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholder="Repita a senha"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.teal }, loading && styles.disabled]}
                onPress={handleRegister}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? "Criando conta..." : "Criar conta"}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:  { flexGrow: 1, padding: 32, paddingTop: 64, gap: 8 },
    back:       { fontSize: 16, marginBottom: 16 },
    title:      { fontSize: 28, fontWeight: "500", marginBottom: 4 },
    subtitle:   { fontSize: 14, marginBottom: 12 },
    label:      { fontSize: 13, marginBottom: 4, marginTop: 8 },
    input:      { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
    button:     { padding: 14, borderRadius: 10, alignItems: "center", marginTop: 24 },
    disabled:   { opacity: 0.6 },
    buttonText: { color: "white", fontSize: 16, fontWeight: "500" },
    error:      { color: "#E24B4A", fontSize: 13 },
});
