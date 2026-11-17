const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.get('/vendor/d3.min.js', (_req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules', 'd3', 'dist', 'd3.min.js'));
});

app.get('/app.js', (_req, res) => {
  res.sendFile(path.join(__dirname, 'app.js'));
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname, {
  dotfiles: 'ignore',
  index: 'index.html',
}));

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Maket server listening on http://${HOST}:${PORT}`);
});
