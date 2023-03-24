

const PenetratingFrictionMultiplier = 0.1;

Verlet.numIterations = 12;


function Verlet( shapeName )
{
    this.shape = World.shapes.get(shapeName);
}


Verlet.prototype.create = function( offset )
{
	this.vertices = [];
	this.createVertices(offset);
	this.createConstraints();
}


Verlet.prototype.destroy = function()
{
	this.world = null;
}


Verlet.prototype.update = function( force )
{
	this.move( force );
	const friction = this.constrainToWorld();
	for(var i = 0; i < Verlet.numIterations; i++)
		this.constrainToShape(friction);
	return true;
}


Verlet.prototype.createVertices = function( offset )
{
	for(var i = 0; i < this.shape.length; i++)
	{
		var v = new Vertex();
		v.x = v.oldX = this.shape[i].x * World.worldScale + offset.x;
		v.y = v.oldY = this.shape[i].y * World.worldScale + offset.y;
		v.z = v.oldZ = this.shape[i].z * World.worldScale + offset.z;
		v.staticFriction = this.shape[i].staticFriction;
		this.vertices.push(v);
	}
}


Verlet.prototype.createConstraints = function()
{
	for(var i = 0; i < this.shape.length; i++)
	{
		var connects = this.shape[i].connected;
		for(var j = 0; j < connects.length; j++)
			this.createConstraint(i, connects[j]);
	}
}


Verlet.prototype.createConstraint = function( i, j )
{
	//console.log(i + "->" + j);
	var v1 = this.vertices[i];
	var v2 = this.vertices[j];
	var c = new Constraint();
	c.set(i, j, v1, v2);
    return c;
}


Verlet.prototype.move = function( force )
{
	var l = this.vertices.length;
	for(var i = 0; i < l; i++)
	{
		var v1 = this.vertices[i];
		if (v1.staticFriction == 1.0)
			continue;

        // TODO: apply force scaled by the cross-section area perpendicular to the force vector
		var fgy = force.y + World.gravity;
		var mag = Math.sqrt(force.x * force.x + fgy * fgy + force.z * force.z);
		if (mag <= v1.staticFriction)
			continue;
		
		var forceMag = v1.staticFriction / mag;
		var applyForce = { x: force.x * forceMag / mag, y: fgy * forceMag / mag, z: force.z * forceMag / mag };

        var dx = v1.x - v1.oldX;
        var dy = v1.y - v1.oldY;
        var dz = v1.z - v1.oldZ;

        v1.oldX = v1.x;
		v1.oldY = v1.y;
		v1.oldZ = v1.z;

		const percent = 0.5;
		var offx = dx * percent;
		var offy = dy * percent;
		var offz = dz * percent;

		v1.x += offx + applyForce.x;
		v1.y += offy + applyForce.y;
		v1.z += offz + applyForce.z;
	}
}


Verlet.prototype.constrainToWorld = function()
{
    const friction = [];
	const l = this.vertices.length;
	for(var i = 0; i < l; i++)
	{
		const v1 = this.vertices[i];
        var f = 0.0;
        var py = World.groundLevel - v1.y;
		if (py > 0)
        {
            // the deeper the ground penetration, the greater the friction, to 1.0
            f = Math.min(py * PenetratingFrictionMultiplier, 1.0);
            v1.y = World.groundLevel;
        }
        friction.push(f);
	}
    return friction;
}


Verlet.prototype.constrainToShape = function()
{
	var l = this.vertices.length;
	for(var i = 0; i < l; i++)
	{
		var v1 = this.vertices[i];
		var c = v1.constraints;
		var k = c.length;
		for(var j = 0; j < k; j++)
		{
			var constraint = c[j];
			var i2 = constraint.otherEndIndex(i);
            var v2 = this.vertices[i2];
            //console.log("v1 " + i + " v2 " + i2);

			var dx = v2.x - v1.x;
			var dy = v2.y - v1.y;
			var dz = v2.z - v1.z;
			var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
			if (d <= Number.MIN_VALUE) d = Number.MIN_VALUE;
			var diff = d - constraint.length;
			var pcent = (diff / d) / 2.0;
			if (pcent > 1.0) pcent = 1.0;
            //console.log("d " + d + " diff " + diff + " pcent " + pcent);
			var offx = dx * pcent;
			var offy = dy * pcent;
			var offz = dz * pcent;
			if (v2.staticFriction != 1.0)
			{
				v2.x -= offx;
				v2.y -= offy;
				v2.z -= offz;
			}
			if (v1.staticFriction != 1.0)
			{
				v1.x += offx;
				v1.y += offy;
				v1.z += offz;
			}
		}
	}

}



/*
// Calculate the distance between the two nodes
Vector2f delta = node2.currentPosition - node1.currentPosition;
float distance = delta.magnitude();

// Check for zero distance
if (distance == 0.0f) {
    return; // no force can be applied
}

// Calculate the error (i.e., how much the distance differs from the desired length)
float error = distance - desiredLength;

// Calculate the force to apply to each node
Vector2f force = delta.normalized() * error * stiffness;

// Check if the force exceeds the threshold value
float threshold = 0.1f; // adjust this value to control the threshold
float forceMag = force.magnitude();
if (forceMag < threshold) {
  // Apply a reduced force that is proportional to the force exerted but limited by the maximum resistance provided by the joint
  force *= threshold / forceMag;
}

// Apply the force to each node
node1.applyForce(force);
node2.applyForce(-force);







// 'stiffness' against bending
// ... not sure about this, I think the angular threshold stuff won't give the desired results, worth a try though

// Note that in this code, `Node` is a class that represents a verlet integration node, with properties for position, old position, mass, and radius.
// The code also assumes that you have a `scene` object that is a reference to the BabylonJS scene where the simulation is being rendered.
// You may need to adjust the values of the stiffness, length, and other parameters depending on your specific use case.

class Link
{
    constructor(nodeIndex1, nodeIndex2, stiffness, length)
    {
        this.nodeIndex1 = nodeIndex1;
        this.nodeIndex2 = nodeIndex2;
        this.stiffness = stiffness;
        this.length = length;
    }
}

const nodes = [];
const links = [];
const gravity = new BABYLON.Vector3(0, -9.81, 0);
const deltaTime = 0.016;
const angularThreshold = Math.PI / 4; // 45 degrees in radians

// create nodes
nodes.push(new Node(0, 0, 0, 1));
nodes.push(new Node(0, 1, 0, 1));
nodes.push(new Node(0, 2, 0, 1));

// create links
links.push(new Link(0, 1, 1, 1));
links.push(new Link(1, 2, 1, 1));

// update node positions
for (let i = 0; i < nodes.length; i++)
{
    const node = nodes[i];
    const acceleration = gravity.scale(node.mass);
    const newPosition = node.position
        .scale(2)
        .subtract(node.oldPosition)
        .add(acceleration.scale(deltaTime * deltaTime));
    node.oldPosition = node.position;
    node.position = newPosition;
}

// apply threshold for angular bending
for (let i = 0; i < links.length - 1; i++)
{
    const link1 = links[i];
    const node1 = nodes[link1.nodeIndex1];
    const node2 = nodes[link1.nodeIndex2];
    const link2 = links[i + 1];
    const node3 = nodes[link2.nodeIndex2];

    const v1 = node1.position.subtract(node2.position);
    const v2 = node3.position.subtract(node2.position);
    const angle = Math.acos(BABYLON.Vector3.Dot(v1.normalize(), v2.normalize()));

    if (angle < angularThreshold)
    {
        const correction = v1.cross(v2).normalize().scale((angularThreshold - angle) * 0.5);
        const force1 = correction.scale(node2.mass * link1.stiffness);
        const force2 = correction.scale(-node2.mass * link2.stiffness);

        node1.position = node1.position.add(force1.scale(deltaTime * deltaTime));
        node2.position = node2.position.add(force1.add(force2).scale(deltaTime * deltaTime));
        node3.position = node3.position.add(force2.scale(deltaTime * deltaTime));
    }
}

// render nodes using BabylonJS
for (let i = 0; i < nodes.length; i++)
{
    const node = nodes[i];
    const sphere = BABYLON.MeshBuilder.CreateSphere(node-${i}, { diameter: node.radius * 2 });
    sphere.position.copyFrom(node.position);
    sphere.material = new BABYLON.StandardMaterial(material-${i}, scene);
    sphere.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
}
*/

