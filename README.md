---

# Simple SPWN Package Manager (SSPM)

SSPM is a command-line tool built in Node.js specifically designed for simplifying the import and management of SPWN libraries. It streamlines the process of accessing libraries directly from the [MucciDev/SSPM/libraries](https://github.com/MucciDev/SSPM/tree/main/libraries) repository.

## Features

- **Library Import**: Seamlessly download and import SPWN libraries from the SSPM repository.
- **Custom Path Configuration**: Easily set a personalized path for efficient library storage.
- **User-friendly CLI**: Intuitive command-line interface for convenient library management.
- **Configurable Library Storage**: Ability to store and organize downloaded libraries with ease.
- **Interactive Library Importing**: Select and import multiple libraries interactively.
- **Real-time Progress Tracking**: Display of live download progress for imported libraries.
- **Error Handling**: Robust error handling for library retrieval and import processes.

## Installation

1. Clone or download the repository to your local machine.
2. Install the required dependencies by executing `npm install`.
3. Use `node sspm.js -s path <custom-path>` to set a personalized path for library storage.

## Usage

### Setting a Custom Path

When first initialized it will ask to establish a custom path for library storage:

```bash
Enter path for libraries folder: <path>
```

After the first time it will prompt the user every time with:

```bash
Use the last used path 'path'? (y/n):
```

### Importing Libraries

To import a library, utilize the following command:

```bash
sspm import <library-name>
```

To import multiple libraries simply do:

```bash
sspm import <library-name> <other-library-name>
```

Replace `<library-name>` with the desired library name for import.

### Example:

```bash
sspm import myLibrary
```

## Configuration

The tool stores the last used path for library storage in a `config.json` file within the SSPM directory.

## Contributions

Contributions and suggestions are encouraged! Please feel free to open issues or pull requests to propose changes or report any encountered bugs.

---
