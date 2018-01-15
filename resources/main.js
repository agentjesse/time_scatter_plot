//this code when reused should be based of time for each plot in seconds. it is not viable to work from Date objects initially up to 24 hours durations if working from seconds

//use d3 v3 ordinal scale, rangeRoundBands(), rangeBand(), and axis to make vertical bar chart.
const margin = {top:50, right:30, bottom:25, left: 60};
const width  = 950 - margin.left - margin.right, 
			height = 600 - margin.top - margin.bottom;
//popup
const tooltip = d3.select('body').append('div')
										.attr('class','toolTip')//set important styling
										.style('position','absolute')
										.style('opacity','0');//start off hidden
//parser that will make a date object from a string.
const parser = d3.time.format('%H:%M:%S').parse;
//set scale ranges before receiving data so axis creation can be made ahead of retrieval
const x = d3.time.scale()//this is a version of a linear scale. it's not ordinal
							.range([0,width]);
const y = d3.scale.linear()
						.range([height, 0]);//hi to lo for vertical graph due to coordinate system used by svg. low input = high output for y positon
//axes'
const xAxis = d3.svg.axis()//make the axis object using this line and set the appropriate scale and orientation
									.scale(x)
									.orient('bottom')
									// .ticks(3);//this usual line will not work well due to format issues. following 2 lines work:
									.ticks(d3.time.second, 30)//a tick every 30 seconds. ordinal scale tick setting is different
									.tickFormat(d3.time.format.utc('%Mm:%Ss'));//utc trick here sets hours to zero correctly since Date objects are made to local time and will set hours incorrectly. https://stackoverflow.com/questions/24541296/d3-js-time-scale-nicely-spaced-ticks-at-minute-intervals-when-data-is-in-second
const yAxis = d3.svg.axis()
									.scale(y)
									.orient('left')
									.ticks(6);//just a hint, it is not exactly the given amount
// set dims, make bkg, titles of graph
d3.select('.svgchart')
								.attr('width',width + margin.left + margin.right)
								.attr('height',height + margin.top + margin.bottom)
							.append('rect')
								.attr('class','chartBkg')
								.attr('width',width + margin.left + margin.right)
								.attr('height',height + margin.top + margin.bottom)
								.attr('rx','15')
								.attr('ry','15');
d3.select('.svgchart').append('text')
								.attr('class', 'chartTitle')
								.text('Doping in Professional Cycle Racing')
								.attr('x', 135)
								.attr('y', 50);
d3.select('.svgchart').append('text')
								.attr('class', 'yTitle')
								.text('Rank')
								.attr('x', 85)
								.attr('y', 330)
								.attr('transform', 'rotate(-90 85,330)');//rotation coords same as x and y position
d3.select('.svgchart').append('text')
																.attr('class', 'yTitle')
																.text('Alpe d\'Huez Completion Time ')
																.attr('x', 620)
																.attr('y', 562);
//get the svg for the chart, set dimensions according to margins, append a group inside using the margin info									
const chart = d3.select('.svgchart')
							.append('g')//make a group within the svg to make use of margins from top left origin point of the group
								.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

//retrieve the data from somewhere, make error checks, then use it to finish setting up scales before making the graph								
d3.json('https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/cyclist-data.json', function(error,data){
	//error handling
	if(error)console.log(error);//super important. display error if found!!
	console.log('data received:',data);
	//finish scale setup
	// x time scale domain is given a set of millisecond values. d3 then converts the 2 values to dates. 
	x.domain( [ d3.min( data, d => d.Seconds ) * 1000, d3.max( data, d => d.Seconds ) * 1000 ] );//extent() will return min and max of a set as an array with 2 elements
	y.domain( d3.extent( data, d => d.Place ) );
	//append axes'
	chart.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0,'+height+')')
				.call(xAxis);
	chart.append('g')
				.attr('class', 'y axis')
				.call(yAxis);
	//remember that at this point the chart variable is already the group you put into the svg. 
  chart.selectAll('circle')//initiate data join, in this case, the rect elements of this line don't exist yet...
        .data(data)//join the data. update selection is returned, it has enter selection hanging off it
			.enter().append('circle')//instantiate the 'g' elements for each item in the selection
				.attr('class', 'dot')
				.style('fill', function(d){ return d.Doping ? 'red' : 'green'} )
				.attr('r', 6)//sometimes radius cant be set via css, so set in js instead
				//to get the x position, the x scale must be given a value fitting its domain. this time scale must receive a date within the range of its domain. as you did before, just pass in a date in milliseconds. the d3 time scale will convert it to a date and then return the appropriate x position.
				.attr('cx', function(d){ return x( d.Seconds * 1000 ) })
				.attr('cy', function(d){ return y( d.Place ) })//scale is already reversed above to handle coordinate system
				// .attr('height', function(d) { return height - y( d[1] ) })

		//append d3 event handlers using on(). more info here: https://github.com/d3/d3-3.x-api-reference/blob/master/Selections.md#on	
		.on('mouseover', function(d,i){ //current datum and index
			// console.log(i);
			// console.log(d);
			// console.log(this);
			//display formatted tooltip div
			// tooltip.html( JSON.stringify(d) )
			//get position of chart
			const svgBoundsRect = document.querySelector('svg').getBoundingClientRect();
			tooltip.html( `${d.Name} - ${d.Nationality}<br>Year: ${d.Year}, finished in ${d.Time}${ d.Doping ? `<br><br>${d.Doping}` : '<br><br>No doping allegations' }` )
							//DON'T FORGET TO OFFSET THE POPUP OR IT WILL INTERFERE, causing multiple event firing
							// .style('left', d3.event.pageX + 'px')//d3.event must be used to access the usual event object
							.style('top', '120px')
							.style('left', svgBoundsRect.left + 110 + 'px');
			tooltip.transition()//smooth transition, from d3: https://github.com/d3/d3-3.x-api-reference/blob/master/Selections.md#transition
						.duration(700)//ms
						// .delay(300)//ms
						.style('opacity', 1);
			d3.select(this).style('opacity','0.1');
		})
		.on('mouseout', function(d,i){
			tooltip.style('opacity', 0)//reset opacity for next transition
							.style('top', '-150px');//throw off screen to prevent interference.still appears if just nuking opacity 
			d3.select(this).style('opacity','1');
		});
	
});






