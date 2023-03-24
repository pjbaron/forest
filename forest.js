// World
// Shapes
//   Plant
//     Verlet
//


// globally accessible world constants
World.worldSize = 50;
World.worldScale = 10;
World.gravity = -0.6;

World.maxPlants = 1;

World.eyeLevel = 30;
World.groundLevel = 0;


// globally accessible system references
World.shapes = null;
World.graphics = null;



function World()
{
    World.Instance = this;
    World.graphics = new Graphics();
    World.shapes = new Shapes();
    this.plants = [];
}


World.prototype.create = function()
{
    this.createPlants();

    // commence the render loop, it is self-sustaining hereafter
    this.animate();
}


World.prototype.createPlants = function()
{
    // initialize plants
    for (let i = 0; i < World.maxPlants; i++)
    {
        var x = World.worldSize * Math.random() - World.worldSize / 2;
        var z = World.worldSize * Math.random() - World.worldSize / 2;
        var plant = new Plant("stick2", x, World.groundLevel, z);
        this.plants.push(plant);
    }
}


World.prototype.update = function()
{
    // update every plant
    this.plants.forEach((plant) => {
        // TODO: life-cycle and possible death
        plant.update();
        // TODO: update the graphical representation to match the new verlet node positions
    });
}


World.prototype.animate = function()
{
    requestAnimationFrame(this.animate.bind(this));
    this.update();
    World.graphics.render();
}


// create the World and start the animate loop
new World().create();
