import { useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    FlatList,
    Modal,
    Pressable,
    TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useColors } from "@/hooks/useColors";
import { usePatients } from "@/context/PatientContext";
import {
    SymptomLog,
    DayNote,
    Appointment,
    getSymptomLogs,
    getDayNotes,
    getAppointments,
    deleteSymptomLog,
    deleteDayNote,
    saveSymptomLog,
    saveDayNote,
} from "@/lib/schedule";

// ─── helpers ──────────────────────────────────────────────────────────────────

const MONTHS       = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const QUICK_SYMPTOMS = ["Dor","Tontura","Náusea","Falta de ar","Febre","Cansaço","Inchaço"];

function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatApptDate(date: string, time: string): string {
    const [y, m, d] = date.split("-");
    return `${d} ${MONTHS[parseInt(m) - 1]} ${y} · ${time}`;
}

function confirmAction(msg: string, onConfirm: () => void) {
    if (Platform.OS === "web") {
        if (window.confirm(msg)) onConfirm();
    } else {
        Alert.alert("Confirmar", msg, [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: onConfirm },
        ]);
    }
}

// ─── sub-tab selector ─────────────────────────────────────────────────────────

type Filter = "all" | "symptoms" | "notes" | "appointments";

const FILTERS: { key: Filter; label: string }[] = [
    { key: "all",          label: "Tudo"      },
    { key: "symptoms",     label: "Sintomas"  },
    { key: "notes",        label: "Notas"     },
    { key: "appointments", label: "Consultas" },
];

function SubTabs({ active, onChange, colors }: {
    active: Filter;
    onChange: (f: Filter) => void;
    colors: ReturnType<typeof useColors>;
}) {
    return (
        <View style={[styles.subTabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {FILTERS.map((f) => (
                <TouchableOpacity
                    key={f.key}
                    style={[styles.subTab, active === f.key && { backgroundColor: colors.background }]}
                    onPress={() => onChange(f.key)}
                >
                    <Text style={[
                        styles.subTabText,
                        { color: active === f.key ? colors.text : colors.textMuted,
                          fontWeight: active === f.key ? "500" : "400" },
                    ]}>
                        {f.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── intensity bar ────────────────────────────────────────────────────────────

function IntensityBar({ value, colors }: { value: number; colors: ReturnType<typeof useColors> }) {
    const color = value <= 2 ? "#1D9E75" : value === 3 ? "#EF9F27" : "#E24B4A";
    return (
        <View style={styles.intensityWrap}>
            {[1, 2, 3, 4, 5].map((n) => (
                <View
                    key={n}
                    style={[styles.intensitySegment, { backgroundColor: n <= value ? color : colors.border }]}
                />
            ))}
            <Text style={[styles.intensityLabel, { color: colors.textMuted }]}>{value}/5</Text>
        </View>
    );
}

// ─── edit symptom modal ───────────────────────────────────────────────────────

function EditSymptomModal({ log, onSave, onClose, colors }: {
    log: SymptomLog;
    onSave: (updated: SymptomLog) => void;
    onClose: () => void;
    colors: ReturnType<typeof useColors>;
}) {
    const [selected, setSelected] = useState<string[]>(log.symptoms);
    const [intensity, setIntensity] = useState(log.intensity);
    const [note, setNote] = useState(log.note);
    const [custom, setCustom] = useState(
        log.symptoms.filter((s) => !QUICK_SYMPTOMS.includes(s)).join(", ")
    );

    function toggle(s: string) {
        setSelected((prev) =>
            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
        );
    }

    function handleSave() {
        const extras = custom.trim()
            ? custom.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
        const all = [...new Set([...selected.filter((s) => QUICK_SYMPTOMS.includes(s)), ...extras])];
        if (all.length === 0) return;
        onSave({ ...log, symptoms: all, intensity, note: note.trim() });
    }

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sheetHandle} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Editar sintoma</Text>

                <Text style={[styles.sheetLabel, { color: colors.textMuted }]}>Sintomas</Text>
                <View style={styles.pillRow}>
                    {QUICK_SYMPTOMS.map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={[
                                styles.pill,
                                { borderColor: colors.border, backgroundColor: colors.background },
                                selected.includes(s) && { backgroundColor: "#085041", borderColor: "#085041" },
                            ]}
                            onPress={() => toggle(s)}
                        >
                            <Text style={[styles.pillText, { color: selected.includes(s) ? "#E1F5EE" : colors.text }]}>
                                {s}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, marginTop: 4 }]}
                    placeholder="Outros sintomas (separados por vírgula)..."
                    placeholderTextColor={colors.textMuted}
                    value={custom}
                    onChangeText={setCustom}
                />

                <Text style={[styles.sheetLabel, { color: colors.textMuted, marginTop: 12 }]}>
                    Intensidade: <Text style={{ color: colors.text, fontWeight: "500" }}>{intensity}</Text>/5
                </Text>
                <View style={styles.intensityBtnRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <TouchableOpacity
                            key={n}
                            style={[
                                styles.intensityBtn,
                                { borderColor: colors.border, backgroundColor: colors.background },
                                intensity === n && { backgroundColor: "#085041", borderColor: "#085041" },
                            ]}
                            onPress={() => setIntensity(n)}
                        >
                            <Text style={[styles.intensityBtnText, { color: intensity === n ? "#E1F5EE" : colors.textMuted }]}>
                                {n}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sheetLabel, { color: colors.textMuted, marginTop: 12 }]}>Nota</Text>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, height: 72, textAlignVertical: "top" }]}
                    placeholder="Observações..."
                    placeholderTextColor={colors.textMuted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                    <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
                        <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleSave}>
                        <Text style={styles.confirmBtnText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── edit note modal ──────────────────────────────────────────────────────────

function EditNoteModal({ note, onSave, onClose, colors }: {
    note: DayNote;
    onSave: (updated: DayNote) => void;
    onClose: () => void;
    colors: ReturnType<typeof useColors>;
}) {
    const [text, setText] = useState(note.note);

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sheetHandle} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Editar nota</Text>

                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, height: 140, textAlignVertical: "top" }]}
                    value={text}
                    onChangeText={setText}
                    multiline
                    autoFocus
                />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                    <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
                        <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.confirmBtn, !text.trim() && { opacity: 0.4 }]}
                        onPress={() => onSave({ ...note, note: text.trim() })}
                        disabled={!text.trim()}
                    >
                        <Text style={styles.confirmBtnText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── entry cards ──────────────────────────────────────────────────────────────

function SymptomCard({ log, colors, onEdit, onDelete }: {
    log: SymptomLog;
    colors: ReturnType<typeof useColors>;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: "#FAEEDA" }]}>
                    <Ionicons name="pulse" size={14} color="#EF9F27" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardType, { color: colors.textMuted }]}>Sintoma</Text>
                    <Text style={[styles.cardDate, { color: colors.textMuted }]}>{formatDate(log.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { borderColor: colors.border }]}>
                    <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { borderColor: "#E24B4A22", backgroundColor: "#E24B4A11" }]}>
                    <Ionicons name="trash-outline" size={14} color="#E24B4A" />
                </TouchableOpacity>
            </View>

            <View style={styles.pillRow}>
                {log.symptoms.map((s) => (
                    <View key={s} style={[styles.pill, { backgroundColor: "#FAEEDA", borderColor: "#FAC775" }]}>
                        <Text style={[styles.pillText, { color: "#633806" }]}>{s}</Text>
                    </View>
                ))}
            </View>

            <IntensityBar value={log.intensity} colors={colors} />

            {log.note ? (
                <Text style={[styles.cardNote, { color: colors.textMuted }]}>{log.note}</Text>
            ) : null}
        </View>
    );
}

function NoteCard({ note, colors, onEdit, onDelete }: {
    note: DayNote;
    colors: ReturnType<typeof useColors>;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: "#E6F1FB" }]}>
                    <Ionicons name="create" size={14} color="#1A5C8A" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardType, { color: colors.textMuted }]}>Nota do dia</Text>
                    <Text style={[styles.cardDate, { color: colors.textMuted }]}>{formatDate(note.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { borderColor: colors.border }]}>
                    <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { borderColor: "#E24B4A22", backgroundColor: "#E24B4A11" }]}>
                    <Ionicons name="trash-outline" size={14} color="#E24B4A" />
                </TouchableOpacity>
            </View>
            <Text style={[styles.noteText, { color: colors.text }]}>{note.note}</Text>
        </View>
    );
}

function AppointmentCard({ appt, colors }: {
    appt: Appointment;
    colors: ReturnType<typeof useColors>;
}) {
    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: "#E1F5EE" }]}>
                    <Ionicons name="calendar" size={14} color="#085041" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardType, { color: colors.textMuted }]}>Consulta</Text>
                    <Text style={[styles.cardDate, { color: colors.textMuted }]}>
                        {formatApptDate(appt.date, appt.time)}
                    </Text>
                </View>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{appt.doctorName}</Text>
            {appt.specialty ? (
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>{appt.specialty}</Text>
            ) : null}
            {appt.location ? (
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.cardSub, { color: colors.textMuted }]}>{appt.location}</Text>
                </View>
            ) : null}
            {appt.notes ? (
                <Text style={[styles.cardNote, { color: colors.textMuted }]}>{appt.notes}</Text>
            ) : null}
        </View>
    );
}

// ─── timeline entry type ──────────────────────────────────────────────────────

type Entry =
    | { type: "symptom";     data: SymptomLog;  sortKey: string }
    | { type: "note";        data: DayNote;      sortKey: string }
    | { type: "appointment"; data: Appointment;  sortKey: string };

// ─── main screen ──────────────────────────────────────────────────────────────

export default function History() {
    const colors = useColors();
    const { selected } = usePatients();

    const [filter, setFilter]               = useState<Filter>("all");
    const [symptomLogs, setSymptomLogs]     = useState<SymptomLog[]>([]);
    const [dayNotes, setDayNotes]           = useState<DayNote[]>([]);
    const [pastAppts, setPastAppts]         = useState<Appointment[]>([]);
    const [editingSymptom, setEditingSymptom] = useState<SymptomLog | null>(null);
    const [editingNote, setEditingNote]     = useState<DayNote | null>(null);

    useFocusEffect(
        useCallback(() => {
            if (!selected) return;
            getSymptomLogs(selected.id).then(setSymptomLogs);
            getDayNotes(selected.id).then(setDayNotes);
            getAppointments(selected.id).then((all) => {
                const now = new Date();
                setPastAppts(
                    all
                        .filter((a) => new Date(`${a.date}T${a.time}`) <= now)
                        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
                );
            });
        }, [selected])
    );

    async function handleDeleteSymptom(id: string) {
        confirmAction("Excluir este registro?", async () => {
            await deleteSymptomLog(id);
            if (selected) getSymptomLogs(selected.id).then(setSymptomLogs);
        });
    }

    async function handleDeleteNote(id: string) {
        confirmAction("Excluir esta nota?", async () => {
            await deleteDayNote(id);
            if (selected) getDayNotes(selected.id).then(setDayNotes);
        });
    }

    async function handleSaveSymptom(updated: SymptomLog) {
        await saveSymptomLog(updated);
        if (selected) getSymptomLogs(selected.id).then(setSymptomLogs);
        setEditingSymptom(null);
    }

    async function handleSaveNote(updated: DayNote) {
        await saveDayNote(updated);
        if (selected) getDayNotes(selected.id).then(setDayNotes);
        setEditingNote(null);
    }

    if (!selected) {
        return (
            <View style={[styles.noPatient, { backgroundColor: colors.background }]}>
                <Ionicons name="person-outline" size={40} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Selecione um paciente para ver o histórico.
                </Text>
            </View>
        );
    }

    const entries: Entry[] = [
        ...(filter === "all" || filter === "symptoms"
            ? symptomLogs.map((d): Entry => ({ type: "symptom", data: d, sortKey: d.createdAt }))
            : []),
        ...(filter === "all" || filter === "notes"
            ? dayNotes.map((d): Entry => ({ type: "note", data: d, sortKey: d.createdAt }))
            : []),
        ...(filter === "all" || filter === "appointments"
            ? pastAppts.map((d): Entry => ({ type: "appointment", data: d, sortKey: `${d.date}T${d.time}` }))
            : []),
    ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SubTabs active={filter} onChange={setFilter} colors={colors} />

            {entries.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="time-outline" size={40} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        Nenhum registro encontrado.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(e) => `${e.type}-${e.data.id}`}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        if (item.type === "symptom") return (
                            <SymptomCard
                                log={item.data}
                                colors={colors}
                                onEdit={() => setEditingSymptom(item.data)}
                                onDelete={() => handleDeleteSymptom(item.data.id)}
                            />
                        );
                        if (item.type === "note") return (
                            <NoteCard
                                note={item.data}
                                colors={colors}
                                onEdit={() => setEditingNote(item.data)}
                                onDelete={() => handleDeleteNote(item.data.id)}
                            />
                        );
                        return <AppointmentCard appt={item.data} colors={colors} />;
                    }}
                />
            )}

            {editingSymptom && (
                <EditSymptomModal
                    log={editingSymptom}
                    onSave={handleSaveSymptom}
                    onClose={() => setEditingSymptom(null)}
                    colors={colors}
                />
            )}
            {editingNote && (
                <EditNoteModal
                    note={editingNote}
                    onSave={handleSaveNote}
                    onClose={() => setEditingNote(null)}
                    colors={colors}
                />
            )}
        </View>
    );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container:      { flex: 1 },
    noPatient:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    empty:          { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 80 },
    emptyText:      { fontSize: 14, textAlign: "center", maxWidth: 260 },
    list:           { padding: 16, gap: 12, paddingBottom: 40 },

    subTabBar: {
        flexDirection: "row",
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        padding: 3,
        gap: 3,
    },
    subTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 9,
        alignItems: "center",
    },
    subTabText:     { fontSize: 13 },

    card: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        gap: 8,
    },
    cardRow:        { flexDirection: "row", alignItems: "center", gap: 10 },
    cardIconWrap: {
        width: 30, height: 30,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    cardType:       { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.06 },
    cardDate:       { fontSize: 12, marginTop: 1 },
    cardTitle:      { fontSize: 15, fontWeight: "500" },
    cardSub:        { fontSize: 13 },
    cardNote:       { fontSize: 13, fontStyle: "italic" },
    noteText:       { fontSize: 14, lineHeight: 21 },
    infoRow:        { flexDirection: "row", alignItems: "center", gap: 4 },

    iconBtn: {
        width: 30, height: 30,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    pillRow:        { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    pill: {
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 999, borderWidth: 1,
    },
    pillText:       { fontSize: 12 },

    intensityWrap:  { flexDirection: "row", alignItems: "center", gap: 4 },
    intensitySegment: { flex: 1, height: 4, borderRadius: 2 },
    intensityLabel: { fontSize: 12, marginLeft: 4, minWidth: 24 },

    intensityBtnRow: { flexDirection: "row", gap: 8 },
    intensityBtn: {
        flex: 1, height: 40,
        borderRadius: 10, borderWidth: 1,
        alignItems: "center", justifyContent: "center",
    },
    intensityBtnText: { fontSize: 15, fontWeight: "500" },

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
    },
    sheetHandle: {
        width: 36, height: 4,
        borderRadius: 2,
        backgroundColor: "#ccc",
        alignSelf: "center",
        marginBottom: 16,
    },
    sheetTitle:     { fontSize: 17, fontWeight: "500", marginBottom: 12 },
    sheetLabel:     { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.06, marginBottom: 8 },
    input: {
        borderWidth: 1, borderRadius: 10,
        padding: 12, fontSize: 15,
    },
    cancelBtn: {
        flex: 1, padding: 13,
        borderWidth: 1, borderRadius: 12, alignItems: "center",
    },
    cancelBtnText:  { fontSize: 14 },
    confirmBtn: {
        flex: 1, padding: 13,
        backgroundColor: "#085041",
        borderRadius: 12, alignItems: "center",
    },
    confirmBtnText: { fontSize: 14, color: "#E1F5EE", fontWeight: "500" },
});
