
class Plant
{
    constructor( scene, cubish )
    {
        this.scene = scene;
        this.cubish = cubish;

        this.physEngine = null;

        this.model = null;
        this.mesh = null;
        this.vertices = null;
        this.indices = null;
        this.verlet = null;
        this.leaves = null;

        this.totalLight = 0;
        this.totalEnergy = 0;
    }


    create( worldPosition )
    {
        // reference to BabylonJS physics engine, for raycast collision checks
        this.physEngine = this.scene.getPhysicsEngine();

        // build a 'plant' model
        this.model = new Model();
        this.model.create();
        this.model.add({x: 0, y: 1, z: 0});
        this.model.add({x: 0, y: 2, z: 0});
        this.model.add({x: 0, y: 3, z: 0});
        this.model.add({x: 1, y: 1, z: 0});
        this.model.add({x: -1, y: 1, z: 0});
        this.model.add({x: 0, y: 2, z: -1});
        this.model.add({x: 0, y: 2, z: 1});

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
        this.totalEnergy = 0;
        this.costOfLiving = World.costOfLiving * this.leaves.length;
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
        // TODO: debug only
        if (plantIndex == (Math.floor(Control.world.tick % Control.world.plants.length)))
            this.lightAmount();

        // TODO: use plantIndex to time-slice intensive calculations (e.g. light received)
        // plantIndex is not fixed for a given plant - the plant list is mutable

        this.verlet.update( force );
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this.vertices);

        // TODO: include elapsed time?
        this.totalEnergy += this.totalLight;
        this.totalEnergy -= this.costOfLiving;

        return (this.totalEnergy > 0);
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
            if (normal.y >= 0)
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
            var hitInfo = this.scene.pickWithRay(ray);
            if (hitInfo.hit)
            {
                // raytrace along the normal and check if the ray can extend a decent distance
                ray.direction = leaf.normal;
                ray.length = 10;
                hitInfo = this.scene.pickWithRay(ray);
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
        //console.log("plant " + this.mesh.name + " receiving " + this.totalLight + " " + ambient + " " + indirect + " " + direct);
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

}

