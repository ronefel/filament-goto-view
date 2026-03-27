# Changelog

All notable changes to the **Filament Goto View** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-27

### Added
- **Goto View Navigation**: `Ctrl+Click` (or `Cmd+Click`) on `$view` property strings to open the corresponding Blade file.
- **Real-time Validation**: Integrated Diagnostics to highlight view paths with a red underline if the Blade file is missing.
- **Custom Configuration**:
    - `viewPath`: Define a custom directory for your Blade views.
    - `extension`: Support for custom view file extensions (default: `.blade.php`).
    - `projectSubFolder`: Support for projects located in subdirectories (useful for monorepos).
- **Laravel Dot Notation**: Automatic conversion of dot-separated strings (e.g., `filament.pages.user`) to file paths.