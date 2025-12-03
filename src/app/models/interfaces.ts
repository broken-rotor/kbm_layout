export interface ColorGroup {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

export interface Action {
  id: string;
  name: string;
  colorGroupId: string;
  keyMappings?: Map<ModifierSet, KeyMapping>;
}

export enum ModifierSet {
  NONE = 'none',
  CTRL = 'ctrl',
  ALT = 'alt',
  SHIFT = 'shift',
  CTRL_ALT = 'ctrl+alt',
  CTRL_SHIFT = 'ctrl+shift',
  ALT_SHIFT = 'alt+shift',
  CTRL_ALT_SHIFT = 'ctrl+alt+shift'
}

export interface KeyMapping {
  keyCode: string;
  deviceType: DeviceType;
  displayName: string;
  modifierSet: ModifierSet;
  actionId?: string;
}

export interface ModifierState {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  ctrlLeft: boolean;
  ctrlRight: boolean;
  altLeft: boolean;
  altRight: boolean;
  shiftLeft: boolean;
  shiftRight: boolean;
}

export enum DeviceType {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse'
}

export interface KeyboardKey {
  code: string;
  display: string;
  row: number;
  col: number;
  width?: number;
  height?: number;
  className?: string;
}

export interface MouseButton {
  code: string;
  display: string;
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
}
