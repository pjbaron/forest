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

        /* TODO: add a method to move the Verlet Shape and set up these parameters
        new Shape(
            scene,
            new THREE.Vector3(x, y, z),
            3,
            100,
            0.25,
            nodeMaterial,
            stickMaterial
        );
        */
    }

    update()
    {
        // update including wind-force
        this.verletShape.update({ x: Math.cos(Date.now() / 1000.0) * 1.0, y: 0, z: 0 });
        World.graphics.update(this.verletShape);
    }
}



