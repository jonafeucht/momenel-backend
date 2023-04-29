// create express app 
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());
// create server 
app.listen(3000, () => {
    console.log('Server started on port 3000');
})


