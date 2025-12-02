# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a keyboard/mouse layout manager application built with Angular 21. It allows users to create custom actions and map them to keyboard keys or mouse buttons. The application persists data to localStorage.

## Development Commands

```bash
# Start development server (runs on http://localhost:4200)
npm start
# or
ng serve

# Build for production
ng build

# Build for development with watch mode
npm run watch

# Run unit tests with Vitest
npm test
# or
ng test

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint -- --fix

# Generate new component
ng generate component component-name
```

## Architecture

### Core Services

- **ActionsService** (src/app/services/actions.service.ts): Central state management service using RxJS BehaviorSubjects
  - Manages actions (create, update, delete)
  - Manages key/mouse button mappings
  - Handles device selection (keyboard vs mouse)
  - Coordinates between components and storage layer
  - Key constraint: Each action can only be mapped to one key/button at a time

- **StorageService** (src/app/services/storage.service.ts): localStorage persistence layer
  - Saves/loads actions array
  - Saves/loads key mappings (serialized as Map entries)

### Data Flow

1. User interactions in components trigger ActionsService methods
2. ActionsService updates internal BehaviorSubjects
3. Changes automatically propagate to subscribed components via observables
4. ActionsService calls StorageService to persist changes to localStorage
5. On app initialization, ActionsService loads data from StorageService

### Component Structure

All components are standalone with the following pattern:

- **App** (src/app/app.ts): Root component with device tab switching
- **KeyboardLayoutComponent**: Renders UK keyboard layout with clickable keys
- **MouseLayoutComponent**: Renders mouse diagram with clickable buttons
- **ActionsListComponent**: Manages action CRUD operations and displays mapped keys
- **ActionDialogComponent**: Modal for creating/editing actions

Components subscribe to ActionsService observables using `takeUntil(destroy$)` pattern for proper cleanup.

### Key Models (src/app/models/interfaces.ts)

- **Action**: User-defined action with id, name, color, and optional keyMapping
- **KeyMapping**: Links a key/button code to an action (includes deviceType, displayName, actionId)
- **DeviceType**: Enum for 'keyboard' or 'mouse'
- **KeyboardKey/MouseButton**: Visual layout definitions for rendering

### Mapping Logic

When a user clicks a key/button while an action is selected:
1. Any existing mapping for that key/button is removed
2. Any existing mapping for the selected action is removed (one action per key)
3. New mapping is created linking the key/button to the action
4. Both the keyMappings Map and the action's keyMapping property are updated

## Configuration

- **TypeScript**: Strict mode enabled with Angular-specific compiler options
- **ESLint**: Angular ESLint with recommended rules, accessibility checks, and template linting
- **Prettier**: Configured with 100 character print width, single quotes, and Angular HTML parser
- **Package Manager**: npm v10.9.2
- **Testing**: Vitest (Angular's new default test runner)
- **Build Tool**: Angular's new @angular/build system (esbuild-based)

## Styling

- Keys/buttons are styled based on mapped action colors
- Contrast color calculation ensures text readability on colored backgrounds
- UK keyboard layout with proper key sizing (function keys, wide keys like Shift/Space)
