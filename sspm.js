const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');

const BASE_URL = 'https://api.github.com/repos/MucciDev/SSPM/contents/libraries';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function downloadFileFromGitHub(repoOwner, repoName, filePath) {
    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${filePath}`;
    return axios.get(url);
}

function downloadLibrary(libraryName, librariesPath) {
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\rDownloading ${spinner[i % spinner.length]} ${libraryName}...`);
        i++;
    }, 100);

    const libraryPath = `${libraryName}.spwn`;

    axios.get(BASE_URL)
        .then(response => {
            const libraries = response.data.filter(item => item.name === libraryPath);

            if (libraries.length > 0) {
                const library = libraries[0];
                return downloadFileFromGitHub('MucciDev', 'SSPM', `libraries/${library.name}`);
            } else {
                clearInterval(interval);
                throw new Error(`Library '${libraryName}' not found.`);
            }
        })
        .then(response => {
            clearInterval(interval);
            const outputPath = path.join(librariesPath, libraryName + '.spwn');
            fs.writeFileSync(outputPath, response.data);
            console.log(`\rLibrary '${libraryName}' downloaded and saved at: ${outputPath}`);
        })
        .catch(error => {
            clearInterval(interval);
            console.error(error.message);
        });
}

program
    .option('-s, --set-path <path>', 'Set path for libraries folder')
    .parse(process.argv);

if (program.setPath) {
    const librariesPath = path.resolve(program.setPath);

    if (!fs.existsSync(librariesPath)) {
        console.error('Specified path does not exist.');
        process.exit(1);
    }

    const librariesFolderPath = path.join(librariesPath, 'libraries');
    if (!fs.existsSync(librariesFolderPath)) {
        fs.mkdirSync(librariesFolderPath);
    }

    rl.question('Enter command: ', (command) => {
        const [cmd, arg] = command.split(' ');
        
        if (cmd === 'sspm' && arg === 'import') {
            const libraryName = command.split(' ').slice(2).join(' ');
            downloadLibrary(libraryName, librariesFolderPath);
        } else {
            console.log('Invalid command!');
        }

        rl.close();
    });
} else {
    rl.question('Enter path for libraries folder: ', (librariesPath) => {
        librariesPath = path.resolve(librariesPath);

        if (!fs.existsSync(librariesPath)) {
            console.error('Specified path does not exist.');
            process.exit(1);
        }

        const librariesFolderPath = path.join(librariesPath, 'libraries');
        if (!fs.existsSync(librariesFolderPath)) {
            fs.mkdirSync(librariesFolderPath);
        }

        rl.question('Enter command: ', (command) => {
            const [cmd, arg] = command.split(' ');
            
            if (cmd === 'sspm' && arg === 'import') {
                const libraryName = command.split(' ').slice(2).join(' ');
                downloadLibrary(libraryName, librariesFolderPath);
            } else {
                console.log('Invalid command!');
            }

            rl.close();
        });
    });
}
