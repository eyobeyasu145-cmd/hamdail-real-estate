import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Stub routes to prevent crashes
app.use('/api/auth', (req, res) => res.json({ message: 'Auth stub' }));
app.use('/api/properties', (req, res) => res.json({ message: 'Properties stub', properties: [] }));
app.use('/api/chat', (req, res) => res.json({ message: 'Chat stub' }));
app.use('/api/contact', (req, res) => res.json({ message: 'Contact stub' }));

app.get('/', (req, res) => {
  res.send('Real Estate API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
