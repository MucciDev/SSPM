const axios = require('axios');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

const CONFIG_FOLDER = './config';
const CONFIG_FILE = path.join(CONFIG_FOLDER, 'config.json');
const BASE_URL = 'https://api.github.com/repos/MucciDev/SSPM/contents/libraries';
const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function saveConfig(configData) {
    try {
        await fs.mkdir(CONFIG_FOLDER, { recursive: true });
        await fs.writeFile(CONFIG_FILE, JSON.stringify(configData));
    } catch (err) {
        throw new Error(`Error saving config: ${err.message}`);
    }
}

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        throw new Error(`Error loading config: ${err.message}`);
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
        const filePath = path.join(librariesPath, 'libraries', libraryPath, file.name);
        await fs.writeFile(filePath, fileData);
        console.log(`File '${file.name}' downloaded and saved at: ${filePath}`);
    } catch (error) {
        console.error(`Error downloading file: ${error.message}`);
    }
}

async function downloadLibrary(libraryName, librariesPath) {
    let spinnerInterval;
    try {
        const libraryPath = `libraries/${libraryName}`;
        const response = await axios.get(BASE_URL);
        const libraries = response.data.filter(item => item.path === libraryPath);

        if (libraries.length > 0) {
            const library = libraries[0];
            const libraryData = await axios.get(library.url);
            const libraryFiles = libraryData.data.filter(item => item.name.endsWith('.spwn'));

            if (libraryFiles.length > 0) {
                spinnerInterval = displaySpinner(`Downloading ${libraryName}...`);

                // Parallelize file downloads
                await Promise.all(libraryFiles.map(file =>
                    downloadLibraryFile(libraryPath, librariesPath, file)
                ));

                clearInterval(spinnerInterval);
                process.stdout.write('\r'); // Clear the spinner animation
            } else {
                throw new Error(`No SPWN files found in the '${libraryName}' library.`);
            }
        } else {
            throw new Error(`Library '${libraryName}' not found.`);
        }
    } catch (error) {
        console.error(error.message);
        clearInterval(spinnerInterval);
        process.stdout.write('\r'); // Clear the spinner animation on error
        throw error;
    }
}

async function start() {
    try {
        const config = await loadConfig();
        let librariesPath = config.lastPath || '';

        try {
            await fs.access(librariesPath);
        } catch (err) {
            librariesPath = '';
        }

        if (!librariesPath || !(await confirmUseLastPath(librariesPath))) {
            librariesPath = await getNewLibraryPath();
        }

        await startLibraryImport(librariesPath);
    } catch (error) {
        console.error(error.message);
    }
}

async function confirmUseLastPath(librariesPath) {
    return new Promise(resolve => {
        rl.question(`Use the last used path '${librariesPath}'? (y/n): `, answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

async function getNewLibraryPath() {
    return new Promise(resolve => {
        rl.question('Enter new library path: ', async answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
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

async function downloadLibraries(libraryNames, librariesPath) {
    try {
        await Promise.all(libraryNames.map(libraryName =>
            downloadLibrary(libraryName, librariesPath)
        ));
        console.log('All libraries downloaded successfully.');
    } catch (error) {
        console.error('Failed to download one or more libraries.');
    }
}

// Start the program
start();
