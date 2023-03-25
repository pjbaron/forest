//
// a Vertex for a Verlet Integration system
// (not general purpose)  TODO: rename to be more specific!
//

class Vertex
{
    constructor(x, y, z)
    {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.oldX = this.x;
        this.oldY = this.y;
        this.oldZ = this.z;
        this.staticFriction = 0.0;
    }

    clone()
    {
        var v = new Vertex();
        v.x = this.x;
        v.y = this.y;
        v.z = this.z;
        v.oldX = this.oldX;
        v.oldY = this.oldY;
        v.oldZ = this.oldZ;
        v.staticFriction = this.staticFriction;
        return v;
    }
}


