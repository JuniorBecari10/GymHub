import { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    FlatList,
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
} from "@/lib/schedule";

// ─── helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatApptDate(date: string, time: string): string {
    const [y, m, d] = date.split("-");
    return `${d} ${MONTHS[parseInt(m) - 1]} ${y} · ${time}`;
}

function confirm(msg: string, onConfirm: () => void) {
    if (Platform.OS === "web") {
        if (window.confirm(msg)) onConfirm();
    } else {
        Alert.alert("Confirmar", msg, [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: onConfirm },
        ]);
    }
}

// ─── filter tabs ──────────────────────────────────────────────────────────────

type Filter = "all" | "symptoms" | "notes" | "appointments";

const FILTERS: { key: Filter; label: string }[] = [
    { key: "all",          label: "Tudo"      },
    { key: "symptoms",     label: "Sintomas"  },
    { key: "notes",        label: "Notas"     },
    { key: "appointments", label: "Consultas" },
];

function FilterBar({ active, onChange, colors }: {
    active: Filter;
    onChange: (f: Filter) => void;
    colors: ReturnType<typeof useColors>;
}) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
        >
            {FILTERS.map((f) => (
                <TouchableOpacity
                    key={f.key}
                    style={[
                        styles.filterBtn,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        active === f.key && { backgroundColor: "#085041", borderColor: "#085041" },
                    ]}
                    onPress={() => onChange(f.key)}
                >
                    <Text style={[
                        styles.filterBtnText,
                        { color: active === f.key ? "#E1F5EE" : colors.textMuted },
                    ]}>
                        {f.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
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
                    style={[
                        styles.intensitySegment,
                        { backgroundColor: n <= value ? color : colors.border },
                    ]}
                />
            ))}
            <Text style={[styles.intensityLabel, { color: colors.textMuted }]}>{value}/5</Text>
        </View>
    );
}

// ─── timeline entry types ─────────────────────────────────────────────────────

type Entry =
    | { type: "symptom";     data: SymptomLog;   sortKey: string }
    | { type: "note";        data: DayNote;       sortKey: string }
    | { type: "appointment"; data: Appointment;   sortKey: string };

// ─── entry cards ──────────────────────────────────────────────────────────────

function SymptomCard({ log, colors, onDelete }: {
    log: SymptomLog;
    colors: ReturnType<typeof useColors>;
    onDelete: () => void;
}) {
    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrap, { backgroundColor: "#FAEEDA" }]}>
                    <Ionicons name="pulse" size={14} color="#EF9F27" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardType, { color: colors.textMuted }]}>Sintoma</Text>
                    <Text style={[styles.cardDate, { color: colors.textMuted }]}>{formatDate(log.createdAt)}</Text>
                </View>
                <TouchableOpacity
                    onPress={onDelete}
                    style={[styles.deleteBtn, { borderColor: "#E24B4A22", backgroundColor: "#E24B4A11" }]}
                >
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

function NoteCard({ note, colors, onDelete }: {
    note: DayNote;
    colors: ReturnType<typeof useColors>;
    onDelete: () => void;
}) {
    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrap, { backgroundColor: "#E6F1FB" }]}>
                    <Ionicons name="create" size={14} color="#1A5C8A" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardType, { color: colors.textMuted }]}>Nota do dia</Text>
                    <Text style={[styles.cardDate, { color: colors.textMuted }]}>{formatDate(note.createdAt)}</Text>
                </View>
                <TouchableOpacity
                    onPress={onDelete}
                    style={[styles.deleteBtn, { borderColor: "#E24B4A22", backgroundColor: "#E24B4A11" }]}
                >
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
            <View style={styles.cardHeader}>
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

// ─── main screen ──────────────────────────────────────────────────────────────

export default function History() {
    const colors = useColors();
    const { selected } = usePatients();

    const [filter, setFilter]           = useState<Filter>("all");
    const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
    const [dayNotes, setDayNotes]       = useState<DayNote[]>([]);
    const [pastAppts, setPastAppts]     = useState<Appointment[]>([]);

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
        confirm("Excluir este registro?", async () => {
            await deleteSymptomLog(id);
            if (selected) getSymptomLogs(selected.id).then(setSymptomLogs);
        });
    }

    async function handleDeleteNote(id: string) {
        confirm("Excluir esta nota?", async () => {
            await deleteDayNote(id);
            if (selected) getDayNotes(selected.id).then(setDayNotes);
        });
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

    // build unified timeline
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

    const isEmpty = entries.length === 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FilterBar active={filter} onChange={setFilter} colors={colors} />

            {isEmpty ? (
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
                        if (item.type === "symptom") {
                            return (
                                <SymptomCard
                                    log={item.data}
                                    colors={colors}
                                    onDelete={() => handleDeleteSymptom(item.data.id)}
                                />
                            );
                        }
                        if (item.type === "note") {
                            return (
                                <NoteCard
                                    note={item.data}
                                    colors={colors}
                                    onDelete={() => handleDeleteNote(item.data.id)}
                                />
                            );
                        }
                        return (
                            <AppointmentCard appt={item.data} colors={colors} />
                        );
                    }}
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

    filterBar:      { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    filterBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
    },
    filterBtnText:  { fontSize: 13, fontWeight: "500" },

    card: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        gap: 8,
    },
    cardHeader:     { flexDirection: "row", alignItems: "center", gap: 10 },
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

    deleteBtn: {
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
    intensitySegment: {
        flex: 1, height: 4,
        borderRadius: 2,
    },
    intensityLabel: { fontSize: 12, marginLeft: 4, minWidth: 24 },
});
