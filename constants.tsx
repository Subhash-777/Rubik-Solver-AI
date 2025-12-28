
import { CubeState, Color } from './types';

const createFace = (color: Color): Color[][] => [
  [color, color, color],
  [color, color, color],
  [color, color, color]
];

export const INITIAL_CUBE_STATE: CubeState = {
  U: createFace('white'),
  D: createFace('yellow'),
  L: createFace('orange'),
  R: createFace('red'),
  F: createFace('green'),
  B: createFace('blue')
};

export const COLOR_MAP: Record<Color, string> = {
  white: '#FFFFFF',
  yellow: '#FFD700',
  red: '#DC2626',
  orange: '#F97316',
  blue: '#2563EB',
  green: '#16A34A'
};

export const MOVES: string[] = ['U', 'D', 'L', 'R', 'F', 'B'];
