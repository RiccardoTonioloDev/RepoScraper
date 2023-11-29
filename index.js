import express from 'express';
import cors from 'cors';
import axios from 'axios';
import 'dotenv/config';

const owner = 'SWATEngineering'; // Sostituisci con il tuo nome utente
const repo = 'SWATEngineering.github.io'; // Sostituisci con il nome della tua repository
const branch = 'main'; // Sostituisci con il nome del branch
const REPO_TOKEN = process.env.REPO_TOKEN;

const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`;

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
const port = 3000;

app.use(cors());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.get('/DocumentsTree', async (req, res) => {
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
                    item.name == 'style.css'
                )
            ) {
                return true;
            }
            return false;
        });
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(result, null, 4));
    } catch (error) {
        console.error('Errore nella richiesta API:', error);
    }
});

app.listen(port);
