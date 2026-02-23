require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Atlas connection string
// You'll need to replace this with your actual MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rhythms-dance';
let db;
let availabilityCollection;

// Connect to MongoDB
async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        db = client.db('rhythms-dance');
        availabilityCollection = db.collection('availability');
        
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // For local development, we'll continue without MongoDB
        console.log('Running without database - data will be in-memory only');
    }
}

// In-memory storage fallback
let inMemoryStorage = [];

// API Routes

// Get all availability submissions
app.get('/api/availability', async (req, res) => {
    try {
        if (availabilityCollection) {
            const data = await availabilityCollection.find({}).toArray();
            res.json(data);
        } else {
            res.json(inMemoryStorage);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get availability by ID
app.get('/api/availability/:id', async (req, res) => {
    try {
        if (availabilityCollection) {
            const data = await availabilityCollection.findOne({ _id: new ObjectId(req.params.id) });
            res.json(data);
        } else {
            const data = inMemoryStorage.find(item => item._id === req.params.id);
            res.json(data);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new availability submission
app.post('/api/availability', async (req, res) => {
    try {
        const submission = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        if (availabilityCollection) {
            const result = await availabilityCollection.insertOne(submission);
            res.json({ success: true, id: result.insertedId });
        } else {
            submission._id = Date.now().toString();
            inMemoryStorage.push(submission);
            res.json({ success: true, id: submission._id });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update availability submission
app.put('/api/availability/:id', async (req, res) => {
    try {
        const update = {
            ...req.body,
            updatedAt: new Date()
        };
        
        if (availabilityCollection) {
            await availabilityCollection.updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: update }
            );
            res.json({ success: true });
        } else {
            const index = inMemoryStorage.findIndex(item => item._id === req.params.id);
            if (index !== -1) {
                inMemoryStorage[index] = { ...inMemoryStorage[index], ...update };
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Not found' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete availability submission
app.delete('/api/availability/:id', async (req, res) => {
    try {
        if (availabilityCollection) {
            await availabilityCollection.deleteOne({ _id: new ObjectId(req.params.id) });
            res.json({ success: true });
        } else {
            inMemoryStorage = inMemoryStorage.filter(item => item._id !== req.params.id);
            res.json({ success: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get time slot configuration
app.get('/api/config/timeslots', async (req, res) => {
    try {
        if (db) {
            const config = await db.collection('config').findOne({ type: 'timeslots' });
            res.json(config || getDefaultTimeSlots());
        } else {
            res.json(getDefaultTimeSlots());
        }
    } catch (error) {
        res.json(getDefaultTimeSlots());
    }
});

// Update time slot configuration
app.put('/api/config/timeslots', async (req, res) => {
    try {
        if (db) {
            await db.collection('config').updateOne(
                { type: 'timeslots' },
                { $set: { ...req.body, updatedAt: new Date() } },
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function getDefaultTimeSlots() {
    return {
        weekday: { start: '18:00', end: '20:00', label: '6-8 PM' },
        weekend: [
            { start: '10:00', end: '12:00', label: '10AM-12PM' },
            { start: '12:00', end: '16:00', label: '12PM-4PM' },
            { start: '16:00', end: '18:00', label: '4PM-6PM' }
        ]
    };
}

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'parent-availability.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});