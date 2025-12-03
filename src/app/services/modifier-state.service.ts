import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { ModifierState, ModifierSet } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ModifierStateService {
  private modifierStateSubject = new BehaviorSubject<ModifierState>({
    ctrl: false,
    alt: false,
    shift: false,
    ctrlLeft: false,
    ctrlRight: false,
    altLeft: false,
    altRight: false,
    shiftLeft: false,
    shiftRight: false
  });

  private currentModifierSetSubject = new BehaviorSubject<ModifierSet>(ModifierSet.NONE);

  public modifierState$ = this.modifierStateSubject.asObservable();
  public currentModifierSet$ = this.currentModifierSetSubject.asObservable();

  constructor() {
    this.initializeKeyboardListeners();
  }

  private initializeKeyboardListeners(): void {
    // Listen for keydown and keyup events on the document
    const keydown$ = fromEvent<KeyboardEvent>(document, 'keydown');
    const keyup$ = fromEvent<KeyboardEvent>(document, 'keyup');
    const blur$ = fromEvent<FocusEvent>(window, 'blur');
    const focus$ = fromEvent<FocusEvent>(window, 'focus');

    // Handle keydown events
    keydown$.subscribe(event => {
      this.updateModifierState(event, true);
    });

    // Handle keyup events
    keyup$.subscribe(event => {
      this.updateModifierState(event, false);
    });

    // Reset modifier state when window loses focus
    blur$.subscribe(() => {
      this.resetModifierState();
    });

    // Check modifier state when window regains focus
    focus$.subscribe(() => {
      // We can't reliably detect modifier state on focus,
      // so we reset to be safe
      this.resetModifierState();
    });
  }

  private updateModifierState(event: KeyboardEvent, isPressed: boolean): void {
    const currentState = this.modifierStateSubject.value;
    const newState = { ...currentState };

    // Update specific modifier keys
    switch (event.code) {
      case 'ControlLeft':
        newState.ctrlLeft = isPressed;
        break;
      case 'ControlRight':
        newState.ctrlRight = isPressed;
        break;
      case 'AltLeft':
        newState.altLeft = isPressed;
        break;
      case 'AltRight':
        newState.altRight = isPressed;
        break;
      case 'ShiftLeft':
        newState.shiftLeft = isPressed;
        break;
      case 'ShiftRight':
        newState.shiftRight = isPressed;
        break;
    }

    // Update general modifier states
    newState.ctrl = newState.ctrlLeft || newState.ctrlRight;
    newState.alt = newState.altLeft || newState.altRight;
    newState.shift = newState.shiftLeft || newState.shiftRight;

    // Update the state
    this.modifierStateSubject.next(newState);

    // Calculate and update the current modifier set
    this.updateCurrentModifierSet(newState);
  }

  private updateCurrentModifierSet(state: ModifierState): void {
    let modifierSet = ModifierSet.NONE;

    if (state.ctrl && state.alt && state.shift) {
      modifierSet = ModifierSet.CTRL_ALT_SHIFT;
    } else if (state.ctrl && state.alt) {
      modifierSet = ModifierSet.CTRL_ALT;
    } else if (state.ctrl && state.shift) {
      modifierSet = ModifierSet.CTRL_SHIFT;
    } else if (state.alt && state.shift) {
      modifierSet = ModifierSet.ALT_SHIFT;
    } else if (state.ctrl) {
      modifierSet = ModifierSet.CTRL;
    } else if (state.alt) {
      modifierSet = ModifierSet.ALT;
    } else if (state.shift) {
      modifierSet = ModifierSet.SHIFT;
    }

    if (this.currentModifierSetSubject.value !== modifierSet) {
      this.currentModifierSetSubject.next(modifierSet);
    }
  }

  private resetModifierState(): void {
    const resetState: ModifierState = {
      ctrl: false,
      alt: false,
      shift: false,
      ctrlLeft: false,
      ctrlRight: false,
      altLeft: false,
      altRight: false,
      shiftLeft: false,
      shiftRight: false
    };

    this.modifierStateSubject.next(resetState);
    this.currentModifierSetSubject.next(ModifierSet.NONE);
  }

  getCurrentModifierSet(): ModifierSet {
    return this.currentModifierSetSubject.value;
  }

  getCurrentModifierState(): ModifierState {
    return this.modifierStateSubject.value;
  }

  isModifierPressed(modifier: 'ctrl' | 'alt' | 'shift'): boolean {
    const state = this.modifierStateSubject.value;
    return state[modifier];
  }
}
