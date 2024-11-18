const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const {createClient}= require("@supabase/supabase-js")
const path = require('path');
const cors = require('cors');
require("dotenv").config();
const port = 4000;

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected...');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
    });

// API creation
app.get('/', (req, res) => {
    res.send('Express app is running');
});

const storage = multer.memoryStorage();

const upload = multer({ storage: storage })
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl,supabaseKey)

// Creating upload endpoint for images
app.use('/images', express.static('upload/images'))
app.post('/upload', upload.single('product'), async(req, res) => {
    
    const file = req.file;
    if(!file){
        return res.status(404).send({success:0,error:"no file uploaded"})
    }
    const fileName = `products/${Date.now()}_${file.originalname}`
    const {data,error} = await supabase.storage.from("product-images").upload(fileName,file.buffer,{
        contentType:file.mimetype,
        cacheControl:"3600"
    })

    if(error){
        console.error(error);
        return res.status(500).send({success:0,error:"failed to upload image"})
    }

    const{data:publicData} = supabase.storage.from("product-images").getPublicUrl(fileName)


    res.json({
        success: 1,
        image_url: publicData.publicUrl,
    })
})

// Schema for creating products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    new_price: {
        type: Number,
        required: true
    },
    old_price: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    available: {
        type: Boolean,
        default: true
    }
})

app.post("/addproduct", async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    } else {
        id = 1;
    }

    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price
    })
    await product.save();
    res.json({
        success: true,
        name: req.body.name
    })
})

// Creating API for deleting products
app.post("/removeproduct", async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({
        success: true
    })
})

// Creating API for getting all products
app.get("/allproducts", async (req, res) => {
    let products = await Product.find({});
    res.send(products)
})

// Schema creating for user model
const User = mongoose.model('User', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    cartData: {
        type: Object
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

// Creating endpoint for registering the user
app.post('/signup', async (req, res) => {
    console.log('Signup request received:', req.body);
    let check = await User.findOne({ email: req.body.email })
    if (check) {
        return res.status(400).json({ success: false, errors: 'Existing user found with same email address' })
    }
    let cart = {}
    for (let i = 0; i < 300; i++) {
        cart[i] = 0
    }
    const user = new User({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart
    })
    await user.save();

    const data = {
        user: {
            id: user.id
        }
    }
    const token = jwt.sign(data, 'secret_ecom')
    res.json({ success: true, token })
})

// Creating endpoint for user login
app.post('/login', async (req, res) => {
    let user = await User.findOne({ email: req.body.email })
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, errors: "wrong password" })
        }
    }
    else {
        res.json({ success: false, errors: "wrong email" })
    }
})

//creating endpoint for new collection data
app.get('/newcollections',async(req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("new collection fecthed");
    res.send(newcollection);
})

//creating end point for popular in women secton
app.get('/popularinwomen',async(req,res)=>{
    let products= await Product.find({category:"women"});
    let popular_in_women =products.slice(0,4);
    console.log("popular in women fetched")
    res.send(popular_in_women)
})

// Creating endpoint for related products data
app.get('/relatedproducts', async (req, res) => {
    let products = await Product.find({});
    let relatedproducts = products.slice(0, 4);
    console.log("RelatedProducts Fetched");
    res.send(relatedproducts);
})

//creating middleware to fetch user
const fetchUser=async(req,res,next)=>{
    const token =req.header('auth-token')
    if (!token) {
        res.status(401).send({errors:"please authenticate using valid token"})
    }
    else{
        try {
            const data= jwt.verify(token,'secret_ecom');
            req.user=data.user;
            next();

        } catch (error) {
            res.status(401).send({errors:"please authenticate using a valid token"})
        }
    }
}

//creating products for adding in cart data
app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log("added",req.body.itemId)
    console.log(req.body.itemId)
    let userData= await User.findOne({_id:req.user.id})
    userData.cartData[req.body.itemId]+=1;
    await User.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})
    res.json("Added")
})

//creating endpoint to remove product from cart data
app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log("removed",req.body.itemId)
    let userData= await User.findOne({_id:req.user.id})
    if (userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId]-=1;
    await User.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})
    res.json("Removed")
})

//creating endpoint to get cart data
app.post('/getcart',fetchUser,async(req,res)=>{
    console.log("Getcart")
    let userData=await User.findOne({_id:req.user.id});
    res.json(userData.cartData)
})

app.listen(port, (error) => {
    if (!error) {
        console.log(`Server running on port ${port}`);
    } else {
        console.log(`Error: ` + error);
    }
});