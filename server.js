const express = require('express');
const app = express();
app.use(express.static('static'));
app.use(express.json({limit: '50mb'}));
const port = 4000;
app.listen(port, () => {
  console.log(`listening at port ${port}`);
});

var mongodb = require('mongodb');
//console.log(mongodb);

//var url = "mongodb://localhost:27017/mongoLPHD";
var url = "mongodb://0.0.0.0:27017/"
var db_name = 'LPHD'
let db
const MC = new mongodb.MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});

//console.log(MC);
async function connectDB() {
  await MC.connect();
  db = await MC.db(db_name);
  console.log('Connected to db');
}
async function closeDB() {
  await MC.close();
  console.log('Disconnected from db server.');
}


app.post('/varlist', async(request,response) => {
  var searched_mode = request.body.searched_mode;
  var inputrgx = ".*"+request.body.input+".*";
  const data = [];
  console.log(request.body);
  await connectDB();
  if (searched_mode=="vartype"){
    const vars_id = await db.collection("variant_type").find({ _id: { $regex: inputrgx} });
    const results = await vars_id.toArray();
    results.forEach(vtype => {
      data.push(vtype._id);
    });
    response.json(data);
  } /*else if (searched_mode=="varchange"){

  }*/
  
  
  
  
  //console.log(data);
  //response.json(data);
  await closeDB();
});

app.get('/centuries', async(request,response) => {
  await connectDB();
  const data = [];
  const centuries = await db.collection("century").find().sort("value");
  const results = await centuries.toArray();
  results.forEach(cdata => {
    century_val = cdata.value;
    data.push(century_val);
  });
  //console.log(data);
  response.json(data);
  await closeDB();
});
app.post('/papyri', async(request,response) => {

  //console.log(request.body);
  var century = request.body.century;
  console.log(century);
  await connectDB();
  if (century== 'all'){
    //console.log('papyri all centuries');
    const data = [];
    const map_points = await db.collection("map_point").find();

    const results = await map_points.toArray();
    results.forEach(point=> {
      var ptid = point._id;
      console.log(ptid);
      var lon = point.lon;
      var lat = point.lat;
      var names = point.names;
      var pap_byCent = point.papyri_ids_byCentury;
      //console.log(pap_byCent);
      var sum_pap = 0;
      Object.keys(pap_byCent).forEach(c=>{
        var to_add = pap_byCent[c].length;
        if (typeof to_add != "number") {
          console.log(pap_byCent[c]);
          console.log(to_add);
        }
        
        sum_pap+=to_add;
      });
      data.push({'ptid': ptid, 'lon': lon, 'lat': lat, 'names': names, 'total': sum_pap});
      //console.log(sum_pap);
    });
    response.json(data);

  } else {
    
    console.log(`papyri in century ${century}`);
    
    const data = [];
    const map_points = await db.collection("map_point").find();
    
    const results = await map_points.toArray();
    results.forEach(point=> {
      var ptid = point._id;
      var lon = point.lon;
      var lat = point.lat;
      var names = point.names;
      var pap_byCent = point.papyri_ids_byCentury;
      //console.log(pap_byCent);
      
      if (pap_byCent.hasOwnProperty(century.toString())){
        var sum_pap = pap_byCent[century.toString()].length;
        data.push({'ptid': ptid, 'lon': lon, 'lat': lat, 'names':names, 'total': sum_pap});

      }

      //console.log(sum_pap);
    });
    console.log(data);
    response.json(data);
  }
  
  
  await closeDB();
});

async function GetChoicesVCHid(varchid){
  console.log()
  const var_change = await db.collection("variant_change").findOne({ _id: varchid});
  console.log(var_change);
  return var_change

}
app.post('/variant_type', async(request,response) => {
  var vartype_id = request.body._id;
  var century = request.body.century;
  await connectDB();
  data = [];
  
  const var_type = await db.collection("variant_type").findOne({ _id: vartype_id}); 
  var varchange_ids = var_type.variant_changes;
  console.log(varchange_ids);
  var var_changes = await db.collection("variant_change").find({_id: {$in: varchange_ids }});
  var varchanges = await var_changes.toArray();
  var choice_ids = [];
  varchanges.forEach(vch=>{
    Array.from(vch.choices).forEach(choice=>{
      choice_ids.push(choice.choice_id);
    });
    
  });
  
  var choice_items = await db.collection("choice").find({_id: {$in: choice_ids }});
  var choices = await choice_items.toArray();
  var papyrus_ids = [];
  var dic_pap_choice = {};
  choices.forEach(ch=>{
    if (!papyrus_ids.includes(ch.papyrus_id)){
      papyrus_ids.push(ch.papyrus_id);
      
    }
    if (dic_pap_choice.hasOwnProperty(ch.papyrus_id)){
      dic_pap_choice[ch.papyrus_id].push(ch._id);
    } else {
      dic_pap_choice[ch.papyrus_id] = [ch._id];
    }
    
  });
  
  var papyrus_items = await db.collection("papyrus").find({_id: {$in: papyrus_ids }});
  var papyri = await papyrus_items.toArray();
  var map_points_ids = [];
  var dic_mp_pap = {};
  
  papyri.forEach(pap=>{
    if (pap.place_coord){
      /*console.log(pap.place_coord);*/
      var split = pap.place_coord.toString().split(',');
      var mappoint_K = `['${split[0]}', '${split[1]}']`;
      //var mappoint_K = `['${split[0]}', '${split[1]}']`;
      console.log([mappoint_K]);
      if (!map_points_ids.includes(mappoint_K)){
        map_points_ids.push(mappoint_K);
      }
      if (dic_mp_pap.hasOwnProperty(mappoint_K)){
        dic_mp_pap[mappoint_K].push(pap._id);
      } else {
        dic_mp_pap[mappoint_K] = [pap._id];
      }
    }  
  });
  var mappoints_items = await db.collection("map_point").find({_id: {$in: map_points_ids }});
  //console.log(mappoints_items);
  var map_points = await mappoints_items.toArray();
  map_points.forEach(mp=>{
    var pap_list = dic_mp_pap[mp._id];
    var total_choices = 0;
    Array.from(pap_list).forEach(papid=>{
      if (century== 'all'){
        var choice_list = dic_pap_choice[papid];
        total_choices+=choice_list.length;
      } else {
        var pap_byCent = mp.papyri_ids_byCentury;
        if (pap_byCent.hasOwnProperty(century) && pap_byCent[century].includes(papid)){
          var choice_list = dic_pap_choice[papid];
          total_choices+=choice_list.length;
        }
      }
        //console.log(`${vartype_id} for all_centuries` );
      
    });
    if (total_choices>0){
      var point = data.push({'ptid': mp._id, 'lon': mp.lon, 'lat': mp.lat, 'names':mp.names, 'total': total_choices});
    }
    
  });
  response.json(data);
    
   
    //console.log(vchids);
    
    

    
   /*else{

  }*/
  
  //const results = await vars_id.toArray();
  //console.log(request.body);
  /*var century = request.body.century;
  console.log(century);
  await connectDB();
  if (century== 'all'){
    //console.log('papyri all centuries');
    const data = [];
    const map_points = await db.collection("map_point").find();

    const results = await map_points.toArray();
    results.forEach(point=> {
      var ptid = point._id;
      var lon = point.lon;
      var lat = point.lat;
      var names = point.names;
      var pap_byCent = point.papyri_ids_byCentury;
      //console.log(pap_byCent);
      var sum_pap = 0;
      Object.keys(pap_byCent).forEach(c=>{
        var to_add = pap_byCent[c].length;
        if (typeof to_add != "number") {
          console.log(pap_byCent[c]);
          console.log(to_add);
        }
        
        sum_pap+=to_add;
      });
      data.push({'ptid': ptid, 'lon': lon, 'lat': lat, 'names': names, 'total': sum_pap});
      //console.log(sum_pap);
    });
    response.json(data);

  } else {
    
    console.log(`papyri in century ${century}`);
    
    const data = [];
    const map_points = await db.collection("map_point").find();
    
    const results = await map_points.toArray();
    results.forEach(point=> {
      var ptid = point._id;
      var lon = point.lon;
      var lat = point.lat;
      var names = point.names;
      var pap_byCent = point.papyri_ids_byCentury;
      //console.log(pap_byCent);
      
      if (pap_byCent.hasOwnProperty(century.toString())){
        var sum_pap = pap_byCent[century.toString()].length;
        data.push({'ptid': ptid, 'lon': lon, 'lat': lat, 'names':names, 'total': sum_pap});

      }

      //console.log(sum_pap);
    });
    console.log(data);
    response.json(data);
  }*/
  
  
  await closeDB();
});

