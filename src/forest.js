// World
// Shapes
//   Plant
//     Verlet
//


class World
{
    // static world constants
    static worldSize = 50;
    static worldScale = 5;
    static gravity = -0.2;
    static windForce = 0.1;

    static maxPlants = 2;

    static eyeLevel = 30;
    static groundLevel = 0;


    // static system references
    static shapes = null;
    static graphics = null;


    constructor()
    {
        World.Instance = this;
        World.graphics = new Graphics();
        World.shapes = new Shapes();
        this.plants = [];
    }

    create()
    {
        this.createPlants();

        // commence the render loop, it is self-sustaining hereafter
        this.animate();
    }

    createPlants()
    {
        // initialize plants
        for(let i = 0; i < World.maxPlants; i++)
        {
            var x = World.worldSize * Math.random() - World.worldSize / 2;
            var z = World.worldSize * Math.random() - World.worldSize / 2;
            var plant = new Plant("stick2", x, World.groundLevel, z);
            this.plants.push(plant);
        }
    }

    update()
    {
        // update every plant
        this.plants.forEach((plant) =>
        {
            plant.update();
        });
    }

    animate()
    {
        requestAnimationFrame(this.animate.bind(this));
        this.update();
        World.graphics.render();
    }
}


// create the World and start the animate loop
const world = new World().create();
