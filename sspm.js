const axios = require('axios');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

const CONFIG_FOLDER = './config';
const CONFIG_FILE = path.join(CONFIG_FOLDER, 'config.json');
const LIBRARIES_FOLDER = './libraries';
const BASE_URL = 'https://api.github.com/repos/MucciDev/SSPM/contents/libraries';
//(old spinner animation) const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']; 
const spinner = ['-', '\\', '|', '/'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createFolderIfNotExists(folderPath) {
    try {
        await fs.access(folderPath);
    } catch (err) {
        try {
            await fs.mkdir(folderPath, { recursive: true });
        } catch (mkdirErr) {
            throw new Error(`Error creating folder ${folderPath}: ${mkdirErr.message}`);
        }
    }
}

// Wrap all asynchronous functions with error handling to ensure proper error messages are logged or thrown
async function initializeFolders() {
    try {
        await createFolderIfNotExists(CONFIG_FOLDER);
        await createFolderIfNotExists(LIBRARIES_FOLDER);
    } catch (err) {
        console.error('Error initializing folders:', err.message);
        throw err;
    }
}

// Add better error handling for file operations
async function createConfigFileWithData(lastPath) {
    const configData = { lastPath };
    try {
        await initializeFolders();
        await fs.writeFile(CONFIG_FILE, JSON.stringify(configData));
    } catch (err) {
        console.error('Error creating config file:', err.message);
        throw err;
    }
}

// Wrap file operations in better try-catch blocks
async function saveConfig(configData) {
    try {
        await initializeFolders();
        await fs.writeFile(CONFIG_FILE, JSON.stringify(configData));
    } catch (err) {
        console.error('Error saving config:', err.message);
        throw err;
    }
}

// Wrap file read operations in better try-catch blocks
async function loadConfig() {
    try {
        await initializeFolders();
        const configFileExists = await fs.access(CONFIG_FILE).then(() => true).catch(() => false);
        
        if (!configFileExists) {
            console.log("Config file doesn't exist. Initializing...");
            const lastPath = await getNewLibraryPath();
            await createConfigFileWithData(lastPath);
            return { lastPath };
        }

        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading config file:', err.message);
        return {};
    }
}

async function downloadFileFromGitHub(repoOwner, repoName, filePath) {
    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${filePath}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to download file from GitHub: ${error.message}`);
    }
}

function displaySpinner(message) {
    let i = 0;
    return setInterval(() => {
        process.stdout.write(`\r${message} ${spinner[i % spinner.length]}`);
        i++;
    }, 100);
}

async function downloadLibraryFile(libraryPath, librariesPath, file) {
    try {
        const fileData = await downloadFileFromGitHub('MucciDev', 'SSPM', `${libraryPath}/${file.name}`);
        const filePath = path.join(librariesPath, libraryPath, file.name); // Fix file path here
        await fs.mkdir(path.dirname(filePath), { recursive: true }); // Ensure directory exists
        await fs.writeFile(filePath, fileData);
        console.log(`File '${file.name}' downloaded and saved at: ${filePath}`);
    } catch (error) {
        throw new Error(`Error downloading file: ${error.message}`);
    }
}

async function downloadLibraries(libraryNames, librariesPath) {
    let spinnerInterval = displaySpinner('Downloading libraries');

    try {
        const libraries = await getLibraryData(); // Fetch library data only once

        await Promise.all(libraryNames.map(async libraryName => {
            const libraryPath = `libraries/${libraryName}`;
            const library = libraries.find(item => item.path === libraryPath);

            if (!library) {
                throw new Error(`Library '${libraryName}' not found.`);
            }

            const libraryData = await axios.get(library.url);
            const libraryFiles = libraryData.data.filter(item => item.name.endsWith('.spwn'));

            if (libraryFiles.length === 0) {
                throw new Error(`No SPWN files found in the '${libraryName}' library.`);
            }

            clearInterval(spinnerInterval); // Clear spinner before logging file downloads
            console.log(`${spinner[spinner.length - 1]} Downloading ${libraryName}...`);

            // Parallel downloads using Promise.all
            await Promise.all(libraryFiles.map(file =>
                downloadLibraryFile(libraryPath, librariesPath, file)
            ));

            console.log(`All files downloaded for ${libraryName}`);
            spinnerInterval = displaySpinner('Downloading libraries'); // Restart spinner
        }));

        clearInterval(spinnerInterval); // Clear spinner after all downloads complete
        console.log('All libraries downloaded successfully.');
    } catch (error) {
        clearInterval(spinnerInterval); // Clear spinner in case of an error
        console.error('Failed to download one or more libraries:', error.message);
    }
}

async function getLibraryData() {
    try {
        const response = await axios.get(BASE_URL);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch library data from GitHub: ${error.message}`);
    }
}

async function confirmUseLastPath(librariesPath) {
    return new Promise(resolve => {
        rl.question(`Use the last used path '${librariesPath}'? (y/n): `, answer => {
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

async function getNewLibraryPath() {
    return new Promise(resolve => {
        rl.question('Enter new library path: ', async answer => {
            resolve(answer.trim());
        });
    });
}

// Modified start function to handle user input
async function start() {
    try {
        const config = await loadConfig();
        let librariesPath = config.lastPath || '';

        let useLastPath = false;

        if (librariesPath) {
            useLastPath = await confirmUseLastPath(librariesPath);
        }

        if (!useLastPath) {
            librariesPath = await getNewLibraryPath();
            await createConfigFileWithData(librariesPath);
        }

        await startLibraryImport(librariesPath);
    } catch (error) {
        console.error(error.message);
    }
}

async function startLibraryImport(librariesPath) {
    try {
        const command = await getCommand();
        const args = command.split(' ').slice(2);

        if (command.startsWith('sspm import') && args.length > 0) {
            await downloadLibraries(args, librariesPath);
        } else {
            console.log('Invalid command!');
        }
    } catch (error) {
        console.error(error.message);
    }
}

async function getCommand() {
    return new Promise(resolve => {
        rl.question('Enter command: ', async command => {
            resolve(command);
        });
    });
}

// Start the program
start();
