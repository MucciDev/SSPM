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
        console.error(err);
    }
}

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
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

async function downloadLibrary(libraryName, librariesPath) {
    let spinnerInterval;
    try {
        const libraryFolderPath = path.join(librariesPath, 'libraries', libraryName);
        await fs.mkdir(libraryFolderPath, { recursive: true });

        const libraryPath = `libraries/${libraryName}`;
        const response = await axios.get(BASE_URL);
        const libraries = response.data.filter(item => item.path === libraryPath);

        if (libraries.length > 0) {
            const library = libraries[0];
            const libraryData = await axios.get(library.url);
            const libraryFiles = libraryData.data.filter(item => item.name.endsWith('.spwn'));

            if (libraryFiles.length > 0) {
                let i = 0;
                spinnerInterval = setInterval(() => {
                    process.stdout.write(`\rDownloading ${spinner[i % spinner.length]} ${libraryName}...`);
                    i++;
                }, 100);

                await Promise.all(libraryFiles.map(async file => {
                    const fileData = await downloadFileFromGitHub('MucciDev', 'SSPM', `${libraryPath}/${file.name}`);
                    const filePath = path.join(libraryFolderPath, file.name);
                    await fs.writeFile(filePath, fileData);
                    console.log(`\rFile '${file.name}' downloaded and saved at: ${filePath}`);
                }));

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

        if (librariesPath) {
            rl.question(`Use the last used path '${librariesPath}'? (y/n): `, async (answer) => {
                if (answer.toLowerCase() === 'y') {
                    await startLibraryImport(librariesPath);
                } else {
                    await getNewLibraryPath();
                }
            });
        } else {
            await getNewLibraryPath();
        }
    } catch (error) {
        console.error(error.message);
    }
}

async function startLibraryImport(librariesPath) {
    try {
        rl.question('Enter command: ', async (command) => {
            const args = command.split(' ').slice(2);

            if (command.startsWith('sspm import') && args.length > 0) {
                await downloadLibraries(args, librariesPath);
            } else {
                console.log('Invalid command!');
            }

            rl.close();
        });
    } catch (error) {
        console.error(error.message);
    }
}

async function downloadLibraries(libraryNames, librariesPath) {
    try {
        const downloadPromises = libraryNames.map(libraryName => {
            return downloadLibrary(libraryName, librariesPath);
        });

        await Promise.all(downloadPromises);
        console.log('All libraries downloaded successfully.');
    } catch (error) {
        console.error('Failed to download one or more libraries.');
    }
}

// Start the program
start();
