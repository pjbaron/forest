

class VerletShape
{
    static PenetratingFrictionMultiplier = 0.1;
    static numIterations = 12;


    constructor( shapeName )
    {
        this.shape = World.shapes.cloneOfShape(shapeName);
        //console.log(JSON.stringify(this.shape));
    }

    create( offset )
    {
        this.shape.vertices = this.createVertices(this.shape.shapeVertices, offset);
        this.createEdges();
    }

    destroy()
    {
        this.world = null;
    }

    update( force )
    {
        this.move(force);
        const friction = this.constrainToWorld();
        for(var i = 0; i < VerletShape.numIterations; i++)
            this.constrainToShape(friction);
        return true;
    }

    createVertices( shapeVertices, offset )
    {
        const vertexList = [];

        for(var i = 0; i < shapeVertices.length; i++)
        {
            const baseVertex = shapeVertices[i];
            var worldVertex = new Vertex(
                baseVertex.x * World.worldScale + offset.x,
                baseVertex.y * World.worldScale + offset.y,
                baseVertex.z * World.worldScale + offset.z);
            worldVertex.staticFriction = baseVertex.staticFriction;
            vertexList[i] = worldVertex;
        }

        return vertexList;
    }

    createEdges()
    {
        const vertexList = this.shape.vertices;
        for(var i = 0; i < vertexList.length; i++)
        {
            this.replaceEdgeVertexReferences(i, vertexList[i]);
        }

        // calculate the 'rest' angles between all edge pairs joining a specific vertex
        // shapeVertices.forEach((vertex) => {
        //     World.shapes.connectionsWithAngles( vertex.connectedEdges, this.shape.edges );
        // });

        this.calculateAllRestingEdgeLengths();
    }

    replaceEdgeVertexReferences( index, vertex )
    {
        const edges = this.shape.edges;
        for(var i = 0, l = edges.length; i < l; i++)
        {
            if (edges[i].startData.index == index)
            {
                edges[i].startData.vertex = vertex;
            }
            if (edges[i].endData.index == index)
            {
                edges[i].endData.vertex = vertex;
                //console.log(`end ${i} ${index}`);
            }
        }
    }

    calculateAllRestingEdgeLengths()
    {
        const edges = this.shape.edges;
        for(var i = 0, l = edges.length; i < l; i++)
        {
            const vector = edges[i].vector;
            var v = createVector(edges[i].startData.vertex, edges[i].endData.vertex);
            edges[i].vector = v;
        }
    }

    move( force )
    {
        var l = this.shape.vertices.length;
        //console.log(this.shape.vertices[l - 1]);
        for(var i = 0; i < l; i++)
        {
            var v1 = this.shape.vertices[i];
            if (v1.staticFriction == 1.0)
                continue;

            // TODO: apply force scaled by the cross-section area perpendicular to the force vector
            var fgy = force.y + World.gravity;
            var mag = Math.sqrt(force.x * force.x + fgy * fgy + force.z * force.z);
            //if (mag <= v1.staticFriction)
                //continue;

            var forceMag = (1.0 - v1.staticFriction) / mag;
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

    constrainToWorld()
    {
        const friction = [];
        const l = this.shape.vertices.length;
        for(var i = 0; i < l; i++)
        {
            const v1 = this.shape.vertices[i];
            var f = 0.0;
            var py = World.groundLevel - v1.y;
            if (py > 0)
            {
                // the deeper the ground penetration, the greater the friction, to 1.0
                f = Math.min(py * VerletShape.PenetratingFrictionMultiplier, 1.0);
                v1.y = World.groundLevel;
            }
            friction.push(f);
        }
        return friction;
    }

    constrainToShape()
    {
        // for every edge in the shape
        for(var i = 0, l = this.shape.edges.length; i < l; i++)
        {
            const edge = this.shape.edges[i];
            const v1 = edge.startData.vertex;
            const v2 = edge.endData.vertex;
            const restLength = Math.sqrt(edge.vector.l2);
//console.log(i +  " " + length);
            // move both ends towards the initial edge length
            var dx = v2.x - v1.x;
            var dy = v2.y - v1.y;
            var dz = v2.z - v1.z;
            var d = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), Number.MIN_VALUE);
            var diff = d - restLength;
            var pcent = Math.min((diff / d) / 2.0, 1.0);
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

