


class Verlet
{
    static numIterations = 7;

    static stiffness = 0.90;
    static damping = 1.0 - 0.01;


    constructor( vertices, indices, worldPosition )
    {
        this.vertices = vertices;
        this.oldVertices = null;
        this.lockedVertices = this.lockGroundVertices();
        this.edges = this.indicesToEdges(indices);
        this.worldPosition = worldPosition;
    }


    update( force )
    {
        this.move(force);
        this.constrainToWorld();
        for(var i = 0; i < Verlet.numIterations; i++)
            this.constrainToShape();
        this.constrainToWorld();
        return true;
    }


    indicesToEdges( indices )
    {
        const edges = [];
        const localVertices = this.vertices;

        function distance(i, j)
        {
            const a = indices[i] * 3;
            const b = indices[j] * 3;
            const dx = localVertices[b + 0] - localVertices[a + 0];
            const dy = localVertices[b + 1] - localVertices[a + 1];
            const dz = localVertices[b + 2] - localVertices[a + 2];
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }

        // indices represent triangles, stored as points a,b,c
        for(var i = 0, l = indices.length; i < l; i += 3)
        {
            // convert to edges linking each of the point pairs
            // * 3 because vertices are stored in a linear array with x,y,z for each
            edges.push({ a: indices[i + 0] * 3, b: indices[i + 1] * 3, l: distance(i + 0, i + 1) });
            edges.push({ a: indices[i + 1] * 3, b: indices[i + 2] * 3, l: distance(i + 1, i + 2) });
            edges.push({ a: indices[i + 2] * 3, b: indices[i + 0] * 3, l: distance(i + 2, i + 0) });
        }

        return edges;
    }


    /// set a lock for any edge vertex if it is touching the ground when the shape is created
    lockGroundVertices()
    {
        var locked = [];
        const l = this.vertices.length;
        for(var i = 0; i < l; i += 3)
        {
            locked[i / 3] = (this.vertices[i + 1] == World.groundLevel);
        }
        return locked;
    }


    constrainToWorld()
    {
        const wy = this.worldPosition.y;
        const l = this.vertices.length;
        for(var i = 0; i < l; i += 3)
        {
            const y = this.vertices[i + 1] + wy;
            if (y < World.groundLevel)
            {
                this.vertices[i + 1] = World.groundLevel - wy;
            }
        }
    }


    constrainToShape()
    {
        // for every edge
        for(var i = 0, l = this.edges.length; i < l; i++)
        {
            const edge = this.edges[i];
            const a = edge.a;
            const b = edge.b;
            const dx = this.vertices[b + 0] - this.vertices[a + 0];
            const dy = this.vertices[b + 1] - this.vertices[a + 1];
            const dz = this.vertices[b + 2] - this.vertices[a + 2];
            var length = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), Number.MIN_VALUE);
            const restLength = edge.l;
            // move both ends to approach the edge restLength
            var diff = (length - restLength) * Verlet.stiffness;
            var pcent = Math.min((diff / length) / 2.0, 1.0);
            var offx = dx * pcent;
            var offy = dy * pcent;
            var offz = dz * pcent;
            if (!this.lockedVertices[a / 3])
            {
                this.vertices[a + 0] += offx;
                this.vertices[a + 1] += offy;
                this.vertices[a + 2] += offz;
            }
            if (!this.lockedVertices[b / 3])
            {
                this.vertices[b + 0] -= offx;
                this.vertices[b + 1] -= offy;
                this.vertices[b + 2] -= offz;
            }
        }
    }


    move( force )
    {
        const memVertices = this.vertices.slice();
        if (!this.oldVertices) this.oldVertices = memVertices;

        // calculate simple forces on the vertex (F = m*a; m = 1.0; F = a)
        const applyForce = { x: force.x, y: force.y + World.gravity, z: force.z };

        // for all vertices in the shape
        const l = this.vertices.length;
        for(var i = 0; i < l; i += 3)
        {
            if (!this.lockedVertices[i / 3])
            {
                // calculate velocity from the motion last frame and the forces
                const velx = (this.vertices[i + 0] - this.oldVertices[i + 0]) * Verlet.damping + applyForce.x;
                const vely = (this.vertices[i + 1] - this.oldVertices[i + 1]) * Verlet.damping + applyForce.y;
                const velz = (this.vertices[i + 2] - this.oldVertices[i + 2]) * Verlet.damping + applyForce.z;

                // calculate the new vertex position, using the velocity
                const nx = this.vertices[i + 0] + velx;
                const ny = this.vertices[i + 1] + vely;
                const nz = this.vertices[i + 2] + velz;

                // set the new position
                this.vertices[i + 0] = nx;
                this.vertices[i + 1] = ny;
                this.vertices[i + 2] = nz;
            }
        }

        this.oldVertices = memVertices;
    }


    unlock()
    {
        const l = this.lockedVertices.length;
        for(var i = 0; i < l; i++)
            this.lockedVertices[i] = false;
    }


    cancelForces()
    {
        const memVertices = this.vertices.slice();
        this.oldVertices = memVertices;
    }


    lockToFloor()
    {
        const l = this.lockedVertices.length;
        for(var i = 0; i < l; i++)
        {
            if (Math.abs(this.vertices[i * 3 + 1] - World.groundLevel) < 0.01)
            {
                this.vertices[i * 3 + 1] = World.groundLevel;
                this.lockedVertices[i] = true;
            }
            else
            {
                this.lockedVertices[i] = false;
            }
        }
    }


}