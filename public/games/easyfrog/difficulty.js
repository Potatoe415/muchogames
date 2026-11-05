// The two difficulties and their balance tables.
import { EASY_BALANCE } from "./balance-easy.js";
import { BALANCE } from "./balance.js";

export const DIFFICULTIES = ["easy", "normal"];

export const balanceFor = (difficulty) =>
  difficulty === "easy" ? EASY_BALANCE : BALANCE;
