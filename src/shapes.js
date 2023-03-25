
const cubeSegWide = 20;
const cubeSegHigh = 20;
const cubeSegDeep = 20;



const cube =
[
	// bottom
	{ x: -2, y: 2, z: -2, staticFriction: 1.0, connected: [1, 2, 4, 7] },	//0
	{ x: 2, y: 2, z: -2, staticFriction: 1.0, connected: [2, 5, 4] },
	{ x: 2, y: 2, z: 2, staticFriction: 1.0, connected: [3, 6, 5] },
	{ x: -2, y: 2, z: 2, staticFriction: 1.0, connected: [0, 7, 6] },	//3
	// top
	{ x: -2, y: -2, z: -2, staticFriction: 0.5, connected: [5] },	//4
	{ x: 2, y: -2, z: -2, staticFriction: 0.5, connected: [6, 7] },
	{ x: 2, y: -2, z: 2, staticFriction: 0.5, connected: [7] },
	{ x: -2, y: -2, z: 2, staticFriction: 0.5, connected: [4] },	//8
];

const stick =
[
	{ x: 0, y: 0, z: 0, staticFriction: 1.0, connected: [1] },	//0
	{ x: 0, y: 4, z: 0, staticFriction: 0.5, connected: [] },	//0
]

const stick2 =
[
	{ x: 0, y: 0, z: 0, staticFriction: 1.0, connected: [1] },	//0
	{ x: 0, y: 4, z: 0, staticFriction: 0.5, connected: [2] },	//1
	{ x: 0, y: 8, z: 0, staticFriction: 0.5, connected: [] },	//2
]



function Shapes()
{
    this.shapes = [];
    this.shapes["cube"] = this.create(cube, 0, 0, 0, 1.0);
    this.shapes["stick"] = this.create(stick, 0, 0, 0, 1.0);
    this.shapes["stick2"] = this.create(stick2, 0, 0, 0, 1.0);
}


Shapes.prototype.create = function( shape, x, y, z, staticFrictionMultiplier )
{
    const edges = this.createEdges( shape );

	const list = [];
	for (var i = 0; i < shape.length; i++)
	{
		const c = shape[i];
		const l = staticFrictionMultiplier * c.staticFriction;
        const vertexData = { x: c.x + x, y: c.y + y, z: c.z + z, staticFriction: l, connectedEdges: this.findAllEdges(edges, i) };
        const angles = this.connectionsWithAngles( vertexData.connectedEdges, edges );
		list.push(vertexData);
	}

	return { shapeVertices: list, edges: edges };
}


Shapes.prototype.createEdges = function( shape )
{
    var edgeList = [];

    // Iterate over each vertex
    for (var i = 0, l = shape.length; i < l; i++)
    {
        var vertexData = shape[i];

        // Iterate over each connected vertex
        for (var j = 0, k = vertexData.connected.length; j < k; j++)
        {
            var connectedVertexIndex = vertexData.connected[j];
            var connectedVertexData = shape[connectedVertexIndex];

            // Check if the connection has already been added to the list
            var alreadyAdded = connectedVertexIndex < i;

            // Add the connection to the list if it hasn't been added already
            if (!alreadyAdded)
            {
                // add reference vertex, so it will update the verletShape.vertices and v.v.
                edgeList.push({
                    startData: { vertex: vertexData, index: i },
                    endData: { vertex: connectedVertexData, index: connectedVertexIndex },
                });
            }
        }
    }

    return edgeList;
}


/// Find all edges that include the vertex referenced by vertexIndex
Shapes.prototype.findAllEdges = function( edges, vertexIndex )
{
    var list = [];

    for(var i = 0, l = edges.length; i < l; i++)
    {
        if (edges[i].startData.index == vertexIndex || edges[i].endData.index == vertexIndex)
            list.push(i);
    }

    return list;
}


Shapes.prototype.connectionsWithAngles = function( edgeIndices, edges )
{
    for(var i = 0, l = edgeIndices.length; i < l; i++)
    {
        const e1 = edgeIndices[i];
        const edge1 = edges[e1];
        if (!edge1.angles) edge1.angles = [];
        const v1 = createVector(edge1.startData.vertex, edge1.endData.vertex);
        edge1.vector = v1;

        for(var j = i + 1; j < l; j++)
        {
            const e2 = edgeIndices[j];
            const edge2 = edges[e2];
            if (!edge2.angles) edge2.angles = [];
            const v2 = createVector(edge2.startData.vertex, edge2.endData.vertex);

            edge1.angles[j] = quaternionAngleBetweenVectors(v1, v2);
            edge2.angles[i] = quaternionAngleBetweenVectors(v2, v1);
            //console.log("connect edges " + e1 + " to " + e2 + " through vertex (" + edge1.startData.index + " or " + edge1.endData.index + ") " + JSON.stringify(q));
        }
    }
}


function createVector( startVertex, endVertex )
{
    var v = {
        x: endVertex.x - startVertex.x,
        y: endVertex.y - startVertex.y,
        z: endVertex.z - startVertex.z
    };
    // pre-calc and attach the length squared
    var l2 = v.x * v.x + v.y * v.y + v.z * v.z;
    v.l2 = l2;
    return v;
}

function quaternionAngleBetweenVectors(v1, v2)
{
    const v1Length = Math.sqrt(v1.l2);
    const v2Length = Math.sqrt(v2.l2);
    const v1Norm = { x: v1.x/v1Length, y: v1.y/v1Length, z: v1.z/v1Length }; // Normalized first vector
    const v2Norm = { x: v2.x/v2Length, y: v2.y/v2Length, z: v2.z/v2Length }; // Normalized second vector

    const dotProduct = v1Norm.x*v2Norm.x + v1Norm.y*v2Norm.y + v1Norm.z*v2Norm.z;

    const crossProduct = {
        x: v1Norm.y*v2Norm.z - v1Norm.z*v2Norm.y,
        y: v1Norm.z*v2Norm.x - v1Norm.x*v2Norm.z,
        z: v1Norm.x*v2Norm.y - v1Norm.y*v2Norm.x
    };

    const angle = Math.atan2(Math.sqrt(crossProduct.x*crossProduct.x + crossProduct.y*crossProduct.y + crossProduct.z*crossProduct.z), dotProduct);

    const axis = { x: crossProduct.x, y: crossProduct.y, z: crossProduct.z };
    const sin2 = Math.sin(angle / 2);
    const q = { w: Math.cos(angle/2), x: axis.x*sin2, y: axis.y*sin2, z: axis.z*sin2 };

    return q;
}
  

// TODO: part one of an ugly brute-force solution
// remove duplicate nodes and vertices from the list
Shapes.prototype.reduce = function( list )
{
    //console.log("reduce " + JSON.stringify(list));
    const length = list.length;
    return list.filter((item, index) =>
        {
            // search forwards in the list
            for(var i = index + 1; i < length; i++)
            {
                if (sameLocation(item, list[i]))
                {
                    // combine the staticFriction values from the two nodes
                    list[i].staticFriction *= item.staticFriction;
                    this.fixConnections(list, i);
                    return false;
                }
            }
            return true;
        });
}


// TODO: part two of an ugly brute-force solution
// decrement connection indices when 'reduce' removes a duplicate node from the shape list
Shapes.prototype.fixConnections = function( list, index )
{
    const length = list.length;
    for(var i = index; i < length; i++)
    {
        const connections = list[i].connected;
        for(var j = 0; j < connections.length; j++)
            if (connections[j] >= index)
                connections[j]--;
    }
}


function sameLocation(p1, p2)
{
    return (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z);
}


Shapes.prototype.offsetList = function( src, offsetIndex )
{
	const list = [];
	for (var i = 0; i < src.length; i++)
		list[i] = src[i] + offsetIndex;
	return list;
}


Shapes.prototype.get = function( shapeName )
{
    // shallow copy the list of vertex data
    const cloneVertices = [...this.shapes[shapeName].shapeVertices];
    const cloneEdges = [...this.shapes[shapeName].edges];

    // go one level deeper for the connected lists
    cloneVertices.forEach((vertex) => {
        vertex.connectedEdges = [...vertex.connectedEdges];
    });

    return { shapeVertices: cloneVertices, edges: cloneEdges };
}
