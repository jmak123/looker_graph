import {make_graph} from './fd_graph.js';

looker.plugins.visualizations.add({

	create: function(element, config){},

	updateAsync: function(data, element, config, queryResponse, details, doneRendering){
        make_graph(element, data, queryResponse)
		doneRendering()
	}
});
