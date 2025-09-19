import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/directions?origin=lat,lng&destination=lat,lng
// Optional: mode, traffic_model, alternatives
app.get('/api/directions', async (req, res) => {
  try {
    const { origin, destination, mode = 'driving', traffic_model = 'best_guess', alternatives = 'false' } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination are required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing GOOGLE_MAPS_API_KEY' });
    }

    const params = new URLSearchParams({
      origin,
      destination,
      mode,
      key: apiKey,
      traffic_model: String(traffic_model),
      departure_time: 'now',
      alternatives: String(alternatives)
    });

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: 'Failed to fetch directions', details: err.response?.data || err.message });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});

