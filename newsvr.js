const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
    const baseURL = 'http://' + req.headers.host + '/';
    const requestURL = url.parse(req.url, true); // Using url.parse instead of new URL
    const resourcePath = path.join(process.cwd(), requestURL.pathname.substring(1));

    fs.stat(resourcePath, (err, stats) => {
        if (!err) {
            if (stats.isDirectory()) {
                // For the first curl request (foldername)
                fs.readdir(resourcePath, (err, filesInFolder) => {
                    if (!err) {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end(`${requestURL.pathname} Directory Content:\n${filesInFolder.join(',')}`);
                    } else {
                        handleError(res, err);
                    }
                });
            } else if (stats.isFile()) {
                // For the second curl request (filename.ext)
                fs.readFile(resourcePath, 'utf8', (err, fileContent) => {
                    if (!err) {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end(`${requestURL.pathname} File Content:\n${fileContent}`);
                    } else {
                        handleError(res, err);
                    }
                });
            }
        } else if (err.code === 'ENOENT') {
            // If the folder or file does not exist, create it
            if (path.extname(resourcePath) === '') {
                // For folder creation
                fs.mkdir(resourcePath, (err) => {
                    if (!err) {
                        res.writeHead(201, { 'Content-Type': 'text/plain' });
                        res.end(`Folder '${requestURL.pathname}' created successfully`);
                    } else {
                        handleError(res, err);
                    }
                });
            } else {
                // For file creation
                const requestData = {
                    Method: req.method,
                    Host: req.headers.host,
                    Agent: req.headers['user-agent']
                };
                const fileData = JSON.stringify(requestData, null, 2);
                fs.writeFile(resourcePath, fileData, 'utf8', (err) => {
                    if (!err) {
                        res.writeHead(201, { 'Content-Type': 'text/plain' });
                        res.end(`File '${requestURL.pathname}' created successfully`);
                    } else {
                        handleError(res, err);
                    }
                });
            }
        } else {
            // Other errors (e.g., permission issues)
            handleError(res, err);
        }
    });
});

const handleError = (res, err) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
};

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});