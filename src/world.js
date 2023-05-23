
class World
{
    // static world constants
    static Instance = null;

    // world
    static mapSize = 60;

    // physics
    static gravity = -0.01;
    static windForce = 0.5;

    // light
    static sunHeight = 256.0;
    static indirectLightPercent = 0.5;  // pcent of direct sunlight which arrives indirectly
    static lightEnergyScaler = 0.01;    // the default plant receives ~125 light per tick, scale it down by this

    // time, seasons and weather
    static hoursPerDay = 24.0;          // hour 0 = midnight
    static daysPerYear = 25;            // day 0 = mid-winter
    static daySpeed = 0.5;

    // camera
    static eyeLevel = 5;
    static groundLevel = 0;
    static cameraSpeed = 0.1;
    static boostSpeed = 0.1;

    // plants
    static maxPlants = 128;
    static seedEnergy = 100;
    static plantSizeLimits = { x: 9, y: 25, z: 9 };
    static costOfLiving = 0.005;
    static plantMaxAge = 3 * this.daysPerYear;

    // public static variables
    static time = 6.00;
    static dayTime = World.time;



    constructor()
    {
        this.cubish = new Cubish();

        this.tick = 0;
        this.plants = null;
        this.ground = null;

        this.sun = null;
        this.ambient = null;
        this.shadowGenerator = null;

        this.skyMaterial = null;
        this.skyBox = null;

        World.time = 6.00;
        World.dayTime = World.time;
    }


    create()
    {
        this.scene = Control.scene.scene;

        // add a ground layer
        const groundOptions = { width: 1000, height: 1000, subdivisions: 10 };
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", groundOptions, this.scene);
        this.ground.setAbsolutePosition(0, World.groundLevel, 0);
        // create a material for the ground
        var material = new BABYLON.StandardMaterial("material", this.scene);
        material.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        material.diffuseColor = new BABYLON.Color3(0.05, 0.2, 0.0);
        this.ground.material = material;
        this.ground.receiveShadows = true;
        
        //const envTex = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/environmentSpecular.env', this.scene);
        this.skyMaterial = new BABYLON.SkyMaterial("skyMaterial", this.scene);
        this.skyMaterial.backFaceCulling = false;
        this.skyBox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, this.scene);
        this.skyBox.material = this.skyMaterial;
        this.skyMaterial.useSunPosition = true;
        this.skyMaterial.sunPosition = new BABYLON.Vector3(0, World.sunHeight, 0);

        // Create lights and attach to the scene
        this.sun = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, -1, 0), this.scene);
        this.sun.position = new BABYLON.Vector3(0, World.sunHeight, 0);
        this.sun.intensity = 1.0;
        this.sun.setDirectionToTarget(BABYLON.Vector3.Zero());
        this.sun.shadowEnabled = true;

        this.ambient = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.ambient.intensity = 1.0;

        // Create the shadow generator
        this.shadowGenerator = new BABYLON.ShadowGenerator(4096, this.sun);

        // build the initial crop
        this.plants = [];
        this.createPlants();
        this.preparePlants();

        // add date/time text to UI
        this.showDateTime = Control.ui.add( "text", {
            text: this.getDateTimeString(),
            x: 0, y: 0, width: 200, height: 50,
            hAlign: BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
            color: "#007f00", size: 12
        } );

        // commence the render loop, it is self-sustaining hereafter
        this.animate();
    }


    animate()
    {
        this.tick++;
        requestAnimationFrame(this.animate.bind(this));

        this.update();
    }


    update()
    {
        this.timeOfDay();

        var wind = {
            x: (Math.cos(Date.now() / 29000.0) + Math.cos(Date.now() / 2300.0) + Math.cos(Date.now() / 663)) / 1000.0 * World.windForce,
            y: 0 * World.windForce,
            z: (Math.sin(Date.now() / 21000.0) + Math.cos(Date.now() / 3100.0) + Math.sin(Date.now() / 517)) / 1000.0 * World.windForce,
        };

        const l = this.plants.length;
        for(var i = l - 1; i >= 0; i--)
        {
            const plant = this.plants[i];
            if (!plant.update( wind, i ))
            {
                console.log(World.dayTime + ": " + plant.mesh.name + " died, leaving [" + (this.plants.length - 1) + "]");
                plant.destroy();
                this.plants.splice( i, 1 );
            }
        }
    }


    timeOfDay()
    {
        // TODO: add moonlight

        // advance time of day (TODO: replace 1/60 with Control.elapsedTime)
        World.time = World.time + 1/60 * World.daySpeed;
        World.dayTime = World.time % 24.0;

        // angle to sun based on time-of-day (180 = noon)
        var dayAngle = World.dayTime / 24.0 * Math.PI * 2.0;
        // angle to sun based on time-of-year (0 = winter)
        var yearAngle = (World.time % World.daysPerYear) / 24.0 * Math.PI;

        this.sun.position.x = Math.sin(dayAngle) * World.sunHeight;
        this.sun.position.y = Math.cos(dayAngle) * -World.sunHeight;
        this.sun.position.z = Math.sin(yearAngle) * World.sunHeight;
        this.sun.setDirectionToTarget(BABYLON.Vector3.Zero());

        // update the visual 'sun' in the sky material
        this.skyMaterial.sunPosition = this.sun.position;

        // dimmer when crossing the horizon, off when below the horizon
        this.sun.intensity = Math.min(Math.max(0, (this.sun.position.y + World.sunHeight * 0.25) / World.sunHeight), 1.0);
        this.ambient.intensity = Math.min(Math.max(0.1, (this.sun.position.y + World.sunHeight * 0.125) / World.sunHeight), 1.0);

        Control.ui.modify("text", this.showDateTime, { text: this.getDateTimeString() });
    }


    createPlants()
    {
        for(var i = 0; i < World.maxPlants; i++)
        {
            var plant = new Plant(this.scene, this.cubish);
            plant.create( new BABYLON.Vector3( (Math.random() - 0.5) * World.mapSize, World.groundLevel, (Math.random() - 0.5) * World.mapSize ) );
            this.plants.push( plant );
            this.shadowGenerator.addShadowCaster( plant.mesh );
        }
    }


    preparePlants()
    {
        const l = this.plants.length;
        for(var i = 0; i < l; i++)
        {
            this.plants[i].prepare();
        }
    }


    getDateTimeString()
    {
        const days = Math.floor(World.time / World.hoursPerDay);
        const year = Math.floor(days / World.daysPerYear) + 1;
        const day = days % World.daysPerYear + 1;
        const hour = Math.floor(World.time % World.hoursPerDay);
        return "Year: " + ("000" + year).slice(-4) + " Day: " + day + " Time: " + hour + ":00";
    }
}
