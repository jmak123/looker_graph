// create element
var svg = d3.select("svg")
        .style('background-color', 'grey'),
    width = +svg.attr("width"),
    height = +svg.attr("height");

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
            'id':function(d){return 'marker_' + d.source + '_' + d.target},
            'viewBox':'-0 -5 10 10',
            'refX':13,
            'refY':0,
            'orient':'auto',
            'markerWidth':4,
            'markerHeight':4,
            'xoverflow':'visible'
        })
        .append('svg:path')
        .attr('id', function(d){return 'arrow_' + d.source + '_' + d.target})
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .style('fill', 'black')
        .style('stroke','none')
        .style('opacity', 0.2);

    var g  = svg.append('g')
        // .attr('width', '80%')
        // .attr('height', '80%')
        // .style('background-clor', 'yellow')
        .call(d3.zoom()
            .on("zoom", zoomed));
    
    // create link elements
    var link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .style('stroke', 'black')
        .style("stroke-width", 2)
        .style("stroke-opacity", function(d){
            if (d.is_primary == 'TRUE') {
                return 0.9
            } else {return 0.1}})
        .style('fill', 'none')
        .attr('marker-end', function(d) { return 'url(#marker_' + d.source + '_' + d.target +')'})
        .on('mouseover', mouseover)
        .on('mouseout', mouseout);

    // create node elements
    node = g.append('g')
        .selectAll("node")
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
        .attr('id', function(d){return 'node_' + d.id})
        .attr("r", 5)
        .style("fill", 'red')
        .on('mouseover', nodemouseover)
        .on('mouseout', nodemouseout)

    node.append("title")
        .text(function (d) {return d.id;});

    node.append("text")
        .attr('id', function(d){return 'text_' + d.id})
        .attr("dy", -7)
        .text(function (d) {return d.id})
        .attr('font-size', 12);

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
        .style('stroke', 'green')
        .style("stroke-opacity", 1)
        .style("stroke-width", 10);
        
        d3.select('#arrow_' + d.source.id + '_' + d.target.id)
        .style('fill', 'green')
        .style('opacity' , 1)
        .style("stroke-width", 10)

    };

    function mouseout(d){
        link
        .style('stroke', 'black')
        .style("stroke-width", 2)
        .style("stroke-opacity", function(d){
            if (d.is_primary == 'TRUE') {
                return 0.9
            } else {return 0.1}})

        d3.select('#arrow_' + d.source.id + '_' + d.target.id)
        .style('fill', 'black')
        .style('opacity', 0.1)
    };

    function nodemouseover(d){
        d3.select('#text_' + d.id)
        .attr('font-size', 25);

        d3.select('#node_' + d.id)
        .attr('r', 20)
    }

    function nodemouseout(d){
        d3.select('#text_' + d.id)
        .attr('font-size', 12);

        d3.select('#node_' + d.id)
        .attr('r', 5)
    }

    function zoomed(){
        g.attr("transform", d3.event.transform)
    }
})