
export type Color = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green';

export type Face = Color[][]; // 3x3 array

export interface CubeState {
  U: Face; // Up
  D: Face; // Down
  L: Face; // Left
  R: Face; // Right
  F: Face; // Front
  B: Face; // Back
}

export type Move = 'U' | 'U\'' | 'U2' | 'D' | 'D\'' | 'D2' | 'L' | 'L\'' | 'L2' | 'R' | 'R\'' | 'R2' | 'F' | 'F\'' | 'F2' | 'B' | 'B\'' | 'B2';

export interface Solution {
  moves: Move[];
  solverName: string;
  timeMs: number;
  explanation?: string;
}

export interface Stats {
  solveTime: number;
  moveCount: number;
  tps: number;
  date: string;
}
