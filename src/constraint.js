//
// a constraint between two Vertex objects
// attaches itself to the vertices when .set is called
//

function Constraint()
{
    this.i1 = -1;
    this.i2 = -1;
	this.v1 = null;
	this.v2 = null;
	this.length = 0;
}


Constraint.prototype.set = function( _i1, _i2, _v1, _v2 )
{
    this.i1 = _i1;
    this.i2 = _i2;
	this.v1 = _v1;
	this.v2 = _v2;

	_v1.addConstraint(this);
	_v2.addConstraint(this);

	var dx = _v1.x - _v2.x;
	var dy = _v1.y - _v2.y;
	var dz = _v1.z - _v2.z;
	this.length = Math.sqrt(dx * dx + dy * dy + dz * dz);
}


Constraint.prototype.otherEnd = function( _v )
{
	if (this.v1 == _v) return this.v2;
	return this.v1;
}


Constraint.prototype.otherEndIndex = function( _i )
{
	if (this.i1 == _i) return this.i2;
	return this.i1;
}
