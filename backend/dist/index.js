"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const events_1 = __importDefault(require("./routes/events"));
const photos_1 = __importDefault(require("./routes/photos"));
const places_1 = __importDefault(require("./routes/places"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/photo-library';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Routes
app.use('/api/events', events_1.default);
app.use('/api/photos', photos_1.default);
app.use('/api/places', places_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Photo Library API is running' });
});
// Connect to MongoDB
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    console.log('Connected to MongoDB');
    // Start server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`API available at http://localhost:${PORT}/api`);
    });
})
    .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await mongoose_1.default.connection.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await mongoose_1.default.connection.close();
    process.exit(0);
});
//# sourceMappingURL=index.js.map