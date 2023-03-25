//
// a single plant in the World
//



class Plant
{
    constructor(shapeName, x, y, z)
    {
        // create the VerletShape which represents the physics object for this plant
        this.verletShape = new VerletShape(shapeName);
        this.verletShape.create({ x: x, y: y, z: z });

        // create the graphic representation of the VerletShape
        World.graphics.createShape(this.verletShape);
    }

    update()
    {
        // update physics, including wind-force
        this.verletShape.update({ x: Math.cos(Date.now() / 1000.0) * World.windForce, y: 0, z: 0 });

        // update the graphic representation to match the current physics configuration
        World.graphics.update(this.verletShape);
    }
}



