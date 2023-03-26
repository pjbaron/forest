

// const cube =
// [
// 	// bottom
// 	{ x: 2, y: 0, z: -2, staticFriction: 1.0, connected: [1, 2, 4, 7, 6] },	//0
// // TODO: link to 2 is missing
// 	{ x: -2, y: 0, z: -2, staticFriction: 1.0, connected: [2, 5, 4, 7] },
// 	{ x: -2, y: 0, z: 2, staticFriction: 1.0, connected: [3, 6, 5] },
// 	{ x: 2, y: 0, z: 2, staticFriction: 1.0, connected: [0, 7, 6] },	//3
// 	// top
// 	{ x: 2, y: 4, z: -2, staticFriction: 0.5, connected: [5] },	//4
// // TODO: link to 6 is missing
// 	{ x: -2, y: 4, z: -2, staticFriction: 0.5, connected: [6, 7] },
// 	{ x: -2, y: 4, z: 2, staticFriction: 0.5, connected: [7] },
// 	{ x: 2, y: 4, z: 2, staticFriction: 0.5, connected: [4] },	//7
// ];

const cube =
[
	// bottom
	{ x: -2, y: 0, z: 2, staticFriction: 1.0, connected: [1,4,6] },	//0
	{ x: 2, y: 0, z: 2, staticFriction: 1.0, connected: [2,5,7] },
	{ x: 2, y: 0, z: -2, staticFriction: 1.0, connected: [3,6,4] },
	{ x: -2, y: 0, z: -2, staticFriction: 1.0, connected: [0,7,5] },	//3
	// top
	{ x: -2, y: 4, z: 2, staticFriction: 0.5, connected: [5] },	//4
	{ x: 2, y: 4, z: 2, staticFriction: 0.5, connected: [6] },
	{ x: 2, y: 4, z: -2, staticFriction: 0.5, connected: [7] },
	{ x: -2, y: 4, z: -2, staticFriction: 0.5, connected: [4] },	//7
];

const stick =
[
	// bottom
	{ x: -1, y: 0, z: -1, staticFriction: 1.0, connected: [1, 2, 4, 7] },	//0
	{ x: 1, y: 0, z: -1, staticFriction: 1.0, connected: [2, 5, 4] },
	{ x: 1, y: 0, z: 1, staticFriction: 1.0, connected: [3, 6, 5] },
	{ x: -1, y: 0, z: 1, staticFriction: 1.0, connected: [0, 7, 6] },	//3
	// top
	{ x: -1, y: 10, z: -1, staticFriction: 0.5, connected: [5] },	//4
	{ x: 1, y: 10, z: -1, staticFriction: 0.5, connected: [6, 7] },
	{ x: 1, y: 10, z: 1, staticFriction: 0.5, connected: [7] },
	{ x: -1, y: 10, z: 1, staticFriction: 0.5, connected: [4] },	//7
];

const stick2 =
[
	// bottom
	{ x: -1, y: 0, z: 1, staticFriction: 1.0, connected: [1,4,6] },	//0
	{ x: 1, y: 0, z: 1, staticFriction: 1.0, connected: [2,5,7] },
	{ x: 1, y: 0, z: -1, staticFriction: 1.0, connected: [3,6,4] },
	{ x: -1, y: 0, z: -1, staticFriction: 1.0, connected: [0,7,5] },	//3
	// middle
	{ x: -1, y: 10, z: 1, staticFriction: 0.5, connected: [5,8,10,6] },	//4
	{ x: 1, y: 10, z: 1, staticFriction: 0.5, connected: [6,9,11,7] },
	{ x: 1, y: 10, z: -1, staticFriction: 0.5, connected: [7,10,8] },
	{ x: -1, y: 10, z: -1, staticFriction: 0.5, connected: [4,11,9] },	//7
	// top
	{ x: -1, y: 20, z: 1, staticFriction: 0.5, connected: [9] },	//8
	{ x: 1, y: 20, z: 1, staticFriction: 0.5, connected: [10] },
	{ x: 1, y: 20, z: -1, staticFriction: 0.5, connected: [11] },
	{ x: -1, y: 20, z: -1, staticFriction: 0.5, connected: [8] },	//11
];

// const stick =
// [
// 	{ x: 0, y: 0, z: 0, staticFriction: 1.0, connected: [1] },	//0
// 	{ x: 0, y: 4, z: 0, staticFriction: 0.5, connected: [] },	//0
// ]

// const stick2 =
// [
// 	{ x: 0, y: 0, z: 0, staticFriction: 1.0, connected: [1] },	//0
// 	{ x: 0, y: 4, z: 0, staticFriction: 0.5, connected: [2] },	//1
// 	{ x: 0, y: 8, z: 0, staticFriction: 0.5, connected: [] },	//2
// ]



function Shapes()
{
    this.shapes = [];
    //this.shapes["cube"] = this.create(cube, 0, 0, 0, 1.0);
    //this.shapes["stick"] = this.create(stick, 0, 0, 0, 1.0);
    this.shapes["stick2"] = this.create(stick2, 0, 0, 0, 1.0);
}


Shapes.prototype.create = function( shape, x, y, z, staticFrictionMultiplier )
{
    const edges = this.createEdges( shape );

	const vertices = [];
	for(var i = 0; i < shape.length; i++)
	{
		const c = shape[i];
		const l = staticFrictionMultiplier * c.staticFriction;
        const vertexData = { x: c.x + x, y: c.y + y, z: c.z + z, staticFriction: l, connectedEdges: this.findAllEdges(edges, i) };
		vertices.push(vertexData);
        //console.log(JSON.stringify(vertexData.connectedEdges));
	}

	return { shapeVertices: vertices, shapeEdges: edges };
}


Shapes.prototype.createEdges = function( shape )
{
    const edgeList = [];

    // Iterate over each vertex
    for(var i = 0, l = shape.length; i < l; i++)
    {
        const vertexData = shape[i];

        // Iterate over each connected vertex
        for(var j = 0, k = vertexData.connected.length; j < k; j++)
        {
            const connectedVertexIndex = vertexData.connected[j];
            const connectedVertexData = shape[connectedVertexIndex];

            // Check if the connection has already been added to the list
            const alreadyAdded = (this.findEdge(edgeList, i, connectedVertexIndex) != -1);

            // Add the connection to the list if it hasn't been added already
            if (!alreadyAdded)
            {
                edgeList.push({
                    startData: { index: i },
                    endData: { index: connectedVertexIndex },
                });
            }
        }
    }

    return edgeList;
}


/// Find all edges that include the vertex referenced by vertexIndex
Shapes.prototype.findEdge = function( edges, fromIndex, toIndex )
{
    for(var i = 0, l = edges.length; i < l; i++)
    {
        if (edges[i].startData.index == fromIndex && edges[i].endData.index == toIndex)
            return i;
        if (edges[i].endData.index == fromIndex && edges[i].startData.index == toIndex)
            return i;
    }

    return -1;
}


/// Find all edges that include the vertex referenced by vertexIndex
Shapes.prototype.findAllEdges = function( edges, vertexIndex )
{
    const list = [];

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

function quaternionAngleBetweenVectors( v1, v2 )
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

    return normalizeQuat(q);
}


function normalizeQuat( q )
{
    var l2 = q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z;
    var l = Math.sqrt(l2);
    return { w: q.w / l, x: q.x / l, y: q.y / l, z: q.z / l };
}


function sameLocation( p1, p2 )
{
    return (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z);
}


Shapes.prototype.offsetList = function( src, offsetIndex )
{
	const list = [];
	for(var i = 0; i < src.length; i++)
		list[i] = src[i] + offsetIndex;
	return list;
}


Shapes.prototype.cloneOfShape = function( shapeName )
{
    // const vertexData = { x: c.x + x, y: c.y + y, z: c.z + z, staticFriction: l, connectedEdges: this.findAllEdges(edges, i) };

    // shallow copy the list of vertex data
    const cloneVertices = [...this.shapes[shapeName].shapeVertices];

    // go one level deeper for the connected lists
    cloneVertices.forEach((vertex) => {
        vertex.connectedEdges = [...vertex.connectedEdges];
    });
    
    // shallow copy the edge data, the deeper data here must be replaced when instantiating a physics copy of this shape
    const cloneEdges = [...this.shapes[shapeName].shapeEdges];

    for(var i = 0; i < cloneEdges.length; i++)
    {
        const edge = cloneEdges[i];
        cloneEdges[i] = {
            startData: { index: edge.startData.index },
            endData: { index: edge.endData.index }
        };
    }

    return { shapeVertices: cloneVertices, edges: cloneEdges };
}
