# Multi-Keybind Support 🎮

The KBM Layout application now supports sophisticated multi-keybind functionality, allowing you to bind multiple key combinations to the same action using modifier keys.

## ✨ Features

### Multiple Keybinds Per Action
Each action can now have multiple keybinds using different modifier combinations:
- **Base key**: `A`
- **With Ctrl**: `Ctrl+A`
- **With Alt**: `Alt+A`
- **With Shift**: `Shift+A`
- **Combinations**: `Ctrl+Alt+A`, `Ctrl+Shift+A`, `Alt+Shift+A`, `Ctrl+Alt+Shift+A`

### Supported Modifiers
- `Ctrl` (Control key)
- `Alt` (Alt key)
- `Shift` (Shift key)
- All combinations of the above

## 🎯 How to Use

### Creating Multi-Keybinds
1. **Select an action** from the actions list
2. **Hold modifier keys** (Ctrl, Alt, Shift, or combinations)
3. **Click a key** on the keyboard layout to create the binding
4. **Repeat** with different modifier combinations for the same key

### Example Workflow
1. Create an action called "Copy Text"
2. Select the "Copy Text" action
3. Click the `C` key → Creates binding: `C`
4. Hold `Ctrl` and click the `C` key → Creates binding: `Ctrl+C`
5. Hold `Shift` and click the `C` key → Creates binding: `Shift+C`

Now your "Copy Text" action responds to `C`, `Ctrl+C`, and `Shift+C`!

### Viewing Multi-Keybinds
The actions list displays all keybinds for each action in a comma-separated format:
```
Copy Text: C, Ctrl+C, Shift+C
Paste Text: V, Ctrl+V
Save File: Ctrl+S, F1
```

### Clearing Keybinds
- **Clear specific binding**: Hold the same modifiers and click the 🚫 button next to the key
- **Clear all bindings**: Use the 🚫 button in the action's controls

## 🏗️ Technical Implementation

### Data Structure
```typescript
interface Action {
  id: string;
  name: string;
  colorGroupId: string;
  keyMappings?: Map<ModifierSet, KeyMapping>;
}

enum ModifierSet {
  NONE = 'none',
  CTRL = 'ctrl',
  ALT = 'alt',
  SHIFT = 'shift',
  CTRL_ALT = 'ctrl+alt',
  CTRL_SHIFT = 'ctrl+shift',
  ALT_SHIFT = 'alt+shift',
  CTRL_ALT_SHIFT = 'ctrl+alt+shift'
}
```

### Key Features
- **Modifier-aware mapping**: Each key+modifier combination is treated as a unique binding
- **Real-time modifier detection**: The app tracks which modifier keys are currently pressed
- **Conflict prevention**: Same key+modifier combination cannot be bound to multiple actions
- **Backward compatibility**: Existing single keybinds are automatically migrated

## 🎨 UI Enhancements

### Visual Feedback
- Actions display all their keybinds in the actions list
- Modifier prefixes are automatically added (e.g., "Ctrl+", "Alt+")
- Color-coded organization with tabbed interface
- Real-time modifier state indication

### Enhanced Controls
- Individual keybind management
- Bulk operations for clearing all bindings
- Intuitive modifier key detection
- Responsive keyboard and mouse layouts

## 🔧 Advanced Usage

### Keybind Sets
The application supports multiple keybind sets, allowing you to:
- Create different configurations for different use cases
- Switch between keybind sets quickly
- Export/import keybind configurations

### Color Groups
Actions are organized by color groups for better visual organization:
- Create custom color groups
- Assign actions to specific groups
- Filter actions by color group
- Tabbed interface for easy navigation

## 💡 Tips

1. **Start simple**: Begin with basic keybinds, then add modifier combinations
2. **Use conventions**: Follow standard conventions (e.g., `Ctrl+C` for copy)
3. **Organize by color**: Use color groups to categorize related actions
4. **Test combinations**: Verify your keybinds work as expected
5. **Document your setup**: Keep track of complex keybind configurations

## 🚀 Getting Started

1. Open the KBM Layout application
2. Create a new action or select an existing one
3. Try binding the same key with different modifiers
4. See your multi-keybinds displayed in the actions list
5. Test the functionality by using different key combinations

The multi-keybind system provides powerful flexibility while maintaining an intuitive user experience!
