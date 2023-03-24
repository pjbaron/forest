//
// a Vertex for a Verlet Integration system
// (not general purpose)  TODO: rename to be more specific!
//

function Vertex()
{
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.oldX = 0;
	this.oldY = 0;
	this.oldZ = 0;
	this.constraints = [];
	this.staticFriction = 0.0;
}


Vertex.prototype.addConstraint = function( _constraint )
{
	this.constraints.push( _constraint );
}
