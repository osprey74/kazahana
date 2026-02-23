import { create } from "zustand";

export interface ReportTarget {
  type: "post" | "user";
  uri?: string;
  cid?: string;
  did?: string;
}

interface ReportState {
  isOpen: boolean;
  target: ReportTarget | null;
  open: (target: ReportTarget) => void;
  close: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  isOpen: false,
  target: null,
  open: (target) => set({ isOpen: true, target }),
  close: () => set({ isOpen: false, target: null }),
}));
