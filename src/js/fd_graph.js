import * as d3 from "d3v4";

var fdg = function(container, data_raw) {

    // create element
    var svg = d3.select(container)
        .html('')
        .append('svg')
            .attr('width', container.clientWidth)
            .attr('height', container.clientHeight)
            .call(d3.zoom()
                .on("zoom", zoomed)),
        width = container.clientWidth,
        height = container.clientHeight

    // data transformation - eleiminate self directed links
    var links = []
    data_raw.forEach(function(d){
        if (d.source != d.target & d.target != null & d.source != null) {
            links.push(d)
        }
    })
    links.forEach(function(d){
        d.gp = links
            .filter(function(o){
                return o.source == d.source
            })
            .map(function(o){
                return o.freq * 1
            })
        d.gp_max = Math.max(...d.gp)
        d.weight = d.freq * 1 / d.gp_max
        d.is_primary = d.freq * 1 >= d.gp_max * 0.75
    })

    // get unique nodes from links
    var all_nodes = links.map(function(d){
        return d.source
    })
        .concat(links.map(function(d){
            return d.target
        }))
    var uniq_nodes = new Set(all_nodes);
    var nodes = Array.from(uniq_nodes)
    nodes = nodes.map(function(d){
        return {'id':d}
    })

    // set node and link force interaction behaviour    
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) {
            return d.id
        }))
        .force("charge", d3.forceManyBody().strength(-5))
        .force("center", d3.forceCenter(width/2, height/2))
        .force('collide', d3.forceCollide().strength(1).radius(50))

    // make definition of marker and assign id to each of them for later reference
    var marker = svg.append('defs')
        .selectAll('marker')
        .data(links).enter()
        .append('svg:marker')
        .attr('id', function(d){
            return 'marker_' + d.source + '_' + d.target
        })
        .attr('viewBox','-0 -5 10 10')
        .attr('refX',13)
        .attr('refY',0)
        .attr('orient','auto')
        .attr('markerWidth',4)
        .attr('markerHeight',4)
        .attr('xoverflow','visible')
        .append('svg:path')
        .attr('id', function(d){
            return 'arrow_' + d.source + '_' + d.target
        })
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .style('fill', 'black')
        .style('stroke','none')
        .style('opacity', function(d){
            if (d.is_primary) {
                return 0.9
            } else {
                return 0.05
            }
        });

    var g  = svg.append('g')
    
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
            if (d.is_primary) {
                return 0.9
            } else {return 0.05}})
        .style('fill', 'none')
        .attr('marker-end', function(d) {
            return 'url(#marker_' + d.source + '_' + d.target +')'
        })
        .on('mouseover', mouseover)
        .on('mouseout', mouseout);

    // // create node elements
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
        .attr('id', function(d){
            return 'node_' + d.id
        })
        .attr("r", 5)
        .style("fill", 'red')
        .on('mouseover', nodemouseover)
        .on('mouseout', nodemouseout)

    node.append("title")
        .text(function (d) {
            return d.id
        });

    node.append("text")
        .attr('id', function(d){
            return 'text_' + d.id
        })
        .attr("dy", -7)
        .text(function (d) {
            return d.id
        })
        .attr('font-size', 12);

    // // link force interaction with nodes and links
    simulation.nodes(nodes).on("tick", tickActions );
    simulation.force("link").links(links);

    console.log(links)
    console.log(nodes)

    // // define behaviour at each data update
    function tickActions() {

        //update circle positions each tick of the simulation 
        node
        .attr("transform", function (d) {
            return "translate(" + d.x + ", " + d.y + ")"
        });

        // need to recalculate arc radius before updating
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

    // for mouse actions select id of element and change attr and style
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

    // on mouse out reset everything to original attr and style
    function mouseout(d){
        link
        .style('stroke', 'black')
        .style("stroke-width", 2)
        .style("stroke-opacity", function(d){
            if (d.is_primary) {
                return 0.9
            } else {return 0.05}})

        d3.select('#arrow_' + d.source.id + '_' + d.target.id)
        .style('fill', 'black')
        .style('opacity', 0.05)
    };

    // same goes for mouse on nodes except need to read link id for highlighting
    function nodemouseover(d){
        d3.select('#text_' + d.id)
        .attr('font-size', 25);

        d3.select('#node_' + d.id)
        .attr('r', 20)

        link
        .style('stroke', function(o){
            if (o.source.id == d.id & o.is_primary ) {
                return 'orange'
            } else if (o.source.id == d.id & !o.is_primary) {
                return 'blue'
            } else {
                return 'black'
            }
        })
        .style('stroke-width', function(o){
            if (o.source.id == d.id & o.is_primary) {
                return 5
            } else {
                return 2
            }
        })
        .style('stroke-opacity', function(o){
            if (o.source.id == d.id & o.is_primary) {
                return 0.9
            } else if (o.source.id == d.id & !o.is_primary) {
                return 0.7
            } else {
                return 0.05
            }
        });

        // don't forget marker has its on element set and needs to be updated separately
        marker
        .style('fill', function(o){
            if (o.source.id == d.id & o.is_primary) {
                return 'orange'
            } else if (o.source.id == d.id & !o.is_primary) {
                return 'blue'
            } else {
                return 'black'
            }
        })
        .style('opacity', function(o){
            if (o.source.id == d.id & o.is_primary) {
                return 0.9
            } else if (o.source.id == d.id & !o.is_primary) {
                return 0.7
            } else {
                return 0.05
            }
        })

    }

    // on mouse out reset everything
    function nodemouseout(d){
        d3.select('#text_' + d.id)
        .attr('font-size', 12);

        d3.select('#node_' + d.id)
        .attr('r', 5)

        link
        .style('stroke', 'black')
        .style("stroke-width", 2)
        .style("stroke-opacity", function(d){
            if (d.is_primary) {
                return 0.9
            } else {return 0.05}})

        marker
        .style('fill', 'black')
        .style('opacity', 0.05)
    }

    function zoomed(){
        g.attr("transform", d3.event.transform)
    }
}


function make_graph (element, data, queryResponse){

    // parse looker api input objects and create clean data to feed into main func
    var parent_name = queryResponse.fields.dimensions[0].name
    var child_name = queryResponse.fields.dimensions[1].name
    var freq_name = queryResponse.fields.measures[0].name

    data.forEach(function(d){
        d.source = d[parent_name].value
        d.target = d[child_name].value
        d.freq = d[freq_name].value
        delete d[parent_name]
        delete d[child_name]
        delete d[freq_name]
    })

    fdg(element, data)
}

export {make_graph}