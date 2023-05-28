
// TODO: class is too big, break it down further: seed, growthSystem, energySystem

class Plant
{
    static id = 0;

    constructor( scene, cubish )
    {
        // GUID
        this.id = Plant.id++;

        // received
        this.scene = scene;
        this.cubish = cubish;

        // created
        this.model = null;
        this.mesh = null;
        this.vertices = null;
        this.indices = null;
        this.verlet = null;
        this.leaves = null;

        this.setParams();
        this.mutateParams(this);
        this.setControlVars();
    }


    setParams()
    {
        // DNA
        this.seedStartDelay = 2.0;              // delay in days before plant starts growing a seed
        this.seedStorePercent = 0.40;           // how much of total energy goes into a growing seed
        this.seedEnergy = World.seedEnergy;     // how much energy does the plant's seed require
        this.seedReleaseDelay = 0.1;            // delay in days before a full seed will be released
        this.seedReleasePower = 7;              // amount of energy to propel the seed on release
        this.ageDamage = 1.0;                   // how quickly does this plant age
        this.maximumAge = World.plantMaxAge;    // maximum age for this plant
        this.growthEnergyPercent = 0.50;        // amount of energy the plant uses for growth (stored = total - seed - growth)
        this.growthEnergyCurve = 0.99999;       // growth energy percent is multiplied by this constant daily
        this.storeEfficiency = 0.75;            // amount of energy that can be retrieved from store
        this.energyPerCell = 50;                // total amount of energy that can be stored in each cell
    }


    mutateParams(plant)
    {
        function tenPcent() {
            return 0.9 + Math.random() * 0.2;
        }
        // DNA
        this.seedStartDelay = plant.seedStartDelay * tenPcent();
        this.seedStorePercent = Math.min(plant.seedStorePercent * tenPcent(), 0.9);
        this.seedEnergy = plant.seedEnergy * tenPcent();
        this.seedReleaseDelay = plant.seedReleaseDelay * tenPcent();
        this.seedReleasePower = plant.seedReleasePower * tenPcent();
        this.ageDamage = plant.ageDamage * tenPcent();
        this.maximumAge = plant.maximumAge * tenPcent();
        this.growthEnergyPercent = Math.min(plant.growthEnergyPercent * tenPcent(), 0.9);
        this.growthEnergyCurve = Math.min(plant.growthEnergyCurve * tenPcent(), 0.9999999);
        this.storeEfficiency = Math.min(plant.storeEfficiency * tenPcent(), 0.9);
        this.energyPerCell = plant.energyPerCell * tenPcent();
    }


    setControlVars()
    {
        // control variables
        this.totalLight = 0;
        this.storedEnergy = World.seedEnergy;
        this.growthEnergy = 0;
        this.seedStore = 0;
        this.seedStartDate = World.time + this.seedStartDelay * World.hoursPerDay;
        this.seedLaunchDate = 0;
        this.dateOfBirth = World.time;
        this.launching = false;
        this.worldPosition = null;
        this.numCells = 0;
        this.currentAge = 0;
    }

            
    create( worldPosition )
    {
        this.worldPosition = new BABYLON.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);

        // build a 'plant' model (3 cells, stacked vertically)
        this.model = new Model();
        this.model.create();
        this.numCells = 1;
        this.model.add({x: 0, y: 1, z: 0});
        this.model.add({x: 0, y: 2, z: 0});

        // build a 'plant' mesh and find its light receiving surfaces ('leaves')
        this.buildMesh();

        // initialise plant variables
        this.launching = false;
        this.totalLight = 0;
        // TODO: should vary depending on plant status as well as size (hibernate at night, growth speed...)
        this.costOfLivingPlant = World.costOfLivingPlant;
        this.costOfLivingCells = World.costOfLivingCell * this.leaves.length;

        // DEBUG: test launch
        //if (this.id == 0)
            //this.launchSeed( this.seedReleasePower );
    }


    destroy()
    {
        if (this.mesh) this.mesh.dispose();
        this.model = null;
        this.vertices = null;
        this.indices = null;
        this.verlet = null;
        this.leaves = null;
    }


    /// prepare this plant for update, once per plant *after* all plants are created
    prepare()
    {
        // calculate the amount of light landing on each triangle
        this.lightAmount();
    }


    /// return false if the plant dies
    update( force, plantIndex )
    {
        // TODO: use plantIndex to time-slice intensive calculations (e.g. light received)
        // plantIndex is not fixed for a given plant - the plant list is mutable

        // update physics, refresh the mesh
        this.verlet.update( force );
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this.vertices);

        if (this.launching)
        {
            this.launching = this.flyingSeedPod();
            return true;
        }

        // lazy recalculation of light, one plant per frame
        // TODO: very inaccurate when many plants and fast day cycle
        if (plantIndex == (Math.floor(Control.world.tick % Control.world.plants.length)))
            this.lightAmount();

        // divide the light energy amongst seed growth, plant growth, and storage
        // TODO: include elapsed real-time?
        var totalEnergy = this.totalLight;
        totalEnergy = this.seedGrowth(totalEnergy);
        totalEnergy = this.plantGrowth(totalEnergy);

        // store the remaining energy at a loss, with a cap
        this.storedEnergy = Math.min(this.storedEnergy + totalEnergy * this.storeEfficiency, this.energyPerCell * this.model.cellCount);
        this.storedEnergy -= this.costOfLivingPlant + this.costOfLivingCells;
        if (this.storedEnergy <= 0)
            console.log(Math.floor(World.time / 24 * 100) / 100 + ": " + this.mesh.name + " died of low energy  " + Math.floor((World.time - this.dateOfBirth) / 24 * 100) / 100 + " days (" + this.currentAge + ")");

        this.ageing();

        return (this.storedEnergy > 0);
    }


    ageing()
    {
        this.currentAge += this.ageDamage;
        // chance of death increases every update cycle, never reaches a guarantee
        const deathChance = 1.0 / Math.max((this.maximumAge - this.currentAge), 1.1);
        if (Math.random() < deathChance)
        {
            this.storedEnergy = 0;
            console.log(Math.floor(World.time / 24 * 100) / 100 + ": " + this.mesh.name + " died of old age at " + Math.floor((World.time - this.dateOfBirth) / 24 * 100) / 100 + " days (" + this.currentAge + ")");
        }
    }


    buildMesh()
    {
        // get rid of an old mesh
        if (this.mesh)
            this.mesh.dispose();

        // build a new custom mesh from the model
        this.mesh = this.cubish.createCustomMesh(this.scene, this.model, {x:0, y:0.5, z:0});
        this.mesh.setAbsolutePosition(this.worldPosition);
        this.mesh.checkCollisions = true;
        Control.world.shadowGenerator.addShadowCaster(this.mesh);

        // data references, then build the verlet representation for soft-body physics
        this.vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        this.indices = this.mesh.getIndices();
        this.verlet = new Verlet(this.vertices, this.indices, this.worldPosition);

// DEBUG: verify face normal calculations are correct
//const newFaceNormal = this.cubish.getFaceNormal(0, this.vertices, this.indices);
//console.log("seed face 0 start normal " + newFaceNormal);
    
        // find all the leaves (triangles which have a normal with y >= 0)
        this.leaves = this.findLeaves();
    }


    plantGrowth( totalEnergy )
    {
        // if we're not fully grown yet
        if (this.model.cellCount > this.numCells)
        {
            // allocate to growth
            var forGrowth = totalEnergy * Math.min(this.growthEnergyPercent, 1.0);
            totalEnergy -= forGrowth;
            this.growthEnergy += forGrowth;
            // TODO: spend growth energy on growth immediately

            // modify how much of our energy we spend on growth
            this.growthEnergyPercent *= this.growthEnergyCurve;
            // TODO: add growth energy curve over the course of a day

            if (this.growthEnergy >= World.cellEnergyCost)
            {
                if (this.model.grow())
                {
                    this.growthEnergy -= World.cellEnergyCost;
                    this.numCells++;
                    this.buildMesh();
                }
            }
        }
        return totalEnergy;
    }


    seedGrowth( totalEnergy )
    {
        // are we growing a seed yet?
        if (World.time > this.seedStartDate)
        {
            // is the seed still growing?
            if (this.seedStore < this.seedEnergy)
            {
                // allocate to the seed
                // TODO: add seed growth energy curve over the course of a day
                var forSeed = Math.min(totalEnergy * this.seedStorePercent, this.seedEnergy - this.seedStore);
                totalEnergy -= forSeed;
                this.seedStore += forSeed;
                // when full, calculate the seed launch day
                if (this.seedStore >= this.seedEnergy)
                    this.seedLaunchDate = World.time + this.seedReleaseDelay * World.hoursPerDay;
            }
            else
            {
                // the seed is full, wait for launch-day (and an available plant slot)
                if (World.time >= this.seedLaunchDate && Control.world.plants.length < World.maxPlants)
                {
                    // charge the seed's launch price
                    this.seedStore -= this.seedReleasePower;
                    if (this.seedStore > 0)
                    {
                        // launch the seed
                        const seed = this.clone();
                        // TODO: mutations to DNA
                        Control.world.addNewPlant(seed);
                        seed.launchSeed(seed.seedReleasePower);
                        console.log(Math.floor(World.time / 24 * 100) / 100 + ": " + this.mesh.name + " seeded to " + seed.mesh.name);
                    }
                    this.seedStore = 0;
                    this.seedStartDate = World.time + this.seedStartDelay * World.hoursPerDay;
                }
            }
        }
        return totalEnergy;
    }


    /// return list of all triangles which are facing upwards or outwards
    findLeaves()
    {
        const leaves = [];
        
        // iterate all indices in trios to obtain the triangles
        const l = this.indices.length;
        for(var i = 0; i < l; i += 3)
        {
            // collect the vertices and calculate a surface normal (anti-clockwise winding)
            const i0 = this.indices[i + 0] * 3;
            const v0 = new BABYLON.Vector3(this.vertices[i0 + 0], this.vertices[i0 + 1], this.vertices[i0 + 2]);
            const i1 = this.indices[i + 1] * 3;
            const v1 = new BABYLON.Vector3(this.vertices[i1 + 0], this.vertices[i1 + 1], this.vertices[i1 + 2]);
            const i2 = this.indices[i + 2] * 3;
            const v2 = new BABYLON.Vector3(this.vertices[i2 + 0], this.vertices[i2 + 1], this.vertices[i2 + 2]);

            // if the surface normal is up or out from the seed location (centre of the model) include this triangle
            const normal = this.calcNormal(v0, v1, v2);
            const pos = v0.add(v1).add(v2).scale(1/3);
            if (normal.y >= -0.1)
            {
                leaves.push( { i0: i0, i1: i1, i2: i2, v0: v0, v1: v1, v2: v2, position: pos, normal: normal, light: 0.0, debug: {} });
            }
        }
        return leaves;
    }


    calcNormal( v0, v1, v2 )
    {
        return v0.subtract(v1).cross(v2.subtract(v1));
    }


    lightAmount()
    {
        const sunPos = Control.world.sun.position;
        const plantPos = this.mesh.position;
        const ray = new BABYLON.Ray(BABYLON.Vector3.Zero(), BABYLON.Vector3.Up());

        var ambient = 0;
        var direct = 0;
        var indirect = 0;

        const l = this.leaves.length;
        for(var i = 0; i < l; i++)
        {
            const leaf = this.leaves[i];

            // raycast from leaf (plus a small offset along the normal) towards the sun, detect collisions (shadow casters)
            const start = leaf.position.add(leaf.normal.scale(0.25)).add(plantPos);
            ray.origin = start;
            ray.direction = sunPos.subtract(start).normalize();
            ray.length = 100;

            // does ray hit something on the way toward the sun? (in shadow)
            // Ray, predicate(mesh) => bool, fastCheck (bool), trianglePredicate
            var hitInfo = this.scene.pickWithRay(ray, null, true, null);
            if (hitInfo.hit)
            {
                ambient++;
                // raytrace along the normal and check if the ray can extend a decent distance
                ray.direction = leaf.normal;
                ray.length = 10;
                hitInfo = this.scene.pickWithRay(ray, null, true, null);
                if (hitInfo.hit)
                {
                    // ambient light received
                    ambient++;
                }
                else
                {
                    // indirect sunlight received
                    indirect++;
                }
            }
            else
            {
                // direct sunlight received
                direct++;
            }
        }

        this.totalLight = ambient * (Control.world.ambient.intensity);
        // TODO: calculate intensity received rather than transmitted (atmospheric scattering, clouds, etc)
        this.totalLight += indirect * (Control.world.ambient.intensity + Control.world.sun.intensity * World.indirectLightPercent);
        this.totalLight += direct * (Control.world.ambient.intensity + Control.world.sun.intensity);
        this.totalLight *= World.lightEnergyScaler;
        //console.log(Math.floor(Control.world.dayTime * 100) / 100 + ": " + this.mesh.name + "[" + Math.round(this.storedEnergy) + "] receiving " + this.totalLight + " " + ambient + " " + indirect + " " + direct);
    }


    /// launch a seed pod into the air using some of its stored energy
    launchSeed( launchPower )
    {
        // try to launch with launchPower, if we have that much storedEnergy
        const power = Math.min(launchPower, this.storedEnergy);
        this.storedEnergy -= power;

        var force = this.randomHemispherePoint(power / 20.0);
        this.verlet.unlock();
        this.verlet.move(force);
        this.launching = true;
    }


    // https://stackoverflow.com/questions/5531827/random-point-on-a-given-sphere
    randomHemispherePoint(radius)
    {
        var u = Math.random();
        var v = Math.random();
        var theta = 2 * Math.PI * u;
        var phi = Math.acos(2 * v - 1);
        var x = (radius * Math.sin(phi) * Math.cos(theta));
        var y = Math.abs((radius * Math.sin(phi) * Math.sin(theta)));
        var z = (radius * Math.cos(phi));
        return new BABYLON.Vector3(x, y, z);
    }


    /// make the seed pod fly, control the landing, return false when it is ready to grow
    flyingSeedPod()
    {
        const l = this.vertices.length;
        const grounded = [];
        const wy = this.worldPosition.y;
        for(var i = 0; i < l; i += 3)
        {
            var y = this.vertices[i + 1] + wy;
            if (Math.abs(y - World.groundLevel) < 0.001)
            {
                grounded.push(i);
            }
        }

        // wait for seed pod to get one face flat on the ground
        if (grounded.length >= 4)
        {
            //console.log("seed landed");

            const faceNormal = this.cubish.getFaceNormal(0, this.vertices, this.indices);
            // console.log("seed face 0 normal " + faceNormal);

            // spin the cube so that face 0 is on the ground
            this.cubish.adjustCubeToGround(faceNormal, this.vertices);

            // const newFaceNormal = this.cubish.getFaceNormal(0, this.vertices, this.indices);
            // console.log("seed face 0 new normal " + newFaceNormal);

            // lock the floor contacting vertices
            this.verlet.lockToFloor();

            // find the COM of the first cube in the vertices list
            var total = new BABYLON.Vector3.Zero();
            for(var i = 0; i < 8 * 3; i += 3)
            {
                total.x += this.vertices[i + 0];
                total.y += this.vertices[i + 1];
                total.z += this.vertices[i + 2];
            }
            var middle = total.scale(1.0 / 8.0)

            // relocate this plant to that location on the ground
            this.worldPosition.addInPlace(middle);
            this.worldPosition.y = World.groundLevel;
            this.mesh.setAbsolutePosition(this.worldPosition);

            // reset all vertices to be offsets from that location
            for(var i = 0; i < l; i += 3)
            {
                this.vertices[i + 0] = this.vertices[i + 0] - middle.x;
                this.vertices[i + 1] = this.vertices[i + 1] - middle.y;
                this.vertices[i + 2] = this.vertices[i + 2] - middle.z;
            }

            // cancel all forces on the seed vertices, to prevent it twisting on its next update
            this.verlet.cancelForces();

            return false;
        }

        return true;
    }


    clone()
    {
        const plant = new Plant(this.scene, this.cubish);
        plant.mutateParams(this);
        plant.setControlVars();
        plant.worldPosition = this.worldPosition.clone();

        // create an ungrown Model (contains a single grown seed cell)
        plant.model = this.model.clone();
        plant.model.mutate();
        plant.numCells = 1;

        // convert it to a custom mesh
        plant.mesh = plant.cubish.createCustomMesh(plant.scene, plant.model);
        plant.mesh.setAbsolutePosition( plant.worldPosition );
        plant.mesh.checkCollisions = true;
        Control.world.shadowGenerator.addShadowCaster(plant.mesh);

        // data references, then build the verlet representation for soft-body physics
        plant.vertices = plant.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        plant.indices = plant.mesh.getIndices();
        plant.verlet = new Verlet( plant.vertices, plant.indices, plant.worldPosition );
        
        // find all the leaves (triangles which have a normal with y >= 0)
        plant.leaves = this.findLeaves();

        // initialise plant variables
        plant.totalLight = 0;
        // TODO: should vary depending on plant status as well as size (hibernate at night, growth speed...)
        plant.costOfLivingPlant = World.costOfLivingPlant;
        plant.costOfLivingCells = World.costOfLivingCell * plant.leaves.length;

        // DNA
        // TODO: mutate for seeds
        plant.seedStartDelay = this.seedStartDelay;
        plant.seedStorePercent = this.seedStorePercent;
        plant.seedEnergy = this.seedEnergy;
        plant.seedReleaseDelay = this.seedReleaseDelay;
        plant.seedReleasePower = this.seedReleasePower;
        plant.ageDamage = this.ageDamage;
        plant.maximumAge = this.maximumAge;
        plant.growthEnergyPercent = this.growthEnergyPercent;
        plant.growthEnergyCurve = this.growthEnergyCurve;
        plant.storeEfficiency = this.storeEfficiency;
        plant.energyPerCell = this.energyPerCell;

        return plant;
    }
      
}
