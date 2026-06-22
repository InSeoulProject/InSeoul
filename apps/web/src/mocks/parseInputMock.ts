import type { ParseInputData } from "@inseoul/shared-contracts";

export const PARSE_INPUT_MOCK: ParseInputData = {
  cashAsset: 30_000_000,
  jeonseDeposit: 200_000_000,
  monthlySaving: 1_500_000,
  annualIncome: null,
  targetDistrict: "마포구",
  targetPrice: null,
  missingFields: ["annualIncome", "targetPrice"],
};
