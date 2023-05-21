
class World
{
    // static world constants
    static Instance = null;

    // world
    static mapSize = 60;

    // physics
    static gravity = -0.01;
    static windForce = 0.001;

    // light
    static sunHeight = 256.0;
    static indirectLightPercent = 0.5;  // pcent of direct sunlight which arrives indirectly

    // camera
    static eyeLevel = 5;
    static groundLevel = 0;
    static cameraSpeed = 0.1;

    // plants
    static maxPlants = 1;
    static seedEnergy = 16;
    static seedNutrients = 16;
    static plantSize = { x: 9, y: 25, z: 9 };



    constructor()
    {
        this.cubish = new Cubish();

        this.tick = 0;
        this.plants = null;
        this.ground = null;

        this.camera = null;
        this.sun = null;
        this.ambient = null;
        this.shadowGenerator = null;

        this.skyMaterial = null;
        this.skyBox = null;

        this.physEngine = null;

        this.time = 12.00;
    }


    create()
    {
        // graphics engine scene reference
        this.scene = this.createScene();

        // add a ground layer
        const groundOptions = { width: 1000, height: 1000, subdivisions: 100 };
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", groundOptions, this.scene);
        this.ground.setAbsolutePosition(0, World.groundLevel, 0);
        // create a material for the ground
        var material = new BABYLON.StandardMaterial("material", this.scene);
        material.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        material.diffuseColor = new BABYLON.Color3(0.05, 0.2, 0.0);
        this.ground.material = material;
        this.ground.receiveShadows = true;

        // build the initial crop
        this.plants = [];
        this.createPlants();
        this.preparePlants();

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
            x: (Math.cos(Date.now() / 29000.0) + Math.cos(Date.now() / 2300.0) + Math.cos(Date.now() / 663)) * World.windForce,
            y: 0 * World.windForce,
            z: 0 * World.windForce
        };

        const l = this.plants.length;
        for(var i = 0; i < l; i++)
        {
            // TODO: verlet, including wind and gravity
            
            if (!this.plants[i].update( wind, i ))
                this.plants.splice( i, 1 );
        }
    }


    timeOfDay()
    {
        // advance time of day
        this.time = (this.time + 1/60 * 0.1) % 24.0;  // 6 seconds per tick

        // angle to sun (180 = above at noon)
        var angle = this.time / 24.0 * Math.PI * 2.0;

        this.sun.position.x = Math.sin(angle) * World.sunHeight;
        this.sun.position.y = Math.cos(angle) * -World.sunHeight;
        this.sun.position.z = 0;                    // TODO: seasonal variation here
        this.sun.setDirectionToTarget(BABYLON.Vector3.Zero());

        this.skyMaterial.sunPosition = this.sun.position;

        // dimmer when crossing the horizon, off when below the horizon
        this.sun.intensity = Math.min(Math.max(0, (this.sun.position.y + 100.0) / 250.0), 1.0);

        // TODO: add moonlight
        this.ambient.intensity = Math.min(Math.max(0.1, (this.sun.position.y + 50.0) / 150.0), 1.0);
    }


    createScene()
    {
        // Create a new scene
        var scene = new BABYLON.Scene(Control.engine);

        // Create a camera and attach it to the scene
        this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, World.eyeLevel, -World.mapSize * 0.75), scene);
        this.camera.attachControl(Control.canvas, true);
        this.camera.rotation = new BABYLON.Vector3(10 * Math.PI / 180, 0, 0);
        this.camera.inertia = 0;
        this.camera.speed = 1.0;

        // Modify camera's keyboard controls
        const dsm = new BABYLON.DeviceSourceManager(scene.getEngine());
        dsm.onDeviceConnectedObservable.add((eventData) => this.registerWASD( dsm, eventData, scene ));

        //const envTex = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/environmentSpecular.env', scene);
        this.skyMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
        this.skyMaterial.backFaceCulling = false;
        this.skyBox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
        this.skyBox.material = this.skyMaterial;
        this.skyMaterial.useSunPosition = true;
        this.skyMaterial.sunPosition = new BABYLON.Vector3(0, World.sunHeight, 0);

        // Create lights and attach to the scene
        this.sun = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, -1, 0), scene);
        this.sun.position = new BABYLON.Vector3(0, World.sunHeight, 0);
        this.sun.intensity = 1.0;
        this.sun.setDirectionToTarget(BABYLON.Vector3.Zero());
        this.sun.shadowEnabled = true;

        this.ambient = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
        this.ambient.intensity = 1.0;

        // Create the shadow generator
        this.shadowGenerator = new BABYLON.ShadowGenerator(4096, this.sun);

        // Enable Physics for raycasting
        scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
        scene.checkCollisions = true;
        this.physEngine = scene.getPhysicsEngine();

        return scene;
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


    registerWASD( dsm, eventData, scene )
    {
        if (eventData.deviceType === BABYLON.DeviceType.Keyboard) {
            const keyboard = dsm.getDeviceSource(BABYLON.DeviceType.Keyboard);

            // register the keyboard listener/action function on the scene
            scene.beforeRender = () => {
                const w = keyboard.getInput(87);
                const a = keyboard.getInput(65);
                const s = keyboard.getInput(83);
                const d = keyboard.getInput(68);
                const e = keyboard.getInput(69);
                const q = keyboard.getInput(81);
                if (w === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Forward().scale(World.cameraSpeed)));
                }
                if (s === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Backward().scale(World.cameraSpeed)));
                }
                if (a === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Left().scale(World.cameraSpeed)));
                }
                if (d === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Right().scale(World.cameraSpeed)));
                }
                if (e === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Up().scale(World.cameraSpeed)));
                }
                if (q === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Down().scale(World.cameraSpeed)));
                }
            };
        }
    }
}
