import { Platform } from "react-native";

export type User = {
    id: string;
    email: string;
    fullName: string;
    password: string;
};

const USERS_KEY = "healthlen_users";
const SESSION_KEY = "healthlen_session";

function getStorage() {
    if (Platform.OS === "web" && typeof window !== "undefined") {
        return window.localStorage;
    }
    return null;
}

// AsyncStorage shim for native — lazy import
let _asyncStorage: any = null;
async function getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
        return getStorage()?.getItem(key) ?? null;
    }
    if (!_asyncStorage) {
        _asyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    }
    return _asyncStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
        getStorage()?.setItem(key, value);
        return;
    }
    if (!_asyncStorage) {
        _asyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    }
    await _asyncStorage.setItem(key, value);
}

async function removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
        getStorage()?.removeItem(key);
        return;
    }
    if (!_asyncStorage) {
        _asyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    }
    await _asyncStorage.removeItem(key);
}

// --- users ---

async function getUsers(): Promise<User[]> {
    const raw = await getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
}

async function saveUsers(users: User[]): Promise<void> {
    await setItem(USERS_KEY, JSON.stringify(users));
}

// --- public API ---

export async function register(
    fullName: string,
    email: string,
    password: string
): Promise<{ error?: string }> {
    const users = await getUsers();
    const exists = users.find((u) => u.email === email);
    if (exists) return { error: "Este email já está em uso." };

    const newUser: User = {
        id: Date.now().toString(),
        email,
        fullName,
        password,
    };
    await saveUsers([...users, newUser]);
    await setItem(SESSION_KEY, JSON.stringify(newUser));
    return {};
}

export async function login(
    email: string,
    password: string
): Promise<{ error?: string }> {
    const users = await getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return { error: "Email ou senha incorretos." };
    await setItem(SESSION_KEY, JSON.stringify(user));
    return {};
}

export async function logout(): Promise<void> {
    await removeItem(SESSION_KEY);
}

export async function getSession(): Promise<User | null> {
    const raw = await getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
}

const PATIENTS_KEY = "healthlen_patients";
const SELECTED_PATIENT_KEY = "healthlen_selected_patient";

export async function getPatients(): Promise<Patient[]> {
    const raw = await getItem(PATIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
}

export async function savePatients(patients: Patient[]): Promise<void> {
    await setItem(PATIENTS_KEY, JSON.stringify(patients));
}

export async function getSelectedPatient(): Promise<Patient | null> {
    const raw = await getItem(SELECTED_PATIENT_KEY);
    return raw ? JSON.parse(raw) : null;
}

export async function saveSelectedPatient(patient: Patient | null): Promise<void> {
    if (patient) {
        await setItem(SELECTED_PATIENT_KEY, JSON.stringify(patient));
    } else {
        await removeItem(SELECTED_PATIENT_KEY);
    }
}

export type Patient = {
    id: string;
    name: string;
    relation: string;
};
