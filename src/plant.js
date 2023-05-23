
class Plant
{
    constructor( scene, cubish )
    {
        this.scene = scene;
        this.cubish = cubish;

        this.model = null;
        this.mesh = null;
        this.vertices = null;
        this.indices = null;
        this.verlet = null;
        this.leaves = null;

        // DNA
        // TODO: vary these for each plant
        this.seedStartDelay = 5.0;              // delay in days before plant starts growing a seed
        this.seedStorePercent = 0.25;           // how much of total energy goes into a growing seed
        this.seedEnergy = World.seedEnergy;     // how much energy does the plant's seed require
        this.seedReleaseDelay = 0;              // delay in days before a full seed will be released
        this.seedReleasePower = 10;             // amount of energy to propel the seed on release
        this.ageDamage = 1.0;                   // how quickly do this plant's cells age
        this.maximumAge = World.plantMaxAge;    // maximum age for this plant
        this.growthEnergyPercent = 0.2;         // amount of energy the plant uses for growth (stored = total - seed - growth)
        this.growthEnergyCurve = 0.99999;       // growth energy percent is multiplied by this constant daily
        this.storeEfficiency = 0.75;            // amount of energy that can be retrieved from store
        this.energyPerCell = 1000;              // total amount of energy that can be stored in each cell

        // control variables
        this.totalLight = 0;
        this.storedEnergy = World.seedEnergy;
        this.growthEnergy = 0;
        this.seedStore = 0;
        this.seedStartDate = World.time + this.seedStartDelay * World.hoursPerDay;
        this.seedLaunchDate = 0;
        this.currentAge = Math.random() * World.plantMaxAge * 0.25;
        this.dateOfBirth = World.time;
    }

            
    create( worldPosition )
    {
        // build a 'plant' model
        this.model = new Model();
        this.model.create();
        // this.model.add({x: 0, y: 1, z: 0});
        // this.model.add({x: 0, y: 2, z: 0});
        // this.model.add({x: 0, y: 3, z: 0});
        // this.model.add({x: 1, y: 1, z: 0});
        // this.model.add({x: -1, y: 1, z: 0});
        // this.model.add({x: 0, y: 2, z: -1});
        // this.model.add({x: 0, y: 2, z: 1});

        // convert it to a custom mesh
        this.mesh = this.cubish.createCustomMesh(this.scene, this.model);
        this.mesh.setAbsolutePosition( worldPosition );
        this.mesh.checkCollisions = true;

        // data references, then build the verlet representation for soft-body physics
        this.vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        this.indices = this.mesh.getIndices();
        this.verlet = new Verlet( this.vertices, this.indices );

        // find all the leaves (triangles which have a normal with y >= 0)
        this.leaves = this.findLeaves();

        // initialise plant variables
        this.totalLight = 0;
        // TODO: should vary depending on plant status as well as size (hibernate at night, growth speed...)
        this.costOfLiving = World.costOfLiving * this.leaves.length;
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

        //this.debugLightLevels();
    }


    /// return false if the plant dies
    update( force, plantIndex )
    {
        // lazy recalculation of light, one plant per frame
        if (plantIndex == (Math.floor(Control.world.tick % Control.world.plants.length)))
            this.lightAmount();

        // TODO: use plantIndex to time-slice intensive calculations (e.g. light received)
        // plantIndex is not fixed for a given plant - the plant list is mutable

        this.verlet.update( force );
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this.vertices);

        // TODO: include elapsed real-time?
        var totalEnergy = this.totalLight;
        totalEnergy = this.seedGrowth(totalEnergy);
        totalEnergy = this.plantGrowth(totalEnergy);

        // store the remaining energy at a loss, with a cap
        this.storedEnergy = Math.min(this.storedEnergy + totalEnergy * this.storeEfficiency, this.energyPerCell * this.model.cellCount);
        this.storedEnergy -= this.costOfLiving;

        return (this.storedEnergy > 0);
    }


    plantGrowth( totalEnergy )
    {
        // allocate to growth
        var forGrowth = totalEnergy * Math.min(this.growthEnergyPercent, 1.0);
        totalEnergy -= forGrowth;
        this.growthEnergy += forGrowth;
        // TODO: spend growth energy on growth immediately

        // modify how much of our energy we spend on growth
        this.growthEnergyPercent *= this.growthEnergyCurve;
        // TODO: add growth energy curve over the course of a day
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
                // the seed is full, wait for launch-day
                if (World.time >= this.seedLaunchDate)
                {
                    // charge the seed's launch price
                    this.seedStore -= this.seedReleasePower;
                    if (this.seedStore > 0)
                    {
                        // TODO: launch the seed, with mutations
                        console.log(World.time + ": " + this.mesh.name + " seeded.");
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


    debugLightLevels()
    {
        const l = this.leaves.length;
        for(var i = 0; i < l; i++)
        {
            const leaf = this.leaves[i];
            const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: (leaf.normal.y + 0.25) / 2.0 }, this.scene);
            sphere.setAbsolutePosition(leaf.position.add(this.mesh.position));
        }
    }


    clone( worldPosition )
    {
        const plant = new Plant( this.scene, this.cubish );

        // copy my 'plant' model
        // TODO: mutate for seeds
        plant.model = this.model.clone();

        // convert it to a custom mesh
        plant.mesh = plant.cubish.createCustomMesh(plant.scene, plant.model);
        plant.mesh.setAbsolutePosition( worldPosition );
        plant.mesh.checkCollisions = true;

        // data references, then build the verlet representation for soft-body physics
        plant.vertices = plant.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        plant.indices = plant.mesh.getIndices();
        plant.verlet = new Verlet( plant.vertices, plant.indices );
        
        // find all the leaves (triangles which have a normal with y >= 0)
        plant.leaves = this.findLeaves();

        // initialise plant variables
        plant.totalLight = 0;
        // TODO: should vary depending on plant status as well as size (hibernate at night, growth speed...)
        plant.costOfLiving = World.costOfLiving * plant.leaves.length;        

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
    }

}

