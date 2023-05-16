
class World
{
    // static world constants
    static gravity = -0.02;
    static windForce = 0.0;

    static maxPlants = 1;

    static eyeLevel = 20;
    static groundLevel = 0;

    static seedEnergy = 10;
    static seedNutrients = 10;

    static plantSize = { x: 8, y: 16, z: 8 };



    constructor()
    {
        this.cubish = new Cubish();

        this.tick = 0;
        this.plants = null;
    }


    create( scene )
    {
        // graphics engine scene reference
        this.scene = scene;

        // build the initial crop
        this.plants = [];
        this.createPlants();

        // commence the render loop, it is self-sustaining hereafter
        this.animate();
    }


    update()
    {
        var wind = { x: (Math.cos(Date.now() / 29000.0) + Math.cos(Date.now() / 2300.0) + Math.cos(Date.now() / 663)) * World.windForce, y: 0, z: 0 };

        for(var i = 0, l = this.plants.length; i < l; i++)
        {
            // TODO: verlet, including wind and gravity
            
            if (!this.plants[i].update( wind ))
                this.plants.splice( i, 1 );
        }
    }


    animate()
    {
        this.tick++;
        requestAnimationFrame(this.animate.bind(this));

        this.update();
    }


    createPlants()
    {
        for(var i = 0; i < World.maxPlants; i++)
        {
            var plant = new Plant(this.scene, this.cubish);
            plant.create();
            this.plants.push(plant);            
        }
    }

}
