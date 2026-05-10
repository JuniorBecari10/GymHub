import { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useColors } from "@/hooks/useColors";
import { usePatients } from "@/context/PatientContext";
import {
    Medication,
    Appointment,
    SymptomLog,
    DayNote,
    getMedications,
    getAppointments,
    saveSymptomLog,
    saveDayNote,
} from "@/lib/schedule";

// ─── helpers ─────────────────────────────────────────────────────────────────

const DAY_FULL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function nextMedTime(med: Medication): Date | null {
    const now = new Date();
    const today = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

    for (let offset = 0; offset < 7; offset++) {
        const day = ((today + offset) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        if (!med.days.includes(day)) continue;
        for (const t of [...med.times].sort()) {
            const [h, m] = t.split(":").map(Number);
            const candidate = new Date(now);
            candidate.setDate(now.getDate() + offset);
            candidate.setHours(h, m, 0, 0);
            if (candidate > now) return candidate;
        }
    }
    return null;
}

function nextActiveMed(meds: Medication[]): { med: Medication; at: Date } | null {
    let best: { med: Medication; at: Date } | null = null;
    for (const med of meds) {
        if (!med.active) continue;
        const at = nextMedTime(med);
        if (at && (!best || at < best.at)) best = { med, at };
    }
    return best;
}

function nextAppointment(appointments: Appointment[]): Appointment | null {
    const now = new Date();
    const future = appointments.filter((a) => new Date(`${a.date}T${a.time}`) > now);
    if (future.length === 0) return null;
    return future[0];
}

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `em ${days} dia${days > 1 ? "s" : ""}`;
    if (hours > 0) return `em ${hours}h${mins % 60 > 0 ? ` ${mins % 60}min` : ""}`;
    if (mins > 0) return `em ${mins} min`;
    return "agora";
}

function formatApptDate(a: Appointment): string {
    const [y, m, d] = a.date.split("-");
    return `${d} ${MONTHS[parseInt(m) - 1]} · ${a.time}`;
}

// ─── symptom log modal ────────────────────────────────────────────────────────

const QUICK_SYMPTOMS = ["Dor", "Tontura", "Náusea", "Falta de ar", "Febre", "Cansaço", "Inchaço"];

function SymptomModal({ visible, onClose, colors, patientId }: {
    visible: boolean;
    onClose: () => void;
    colors: ReturnType<typeof useColors>;
    patientId: string;
}) {
    const [selected, setSelected] = useState<string[]>([]);
    const [intensity, setIntensity] = useState(3);
    const [note, setNote] = useState("");
    const [custom, setCustom] = useState("");
    const [saving, setSaving] = useState(false);

    function toggle(s: string) {
        setSelected((prev) =>
            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
        );
    }

    async function handleSave() {
        const all = custom.trim() ? [...selected, custom.trim()] : selected;
        if (all.length === 0) return;
        setSaving(true);
        await saveSymptomLog({
            id: Date.now().toString(),
            patientId,
            symptoms: all,
            intensity,
            note: note.trim(),
            createdAt: new Date().toISOString(),
        });
        setSaving(false);
        setSelected([]);
        setNote("");
        setCustom("");
        setIntensity(3);
        onClose();
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sheetHandle} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Registrar sintoma</Text>

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
                    placeholder="Outro sintoma..."
                    placeholderTextColor={colors.textMuted}
                    value={custom}
                    onChangeText={setCustom}
                />

                <Text style={[styles.sheetLabel, { color: colors.textMuted, marginTop: 12 }]}>
                    Intensidade: <Text style={{ color: colors.text, fontWeight: "500" }}>{intensity}</Text>/5
                </Text>
                <View style={styles.intensityRow}>
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
                            <Text style={[styles.intensityText, { color: intensity === n ? "#E1F5EE" : colors.textMuted }]}>
                                {n}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sheetLabel, { color: colors.textMuted, marginTop: 12 }]}>Nota</Text>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, height: 72, textAlignVertical: "top" }]}
                    placeholder="Observações opcionais..."
                    placeholderTextColor={colors.textMuted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                    <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
                        <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.confirmBtn, (selected.length === 0 && !custom.trim()) && { opacity: 0.4 }]}
                        onPress={handleSave}
                        disabled={selected.length === 0 && !custom.trim()}
                    >
                        <Text style={styles.confirmBtnText}>Registrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── note modal ───────────────────────────────────────────────────────────────

function NoteModal({ visible, onClose, colors, patientId }: {
    visible: boolean;
    onClose: () => void;
    colors: ReturnType<typeof useColors>;
    patientId: string;
}) {
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!note.trim()) return;
        setSaving(true);
        await saveDayNote({
            id: Date.now().toString(),
            patientId,
            note: note.trim(),
            createdAt: new Date().toISOString(),
        });
        setSaving(false);
        setNote("");
        onClose();
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sheetHandle} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Nota do dia</Text>

                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, height: 140, textAlignVertical: "top" }]}
                    placeholder="Anote observações sobre o dia do paciente..."
                    placeholderTextColor={colors.textMuted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    autoFocus
                />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                    <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
                        <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.confirmBtn, (!note.trim() || saving) && { opacity: 0.4 }]}
                        onPress={handleSave}
                        disabled={!note.trim() || saving}
                    >
                        <Text style={styles.confirmBtnText}>
                            {saving ? "Salvando..." : "Salvar nota"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
    return (
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
    );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function Home() {
    const colors = useColors();
    const { selected } = usePatients();

    const [medications, setMedications] = useState<Medication[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [symptomOpen, setSymptomOpen] = useState(false);
    const [noteOpen, setNoteOpen] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!selected) return;
            getMedications(selected.id).then(setMedications);
            getAppointments(selected.id).then(setAppointments);
        }, [selected])
    );

    const nextMed = nextActiveMed(medications);
    const nextAppt = nextAppointment(appointments);

    const todayMeds = medications.filter((m) => {
        if (!m.active) return false;
        const today = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        return m.days.includes(today);
    });

    if (!selected) {
        return (
            <View style={[styles.noPatient, { backgroundColor: colors.background }]}>
                <Ionicons name="person-outline" size={40} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Selecione um paciente para ver o resumo do dia.
                </Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={{ backgroundColor: colors.background }}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* next medication highlight */}
                {nextMed ? (
                    <View style={styles.highlightCard}>
                        <View style={styles.highlightTop}>
                            <View style={styles.highlightIcon}>
                                <Ionicons name="medkit" size={18} color="#E1F5EE" />
                            </View>
                            <Text style={styles.highlightLabel}>Próximo medicamento</Text>
                            <Text style={styles.highlightTime}>{formatRelativeTime(nextMed.at)}</Text>
                        </View>
                        <Text style={styles.highlightTitle}>{nextMed.med.name}</Text>
                        {nextMed.med.dose ? (
                            <Text style={styles.highlightSub}>{nextMed.med.dose}</Text>
                        ) : null}
                        <Text style={styles.highlightSub}>
                            {nextMed.at.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            {" · "}
                            {DAY_FULL[nextMed.at.getDay()]}
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.highlightCard, styles.highlightEmpty]}>
                        <Ionicons name="checkmark-circle" size={22} color="#9FE1CB" />
                        <Text style={styles.highlightTitle}>Nenhum medicamento pendente.</Text>
                    </View>
                )}

                {/* next appointment */}
                {nextAppt && (
                    <View style={[styles.apptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.apptLabel, { color: colors.textMuted }]}>Próxima consulta</Text>
                            <Text style={[styles.apptDoctor, { color: colors.text }]}>{nextAppt.doctorName}</Text>
                            {nextAppt.specialty ? (
                                <Text style={[styles.apptSub, { color: colors.textMuted }]}>{nextAppt.specialty}</Text>
                            ) : null}
                            <Text style={[styles.apptSub, { color: colors.textMuted }]}>
                                {formatApptDate(nextAppt)}
                                {nextAppt.location ? ` · ${nextAppt.location}` : ""}
                            </Text>
                        </View>
                        <View style={[styles.apptDateBox, { backgroundColor: "#E1F5EE" }]}>
                            <Text style={styles.apptDay}>{nextAppt.date.split("-")[2]}</Text>
                            <Text style={styles.apptMonth}>
                                {MONTHS[parseInt(nextAppt.date.split("-")[1]) - 1]}
                            </Text>
                        </View>
                    </View>
                )}

                {/* quick actions */}
                <SectionHeader title="AÇÕES RÁPIDAS" colors={colors} />
                <View style={styles.quickGrid}>
                    <QuickBtn
                        icon="pulse-outline"
                        label="Sintoma"
                        colors={colors}
                        onPress={() => setSymptomOpen(true)}
                    />
                    <QuickBtn
                        icon="create-outline"
                        label="Nota do dia"
                        colors={colors}
                        onPress={() => setNoteOpen(true)}
                    />
                </View>

                {/* today's meds */}
                {todayMeds.length > 0 && (
                    <>
                        <SectionHeader title="HOJE" colors={colors} />
                        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            {todayMeds.map((med, i) => (
                                <View
                                    key={med.id}
                                    style={[
                                        styles.medRow,
                                        i < todayMeds.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                                    ]}
                                >
                                    <View style={[styles.medDot, { backgroundColor: "#1D9E75" }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.medName, { color: colors.text }]}>{med.name}</Text>
                                        {med.dose ? (
                                            <Text style={[styles.medDose, { color: colors.textMuted }]}>{med.dose}</Text>
                                        ) : null}
                                    </View>
                                    <Text style={[styles.medTimes, { color: colors.textMuted }]}>
                                        {med.times.join(" · ")}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* upcoming appointments */}
                {appointments.filter((a) => new Date(`${a.date}T${a.time}`) > new Date()).slice(0, 3).length > 0 && (
                    <>
                        <SectionHeader title="PRÓXIMAS CONSULTAS" colors={colors} />
                        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            {appointments
                                .filter((a) => new Date(`${a.date}T${a.time}`) > new Date())
                                .slice(0, 3)
                                .map((appt, i, arr) => (
                                    <View
                                        key={appt.id}
                                        style={[
                                            styles.apptRow,
                                            i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                                        ]}
                                    >
                                        <View style={[styles.apptRowDateBox, { backgroundColor: colors.background }]}>
                                            <Text style={[styles.apptRowDay, { color: colors.text }]}>
                                                {appt.date.split("-")[2]}
                                            </Text>
                                            <Text style={[styles.apptRowMonth, { color: colors.textMuted }]}>
                                                {MONTHS[parseInt(appt.date.split("-")[1]) - 1]}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.medName, { color: colors.text }]}>{appt.doctorName}</Text>
                                            <Text style={[styles.medDose, { color: colors.textMuted }]}>
                                                {appt.time}{appt.specialty ? ` · ${appt.specialty}` : ""}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                        </View>
                    </>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>

            <SymptomModal
                visible={symptomOpen}
                onClose={() => setSymptomOpen(false)}
                colors={colors}
                patientId={selected.id}
            />
            <NoteModal
                visible={noteOpen}
                onClose={() => setNoteOpen(false)}
                colors={colors}
                patientId={selected.id}
            />
        </>
    );
}

// ─── quick action button ──────────────────────────────────────────────────────

function QuickBtn({ icon, label, colors, onPress }: {
    icon: string;
    label: string;
    colors: ReturnType<typeof useColors>;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Ionicons name={icon as any} size={22} color="#1D9E75" />
            <Text style={[styles.quickBtnLabel, { color: colors.text }]}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { padding: 16, gap: 10, marginTop: -16 },
    noPatient: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyText: { fontSize: 14, textAlign: "center", maxWidth: 260 },
    sectionTitle: { fontSize: 11, fontWeight: "500", letterSpacing: 0.08, marginTop: 6 },

    // highlight card
    highlightCard: {
        backgroundColor: "#085041",
        borderRadius: 16,
        padding: 18,
        gap: 4,
    },
    highlightEmpty: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    highlightTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
    },
    highlightIcon: {
        width: 30, height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    highlightLabel: { fontSize: 12, color: "#9FE1CB", flex: 1 },
    highlightTime: { fontSize: 12, color: "#9FE1CB", fontWeight: "500" },
    highlightTitle: { fontSize: 16, fontWeight: "500", color: "#E1F5EE", letterSpacing: -0.3 },
    highlightSub: { fontSize: 13, color: "#9FE1CB" },

    // appt highlight card
    apptCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
    },
    apptLabel: { fontSize: 11, color: "#1D9E75", marginBottom: 2 },
    apptDoctor: { fontSize: 16, fontWeight: "500", letterSpacing: -0.2 },
    apptSub: { fontSize: 13, marginTop: 1 },
    apptDateBox: { borderRadius: 10, padding: 10, alignItems: "center", width: 55 },
    apptDay: { fontSize: 20, fontWeight: "500", color: "#085041", lineHeight: 24 },
    apptMonth: { fontSize: 10, color: "#0F6E56", textTransform: "uppercase" },

    // quick actions
    quickGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    quickBtn: {
        flex: 1,
        minWidth: "45%",
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        gap: 8,
    },
    quickBtnLabel: { fontSize: 13, fontWeight: "500" },

    // list card
    listCard: {
        borderWidth: 1,
        borderRadius: 14,
        overflow: "hidden",
    },
    medRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
    },
    medDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    medName: { fontSize: 14, fontWeight: "500" },
    medDose: { fontSize: 12, marginTop: 1 },
    medTimes: { fontSize: 13 },

    // appt row
    apptRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
    },
    apptRowDateBox: {
        width: 40, height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    apptRowDay: { fontSize: 16, fontWeight: "500", lineHeight: 20 },
    apptRowMonth: { fontSize: 10, textTransform: "uppercase" },

    // modals
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
    sheetTitle: { fontSize: 17, fontWeight: "500", marginBottom: 12 },
    sheetLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.06, marginBottom: 8 },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    pill: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 999, borderWidth: 1,
    },
    pillText: { fontSize: 13 },
    intensityRow: { flexDirection: "row", gap: 8 },
    intensityBtn: {
        flex: 1, height: 40,
        borderRadius: 10, borderWidth: 1,
        alignItems: "center", justifyContent: "center",
    },
    intensityText: { fontSize: 15, fontWeight: "500" },
    input: {
        borderWidth: 1, borderRadius: 10,
        padding: 12, fontSize: 15,
    },
    cancelBtn: {
        flex: 1, padding: 13,
        borderWidth: 1, borderRadius: 12, alignItems: "center",
    },
    cancelBtnText: { fontSize: 14 },
    confirmBtn: {
        flex: 1, padding: 13,
        backgroundColor: "#085041",
        borderRadius: 12, alignItems: "center",
    },
    confirmBtnText: { fontSize: 14, color: "#E1F5EE", fontWeight: "500" },
});
