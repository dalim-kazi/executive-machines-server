const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
const stripe = require("stripe")(process.env.DB_PAYMENT_KEY);
const port =process.env.PORT || 5000
app.use(cors())
app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello World!')
})

const verifyJwt = (req,res,next) => {
  const authorization = req.headers.authorization 
  if (!authorization) {
    return res.this.status(401).send({error:true ,massage:'unAuthorization'})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.DB_JWT_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(403).send({error:true ,massage:"unAuthorization"})
    }
    req.decoded = decoded 
    next()
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.s0tuw8w.mongodb.net/?retryWrites=true&w=majority`;
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
    await client.db("admin").command({ ping: 1 });
    const productCollection = client.db('executiveMachines').collection('products')
    const usersCollection = client.db('executiveMachines').collection('users')
    const bookingCollection = client.db('executiveMachines').collection('booking')
    const reviewCollection = client.db('executiveMachines').collection('review')
    const paymentCollection = client.db('executiveMachines').collection('payment')
    // post jwt token 
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.DB_JWT_TOKEN, { expiresIn: '1d' })
      res.send({ token })
    })
 
    //  admin verify
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      if (user?.role !== 'admin') {
        return res.status(401).send({ error: true, massage: "unAuthorization" })
      }
      next()
    }


    // products
    app.get('/products', async (req, res) => {
      const query = {}
      const result = await productCollection.find(query).toArray()
      res.send(result)
    })

    //  users
    app.post('/users', async (req, res) => {
      const query = req.body
      const result = await usersCollection.insertOne(query)
      res.send(result)
    })
    //  admin user
    app.get('/manageUser', verifyJwt, verifyAdmin, async (req, res) => {
      const query = {}
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })
    app.patch('/users/:id', verifyJwt, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc)
      res.send(result)
    })
 
    app.get('/users/admin/:email', verifyJwt, async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const result = await usersCollection.findOne(query)
      res.send(result)
    })
     
    app.delete('/users/:id', verifyJwt, verifyAdmin, async (req, res) => {
      const id = req.params.id 
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })
    // booking 
    app.get('/reservation/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await productCollection.findOne(query)
      res.send(result)
    })
    app.post('/booking', verifyJwt, async (req, res) => {
      const booking = req.body 
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })
   
    app.delete('/booking/:id', verifyJwt, async (req, res) => {
      const id = req.params.id 
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
    })
    
    app.get('/booking/user', verifyJwt, async (req, res) => {
      const email = req.query.email 
      if (!email) {
        return res.send([])
      }
      const decodedEmail =req.decoded.email
      if (email !== decodedEmail) {
        res.status(401).send({error:true,massage:'unAuthorization'})
      }
      const query = { email: email }
      const result = await bookingCollection.find(query).toArray()
      res.send(result)
    })
    

    app.get('/Booking/admin', verifyJwt, verifyAdmin, async (req, res) => {
      const query = {}
      const result = await bookingCollection.find(query).toArray()
      res.send(result)
   })

    app.get('/booking/:id', async (req, res) => {
      const id = req.params.id 
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.findOne(query)
      res.send(result)
    })
    app.patch('/booking/:id', verifyJwt, async (req, res) => {
      const id = req.params.id 
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          payment: 'complete'
        },
      };
      const result = await bookingCollection.updateOne(query, updateDoc)
      res.send(result)
    })
    // review

    app.post('/review', verifyJwt, async (req, res) => {
      const review = req.body 
      const result = await reviewCollection.insertOne(review)
      res.send(result)
    })
    app.get('/review', async (req, res) => {
      const query = {}
      const result = await reviewCollection.find(query).toArray()
      res.send(result)
    })
  
    app.get('/review/user/:email', verifyJwt, async (req, res) => {
      const email = req.params.email 
      const query = { email: email }
      const result = await reviewCollection.find(query).toArray()
      res.send(result)
  })

    //  payment 
    app.post('/payment', verifyJwt, async (req, res) => {
      const paymentDetails = req.body 
      const result = await paymentCollection.insertOne(paymentDetails)
      res.send(result)
    })
     
    app.get('/paymentUser/:email', verifyJwt, async (req, res) => {
      const email = req.params.email 
      const query = { email: email }
      const result = await paymentCollection.find(query) .toArray()
      res.send(result)
    })


    app.get('/admin/payment', verifyJwt, verifyAdmin, async (req, res) => {
      const query = {}
      const result = await paymentCollection.find(query).toArray()
      res.send(result)
    })
    

    // payment api 
    app.post('/create-payment-intent', verifyJwt, async (req, res) => {
      const { price } = req.body 
      const total = (price * 100)
      const paymentIntent = await stripe.paymentIntents.create({
        amount:total,
        currency: "usd",
        payment_method_types: [
          "card"
        ],
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
     })

    app.get('/admin-state', verifyJwt, verifyAdmin, async (req, res) => {
      const query ={}
      const user = await usersCollection.estimatedDocumentCount()
      const booking = await bookingCollection.estimatedDocumentCount()
      const totalProduct = await productCollection.estimatedDocumentCount()
      const totalReview = await reviewCollection.estimatedDocumentCount()
      const payment = await paymentCollection.find(query).toArray()
      const totalPayment = payment?.reduce((sum, currentValue) => currentValue.price + sum,0)
      res.send({
        user,booking,totalProduct,totalPayment,totalReview
      })
   })
    
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  
  finally {
     
     
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})