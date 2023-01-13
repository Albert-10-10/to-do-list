const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const app = express();
const _ = require("lodash");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

require('dotenv').config()
const srvr = process.env.N1_KEY;
const srvrCred = process.env.N1_SECRET;
const mongoDbCloud = "mongodb+srv://" + srvr + ":" + srvrCred + "@cluster0.pbgedoy.mongodb.net/todolistDB";

mongoose.set("strictQuery", false);
mongoose.connect(mongoDbCloud);

const itemsSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item", itemsSchema);


//default items 
const item1 = new Item ({
  name: "Welcome to My Todolist!"
});
const item2 = new Item ({
  name: "Click the ➕ button to add a new item"
});
const item3 = new Item ({
  name: "👈 Click this to delete an item"
});

const defaultItems = [item1, item2, item3];

//custom list name
const listSchema =  {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


//root
app.get("/", function(req, res) {

// const day = date.getDate();

  Item.find({}, (error, foundItems)=>{
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, (error)=>{
        if (error){
          console.log(error)
        } else {
          console.log("Default items inserted to DB");
        }
      });

      res.redirect("/");

    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

//add item
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (error, foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
      //goes to custom list
    });
  }

  
  
});

//delete checkbox
app.post("/delete", (req, res)=>{
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  // if(listName === "Today"){
  //   Item.findByIdAndRemove(checkItemId, (error)=>{
  //     if(!error){
  //       res.redirect("/");
  //       console.log("Trueee");
  //     }
  //   });
  // }

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemId, (error)=>{
      if(!error){
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {
      $pull: {items: {_id: checkItemId}}}, (error, foundList)=>{
        if(!error){
          res.redirect("/" + listName);
      }
    });
  }

});


//custom link
app.get("/:customListName", (req, res)=>{
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (error, foundList)=>{
    if(!error){
      if(!foundList){
        //Create new list 
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        console.log("New list added")
        res.redirect("/" + customListName);

      } else {
        //Display existing list 
        console.log("Alreading existing");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started");
});
