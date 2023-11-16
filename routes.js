const path = require("path");
const fs = require("fs");
const yaml = require('js-yaml');

/**
 * Read the latest.yml and return the version number.
 * @returns {*|null}
 */
const collectLatestVersion = () => {
    const latestPath = path.join(__dirname, 'applications', 'electron-launcher', 'latest.yml');

    try {
        // Read the YAML file
        const fileContents = fs.readFileSync(latestPath, 'utf8');

        // Parse the YAML content
        const data = yaml.load(fileContents);

        // Extract the version
        const version = data.version;

        // Print the version
        console.log(`Version: ${version}`);

        return version;
    } catch (error) {
        console.error(`Error reading or parsing the YAML file: ${error.message}`);
    }

    return null;
}

/**
 * A recursive function to collect all the files within the supplied folder path.
 * @param folderPath
 * @returns {*[]}
 */
const getFolderContent = (folderPath) => {
    const folderContent = [];

    // Get the list of files/folders in the directory
    const files = fs.readdirSync(folderPath);

    files.forEach((file) => {
        const filePath = path.join(folderPath, file);

        if (fs.statSync(filePath).isDirectory()) {
            // Item is a nested folder, recursively retrieve its content
            const subFolderContent = getFolderContent(filePath);
            if (subFolderContent.length > 0) {
                folderContent.push({
                    type: 'folder',
                    name: file,
                    content: subFolderContent,
                });
            }
        } else {
            // Item is a file
            folderContent.push({
                type: 'file',
                name: file,
                path: filePath.replace(__dirname, ''),
            });
        }
    });

    return folderContent;
}

module.exports = (app) => {
    // Route to download the folder, sends back a json of the folder content
    app.get('/download-folder', (req, res) => {
        const folderPath = path.join(__dirname, 'applications', 'electron-launcher');
        const folderContent = getFolderContent(folderPath);

        const latestVersionNumber = collectLatestVersion();
        if (latestVersionNumber == null) {
            res.status(404).send('latest.yml not found');
            return;
        }

        // Check that the latest version exists on the server
        const latestFile = folderContent.find(item => item.name === `LeadMe Setup ${latestVersionNumber}.exe`);
        if (latestFile === undefined) {
            res.status(404).send(`LeadMe Setup ${latestVersionNumber}.exe not found`);
            return;
        }

        // Filter the folder content to include only the files with the latest version, only the .exe, .exe.blockmap and
        // latest.yml are in the top layer of the folderContent. The win-unpacked is always the up-to-date version and
        // is left unchanged.
        const filteredFiles = folderContent.filter(item =>
            (
                item.name === `LeadMe Setup ${latestVersionNumber}.exe` ||
                item.name === `LeadMe Setup ${latestVersionNumber}.exe.blockmap` ||
                item.name === `latest.yml`
            ) || item.type !== 'file'
        );

        res.json(filteredFiles);
    });

    // Route to download the folder sub contents
    app.get('/download-folder/*', (req, res) => {
        const requestedPath = req.params[0];
        const filePath = path.join(__dirname, 'applications', 'electron-launcher', requestedPath);

        if (fs.existsSync(filePath)) {
            const isDirectory = fs.statSync(filePath).isDirectory();

            if (isDirectory) {
                // If the requested path is a directory, recursively retrieve its content
                const folderContent = getFolderContent(filePath);

                res.json(folderContent);
            } else {
                // If the requested path is a file, send the file
                res.sendFile(filePath);
            }
        } else {
            res.status(404).send('File or folder not found');
        }
    });
};
