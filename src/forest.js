
class World
{
    // static world constants
    static worldSize = 400;
    static worldScale = 3;
    static gravity = -0.4;
    static windForce = 0.0;
    static velocityDamper = 0.9;

    static maxPlants = 1;
    static seedEnergyMin = 64;
    static seedEnergyMax = 256;
    static sunlightMultiplier = 1.0;        // seasonal variation and global control
    static energyCostMultiplier = 1.0;      // seasonal variation and global control

    static eyeLevel = 120;
    static groundLevel = 0;


    // static system references
    static shapes = null;
    static graphics = null;


    constructor()
    {
        World.Instance = this;
        World.graphics = new Graphics();
        World.shapes = new BasicShapes();
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
            var energy = Math.random() * (World.seedEnergyMax - World.seedEnergyMin) + World.seedEnergyMin;Math.random() * (World.seedEnergyMax - World.seedEnergyMin) + World.seedEnergyMin
            var plant = new Plant(x, World.groundLevel, z, energy);
            this.plants.push(plant);
        }
    }

    update()
    {
        var wind = { x: (Math.cos(Date.now() / 29000.0) + Math.cos(Date.now() / 2300.0) + Math.cos(Date.now() / 663)) * World.windForce, y: 0, z: 0 };
        // update every plant
        this.plants.forEach((plant) =>
        {
            plant.update(wind);
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
const world = new World();
world.create();
