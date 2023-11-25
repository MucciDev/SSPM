const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');

const CONFIG_FOLDER = './config';
const CONFIG_FILE = path.join(CONFIG_FOLDER, 'config.json');
const BASE_URL = 'https://api.github.com/repos/MucciDev/SSPM/contents/libraries';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function saveConfig(configData) {
    if (!fs.existsSync(CONFIG_FOLDER)) {
        fs.mkdirSync(CONFIG_FOLDER);
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData));
}

function loadConfig() {
    try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function createLibrariesFolder(librariesPath) {
    const librariesFolderPath = path.join(librariesPath, 'libraries');
    if (!fs.existsSync(librariesFolderPath)) {
        fs.mkdirSync(librariesFolderPath);
    }
    return librariesFolderPath;
}

function downloadFileFromGitHub(repoOwner, repoName, filePath) {
    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${filePath}`;
    return axios.get(url);
}

function downloadLibrary(libraryName, librariesPath) {
    return new Promise((resolve, reject) => {
        const libraryFolderPath = path.join(librariesPath, 'libraries', libraryName);
        if (!fs.existsSync(libraryFolderPath)) {
            fs.mkdirSync(libraryFolderPath, { recursive: true });
        }

        const libraryPath = `libraries/${libraryName}`;
        axios.get(BASE_URL)
            .then(response => {
                const libraries = response.data.filter(item => item.path === libraryPath);

                if (libraries.length > 0) {
                    const library = libraries[0];
                    return axios.get(library.url);
                } else {
                    throw new Error(`Library '${libraryName}' not found.`);
                }
            })
            .then(response => {
                const libraryFiles = response.data.filter(item => item.name.endsWith('.spwn'));

                if (libraryFiles.length > 0) {
                    const downloadPromises = libraryFiles.map(file => {
                        const fileURL = file.download_url;
                        const fileName = file.name;
                        return downloadFileFromGitHub('MucciDev', 'SSPM', `${libraryPath}/${fileName}`)
                            .then(fileData => {
                                const filePath = path.join(libraryFolderPath, fileName);
                                fs.writeFileSync(filePath, fileData.data);
                                console.log(`File '${fileName}' downloaded and saved at: ${filePath}`);
                            });
                    });

                    Promise.all(downloadPromises)
                        .then(() => resolve())
                        .catch(() => reject());
                } else {
                    throw new Error(`No SPWN files found in the '${libraryName}' library.`);
                }
            })
            .catch(error => {
                console.error(error.message);
                reject();
            });
    });
}

program
    .option('-s, --set-path <path>', 'Set path for libraries folder')
    .parse(process.argv);

let librariesPath = '';

// Check if a path is provided via command line
if (program.setPath) {
    librariesPath = path.resolve(program.setPath);

    if (!fs.existsSync(librariesPath)) {
        console.error('Specified path does not exist.');
        process.exit(1);
    }
} else {
    const config = loadConfig();
    librariesPath = config.lastPath || '';

    if (!fs.existsSync(librariesPath)) {
        librariesPath = '';
    }
}

if (librariesPath) {
    rl.question(`Use the last used path '${librariesPath}'? (y/n): `, (answer) => {
        if (answer.toLowerCase() === 'y') {
            startLibraryImport(librariesPath);
        } else {
            getNewLibraryPath();
        }
    });
} else {
    getNewLibraryPath();
}

function getNewLibraryPath() {
    rl.question('Enter path for libraries folder: ', (inputPath) => {
        librariesPath = path.resolve(inputPath);

        if (!fs.existsSync(librariesPath)) {
            console.error('Specified path does not exist.');
            process.exit(1);
        }

        startLibraryImport(librariesPath);
    });
}

function startLibraryImport(librariesPath) {
    rl.question('Enter command: ', (command) => {
        const args = command.split(' ').slice(2);

        if (command.startsWith('sspm import') && args.length > 0) {
            downloadLibraries(args, librariesPath);
        } else {
            console.log('Invalid command!');
        }

        rl.close();
    });
}

function downloadLibraries(libraryNames, librariesPath) {
    const downloadPromises = libraryNames.map(libraryName => {
        return downloadLibrary(libraryName, librariesPath);
    });

    Promise.all(downloadPromises)
        .then(() => {
            console.log('All libraries downloaded successfully.');
        })
        .catch(() => {
            console.error('Failed to download one or more libraries.');
        });
}
