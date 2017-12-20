/* global hyperdis */
const Model = hyperdis.default,
    model = Model.create({
        x: 10,
        y: 11,
        fact: {
            x: 2,
            y: 3,
            z: 4,
            complex: {
                i1: -9,
                i2: -4
            }
        }
    }),
    model1 = Model.create({ range: { start: 1, end: 5 }, visible: true, focus: 1 });

model1.append('range', { type: { absolute: true } });
console.log(model.serialize());
model.prop('fact.y', -3);
console.log(model.serialize());


model1
                .lock()
                .prop('focus', 0)
                .prop('range.end', 111)
                .unlock();

const unsub = model.next(['x', 'fact'], function () {
    console.log(arguments);
});


let unsubscribe = model1.next(['range.end', 'focus'],
    (sRange, focus) => {
        console.log(sRange, focus);
    });

model1
                .prop('range.end', 100)
                .prop('range.type.absolute', true)
                .prop('focus', 7);

function update () {
    model1.lock().prop('range.end', 10).prop('range.end', 999).prop('range.end', 555).unlock();
}


// model.append('fact.complex', {
//     i9: -8
// });
// model.calcVar('sum', require => require('x', 'y', (x, y) => x + y));
// console.log(model.prop('sum'));


// Render graph here
function createData (mod) {
    const graph = mod.graph(),
        network = graph.root;
    let data = {
        nodes: [],
        edges: [],
        electricEdges: []
    };

    (function rec (node, incoming) {
        const i = data.nodes.push({ label: node.name === null ? '$' : node.name, r: 20 }) - 1;
        if (incoming !== undefined) {
            data.edges.push({ source: incoming, target: i });
        }
        node.edges.forEach((element) => {
            rec(element, i);
        });
    }(network));

    return data;
}

function renderGraph (data) {
    const svg = d3.select('#graph').append('svg'),
        chartLayer = svg.append('g').classed('chartLayer', true),
        width = document.querySelector('#graph').clientWidth,
        height = document.querySelector('#graph').clientHeight,
        margin = { top: 0, left: 0, bottom: 0, right: 0 },
        chartWidth = width - (margin.left + margin.right),
        chartHeight = height - (margin.top + margin.bottom);

    svg.attr('width', width).attr('height', height);

    chartLayer
                    .attr('width', chartWidth)
                    .attr('height', chartHeight)
                    .attr('transform', `translate(${[margin.left, margin.top]})`);

    let simulation = d3.forceSimulation()
                    .force('link', d3.forceLink().id(d => d.index))
                    .force('collide', d3.forceCollide(d => d.r + 8).iterations(16))
                    .force('charge', d3.forceManyBody())
                    .force('center', d3.forceCenter(chartWidth / 2, chartHeight / 2))
                    .force('y', d3.forceY(0))
                    .force('x', d3.forceX(0));

    let link = svg.append('g')
                    .attr('class', 'links')
                    .selectAll('line')
                    .data(data.edges)
                    .enter()
                    .append('line')
                    .attr('stroke', 'black');

    let node = svg.append('g')
                    .attr('class', 'nodes')
                    .selectAll('text')
                    .data(data.nodes)
                    .enter().append('text')
                    // .attr('r', d => d.r)
                    .text(d => d.label);

    let ticked = function() {
        link
                        .attr('x1', d => d.source.x)
                        .attr('y1', d => d.source.y)
                        .attr('x2', d => d.target.x)
                        .attr('y2', d => d.target.y);

        node
                        .attr('x', d => d.x)
                        .attr('y', d => d.y);
    };

    simulation
                    .nodes(data.nodes)
                    .on('tick', ticked);

    simulation.force('link')
                    .links(data.edges);
}

const fdgData = createData(model);
renderGraph(fdgData);
