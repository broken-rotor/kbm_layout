import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActionsService } from '../../services/actions.service';
import { ModifierStateService } from '../../services/modifier-state.service';
import { KeyboardKey, DeviceType, Action, KeyMapping, ModifierSet } from '../../models/interfaces';

@Component({
  selector: 'app-keyboard-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './keyboard-layout.component.html',
  styleUrls: ['./keyboard-layout.component.css']
})
export class KeyboardLayoutComponent implements OnInit, OnDestroy {
  private actionsService = inject(ActionsService);
  private modifierStateService = inject(ModifierStateService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  selectedAction: Action | null = null;
  keyMappings = new Map<string, KeyMapping>();
  currentModifierSet: ModifierSet = ModifierSet.NONE;

  // UK Keyboard Layout (ISO Layout)
  keyboardRows: KeyboardKey[][] = [
    // Function row
    [
      { code: 'Escape', display: 'Esc', className: 'key-esc' },
      { code: 'Dead1-1', display: '', dead: true },
      { code: 'F1', display: 'F1', className: 'key-function' },
      { code: 'F2', display: 'F2', className: 'key-function' },
      { code: 'F3', display: 'F3', className: 'key-function' },
      { code: 'F4', display: 'F4', className: 'key-function' },
      { code: 'Dead1-2', display: '', dead: true },
      { code: 'F5', display: 'F5', className: 'key-function' },
      { code: 'F6', display: 'F6', className: 'key-function' },
      { code: 'F7', display: 'F7', className: 'key-function' },
      { code: 'F8', display: 'F8', className: 'key-function' },
      { code: 'Dead1-3', display: '', dead: true },
      { code: 'F9', display: 'F9', className: 'key-function' },
      { code: 'F10', display: 'F10', className: 'key-function' },
      { code: 'F11', display: 'F11', className: 'key-function' },
      { code: 'F12', display: 'F12', className: 'key-function' },
      { code: 'Dead1-4', display: '', dead: true, className: 'narrow-space' },
      { code: 'PrtScrn', display: 'PS', className: 'key-function' },
      { code: 'ScrollLock', display: 'SL', className: 'key-function' },
      { code: 'PauseBreak', display: 'P/B', className: 'key-function' }
    ],
    // Number row
    [
      { code: 'Backquote', display: '`' },
      { code: 'Digit1', display: '1' },
      { code: 'Digit2', display: '2' },
      { code: 'Digit3', display: '3' },
      { code: 'Digit4', display: '4' },
      { code: 'Digit5', display: '5' },
      { code: 'Digit6', display: '6' },
      { code: 'Digit7', display: '7' },
      { code: 'Digit8', display: '8' },
      { code: 'Digit9', display: '9' },
      { code: 'Digit0', display: '0' },
      { code: 'Minus', display: '-' },
      { code: 'Equal', display: '=' },
      { code: 'Backspace', display: 'Backspace', width: 88 },
      { code: 'Dead2-1', display: '', dead: true, className: 'narrow-space' },
      { code: 'Insert', display: 'Ins', className: 'key-function' },
      { code: 'Home', display: 'Hm', className: 'key-function' },
      { code: 'PgUp', display: 'PUp', className: 'key-function' },
      { code: 'Dead2-2', display: '', dead: true, className: 'narrow-space' },
      { code: 'NumLock', display: 'NL', className: 'key-function' },
      { code: 'Keypad/', display: '/' },
      { code: 'Keypad*', display: '*' },
      { code: 'Keypad-', display: '-' }
    ],
    // QWERTY row (with ISO Enter spanning to next row)
    [
      { code: 'Tab', display: 'Tab', width: 63 },
      { code: 'KeyQ', display: 'Q' },
      { code: 'KeyW', display: 'W' },
      { code: 'KeyE', display: 'E' },
      { code: 'KeyR', display: 'R' },
      { code: 'KeyT', display: 'T' },
      { code: 'KeyY', display: 'Y' },
      { code: 'KeyU', display: 'U' },
      { code: 'KeyI', display: 'I' },
      { code: 'KeyO', display: 'O' },
      { code: 'KeyP', display: 'P' },
      { code: 'BracketLeft', display: '[' },
      { code: 'BracketRight', display: ']' },
      { code: 'Enter', display: 'Enter', width: 66 },
      { code: 'Dead3-1', display: '', dead: true, className: 'narrow-space' },
      { code: 'Delete', display: 'Del', className: 'key-function' },
      { code: 'End', display: 'End', className: 'key-function' },
      { code: 'PgDown', display: 'PDn', className: 'key-function' },
      { code: 'Dead3-2', display: '', dead: true, className: 'narrow-space' },
      { code: 'Keypad7', display: '7' },
      { code: 'Keypad8', display: '8' },
      { code: 'Keypad9', display: '9' },
      { code: 'Keypad+', display: '+' }
    ],
    // ASDF row (with ISO Enter continuation and UK hash key)
    [
      { code: 'CapsLock', display: 'Caps', width: 76 },
      { code: 'KeyA', display: 'A' },
      { code: 'KeyS', display: 'S' },
      { code: 'KeyD', display: 'D' },
      { code: 'KeyF', display: 'F' },
      { code: 'KeyG', display: 'G' },
      { code: 'KeyH', display: 'H' },
      { code: 'KeyJ', display: 'J' },
      { code: 'KeyK', display: 'K' },
      { code: 'KeyL', display: 'L' },
      { code: 'Semicolon', display: ';' },
      { code: 'Quote', display: "'" },
      { code: 'Backslash', display: '#' },
      { code: 'Dead4-1', display: '', dead: true, width: 218 },
      { code: 'Keypad4', display: '4' },
      { code: 'Keypad5', display: '5' },
      { code: 'Keypad6', display: '6' }
    ],
    // ZXCV row (with UK backslash key)
    [
      { code: 'ShiftLeft', display: 'Shift', width: 55, className: 'key-modifier' },
      { code: 'IntlBackslash', display: '\\' },
      { code: 'KeyZ', display: 'Z' },
      { code: 'KeyX', display: 'X' },
      { code: 'KeyC', display: 'C' },
      { code: 'KeyV', display: 'V' },
      { code: 'KeyB', display: 'B' },
      { code: 'KeyN', display: 'N' },
      { code: 'KeyM', display: 'M' },
      { code: 'Comma', display: ',' },
      { code: 'Period', display: '.' },
      { code: 'Slash', display: '/' },
      { code: 'ShiftRight', display: 'Shift', width: 116, className: 'key-modifier' },
      { code: 'Dead4-1', display: '', dead: true, width: 55 },
      { code: 'UpArrow', display: 'Up', className: 'key-function' },
      { code: 'Dead4-2', display: '', dead: true, width: 60 },
      { code: 'Keypad1', display: '1' },
      { code: 'Keypad2', display: '2' },
      { code: 'Keypad3', display: '3' },
      { code: 'KeypadEnter', display: 'Etr' }
    ],
    // Bottom row
    [
      { code: 'ControlLeft', display: 'Ctrl', width: 63, className: 'key-modifier' },
      { code: 'MetaLeft', display: 'Win' },
      { code: 'AltLeft', display: 'Alt', width: 55, className: 'key-modifier' },
      { code: 'Space', display: 'Space', width: 292 },
      { code: 'AltRight', display: 'AltGr', width: 55, className: 'key-modifier' },
      { code: 'MetaRight', display: 'Win' },
      { code: 'ContextMenu', display: 'Menu' },
      { code: 'ControlRight', display: 'Ctrl', width: 57, className: 'key-modifier' },
      { code: 'Dead5-1', display: '', dead: true, className: 'narrow-space' },
      { code: 'LeftArrow', display: 'Lft', className: 'key-function' },
      { code: 'DownArrow', display: 'Dn', className: 'key-function' },
      { code: 'RightArrow', display: 'Rgt', className: 'key-function' },
      { code: 'Dead5-2', display: '', dead: true, className: 'narrow-space' },
      { code: 'Keypad0', display: '0', width: 88 },
      { code: 'Keypad.', display: '.' }
    ]
  ];

  ngOnInit(): void {
    this.actionsService.selectedAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe(action => {
        this.selectedAction = action;
        this.cdr.markForCheck();
      });

    this.actionsService.keyMappings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mappings => {
        this.keyMappings = mappings;
        this.cdr.markForCheck();
      });

    this.modifierStateService.modifierState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Calculate effective modifier set considering conflicts
        this.currentModifierSet = this.modifierStateService.getEffectiveModifierSet(
          (modifier) => this.actionsService.isModifierKeyBound(modifier)
        );
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onKeyClick(key: KeyboardKey): void {
    if (this.selectedAction) {
      // Use modifier-aware mapping if modifiers are pressed, otherwise use regular mapping
      if (this.currentModifierSet !== ModifierSet.NONE) {
        this.actionsService.mapKeyToActionWithModifier(key.code, DeviceType.KEYBOARD, key.display);
      } else {
        this.actionsService.mapKeyToAction(key.code, DeviceType.KEYBOARD, key.display);
      }
      // Deselect the action after binding to exit selection mode
      this.actionsService.selectAction(null);
    } else {
      // If no action selected, clear the mapping for this key
      if (this.currentModifierSet !== ModifierSet.NONE) {
        this.actionsService.clearModifierKeyMapping(key.code);
      } else {
        this.actionsService.clearKeyMapping(key.code);
      }
    }
  }

  getKeyStyle(key: KeyboardKey): Record<string, string> {
    const mapping = this.actionsService.getModifierMappingForKey(key.code, this.currentModifierSet);
    const baseStyle: Record<string, string> = {};

    // Check if this is a modifier key and if it's currently pressed
    const isModifierPressed = this.isModifierKeyPressed(key.code);

    if (mapping && mapping.actionId) {
      const action = this.actionsService.getActionById(mapping.actionId);
      if (action) {
        // Fill the entire key with the action color
        const actionColor = this.actionsService.getActionColor(action);
        baseStyle['background'] = actionColor;
        baseStyle['color'] = this.getContrastColor(actionColor);
        baseStyle['border-color'] = actionColor;
      }
    } else if (isModifierPressed) {
      // Highlight pressed modifier keys that don't have actions bound
      baseStyle['background'] = '#4a90e2';
      baseStyle['color'] = '#ffffff';
      baseStyle['border-color'] = '#357abd';
      baseStyle['box-shadow'] = '0 0 8px rgba(74, 144, 226, 0.6)';
    }

    if (key.width !== undefined) {
      baseStyle['width'] = key.width.toString() + 'px';
    }

    return baseStyle;
  }

  getDeadKeyStyle(key: KeyboardKey): Record<string, string> {
    const baseStyle: Record<string, string> = {};

    if (key.width !== undefined) {
      baseStyle['min-width'] = key.width.toString() + 'px';
    }

    return baseStyle;    
  }

  private isModifierKeyPressed(keyCode: string): boolean {
    const modifierState = this.modifierStateService.getCurrentModifierState();
    
    switch (keyCode) {
      case 'ControlLeft':
        return modifierState.ctrlLeft;
      case 'ControlRight':
        return modifierState.ctrlRight;
      case 'AltLeft':
        return modifierState.altLeft;
      case 'AltRight':
        return modifierState.altRight;
      case 'ShiftLeft':
        return modifierState.shiftLeft;
      case 'ShiftRight':
        return modifierState.shiftRight;
      default:
        return false;
    }
  }

  getKeyClasses(key: KeyboardKey): string {
    let classes = 'keyboard-key';
    
    if (key.className) {
      classes += ` ${key.className}`;
    }

    const mapping = this.actionsService.getModifierMappingForKey(key.code, this.currentModifierSet);
    if (mapping && mapping.actionId) {
      classes += ' key-mapped';
    }

    if (this.selectedAction) {
      classes += ' key-selectable';
    }

    return classes;
  }

  getDeadKeyClasses(key: KeyboardKey): string {
    let classes = 'keyboard-dead-key';
    
    if (key.className) {
      classes += ` ${key.className}`;
    }

    if (key.width) {
      classes += ' key-width-' + key.width*100;
    }

    return classes;
  }

  getKeyTitle(key: KeyboardKey): string {
    const mapping = this.actionsService.getModifierMappingForKey(key.code, this.currentModifierSet);
    if (mapping && mapping.actionId) {
      const action = this.actionsService.getActionById(mapping.actionId);
      if (action) {
        const modifierText = this.currentModifierSet !== ModifierSet.NONE ? ` (${this.currentModifierSet})` : '';
        return `${key.display} - ${action.name}${modifierText}`;
      }
    }
    return key.display;
  }

  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}
