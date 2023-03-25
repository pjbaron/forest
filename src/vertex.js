//
// a Vertex for a Verlet Integration system
// (not general purpose)  TODO: rename to be more specific!
//

class Vertex
{
    constructor( x, y, z )
    {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.oldX = this.x;
        this.oldY = this.y;
        this.oldZ = this.z;
        this.staticFriction = 0.0;
    }

    static fromObject( object )
    {
        var v = new Vertex(object.x, object.y, object.z);
        v.staticFriction = object.staticFriction || 0;
        return v;
    }

    clone()
    {
        var v = new Vertex(this.x, this.y, this.z);
        v.staticFriction = this.staticFriction;
        return v;
    }
}


