//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
const _ =require("lodash");
const request=require ("request");
const app = express();
//authentication
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const homeStartingContent = "Ambition is a lust that is never quenched, but grows more inflamed and madder by enjoyment.You are always crazy when you are doing something that no one else is doing! Click To Tweet.\nNothing in Life is easy & what's easy is not worth it anyway! Click To Tweet.A 'good present' is the key to A 'Good future'. Click To Tweet.Be a tree. Have the strength to turn bad into good! It's tough but not impossible!";

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret: "Our little secret. ",
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
//to use passport also for session we have done this
app.use(passport.session());
const uri=process.env.MONGOCLOUD;
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
//mongoose.connect("mongodb://localhost:27017/bloggerDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const blogSchema={
  title:String,
  content:String
};
const individualSchema={
  E_mail:String,
  info:blogSchema
};
const userSchema=new mongoose.Schema({
  username:String,
  password:String
});
userSchema.plugin(passportLocalMongoose);
// individualSchema.plugin(passportLocalMongoose);
// blogSchema.plugin(passportLocalMongoose);
const Post=mongoose.model("Post",blogSchema);
const Indiv=mongoose.model("Individual",individualSchema);
const User=new mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
  //console.log(posts);
app.get("/",function(req,res){
  res.render("signup");
});
app.post("/",function(req,res){
  User.register({username:req.body.username},req.body.password, function(err, user) {
    if (err) {
    console.log(err);
    //res.redirect("/redirect");
    }
    else {
      passport.authenticate("local")(req,res,function(){
          res.redirect("/login");
          console.log("Successully registered");
      });
    }
  });
});
app.get("/login",function(req,res){
  res.render("login");
});
app.post("/login",function(req,res){
  const user=new User({
    username:req.body.username,
    password:req.body.password
  });

    console.log(req.body.username);
    req.login(user, function(err) {
        if (err) {
           console.log(err);
           res.redirect("/failure");
         }
        else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/home");
        });
      }
    });
});
app.post ("/success",function(req,res){
  res.redirect("/home");
});
app.get ("/failure",function(req,res){
  res.render("failure");
  //res.redirect("/login");
});
app.post("/failure",function(req,res){
  res.redirect("/login");
});
var requested_id="";
app.post("/delete",function(req,res){
  //const id=req.body.deleteid;
  //console.log("key");
  console.log(requested_id);
  Indiv.findByIdAndRemove(requested_id, function(err){
    if (!err) {
      //console.log("Successfully deleted checked item.");
      res.redirect("/home");
    }
  });
});
app.get("/home",function(req,res){
  if(req.isAuthenticated()){
    Indiv.find({E_mail:req.user.username},function(err,found){
        res.render('home',{para:homeStartingContent,posthome:found,Email:req.user.username});
    });
  }
  else{
    res.redirect("/login");
  }
});
app.get("/compose",function(req,res){
  res.render("compose",{Email:req.user.username});
});
app.get("/update",function(req,res){
  Indiv.findOne({_id:requested_id},function(err,posts){
      res.render("update",{Email:req.user.username,posttitle:posts.info.title,postcontent:posts.info.content});
    });
});
app.post("/update",function(req,res){
  const post=new Post({
    title:req.body.posttitle,
    content:req.body.postbody
  });
  Indiv.updateOne({_id:requested_id},{info:post},function(err){
  //  if (!err){
      res.redirect("/home");
    //  console.log("Sucessfully updated");
  //  }
  });
});
app.post("/compose",function(req,res){
  const post=new Post({
    title:req.body.posttitle,
    content:req.body.postbody
  });
  //console.log(post);
  const indiv=new Indiv({
    E_mail:req.user.username,
    info:post
  });
  indiv.save(function(err){
    if (err){
      console.log(err);
    }
    else{
      //console.log("Sucessfully composed");
        res.redirect("/home");
    }
  });
});
app.get('/posts/:postId', function (req, res) {
  requested_id=req.params.postId;
  Indiv.findOne({_id:requested_id},function(err,posts){
      res.render("post",{posttitle:posts.info.title,postcontent:posts.info.content});
  });
  //console.log(req.params.postName);
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
console.log(port);
// app.listen(3000, function() {
//   console.log("Server started successfully");
// });
