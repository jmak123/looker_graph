import * as d3 from "d3v4";

var fdg = function() {
    // create element
    var svg = d3.select("svg")
            .style('background-color', 'white'),
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
            .attr('id', function(d){return 'marker_' + d.source + '_' + d.target})
            .attr('viewBox','-0 -5 10 10')
            .attr('refX',13)
            .attr('refY',0)
            .attr('orient','auto')
            .attr('markerWidth',4)
            .attr('markerHeight',4)
            .attr('xoverflow','visible')
            .append('svg:path')
            .attr('id', function(d){return 'arrow_' + d.source + '_' + d.target})
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .style('fill', 'black')
            .style('stroke','none')
            .style('opacity', function(d){
                if (d.is_primary == 'TRUE') {
                    return 0.9
                } else {return 0.05}});

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
                } else {return 0.05}})
            .style('fill', 'none')
            .attr('marker-end', function(d) { return 'url(#marker_' + d.source + '_' + d.target +')'})
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        // create node elements
        var node = g.append('g')
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
                } else {return 0.05}})

            d3.select('#arrow_' + d.source.id + '_' + d.target.id)
            .style('fill', 'black')
            .style('opacity', 0.05)
        };

        function nodemouseover(d){
            d3.select('#text_' + d.id)
            .attr('font-size', 25);

            d3.select('#node_' + d.id)
            .attr('r', 20)

            link
            .style('stroke', function(o){
                if (o.source.id == d.id & o.is_primary == 'TRUE') {
                    return 'orange'
                } else if (o.source.id == d.id & o.is_primary == 'FALSE') {
                    return 'blue'
                } else {
                    return 'black'
                }
            })
            .style('stroke-width', function(o){
                if (o.source.id == d.id & o.is_primary == 'TRUE') {
                    return 5
                } else {
                    return 2
                }
            })
            .style('stroke-opacity', function(o){
                if (o.source.id == d.id & o.is_primary == 'TRUE') {
                    return 0.9
                } else if (o.source.id == d.id & o.is_primary == 'FALSE') {
                    return 0.7
                } else {
                    return 0.05
                }
            });

            marker
            .style('fill', function(o){
                if (o.source.id == d.id & o.is_primary == 'TRUE') {
                    return 'orange'
                } else if (o.source.id == d.id & o.is_primary == 'FALSE') {
                    return 'blue'
                } else {
                    return 'black'
                }
            })
            .style('opacity', function(o){
                if (o.source.id == d.id & o.is_primary == 'TRUE') {
                    return 0.9
                } else if (o.source.id == d.id & o.is_primary == 'FALSE') {
                    return 0.7
                } else {
                    return 0.05
                }
            })

        }

        function nodemouseout(d){
            d3.select('#text_' + d.id)
            .attr('font-size', 12);

            d3.select('#node_' + d.id)
            .attr('r', 5)

            link
            .style('stroke', 'black')
            .style('stroke-width', 2)

            marker
            .style('fill', 'black')
            .style('opacity', 0.05)
        }

        function zoomed(){
            g.attr("transform", d3.event.transform)
        }
    })
}

function make_graph (){
    fdg()
}

export {make_graph}