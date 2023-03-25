//
// a single plant in the World
//



class Plant
{
    constructor(shapeName, x, y, z)
    {
        this.verletShape = new VerletShape(shapeName);
        this.verletShape.create({ x: x, y: y, z: z });

        this.shape = World.graphics.createShape(this.verletShape);
    }

    update()
    {
        // update including wind-force
        this.verletShape.update({ x: Math.cos(Date.now() / 1000.0) * World.windForce, y: 0, z: 0 });
        World.graphics.update(this.verletShape);
    }
}



