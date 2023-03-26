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

    update( wind )
    {
        // update physics, including wind-force
        this.verletShape.update(wind);

        // update the graphic representation to match the current physics configuration
        World.graphics.update(this.verletShape);
    }
}



