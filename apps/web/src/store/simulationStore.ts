import type {
  GoldenCrossData,
  GoldenCrossRequest,
  LoanEligibilityData,
  ParseInputData,
  StressTestData,
  StrategyCardData,
} from "@inseoul/shared-contracts";
import { create } from "zustand";

interface SimulationState {
  rawText: string;
  parsedInput: ParseInputData | null;
  formInput: GoldenCrossRequest | null;
  goldenCrossData: GoldenCrossData | null;
  stressTestData: StressTestData | null;
  loanData: LoanEligibilityData | null;
  strategyCardData: StrategyCardData | null;

  setRawText: (text: string) => void;
  setParsedInput: (data: ParseInputData) => void;
  setFormInput: (data: GoldenCrossRequest) => void;
  setGoldenCrossData: (data: GoldenCrossData) => void;
  setStressTestData: (data: StressTestData) => void;
  setLoanData: (data: LoanEligibilityData) => void;
  setStrategyCardData: (data: StrategyCardData) => void;
  reset: () => void;
}

const initialState = {
  rawText: "",
  parsedInput: null,
  formInput: null,
  goldenCrossData: null,
  stressTestData: null,
  loanData: null,
  strategyCardData: null,
};

export const useSimulationStore = create<SimulationState>()((set) => ({
  ...initialState,
  setRawText: (rawText) => set({ rawText }),
  setParsedInput: (parsedInput) => set({ parsedInput }),
  setFormInput: (formInput) => set({ formInput }),
  setGoldenCrossData: (goldenCrossData) => set({ goldenCrossData }),
  setStressTestData: (stressTestData) => set({ stressTestData }),
  setLoanData: (loanData) => set({ loanData }),
  setStrategyCardData: (strategyCardData) => set({ strategyCardData }),
  reset: () => set(initialState),
}));
