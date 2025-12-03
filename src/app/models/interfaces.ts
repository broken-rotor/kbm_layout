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
  keyMapping?: KeyMapping;
}

export interface KeyMapping {
  keyCode: string;
  deviceType: DeviceType;
  displayName: string;
  actionId?: string;
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

export interface AppState {
  selectedDevice: DeviceType;
  selectedAction: Action | null;
  actions: Action[];
  keyMappings: Map<string, KeyMapping>;
}
