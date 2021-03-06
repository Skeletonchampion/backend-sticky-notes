const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const express = require("express");
const mongoose = require("mongoose");
const expressSession = require("express-session");
const MongoStore = require('connect-mongo');
const cors = require("cors");
const bcrypt = require("bcrypt");

const User = require("./models/User.js");
const Note = require("./models/Note.js");

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('trust proxy', 1);
app.use(expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // must be 'none' to enable cross-site delivery
        secure: process.env.NODE_ENV === "production", // must be true if sameSite='none'
    },
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE,
    }),
}));

const corsConfig = {
    origin: true,
    credentials: true,
};
// app.use(cors({
//     origin: true,
//     credentials: true,
//     })
// );
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));

mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true });

app.get("/user", (req, res) => {
    res.json({userId: req.session.userId, username: req.session.username});
});

app.get("/notes", async (req, res) => {
    const notes = await Note.find({userId: req.session.userId});
    res.json(notes);
});

app.delete("/notes/note", async (req, res) => {
    try {
        const deletedNote = await Note.deleteOne({userId: req.session.userId, noteId: req.body.noteId});
        res.json({message: "Sucessfully deleted"});
    }
    catch(err) {
        console.error(`error: ${error}`)
    }
});

app.post("/login", async (req, res) => {
    try {
        const users = await User.find();
    
        user = users.find(user => user.username === req.body.username);

        if(user) {
            bcrypt.compare(req.body.password, user.password, (err, same) => {
                if(same) {
                    req.session.userId = user._id;
                    req.session.username = user.username;
                    res.json({userId: req.session.userId});
                }
                else {
                    res.json({message: "Wrong password!"});
                }
            });
        }
        else {
            await User.create(req.body);
            res.json({message: "You have registered new account! Please login again!"});
        }
    }
    catch(err) {
        console.error(`error: ${err}`);
    }
});

app.delete("/logout", (req, res) => {
    if(req.session.userId) {
        req.session.destroy();
        res.json({message: "Sucessfully Logout"});
    }
    else {
        res.json({message: "Failed Logout"});
    }
});

app.post("/notes/new", async (req, res) => {
    try {
        const note = await new Note({
            userId: req.session.userId,
            title: req.body.title,
            body: req.body.body,
            date: req.body.date,
            noteId: req.body.noteId,
            ts: req.body.ts,
        });
        await note.save();
        res.json(note);
    }
    catch(err) {
        console.error(`error: ${err}`);
    }
});

app.patch("/notes/note", async (req, res) => {
    try {
        await Note.updateOne({noteId: req.body.noteId}, {$set: {bg: req.body.color}});
        res.json(req.body.color);
    }
    catch(err) {
        console.error(`error: ${err}`);
    }
});

app.listen(process.env.PORT || 5000);