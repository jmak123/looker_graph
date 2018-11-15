var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

svg.append('defs').append('marker')
    .attrs({'id':'arrowhead',
        'viewBox':'-0 -5 10 10',
        'refX':13,
        'refY':0,
        'orient':'auto',
        'markerWidth':4,
        'markerHeight':4,
        'xoverflow':'visible'})
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#999')
    .style('stroke','none');

var div = d3.select("svg").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

d3.csv('sp_event.csv', function(error, data_raw){

    var data = []
    data_raw.forEach(function(d){
        if (d.source != d.target) {
            data.push(d)
        }
    })

    var all_nodes = data.map(function(d){return(d.source)})
        .concat(data.map(function(d){return(d.target)}))
    var uniq_nodes = new Set(all_nodes);
    var nodes = Array.from(uniq_nodes)
    nodes = nodes.map(function(d){return{'id':d}})

    var links = data
    console.log(nodes)
    console.log(links)

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) {return d.id;}))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width/2, height/2))
        .force('collide', d3.forceCollide().strength(1).radius(50))

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .attr('marker-end','url(#arrowhead)');

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
        .on("mouseover", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            div.text(d.id)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");	
        })					
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(500)		
                .style("opacity", 0);	
        });

    node.append("title")
        .text(function (d) {return d.id;});

    node.append("text")
        .attr("dy", -3)
        .text(function (d) {return d.id});

    simulation.nodes(nodes).on("tick", tickActions );
    simulation.force("link").links(links);

    function tickActions() {
        //update circle positions each tick of the simulation 
        node
        .attr("transform", function (d) {return "translate(" + d.x + ", " + d.y + ")";});

        link
        .attr("x1", function (d) {return d.source.x;})
        .attr("y1", function (d) {return d.source.y;})
        .attr("x2", function (d) {return d.target.x;})
        .attr("y2", function (d) {return d.target.y;});
    }      
        
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
})