# Changelog

All notable changes to the **Filament Goto View** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-03-27

### Added
- **Quick Fix — Create Missing View**: When a `$view` string references a non-existent Blade file, a 💡 Quick Fix action is now available. Clicking it instantly creates the view file with a default `<x-filament-panels::page>` template, including all necessary intermediate directories, and opens the new file in the editor.

## [1.1.1] - 2026-03-27

### Fixed
- Autocomplete no longer duplicates the prefix when selecting a suggestion after typing a partial name (e.g., `filament.` + selecting `filament.pages.dashboard` no longer produces `filament.filament.pages.dashboard`).
- Lowered minimum VS Code engine requirement from `1.110.0` to `1.107.0` for broader compatibility.

## [1.1.0] - 2026-03-27

### Added
- **Intelligent Autocomplete**: Suggestions for all available Blade views when typing inside `$view = '...'`.
- Recursive scan of the views directory, presenting names in Laravel dot notation.
- Autocomplete triggers on `'`, `"`, and `.` characters.

## [1.0.0] - 2026-03-27

### Added
- **Goto View Navigation**: `Ctrl+Click` (or `Cmd+Click`) on `$view` property strings to open the corresponding Blade file.
- **Real-time Validation**: Integrated Diagnostics to highlight view paths with a red underline if the Blade file is missing.
- **Custom Configuration**:
    - `viewPath`: Define a custom directory for your Blade views.
    - `extension`: Support for custom view file extensions (default: `.blade.php`).
    - `projectSubFolder`: Support for projects located in subdirectories (useful for monorepos).
- **Laravel Dot Notation**: Automatic conversion of dot-separated strings (e.g., `filament.pages.user`) to file paths.