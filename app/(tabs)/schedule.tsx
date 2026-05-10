import { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    Alert,
    Platform,
    FlatList,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useColors } from "@/hooks/useColors";
import { usePatients } from "@/context/PatientContext";
import {
    Medication,
    Appointment,
    DayOfWeek,
    getMedications,
    saveMedication,
    deleteMedication,
    getAppointments,
    saveAppointment,
    deleteAppointment,
} from "@/lib/schedule";
import DateTimePicker from "@react-native-community/datetimepicker";

const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const DAY_FULL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

function confirm(msg: string, onConfirm: () => void) {
    if (Platform.OS === "web") {
        if (window.confirm(msg)) onConfirm();
    } else {
        Alert.alert("Confirmar", msg, [
            { text: "Cancelar", style: "cancel" },
            { text: "Confirmar", style: "destructive", onPress: onConfirm },
        ]);
    }
}

function SubTabs({ active, onChange, colors }: {
    active: "meds" | "appointments";
    onChange: (v: "meds" | "appointments") => void;
    colors: ReturnType<typeof useColors>;
}) {
    return (
        <View style={[styles.subTabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(["meds", "appointments"] as const).map((tab) => {
                const selected = active === tab;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.subTab, selected && { backgroundColor: colors.background }]}
                        onPress={() => onChange(tab)}
                    >
                        <Text style={[styles.subTabText, { color: selected ? colors.text : colors.textMuted, fontWeight: selected ? "500" : "400" }]}>
                            {tab === "meds" ? "Medicamentos" : "Consultas"}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function Empty({ icon, text, colors }: {
    icon: string;
    text: string;
    colors: ReturnType<typeof useColors>;
}) {
    return (
        <View style={styles.empty}>
            <Ionicons name={icon as any} size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{text}</Text>
        </View>
    );
}

function MedCard({ med, colors, onEdit, onDelete, onToggle }: {
    med: Medication;
    colors: ReturnType<typeof useColors>;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
}) {
    const days = med.days.length === 7
        ? "Todos os dias"
        : med.days.map((d) => DAY_FULL[d]).join(", ");

    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, !med.active && { opacity: 0.5 }]}>
            <View style={styles.cardRow}>
                <View style={[styles.medDot, { backgroundColor: med.active ? "#1D9E75" : colors.border }]} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{med.name}</Text>
                    {med.dose ? <Text style={[styles.cardSub, { color: colors.textMuted }]}>{med.dose}</Text> : null}
                </View>
                <TouchableOpacity onPress={onToggle} style={[styles.iconBtn, { borderColor: colors.border }]}>
                    <Ionicons name={med.active ? "pause-outline" : "play-outline"} size={15} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { borderColor: colors.border }]}>
                    <Ionicons name="pencil-outline" size={15} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { borderColor: "#E24B4A33", backgroundColor: "#E24B4A11" }]}>
                    <Ionicons name="trash-outline" size={15} color="#E24B4A" />
                </TouchableOpacity>
            </View>

            <View style={[styles.cardRow, { marginTop: 10, gap: 6, flexWrap: "wrap" }]}>
                {med.times.map((t) => (
                    <View key={t} style={[styles.timePill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.timePillText, { color: colors.text }]}>{t}</Text>
                    </View>
                ))}
            </View>

            <Text style={[styles.cardDays, { color: colors.textMuted }]}>{days}</Text>
            {med.notes ? <Text style={[styles.cardNotes, { color: colors.textMuted }]}>{med.notes}</Text> : null}
        </View>
    );
}

function ApptCard({ appt, colors, onEdit, onDelete }: {
    appt: Appointment;
    colors: ReturnType<typeof useColors>;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [y, m, d] = appt.date.split("-");
    const dateStr = `${d}/${m}/${y}`;
    const isPast = new Date(`${appt.date}T${appt.time}`) < new Date();

    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, isPast && { opacity: 0.55 }]}>
            <View style={styles.cardRow}>
                <View style={[styles.apptDateBox, { backgroundColor: isPast ? colors.background : "#E1F5EE" }]}>
                    <Text style={[styles.apptDay, { color: isPast ? colors.textMuted : "#085041" }]}>{d}</Text>
                    <Text style={[styles.apptMonth, { color: isPast ? colors.textMuted : "#0F6E56" }]}>
                        {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][parseInt(m) - 1]}
                    </Text>
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{appt.doctorName}</Text>
                    {appt.specialty ? <Text style={[styles.cardSub, { color: colors.textMuted }]}>{appt.specialty}</Text> : null}
                    <Text style={[styles.cardSub, { color: colors.textMuted }]}>{appt.time}{appt.location ? ` · ${appt.location}` : ""}</Text>
                </View>

                <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { borderColor: colors.border }]}>
                    <Ionicons name="pencil-outline" size={15} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { borderColor: "#E24B4A33", backgroundColor: "#E24B4A11" }]}>
                    <Ionicons name="trash-outline" size={15} color="#E24B4A" />
                </TouchableOpacity>
            </View>

            {appt.notes ? <Text style={[styles.cardNotes, { color: colors.textMuted }]}>{appt.notes}</Text> : null}
        </View>
    );
}

function MedForm({ initial, onSave, onClose, colors }: {
    initial?: Medication;
    onSave: (m: Medication) => void;
    onClose: () => void;
    colors: ReturnType<typeof useColors>;
}) {
    const { selected } = usePatients();
    const [name, setName] = useState(initial?.name ?? "");
    const [dose, setDose] = useState(initial?.dose ?? "");
    const [notes, setNotes] = useState(initial?.notes ?? "");
    const [days, setDays] = useState<DayOfWeek[]>(initial?.days ?? ALL_DAYS);
    const [times, setTimes] = useState<string[]>(initial?.times ?? ["08:00"]);
    const [newTime, setNewTime] = useState("");

    function toggleDay(d: DayOfWeek) {
        setDays((prev) =>
            prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort() as DayOfWeek[]
        );
    }

    function addTime() {
        const t = newTime.trim();
        if (!t.match(/^\d{2}:\d{2}$/) || times.includes(t)) return;
        setTimes((prev) => [...prev, t].sort());
        setNewTime("");
    }

    function removeTime(t: string) {
        setTimes((prev) => prev.filter((x) => x !== t));
    }

    function handleSave() {
        if (!name.trim() || times.length === 0 || days.length === 0) return;
        onSave({
            id: initial?.id ?? Date.now().toString(),
            name: name.trim(),
            dose: dose.trim(),
            notes: notes.trim(),
            times,
            days,
            active: initial?.active ?? true,
            patientId: selected?.id ?? "",
        });
    }

    return (
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {initial ? "Editar medicamento" : "Novo medicamento"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                <FormField label="Nome" value={name} onChangeText={setName} placeholder="Losartana 50 mg" colors={colors} />
                <FormField label="Dose" value={dose} onChangeText={setDose} placeholder="1 comprimido" colors={colors} />
                <FormField label="Observações" value={notes} onChangeText={setNotes} placeholder="Tomar com água..." colors={colors} multiline />

                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Dias da semana</Text>
                <View style={styles.daysRow}>
                    {ALL_DAYS.map((d) => (
                        <TouchableOpacity
                            key={d}
                            style={[styles.dayBtn, days.includes(d) && { backgroundColor: "#085041", borderColor: "#085041" }, { borderColor: colors.border }]}
                            onPress={() => toggleDay(d)}
                        >
                            <Text style={[styles.dayBtnText, { color: days.includes(d) ? "#E1F5EE" : colors.textMuted }]}>
                                {DAY_LABELS[d]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Horários</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    {times.map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.timePill, { backgroundColor: "#E1F5EE", borderColor: "#9FE1CB" }]}
                            onPress={() => removeTime(t)}
                        >
                            <Text style={[styles.timePillText, { color: "#085041" }]}>{t}</Text>
                            <Ionicons name="close" size={12} color="#085041" />
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                        style={[styles.timeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, flex: 1 }]}
                        placeholder="08:00"
                        placeholderTextColor={colors.textMuted}
                        value={newTime}
                        onChangeText={setNewTime}
                        keyboardType="numbers-and-punctuation"
                    />
                    <TouchableOpacity
                        style={[styles.addTimeBtn, { backgroundColor: "#085041" }]}
                        onPress={addTime}
                    >
                        <Ionicons name="add" size={20} color="#E1F5EE" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
                    <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.confirmBtn, (!name.trim() || times.length === 0) && { opacity: 0.4 }]}
                    onPress={handleSave}
                    disabled={!name.trim() || times.length === 0}
                >
                    <Text style={styles.confirmBtnText}>{initial ? "Salvar" : "Cadastrar"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ApptForm({ initial, onSave, onClose, colors }: {
    initial?: Appointment;
    onSave: (a: Appointment) => void;
    onClose: () => void;
    colors: ReturnType<typeof useColors>;
}) {
    const { selected } = usePatients();
    const [doctorName, setDoctorName] = useState(initial?.doctorName ?? "");
    const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
    const [location, setLocation] = useState(initial?.location ?? "");
    const [notes, setNotes] = useState(initial?.notes ?? "");
    const [dateTime, setDateTime] = useState<Date>(
        initial?.date
            ? new Date(`${initial.date}T${initial.time}`)
            : new Date()
    );
    const [showPicker, setShowPicker] = useState<"date" | "time" | null>(null);

    function formatDate(d: Date) {
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
    }

    function formatTime(d: Date) {
        if (isNaN(d.getTime())) return "";
        return d.toTimeString().slice(0, 5);
    }

    function handleSave() {
        if (!doctorName.trim()) return;
        onSave({
            id: initial?.id ?? Date.now().toString(),
            doctorName: doctorName.trim(),
            specialty: specialty.trim(),
            date: formatDate(dateTime),
            time: formatTime(dateTime),
            location: location.trim(),
            notes: notes.trim(),
            patientId: selected?.id ?? "",
        });
    }

    return (
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {initial ? "Editar consulta" : "Nova consulta"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <FormField label="Médico" value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Roberto Fonseca" colors={colors} />
                <FormField label="Especialidade" value={specialty} onChangeText={setSpecialty} placeholder="Cardiologia" colors={colors} />

                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Data</Text>
                {Platform.OS === "web" ? (
                    <input
                        type="date"
                        value={formatDate(dateTime)}
                        onChange={(e) => {
                            const [y, m, d] = e.target.value.split("-").map(Number);
                            const updated = new Date(dateTime);
                            updated.setFullYear(y, m - 1, d);
                            if (!isNaN(updated.getTime())) setDateTime(new Date(updated));
                        }}
                        style={{
                            fontSize: 15,
                            padding: 12,
                            borderRadius: 10,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.background,
                            color: colors.text,
                            width: "100%",
                            marginBottom: 12,
                            boxSizing: "border-box",
                        } as any}
                    />
                ) : (
                    <TouchableOpacity
                        style={[styles.formInput, { borderColor: colors.border, backgroundColor: colors.background, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }]}
                        onPress={() => setShowPicker("date")}
                    >
                        <Text style={{ color: colors.text, fontSize: 15 }}>{formatDate(dateTime)}</Text>
                        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                )}

                <Text style={[styles.formLabel, { color: colors.textMuted }]}>Horário</Text>
                {Platform.OS === "web" ? (
                    <input
                        type="time"
                        value={formatTime(dateTime)}
                        onChange={(e) => {
                            const [h, m] = e.target.value.split(":").map(Number);
                            const updated = new Date(dateTime);
                            updated.setHours(h, m);
                            if (!isNaN(updated.getTime())) setDateTime(new Date(updated));
                        }}
                        style={{
                            fontSize: 15,
                            padding: 12,
                            borderRadius: 10,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.background,
                            color: colors.text,
                            width: "100%",
                            marginBottom: 12,
                            boxSizing: "border-box",
                        } as any}
                    />
                ) : (
                    <TouchableOpacity
                        style={[styles.formInput, { borderColor: colors.border, backgroundColor: colors.background, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }]}
                        onPress={() => setShowPicker("time")}
                    >
                        <Text style={{ color: colors.text, fontSize: 15 }}>{formatTime(dateTime)}</Text>
                        <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                )}

                {showPicker && Platform.OS !== "web" && (
                    <DateTimePicker
                        value={dateTime}
                        mode={showPicker}
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(_, date) => {
                            setShowPicker(null);
                            if (date) setDateTime(date);
                        }}
                    />
                )}

                <FormField label="Local" value={location} onChangeText={setLocation} placeholder="Clínica São Lucas" colors={colors} />
                <FormField label="Observações" value={notes} onChangeText={setNotes} placeholder="Levar exames anteriores..." colors={colors} multiline />
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={onClose}
                >
                    <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.confirmBtn, !doctorName.trim() && { opacity: 0.4 }]}
                    onPress={handleSave}
                    disabled={!doctorName.trim()}
                >
                    <Text style={styles.confirmBtnText}>{initial ? "Salvar" : "Cadastrar"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function FormField({ label, value, onChangeText, placeholder, colors, keyboardType, multiline }: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    colors: ReturnType<typeof useColors>;
    keyboardType?: any;
    multiline?: boolean;
}) {
    return (
        <View style={{ marginBottom: 12 }}>
            <Text style={[styles.formLabel, { color: colors.textMuted }]}>{label}</Text>
            <TextInput
                style={[
                    styles.formInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                    multiline && { height: 72, textAlignVertical: "top" },
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={keyboardType ?? "default"}
                multiline={multiline}
                autoCapitalize="words"
            />
        </View>
    );
}

export default function Schedule() {
    const colors = useColors();
    const { selected } = usePatients();

    const [activeTab, setActiveTab] = useState<"meds" | "appointments">("meds");
    const [medications, setMedications] = useState<Medication[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [medModal, setMedModal] = useState(false);
    const [apptModal, setApptModal] = useState(false);
    const [editingMed, setEditingMed] = useState<Medication | undefined>();
    const [editingAppt, setEditingAppt] = useState<Appointment | undefined>();

    useFocusEffect(
        useCallback(() => {
            if (!selected) return;
            getMedications(selected.id).then(setMedications);
            getAppointments(selected.id).then(setAppointments);
        }, [selected])
    );


    useEffect(() => {
        if (!selected) {
            setMedications([]);
            setAppointments([]);
            return;
        }
        getMedications(selected.id).then(setMedications);
        getAppointments(selected.id).then(setAppointments);
    }, [selected]);

    async function handleSaveMed(med: Medication) {
        await saveMedication(med);
        if (selected) getMedications(selected.id).then(setMedications);
        setMedModal(false);
        setEditingMed(undefined);
    }

    async function handleDeleteMed(id: string) {
        confirm("Excluir este medicamento?", async () => {
            await deleteMedication(id);
            if (selected) getMedications(selected.id).then(setMedications);
        });
    }

    async function handleToggleMed(med: Medication) {
        await saveMedication({ ...med, active: !med.active });
        if (selected) getMedications(selected.id).then(setMedications);
    }

    async function handleSaveAppt(appt: Appointment) {
        await saveAppointment(appt);
        if (selected) getAppointments(selected.id).then(setAppointments);
        setApptModal(false);
        setEditingAppt(undefined);
    }

    async function handleDeleteAppt(id: string) {
        confirm("Excluir esta consulta?", async () => {
            await deleteAppointment(id);
            if (selected) getAppointments(selected.id).then(setAppointments);
        });
    }

    if (!selected) {
        return (
            <View style={[styles.noPatient, { backgroundColor: colors.background }]}>
                <Ionicons name="person-outline" size={40} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Selecione um paciente para ver a agenda.
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SubTabs active={activeTab} onChange={setActiveTab} colors={colors} />

            {activeTab === "meds" ? (
                <>
                    {medications.length === 0 ? (
                        <Empty icon="medkit-outline" text="Nenhum medicamento cadastrado." colors={colors} />
                    ) : (
                        <FlatList
                            data={medications}
                            keyExtractor={(m) => m.id}
                            contentContainerStyle={styles.list}
                            renderItem={({ item }) => (
                                <MedCard
                                    med={item}
                                    colors={colors}
                                    onEdit={() => { setEditingMed(item); setMedModal(true); }}
                                    onDelete={() => handleDeleteMed(item.id)}
                                    onToggle={() => handleToggleMed(item)}
                                />
                            )}
                        />
                    )}
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: "#085041" }]}
                        onPress={() => { setEditingMed(undefined); setMedModal(true); }}
                    >
                        <Ionicons name="add" size={26} color="#E1F5EE" />
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    {appointments.length === 0 ? (
                        <Empty icon="calendar-outline" text="Nenhuma consulta agendada." colors={colors} />
                    ) : (
                        <FlatList
                            data={appointments}
                            keyExtractor={(a) => a.id}
                            contentContainerStyle={styles.list}
                            renderItem={({ item }) => (
                                <ApptCard
                                    appt={item}
                                    colors={colors}
                                    onEdit={() => { setEditingAppt(item); setApptModal(true); }}
                                    onDelete={() => handleDeleteAppt(item.id)}
                                />
                            )}
                        />
                    )}
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: "#085041" }]}
                        onPress={() => { setEditingAppt(undefined); setApptModal(true); }}
                    >
                        <Ionicons name="add" size={26} color="#E1F5EE" />
                    </TouchableOpacity>
                </>
            )}

            {/* med modal */}
            <Modal visible={medModal} transparent animationType="slide" onRequestClose={() => setMedModal(false)}>
                <Pressable style={styles.overlay} onPress={() => setMedModal(false)} />
                <MedForm
                    initial={editingMed}
                    onSave={handleSaveMed}
                    onClose={() => setMedModal(false)}
                    colors={colors}
                />
            </Modal>

            {/* appt modal */}
            <Modal visible={apptModal} transparent animationType="slide" onRequestClose={() => setApptModal(false)}>
                <Pressable style={styles.overlay} onPress={() => setApptModal(false)} />
                <ApptForm
                    initial={editingAppt}
                    onSave={handleSaveAppt}
                    onClose={() => setApptModal(false)}
                    colors={colors}
                />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    noPatient: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    list: { padding: 16, gap: 12, paddingBottom: 100 },
    subTabBar: {
        flexDirection: "row",
        margin: 16,
        marginTop: 0,
        marginBottom: -4,
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
    subTabText: { fontSize: 14 },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingBottom: 80,
    },
    emptyText: { fontSize: 14, textAlign: "center" },
    card: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        gap: 2,
    },
    cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    cardTitle: { fontSize: 15, fontWeight: "500" },
    cardSub: { fontSize: 13, marginTop: 1 },
    cardDays: { fontSize: 12, marginTop: 6 },
    cardNotes: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
    medDot: {
        width: 8, height: 8,
        borderRadius: 4,
        flexShrink: 0,
    },
    iconBtn: {
        width: 30, height: 30,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    timePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    timePillText: { fontSize: 13, fontWeight: "500" },
    apptDateBox: {
        width: 44, height: 48,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    apptDay: { fontSize: 18, fontWeight: "500", lineHeight: 22 },
    apptMonth: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.05 },
    fab: {
        position: "absolute",
        bottom: 24, right: 24,
        width: 52, height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
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
    sheetTitle: { fontSize: 17, fontWeight: "500", marginBottom: 16 },
    formLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.06, marginBottom: 5 },
    formInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
    daysRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
    dayBtn: {
        width: 36, height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    dayBtnText: { fontSize: 12, fontWeight: "500" },
    timeInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
    addTimeBtn: {
        width: 44, height: 44,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
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
