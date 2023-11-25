# Simple SPWN Package Manager (SSPM)

SSPM is a command-line tool built in Node.js to facilitate the easy import and management of SPWN libraries from the [MucciDev/SSPM](https://github.com/MucciDev/SSPM) repository.

## Features

- **Import Libraries**: Download and import SPWN libraries directly from the SSPM repository.
- **Set Custom Path**: Set a custom path for downloading and storing libraries.
- **Command-line Interface**: User-friendly CLI for managing library imports.

## Installation

1. Clone or download the repository to your local machine.
2. Install the required dependencies by running `npm install`.
3. Use `node sspm.js -s path <custom-path>` to set a custom path for library storage.

## Usage

### Setting a Custom Path

To set a custom path for library storage, use the following command:

```
node sspm.js -s path <custom-path>
```

### Importing Libraries

To import a library, use the following command:

```
sspm import <library-name>
```

Replace `<library-name>` with the name of the library you want to import.

### Example:

```
sspm import myLibrary
```

## Configuration

The tool stores the last used path for library storage in a `config.json` file within the SSPM directory.

## Contributions

Contributions and suggestions are welcome! Feel free to open an issue or pull request to propose changes or report any bugs.

---

You can structure this documentation in a README.md file within the repository to provide users with information on installation, usage, features, and contribution guidelines. Adjust the content based on the specifics of your SSPM tool.
