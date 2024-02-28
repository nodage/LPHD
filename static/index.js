const LPHDmap = L.map('LPHDmap').setView([27.17909360340332, 31.181757012104246], 6);
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const tileURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const tiles = L.tileLayer(tileURL, { attribution });
tiles.addTo(LPHDmap);
L.svg().addTo(LPHDmap);

var span1 = document.getElementById('searched_value');
var span_cent = document.getElementById('searched_century');
var span3 = document.getElementById('searched_total');
let searched_mode;
let params;
var dic_searched_mode = {'papyrus': 'papyri/', 'varchange': 'variant_change/', 'vartype': 'variant_type/' }
/*var palette = {0.0: "#9eeff1", 0.1:"#45c7d6", 0.2:"#3c9bb8", 0.3:"#2090f5", 0.4:"#6077d9", 0.5:"#6142c6", 0.6:"#8752c8",0.7:"#af39f5", 0.8: "#db2ccf", 0.9:"#cf1e7b", 1:"#fa0412" }*/

var palette = {0.0: "#a5db4e", 0.1:"#b4d241", 0.2:"#c4c834", 0.3:"#d6bd25", 0.4:"#e8b216", 0.5:"#f9a706", 0.6:"#f98a06",0.7:"#f97006", 0.8: "#f95005", 0.9:"#f92f05", 1:"#fa0704" }
/*var palette = {0.0: "#93f250", 0.1:"#79f26c", 0.2:"#5ff288", 0.3:"#3ef2ac", 0.4:"#7bfbc9", 0.5:"#04f1e9", 0.6:"#07b1c7",0.7:"#048cc2", 0.8: "#1964c4", 0.9:"#4d46cd", 1:"#6904c2" }*/
function d3circles(pointsdata) {
    
    console.log(pointsdata);
    
    
    
    d3.select("#LPHDmap")
        .select("svg")
        .selectAll('*')
        .remove()
    
    
    var all_values = Array();
    var total_data = 0;
    pointsdata.forEach(p=>{
        if (typeof p.total=="number"){
            all_values.push(p.total);
            total_data+=p.total;
        }
        
        //console.log(Math.max(all_values));
    });
    span3.textContent= `${total_data}`;

    //console.log(all_values);
    var max_value = Math.max.apply(null,all_values);
    

    
    
    d3.select("#LPHDmap")
        .select("svg")
        .selectAll("myCircles")
        .data(pointsdata)
        .enter()
        .append("g")
        .append("circle")
            .attr("id", function(d){ return d.ptid})
            .attr("cx", function(d){ return LPHDmap.latLngToLayerPoint([d.lat, d.lon]).x })
            .attr("cy", function(d){ return LPHDmap.latLngToLayerPoint([d.lat, d.lon]).y })
            .attr("r", LPHDmap._zoom/1.5)
            .style("fill", function(d){return palette[Math.round((d.total/max_value)*10)/10]})
            //.style("fill-opacity", function(d){return Math.round((d.total/max_value)*10)/10+0.2})
            .style("cursor", "pointer")
            .attr("stroke", "black")
            .attr("stroke-width", 1);
            
    LPHDmap.on("moveend", update);
    d3.selectAll('circle')
        .attr('pointer-events', "visiblePainted")
        .each(function(d){
            
            d3.select(this)
              .on('mouseenter', (event)=>{
                var sd = d;
                //console.log(sd);
                d3.select(this)
                    .attr("r", 10)
                d3.select("svg")
                  .append("g")
                  .append("text")
                    .attr('x', LPHDmap.latLngToLayerPoint([sd.lat, sd.lon]).x)
                    .attr("y", LPHDmap.latLngToLayerPoint([sd.lat, sd.lon]).y )
                    .text(sd.names[0] + `: ${sd.total}`);
              })
              .on('mouseleave', (event)=>{
                d3.select(this)
                    .attr("r", LPHDmap._zoom/1.5)
                d3.select("svg")
                    .selectAll("text")
                    .remove()
              });
        })
}
function update() {
    d3.selectAll("circle")
        .attr("cx", function(d){ return LPHDmap.latLngToLayerPoint([d.lat, d.lon]).x })
        .attr("cy", function(d){ return LPHDmap.latLngToLayerPoint([d.lat, d.lon]).y })
        .attr("r", function(d){ return LPHDmap._zoom/1.5})
}


    

async function GetResults(searched_mode, params) {
    
    var url_results = dic_searched_mode[searched_mode];
    console.log(`Asking to ${url_results} for ${params}`)
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            },
        body: JSON.stringify(params)
    };
    const response = await fetch(url_results, options);
    var points = await response.json();
    d3circles(points);

    
}
async function ReactiveCenturyBar(id_bar){
    var bar = document.getElementById(id_bar);
    var datalist = document.getElementById("centuries_list");
    //var span_cent = document.getElementById("searched_century");
    bar.addEventListener("change", event=>{
        var bar_val = bar.value;
        Array.from(datalist.getElementsByTagName('option')).forEach((opt) => {
            //console.log(opt.value);
            if (opt.value == bar_val) {
                console.log(opt.text);
                span_cent.textContent = opt.text;
            }   
        });
        if (span_cent.textContent=='all centuries'){
            if (params){
                params['century']= 'all';
            } else{
                params = {'century':'all'};
            }
            
            GetResults(searched_mode,params );
        } else {
            var cent_val = span_cent.textContent.slice(8);
            if (params){
                params['century']= parseInt(cent_val);
            } else {
                params= {'century':parseInt(cent_val)};
            }
            
            GetResults(searched_mode,params );
        }
        //console.log(datalist[bar.value.toString()]);
    });
}
async function MakeCenturyBar () {
    //console.log('coucou!');
    var url_results = "centuries/";
    const response = await fetch(url_results);
    var centuries_list = await response.json();
    //console.log(centuries_list);
    var div_settings = document.getElementById("settings");
    var slide_century = document.createElement("input");
    slide_century.setAttribute("type", "range");
    slide_century.setAttribute("id", "century_select");
    slide_century.setAttribute("min", "0");
    slide_century.setAttribute("max", (centuries_list.length -1).toString());
    slide_century.setAttribute("step", "1");
    slide_century.setAttribute("list","centuries_list");
    slide_century.value=0;
    div_settings.appendChild(slide_century);
    var datalist = document.createElement("datalist");
    datalist.setAttribute('id', "centuries_list");
    var option_all = document.createElement("option");
    option_all.setAttribute("value", 0);
    option_all.textContent = "all centuries";
    datalist.appendChild(option_all);
    var input_val = 1;
    centuries_list.forEach(val =>{
        
        if (val!=0){
            //console.log('hip!');
            //console.log(input_val, val);
            var option = document.createElement("option");
            option.setAttribute("value", input_val);
            option.textContent= `century ${val.toString()}`;
            //console.log(option);
            datalist.appendChild(option);
            input_val+=1;
        }   
    });
    div_settings.appendChild(datalist);
    ReactiveCenturyBar("century_select");
    



}
async function GetVarValues(input_value, searched_mode){
    var varinput = document.getElementById("var");
    console.log(input_value);
    params = {'searched_mode': searched_mode, 'input': input_value}
    var url_results = "varlist/";
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            },
        body: JSON.stringify(params)
    };
    const response = await fetch(url_results, options);
    const values = await response.json();
    //console.log(values);
    var var_list_id = varinput.getAttribute('list');

	if (document.getElementById(var_list_id)) {
		document.getElementById(var_list_id).remove();
	}
	var var_list = document.createElement('datalist');
	var_list.setAttribute('id', var_list_id );
    Array.from(values).forEach((varid)=>{
        var var_opt = document.createElement('option');
        var_opt.textContent=varid;
        var_opt.setAttribute("value", varid);
        var_list.appendChild(var_opt);
    });
    document.getElementById("var_setting").appendChild(var_list);
    /*console.log(possible_lemmas.data);
		Array.from(possible_lemmas.data).forEach((pos_lem) => {
			var lemma_opt = document.createElement('option');
			var lemma_txt = document.createTextNode(pos_lem.LEMMA_STR);
			lemma_opt.appendChild(lemma_txt);
			//lemma_opt.setAttribute('label', pos_lem.ID_LEMMA_STR);
			lemma_opt.setAttribute('value', pos_lem.ID_LEMMA);
			lemma_list.appendChild(lemma_opt);
			//console.log('hey');
	
		});
		
		attr_div.appendChild(lemma_list);*/ 
}
async function ReactiveVarInput() {
    var varinput = document.getElementById("var");
    var vartype = document.getElementById("vartype");
    var varchange = document.getElementById("varchange");
    varinput.addEventListener("keyup", (event)=>{
        if (vartype.checked==true){
            searched_mode="vartype";
            //console.log("vartype");
        } else if (varchange.checked==true){
            searched_mode="varchange";
            //console.log("varchange");
        }
        
		
		var input_value = varinput.value;
        GetVarValues(input_value, searched_mode);
        
		
		
    });
    
}
function ButtonSubmit() {
    var varinput = document.getElementById("var");
    var vartype = document.getElementById("vartype");
    var varchange = document.getElementById("varchange");
    button_visualization = document.getElementById("QuerySubmitButton");
    button_visualization.addEventListener("click", (event) => {
        console.log('I got clicked!');
        if (vartype.checked==true){
            searched_mode="vartype";
            //console.log("vartype");
        } else if (varchange.checked==true){
            searched_mode="varchange";
            //console.log("varchange");
        }
        params = {'century': 'all', '_id': varinput.value};
        
        span1.textContent= varinput.value;
        GetResults(searched_mode, params);

    });

}

async function setup() {
    checkvartype = document.getElementById('vartype');
    checkvarchange = document.getElementById('varchange');
    checkvartype.checked= true;
    //span1 = document.getElementById('searched_value');
    searched_mode = "papyrus";
    console.log(searched_mode);
    checkvartype.addEventListener('change', (event) => {
		if (checkvartype.checked == true) {
			if (checkvarchange.checked == true) {
				checkvarchange.checked = false;
			} 
			checkvartype.checked = true;
		} 
	});
	checkvarchange.addEventListener('change', (event) => {
		if (checkvarchange.checked == true) {
			if (checkvartype.checked == true) {
				checkvartype.checked = false;
			}
			checkvarchange.checked = true;
		} 
		
	});
    params = {'century':'all'};
    await GetResults(searched_mode,params );
    
    MakeCenturyBar();
    ReactiveVarInput();
    ButtonSubmit();





}

setup();

