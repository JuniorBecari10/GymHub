import { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    FlatList,
    TextInput,
    StyleSheet,
    Alert,
    Platform,
} from "react-native";
import { Colors, useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ComponentProps } from "react";
import {
    Patient,
    getPatients,
    savePatients,
    getSelectedPatient,
    saveSelectedPatient,
} from "@/lib/auth";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

const AVATAR_COLORS = [
    "#085041", "#6D3A9C", "#B85C1A", "#1A5C8A",
    "#7A1A4A", "#1A7A4A", "#5C1A7A", "#8A5C1A",
];

function avatarColor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function Avatar({ patient, size }: { patient: Patient; size: number }) {
    return (
        <View style={{
            width: size, height: size,
            borderRadius: size / 2,
            backgroundColor: avatarColor(patient.id),
            alignItems: "center",
            justifyContent: "center",
        }}>
            <Text style={{ fontSize: size * 0.35, fontWeight: "500", color: "#fff" }}>
                {getInitials(patient.name)}
            </Text>
        </View>
    );
}

function confirmDelete(name: string, onConfirm: () => void) {
    if (Platform.OS === "web") {
        if (window.confirm(`Excluir ${name}?`)) onConfirm();
    } else {
        Alert.alert("Excluir paciente", `Tem certeza que deseja excluir ${name}?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: onConfirm },
        ]);
    }
}

function AppHeader({ colors }: { colors: Colors }) {
    const insets = useSafeAreaInsets();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [selected, setSelected] = useState<Patient | null>(null);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<Patient | null>(null);

    const [newName, setNewName] = useState("");
    const [newRelation, setNewRelation] = useState("");

    useEffect(() => {
        getPatients().then(setPatients);
        getSelectedPatient().then(setSelected);
    }, []);

    async function handleSelect(patient: Patient) {
        setSelected(patient);
        await saveSelectedPatient(patient);
        setSelectorOpen(false);
    }

    async function handleAdd() {
        if (!newName.trim()) return;

        const patient: Patient = {
            id: Date.now().toString(),
            name: newName.trim(),
            relation: newRelation.trim() || "Paciente",
        };

        const updated = [...patients, patient];
        setPatients(updated);
        await savePatients(updated);
        setSelected(patient);
        await saveSelectedPatient(patient);
        setNewName("");
        setNewRelation("");
        setAddOpen(false);
    }

    async function handleSaveEdit() {
        if (!editing || !newName.trim()) return;

        const updated = patients.map((p) =>
            p.id === editing.id
                ? { ...p, name: newName.trim(), relation: newRelation.trim() || "Paciente" }
                : p
        );
        setPatients(updated);
        await savePatients(updated);

        if (selected?.id === editing.id) {
            const updatedPatient = updated.find((p) => p.id === editing.id)!;
            setSelected(updatedPatient);
            await saveSelectedPatient(updatedPatient);
        }

        setEditing(null);
        setNewName("");
        setNewRelation("");
        setAddOpen(false);
    }

    async function handleDelete(patient: Patient) {
        confirmDelete(patient.name, async () => {
            const updated = patients.filter((p) => p.id !== patient.id);
            setPatients(updated);
            await savePatients(updated);

            if (selected?.id === patient.id) {
                const next = updated[0] ?? null;
                setSelected(next);
                await saveSelectedPatient(next);
            }
        });
    }

    function openAdd() {
        setEditing(null);
        setNewName("");
        setNewRelation("");
        setSelectorOpen(false);
        setAddOpen(true);
    }

    function openEdit(patient: Patient) {
        setEditing(patient);
        setNewName(patient.name);
        setNewRelation(patient.relation);
        setSelectorOpen(false);
        setAddOpen(true);
    }

    return (
        <View style={{ width: "100%" }}>
            <View style={{
                paddingTop: insets.top + 8,
                paddingHorizontal: 8,
                paddingBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.background,
            }}>
                <TouchableOpacity
                    onPress={() => setSelectorOpen(true)}
                    style={[styles.patientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.7}
                >
                    {selected && (
                        <Avatar patient={selected} size={24} />
                    )}

                    <View style={{ flexShrink: 1 }}>
                        {selected ? (
                            <Text
                                style={[styles.patientName, { color: colors.text }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {selected.name}
                            </Text>
                        ) : (
                            <Text
                                style={[styles.patientEmpty, { color: colors.textMuted }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                Nenhum paciente selecionado
                            </Text>
                        )}
                    </View>

                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* SELECTOR */}
            <Modal
                visible={selectorOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectorOpen(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setSelectorOpen(false)} />

                <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.sheetHandle} />

                    <Text style={[styles.sheetTitle, { color: colors.text }]}>
                        Selecionar paciente
                    </Text>

                    {patients.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            Nenhum paciente cadastrado ainda.
                        </Text>
                    ) : (
                        <FlatList
                            data={patients}
                            keyExtractor={(p) => p.id}
                            style={{ maxHeight: 300 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.patientRow,
                                        { borderColor: colors.border },
                                        selected?.id === item.id && { backgroundColor: colors.background, borderRadius: 12 },
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Avatar patient={item} size={38} />

                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.rowRelation, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                                            {item.relation}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => openEdit(item)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        style={[styles.rowAction, { borderColor: colors.border }]}
                                    >
                                        <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleDelete(item)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        style={[styles.rowAction, { borderColor: "#E24B4A22", backgroundColor: "#E24B4A11" }]}
                                    >
                                        <Ionicons name="trash-outline" size={14} color="#E24B4A" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )}
                        />
                    )}

                    <TouchableOpacity
                        style={[styles.addBtn, { borderColor: colors.border }]}
                        onPress={openAdd}
                    >
                        <Ionicons name="add-circle-outline" size={18} color={colors.text} />
                        <Text style={[styles.addBtnText, { color: colors.text }]}>
                            Adicionar paciente
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* ADD / EDIT */}
            <Modal
                visible={addOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setAddOpen(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setAddOpen(false)} />

                <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.sheetHandle} />

                    <Text style={[styles.sheetTitle, { color: colors.text }]}>
                        {editing ? "Editar paciente" : "Novo paciente"}
                    </Text>

                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        Nome completo
                    </Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        placeholder="Maria Aparecida"
                        placeholderTextColor={colors.textMuted}
                        value={newName}
                        onChangeText={setNewName}
                        autoCapitalize="words"
                    />

                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        Relação
                    </Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        placeholder="Mãe, pai, avó..."
                        placeholderTextColor={colors.textMuted}
                        value={newRelation}
                        onChangeText={setNewRelation}
                        autoCapitalize="words"
                    />

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                        <TouchableOpacity
                            style={[styles.cancelBtn, { borderColor: colors.border }]}
                            onPress={() => setAddOpen(false)}
                        >
                            <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmBtn, !newName.trim() && { opacity: 0.4 }]}
                            onPress={editing ? handleSaveEdit : handleAdd}
                            disabled={!newName.trim()}
                        >
                            <Text style={styles.confirmBtnText}>
                                {editing ? "Salvar" : "Cadastrar"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
                    elevation: 0,
                    shadowOpacity: 0,
                },
                sceneStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            {tab("home", "Home", "home")}
            {tab("schedule", "Agenda", "calendar")}
            {tab("history", "Histórico", "time")}
            {tab("profile", "Perfil", "person")}
        </Tabs>
    );
}

const styles = StyleSheet.create({
    patientCard: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 8,
        alignSelf: "flex-start",
        maxWidth: "90%",
    },
    patientName: { fontSize: 14, fontWeight: "500" },
    patientEmpty: { fontSize: 13 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderBottomWidth: 0,
        padding: 24,
        paddingBottom: 40,
        gap: 12,
    },
    sheetHandle: {
        width: 36, height: 4,
        borderRadius: 2,
        backgroundColor: "#ccc",
        alignSelf: "center",
        marginBottom: 8,
    },
    sheetTitle: { fontSize: 17, fontWeight: "500", marginBottom: 4 },
    emptyText: { fontSize: 14, textAlign: "center", paddingVertical: 24 },
    patientRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    rowName: { fontSize: 14, fontWeight: "500" },
    rowRelation: { fontSize: 12 },
    rowAction: {
        width: 30, height: 30,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        borderRadius: 12,
        padding: 13,
        marginTop: 4,
    },
    addBtnText: { fontSize: 14, fontWeight: "500" },
    inputLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.05, marginBottom: 4 },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
    cancelBtn: {
        flex: 1, padding: 13,
        borderWidth: 1, borderRadius: 12,
        alignItems: "center",
    },
    cancelBtnText: { fontSize: 14 },
    confirmBtn: {
        flex: 1, padding: 13,
        backgroundColor: "#085041",
        borderRadius: 12,
        alignItems: "center",
    },
    confirmBtnText: { fontSize: 14, color: "#E1F5EE", fontWeight: "500" },
});
