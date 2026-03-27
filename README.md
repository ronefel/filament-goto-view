# Filament Goto View

> **Navigate from your PHP code directly to Blade view files in [Filament PHP](https://filamentphp.com/) projects — with a single click.**

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/Ronefel.filament-goto-view)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/Ronefel.filament-goto-view)
![License](https://img.shields.io/github/license/ronefel/filament-goto-view)

---

## ✨ Features

### 🔗 Click-to-Navigate

`Ctrl+Click` (or `Cmd+Click` on macOS) on any `$view` property string to instantly open the corresponding Blade file.

```php
// Before: You manually search for the file...
// After: Just Ctrl+Click on the string!
protected static string $view = 'filament.pages.dashboard';
//                                ^^^^^^^^^^^^^^^^^^^^^^^^
//                                Click here → opens resources/views/filament/pages/dashboard.blade.php
```

### 🔴 Real-Time View Validation

The extension validates view paths in real-time. If a Blade file doesn't exist at the expected path, the view string is underlined in red with a clear error message — **no need to run your app to find broken views**.

### 💡 Intelligent Autocomplete

Get instant suggestions for all available Blade views while typing inside `$view = '...'`. The extension scans your `resources/views` directory and presents view names in **Laravel dot notation** — so you never have to remember exact paths.

```php
protected static string $view = '|';  // ← Start typing, get suggestions!
//  filament.pages.dashboard
//  filament.pages.settings
//  filament.widgets.stats-overview
//  ...
```

Triggers automatically on `'`, `"`, and `.` characters.

### ⚙️ Fully Configurable

Works out of the box with standard Laravel projects, but easily adapts to custom setups:

| Setting | Default | Description |
|---------|---------|-------------|
| `filament-goto-view.viewPath` | `resources/views` | Relative path to your Laravel views folder |
| `filament-goto-view.extension` | `.blade.php` | File extension of your view files |
| `filament-goto-view.projectSubFolder` | `""` | Subfolder for your Laravel project (useful for monorepos) |

---

## 📦 Installation

1. Open **VS Code**
2. Go to the **Extensions** view (`Ctrl+Shift+X`)
3. Search for **Filament Goto View**
4. Click **Install**

Or install via the command line:

```bash
code --install-extension Ronefel.filament-goto-view
```

---

## 🚀 Usage

1. Open any PHP file in your Filament project
2. Find a line with `$view = 'some.view.path'`
3. Hold `Ctrl` (or `Cmd` on macOS) and click on the view string
4. The corresponding Blade file opens instantly

If the view file doesn't exist, you'll see a red underline with an error diagnostic — helping you catch typos and missing files before they cause runtime errors.

---

## ⚙️ Configuration

Open your VS Code settings (`Ctrl+,`) and search for "Filament Goto View" to customize the extension behavior.

### Monorepo / Subfolder Setup

If your Laravel project lives in a subdirectory (e.g., `backend/`), configure:

```json
{
  "filament-goto-view.projectSubFolder": "backend"
}
```

### Custom Views Directory

If your views are located in a non-standard directory:

```json
{
  "filament-goto-view.viewPath": "src/resources/views"
}
```

---

## 🧩 How It Works

The extension scans PHP files for `$view = '...'` patterns and:

1. **Converts** Laravel dot notation (e.g., `filament.pages.user`) to a file path (`filament/pages/user.blade.php`)
2. **Resolves** the full path using the workspace root + configured settings
3. **Creates clickable links** if the file exists
4. **Reports diagnostics** if the file is missing

---

## 📋 Requirements

- **VS Code** `1.110.0` or higher
- A **Laravel** project using **Filament PHP**

---

## 🐛 Known Issues

- The extension only detects `$view = '...'` patterns. Other Filament view references (like `view()` calls) are not yet supported.

---

## 📝 Release Notes

### 1.1.0

- **Intelligent Autocomplete**: Get suggestions for all available Blade views when typing inside `$view = '...'`
- Scans `resources/views` directory recursively and presents names in Laravel dot notation
- Triggers on `'`, `"`, and `.` characters

### 1.0.0

Initial release:

- Click-to-navigate on `$view` property strings
- Real-time diagnostics for missing Blade views
- Configurable view path, file extension, and project subfolder
- Laravel dot notation to file path conversion

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/ronefel/filament-goto-view).

---

## 📄 License

This extension is licensed under the [MIT License](LICENSE).
