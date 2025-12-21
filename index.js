const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const verifyFBToken = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) return res.status(401).send("Unauthorize Access");

    try {
        const idToken = token.split(' ')[1]
        const decoded = await admin.auth().verifyIdToken(idToken)
        console.log(decoded);
        req.decoded_email = decoded.email;
        next()

    }
    catch (error) {
        return res.status(401).send("Unauthorize Access");
    }
}


const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.hgbitkj.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        // Send a ping to confirm a successful connection


        const database = client.db('Life_Drop_db');
        const usersCollection = database.collection('users');
        const donationRequestsCollection = database.collection('donation-requests')


        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            userInfo.role = 'donor';
            userInfo.status = 'active'
            userInfo.createdAt = new Date();
            const result = await usersCollection.insertOne(userInfo);
            res.send(result)
        });

        app.get('/users/:email', async (req, res) => {
            const { email } = req.params;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            res.send(result)
        })

        app.post('/donation-request', verifyFBToken, async (req, res) => {
            const requestData = req.body;
            const result = await donationRequestsCollection.insertOne(requestData);
            res.send(result)
        })

        // app.get('/', (req, res) => {
        //     res.send('server is running')
        // });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log('server is running on port', port)
})