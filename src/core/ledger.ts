import { type Ledger, type Expense, schemaVersion } from "@/contracts";

export function createLedger(): Ledger {
  return {
    schemaVersion,
    expenses: [],
  };
}

export function addExpense(ledger: Ledger, expense: Expense): Ledger {
  return {
    ...ledger,
    expenses: [...ledger.expenses, expense],
  };
}

export function tinhThucTeTheoHangMuc(ledger: Ledger): Record<string, number> {
  const result: Record<string, number> = {};
  for (const exp of ledger.expenses) {
    result[exp.hangMuc] = (result[exp.hangMuc] || 0) + exp.soTienVND;
  }
  return result;
}

export function tongThucTe(ledger: Ledger): number {
  return ledger.expenses.reduce((sum, exp) => sum + exp.soTienVND, 0);
}
