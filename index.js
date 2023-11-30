import express from 'express';
import cors from 'cors';
import axios from 'axios';
import 'dotenv/config';

const owner = 'SWATEngineering'; // Sostituisci con il tuo nome utente
const repo = 'SWATEngineering.github.io'; // Sostituisci con il nome della tua repository
const branch = 'main'; // Sostituisci con il nome del branch
const REPO_TOKEN = process.env.REPO_TOKEN;

let CONTENT = '';

const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`;

async function repo_explorer() {
    console.log('#server - UPDATING CONTENT');
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${REPO_TOKEN}`,
            },
        });
        const treeData = response.data;
        const result = (await JSONizeTree(treeData)).filter((item) => {
            if (
                !(
                    item.name == 'assets' ||
                    item.name == 'index.html' ||
                    item.name == 'script.js' ||
                    item.name == 'automate-cards.js' ||
                    item.name == '.gitignore' ||
                    item.name == 'style.css'
                )
            ) {
                return true;
            }
            return false;
        });
        CONTENT = result;
    } catch (error) {
        console.error('Errore nella richiesta API:', error);
    }
    console.log('#server - CONTENT UPDATED');
}

await repo_explorer();
setInterval(repo_explorer, 900000);

async function JSONizeTree(treeData) {
    const results = [];
    for (const item of treeData) {
        const entity = {
            isDir: 0,
            name: item.name,
            url: item.html_url,
        };

        if (item.type === 'dir') {
            entity.isDir = 1;
            try {
                const response = await axios.get(item.url, {
                    headers: {
                        Authorization: `Bearer ${REPO_TOKEN}`,
                    },
                });
                const treeData = response.data;
                entity.dir = await JSONizeTree(treeData);
            } catch (error) {
                console.error('Errore nella richiesta API:', error);
            }
        }
        results.push(entity);
    }
    return results;
}

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.get('/DocumentsTree', async (req, res) => {
    console.log('#server - REQUEST RECEIVED');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(CONTENT, null, 4));
});

app.listen(port);
