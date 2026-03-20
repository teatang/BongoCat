# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BongoCat is a cross-platform desktop pet application that displays a cat animation which responds to user keyboard, mouse, and gamepad input. Built with Tauri 2 (Rust backend + Vue 3 frontend).

## Commands

```bash
# Install dependencies
pnpm install

# Development (builds icon then runs vite dev server)
pnpm dev

# Build frontend only
pnpm build

# Build Tauri app (includes frontend build)
pnpm tauri build

# Lint and fix code
pnpm lint

# Run release (builds and creates release artifacts)
pnpm release
```

## Architecture

### Frontend (Vue 3 + TypeScript)

- **State Management**: Pinia stores in `src/stores/`
- **UI Components**: Ant Design Vue
- **Live2D Rendering**: PixiJS + pixi-live2d-display
- **Pages**:
  - `src/pages/main/` - Main pet window
  - `src/pages/preference/` - Settings window
- **Composables** for Tauri integration:
  - `useDevice.ts` - Mouse/keyboard monitoring
  - `useGamepad.ts` - Gamepad input
  - `useModel.ts` - Live2D model loading
  - `useTray.ts` - System tray
  - `useWindowPosition.ts` / `useWindowState.ts` - Window management

### Backend (Rust/Tauri)

- **Entry**: `src-tauri/src/main.rs` and `src-tauri/src/lib.rs`
- **Core Modules**:
  - `src-tauri/src/core/device.rs` - Keyboard/mouse event hooks
  - `src-tauri/src/core/gamepad.rs` - Gamepad input handling
  - `src-tauri/src/core/prevent_default.rs` - Input suppression
- **Window Plugin**: Custom window plugin in `src-tauri/src/plugins/window/`

### Multi-Window Model

- **Main Window**: Transparent, always-on-top, frameless, accepts first mouse - displays the pet
- **Preference Window**: Standard window for settings (800x600 min)

### Key Files

- `src-tauri/tauri.conf.json` - Tauri configuration
- `vite.config.ts` - Vite build configuration
- `uno.config.ts` - UnoCSS configuration
- `src-tauri/Cargo.toml` - Rust dependencies
- `src/main.ts` - Vue app entry

## Git Workflow

- Uses commitlint for commit message validation
- Pre-commit hooks run lint-staged (auto-fix ESLint)
- Release automation via release-it
