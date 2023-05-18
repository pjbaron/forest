
class World
{
    // static world constants


    // world
    static mapSize = 100;

    // physics
    static gravity = -0.01;
    static windForce = 0.001;

    // camera
    static eyeLevel = 5;
    static groundLevel = 0;

    // plants
    static maxPlants = 16;
    static seedEnergy = 16;
    static seedNutrients = 16;
    static plantSize = { x: 9, y: 25, z: 9 };



    constructor()
    {
        this.cubish = new Cubish();

        this.tick = 0;
        this.plants = null;
        this.ground = null;
    }


    create( scene )
    {
        // graphics engine scene reference
        this.scene = scene;

        // add a ground layer
        const groundOptions = { width: 1000, height: 1000, subdivisions: 100 };
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", groundOptions, this.scene);
        this.ground.setAbsolutePosition(0, World.groundLevel, 0);
        // create a material for the ground
        var material = new BABYLON.StandardMaterial("material", scene);
        material.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        material.diffuseColor = new BABYLON.Color3(0.05, 0.2, 0.0);
        this.ground.material = material;

        // build the initial crop
        this.plants = [];
        this.createPlants();

        // commence the render loop, it is self-sustaining hereafter
        this.animate();
    }


    update()
    {
        var wind = {
            x: (Math.cos(Date.now() / 29000.0) + Math.cos(Date.now() / 2300.0) + Math.cos(Date.now() / 663)) * World.windForce,
            y: 0 * World.windForce,
            z: 0 * World.windForce
        };

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
            plant.create( new BABYLON.Vector3((Math.random() - 0.5) * World.mapSize, World.groundLevel, (Math.random() - 0.5) * World.mapSize));
            this.plants.push(plant);
        }
    }

}
