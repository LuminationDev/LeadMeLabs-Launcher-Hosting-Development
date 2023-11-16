// Dependencies
// =============================================================
const compression = require('compression');
const express = require('express');
const rateLimit = require('express-rate-limit');

// Set up the Express App
// =============================================================
const app = express();
const port = process.env.PORT || 8082;

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // maximum requests from IP address
    standardHeaders: true,
    legacyHeaders: false
});

// Using compression npm to improve performance
app.use(compression());

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(limiter);

app.disable('x-powered-by')

// Routes
// =============================================================
require('./routes')(app);
app.use('/static/electron-launcher', express.static('applications/electron-launcher'))

app.listen(port, () => console.log(`Listening on port ${port}!`));
