// create element
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// reserve element for tooltip
var div = d3.select("svg").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

// read csv
d3.csv('sp_event.csv', function(error, data_raw){

    // data transformation - eleiminate self directed links
    var data = []
    data_raw.forEach(function(d){
        if (d.source != d.target) {
            data.push(d)
        }
    })

    // get unique nodes from links
    var all_nodes = data.map(function(d){return(d.source)})
        .concat(data.map(function(d){return(d.target)}))
    var uniq_nodes = new Set(all_nodes);
    var nodes = Array.from(uniq_nodes)
    nodes = nodes.map(function(d){return{'id':d}})

    var links = data
    console.log(nodes)
    console.log(links)

    // set node and link force interaction behaviour    
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) {return d.id;}))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width/2, height/2))
        .force('collide', d3.forceCollide().strength(1).radius(50))

    var marker = svg.append('defs')
        .selectAll('marker')
        .data(links).enter()
        .append('svg:marker')
        .attrs({
            'id':function(d){return 'arrow_' + d.source + '_' + d.target},
            'viewBox':'-0 -5 10 10',
            'refX':13,
            'refY':0,
            'orient':'auto',
            'markerWidth':4,
            'markerHeight':4,
            'xoverflow':'visible'
        })
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke','none')
        .style('opacity', 0.2);

    // create link elements
    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .style('stroke', 'black')
        .style("stroke-width", 2)
        .style("stroke-opacity", 0.1)
        .style('fill', 'none')
        // .attr('marker-end','url(#arrowhead)')
        .attr('marker-end', function(d) { return 'url(#arrow_' + d.source + '_' + d.target +')'})
        .on('mouseover', mouseover)
        .on('mouseout', mouseout);

    // create node elements
    node = svg.selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
    );

    node.append("circle")
        .attr("r", 5)
        .style("fill", 'red')

    node.append("title")
        .text(function (d) {return d.id;});

    node.append("text")
        .attr("dy", -3)
        .text(function (d) {return d.id});

    // d3 zoom behaviour handler
    var zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);
    zoom_handler(svg);  

    // link force interaction with nodes and links
    simulation.nodes(nodes).on("tick", tickActions );
    simulation.force("link").links(links);

    // define behaviour at each data update
    function tickActions() {
        //update circle positions each tick of the simulation 
        node
        .attr("transform", function (d) {return "translate(" + d.x + ", " + d.y + ")";});

        link.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + 
                d.source.x + "," + 
                d.source.y + "A" + 
                dr + "," + dr + " 0 0,1 " + 
                d.target.x + "," + 
                d.target.y;
        });
    }      
    
    // functions for node drag behaviour
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    
    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = undefined;
        d.fy = undefined;
    }

    function mouseover(d){
        d3.select(this)
        .style("stroke-opacity", 1)
        .style("stroke-width", 5);
        
        d3.select('arrow_' + d.source.id + '_' + d.target.id)
        .attr('fill', 'red')


    };

    function mouseout(){
        link
        .style("stroke-width", 2)
        .style("stroke-opacity", 0.1)
    }

    function zoom_actions(){
        svg.attr("transform", d3.event.transform)
    }
})