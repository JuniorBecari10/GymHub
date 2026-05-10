import { Platform } from "react-native";

let _asyncStorage: any = null;
async function getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web" && typeof window !== "undefined") {
        return window.localStorage.getItem(key);
    }
    if (!_asyncStorage) {
        _asyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    }
    return _asyncStorage.getItem(key);
}
async function setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web" && typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
        return;
    }
    if (!_asyncStorage) {
        _asyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    }
    await _asyncStorage.setItem(key, value);
}

const MEDS_KEY = "healthlen_medications";
const APPOINTMENTS_KEY = "healthlen_appointments";

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Medication = {
    id: string;
    name: string;
    dose: string;
    times: string[];         // ["08:00", "20:00"]
    days: DayOfWeek[];       // [0,1,2,3,4,5,6] = todos
    notes: string;
    active: boolean;
    patientId: string;
};

export type Appointment = {
    id: string;
    doctorName: string;
    specialty: string;
    date: string;            // "YYYY-MM-DD"
    time: string;            // "HH:MM"
    location: string;
    notes: string;
    patientId: string;
};

export async function getMedications(patientId: string): Promise<Medication[]> {
    const raw = await getItem(MEDS_KEY);
    const all: Medication[] = raw ? JSON.parse(raw) : [];
    return all.filter((m) => m.patientId === patientId);
}

export async function saveMedication(med: Medication): Promise<void> {
    const raw = await getItem(MEDS_KEY);
    const all: Medication[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((m) => m.id === med.id);
    if (idx >= 0) all[idx] = med;
    else all.push(med);
    await setItem(MEDS_KEY, JSON.stringify(all));
}

export async function deleteMedication(id: string): Promise<void> {
    const raw = await getItem(MEDS_KEY);
    const all: Medication[] = raw ? JSON.parse(raw) : [];
    await setItem(MEDS_KEY, JSON.stringify(all.filter((m) => m.id !== id)));
}

export async function getAppointments(patientId: string): Promise<Appointment[]> {
    const raw = await getItem(APPOINTMENTS_KEY);
    const all: Appointment[] = raw ? JSON.parse(raw) : [];
    return all
        .filter((a) => a.patientId === patientId)
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export async function saveAppointment(appt: Appointment): Promise<void> {
    const raw = await getItem(APPOINTMENTS_KEY);
    const all: Appointment[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((a) => a.id === appt.id);
    if (idx >= 0) all[idx] = appt;
    else all.push(appt);
    await setItem(APPOINTMENTS_KEY, JSON.stringify(all));
}

export async function deleteAppointment(id: string): Promise<void> {
    const raw = await getItem(APPOINTMENTS_KEY);
    const all: Appointment[] = raw ? JSON.parse(raw) : [];
    await setItem(APPOINTMENTS_KEY, JSON.stringify(all.filter((a) => a.id !== id)));
}

export type SymptomLog = {
    id: string;
    patientId: string;
    symptoms: string[];
    intensity: number;
    note: string;
    createdAt: string; // ISO string
};

export type DayNote = {
    id: string;
    patientId: string;
    note: string;
    createdAt: string;
};

const SYMPTOM_LOGS_KEY = "healthlen_symptom_logs";
const DAY_NOTES_KEY    = "healthlen_day_notes";

export async function getSymptomLogs(patientId: string): Promise<SymptomLog[]> {
    const raw = await getItem(SYMPTOM_LOGS_KEY);
    const all: SymptomLog[] = raw ? JSON.parse(raw) : [];
    return all
        .filter((s) => s.patientId === patientId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveSymptomLog(log: SymptomLog): Promise<void> {
    const raw = await getItem(SYMPTOM_LOGS_KEY);
    const all: SymptomLog[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((s) => s.id === log.id);
    if (idx >= 0) all[idx] = log;
    else all.push(log);
    await setItem(SYMPTOM_LOGS_KEY, JSON.stringify(all));
}

export async function deleteSymptomLog(id: string): Promise<void> {
    const raw = await getItem(SYMPTOM_LOGS_KEY);
    const all: SymptomLog[] = raw ? JSON.parse(raw) : [];
    await setItem(SYMPTOM_LOGS_KEY, JSON.stringify(all.filter((s) => s.id !== id)));
}

export async function getDayNotes(patientId: string): Promise<DayNote[]> {
    const raw = await getItem(DAY_NOTES_KEY);
    const all: DayNote[] = raw ? JSON.parse(raw) : [];
    return all
        .filter((n) => n.patientId === patientId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveDayNote(note: DayNote): Promise<void> {
    const raw = await getItem(DAY_NOTES_KEY);
    const all: DayNote[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((n) => n.id === note.id);
    if (idx >= 0) all[idx] = note;
    else all.push(note);
    await setItem(DAY_NOTES_KEY, JSON.stringify(all));
}

export async function deleteDayNote(id: string): Promise<void> {
    const raw = await getItem(DAY_NOTES_KEY);
    const all: DayNote[] = raw ? JSON.parse(raw) : [];
    await setItem(DAY_NOTES_KEY, JSON.stringify(all.filter((n) => n.id !== id)));
}
