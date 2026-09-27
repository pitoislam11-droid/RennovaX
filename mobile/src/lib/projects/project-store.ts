import { create } from 'zustand';

import type { IntakeStep, IntakeTurn } from '@/lib/contracts';

export type LocalProjectPhoto = {
  id: string;
  uri: string;
  filename: string;
  mimeType: string;
};

type ProjectDraftState = {
  initialRequest: string;
  location: string;
  turns: IntakeTurn[];
  step: IntakeStep | null;
  photos: LocalProjectPhoto[];
  setStart: (initialRequest: string, location: string) => void;
  setStep: (step: IntakeStep) => void;
  addTurn: (turn: IntakeTurn) => void;
  setPhotos: (photos: LocalProjectPhoto[]) => void;
  reset: () => void;
};

const emptyDraft = {
  initialRequest: '',
  location: '',
  turns: [] as IntakeTurn[],
  step: null as IntakeStep | null,
  photos: [] as LocalProjectPhoto[],
};

export const useProjectDraft = create<ProjectDraftState>((set) => ({
  ...emptyDraft,
  setStart: (initialRequest, location) => set({ ...emptyDraft, initialRequest, location }),
  setStep: (step) => set({ step }),
  addTurn: (turn) => set((state) => ({ turns: [...state.turns, turn] })),
  setPhotos: (photos) => set({ photos }),
  reset: () => set(emptyDraft),
}));
