
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
	{ x: 0, y: 4, z: 0, staticFriction: 2.1, connected: [2] },	//1
	{ x: 0, y: 8, z: 0, staticFriction: 1.5, connected: [] },	//2
]



function Shapes()
{
    this.shapes = [];
    this.shapes["cube"] = this.create(cube, 0, 0, 0, 0, 1.0);
    this.shapes["stick"] = this.create(stick, 0, 0, 0, 0, 1.0);
    this.shapes["stick2"] = this.create(stick2, 0, 0, 0, 0, 1.0);
}


// TODO: part one of an ugly brute-force solution
// remove duplicate nodes and vertices from the list
Shapes.prototype.reduce = function( list )
{
    //console.log("reduce " + JSON.stringify(list));
    var length = list.length;
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
    var length = list.length;
    for(var i = index; i < length; i++)
    {
        var connections = list[i].connected;
        for(var j = 0; j < connections.length; j++)
            if (connections[j] >= index)
                connections[j]--;
    }
}


function sameLocation(p1, p2)
{
    return (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z);
}


// offsetIndex is used when combining several primitives to create a compound shape
Shapes.prototype.create = function( shape, offsetIndex, x, y, z, staticFrictionMultiplier )
{
	var list = [];
	for (var i = 0; i < shape.length; i++)
	{
		var c = shape[i];
		var l = staticFrictionMultiplier * c.staticFriction;
		list.push({ x: c.x + x, y: c.y + y, z: c.z + z, staticFriction: l, connected: this.offsetList(c.connected, offsetIndex) });
	}
	return list;
}


Shapes.prototype.offsetList = function( src, offsetIndex )
{
	var list = [];
	for (var i = 0; i < src.length; i++)
		list[i] = src[i] + offsetIndex;
	return list;
}


Shapes.prototype.get = function( shapeName )
{
    // shallow copy the list of vertex data
    let clone = [...this.shapes[shapeName]];

    // go one level deeper for the connected lists
    clone.forEach((vertex) => {
        vertex.connected = [...vertex.connected];
    });

    return clone;
}
