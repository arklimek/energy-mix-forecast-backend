import express from 'express';
import cors from 'cors';
import { generationMixRouter } from './endpoint-Energy-Mix.js';
import { optimalWindowRouter } from './endpoint-Optimal-Charge-Window.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.use(generationMixRouter);
app.use(optimalWindowRouter);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Express server listening on port: ${PORT}`);
    });
}

export default app;