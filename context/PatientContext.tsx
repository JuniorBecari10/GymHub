import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    Patient,
    getPatients,
    savePatients,
    getSelectedPatient,
    saveSelectedPatient,
} from "@/lib/auth";

type PatientContextType = {
    patients: Patient[];
    selected: Patient | null;
    setSelected: (p: Patient | null) => Promise<void>;
    addPatient: (p: Patient) => Promise<void>;
    updatePatient: (p: Patient) => Promise<void>;
    deletePatient: (id: string) => Promise<void>;
};

const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selected, setSelectedState] = useState<Patient | null>(null);

    useEffect(() => {
        getPatients().then(setPatients);
        getSelectedPatient().then(setSelectedState);
    }, []);

    async function setSelected(p: Patient | null) {
        setSelectedState(p);
        await saveSelectedPatient(p);
    }

    async function addPatient(p: Patient) {
        const updated = [...patients, p];
        setPatients(updated);
        await savePatients(updated);
        await setSelected(p);
    }

    async function updatePatient(p: Patient) {
        const updated = patients.map((x) => x.id === p.id ? p : x);
        setPatients(updated);
        await savePatients(updated);
        if (selected?.id === p.id) await setSelected(p);
    }

    async function deletePatient(id: string) {
        const updated = patients.filter((x) => x.id !== id);
        setPatients(updated);
        await savePatients(updated);
        if (selected?.id === id) await setSelected(updated[0] ?? null);
    }

    return (
        <PatientContext.Provider value={{ patients, selected, setSelected, addPatient, updatePatient, deletePatient }}>
            {children}
        </PatientContext.Provider>
    );
}

export function usePatients() {
    const ctx = useContext(PatientContext);
    if (!ctx) throw new Error("usePatients must be used within PatientProvider");
    return ctx;
}
