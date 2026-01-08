//NEW

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware per JSON
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(express.json());


// Funzione per leggere i dati dal file JSON
function readTransportsFromFile() {
  try {
    const filePath = path.join("./data", 'meanOfTransports.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading meanOfTransports.json:', error.message);
    return [];
  }
}

// Carica i dati all'avvio del server
let transports = readTransportsFromFile();

// Endpoint per ottenere tutti i mezzi di trasporto
app.get('/api/transports', (req, res) => {
  res.json(transports);
});

// Endpoint per ottenere un mezzo specifico per ID
app.get('/api/transports/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const transport = transports.find(t => t.id === id);
  
  if (transport) {
    res.json(transport);
  } else {
    res.status(404).json({ error: 'Transport not found' });
  }
});

// Funzione per leggere i viaggi dal file JSON
function readTripsFromFile() {
  try {
    const filePath = path.join("./data", 'trips.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading trips.json:', error.message);
    return [];
  }
}

// Endpoint per ottenere i viaggi dal file JSON
app.get('/api/trips', (req, res) => {
  const trips = readTripsFromFile();
  
  if (trips.length === 0) {
    return res.status(404).json({ error: 'No trips found. Make sure trips.json exists.' });
  }
  
  res.json(trips);
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log(`  GET http://localhost:${PORT}/api/transports - Get all transports`);
  console.log(`  GET http://localhost:${PORT}/api/transports/:id - Get transport by ID`);
  console.log(`  GET http://localhost:${PORT}/api/trips - Get all trips`);
  console.log('');
});