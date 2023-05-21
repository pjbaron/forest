
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
        if (plantIndex == 0)
            this.lightAmount();

        // TODO: use plantIndex to time-slice intensive calculations (e.g. light received)
        // plantIndex is not fixed for a given plant - the plant list is mutable

        this.verlet.update( force );
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this.vertices);

        return true;
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

/*
    lightAmountPhysics()
    {
        const sunPos = Control.world.sun.position;
        const plantPos = this.mesh.position;
        const raycastResult = new BABYLON.PhysicsRaycastResult();

const lm = new BABYLON.StandardMaterial("material", this.scene);
lm.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
lm.diffuseColor = new BABYLON.Color3(1, 1, 1);

        const l = this.leaves.length;
        for(var i = 0; i < l; i++)
        {
            const leaf = this.leaves[i];
            // raycast from leaf (plus a small offset along the normal) towards the sun, detect if we can see it (direct sunlight)
            const start = leaf.position.add(leaf.normal.scale(-1.25)).add(plantPos);
            this.physEngine.raycastToRef(start, sunPos, raycastResult);

// TODO: debug only - draw ray lines from nearly flat up-facing surfaces
if (leaf.normal.y > 0.8)
{
    if (!leaf.debug.points)
    {
        leaf.debug.points = [start, Control.world.sun.position];
        leaf.debug.options = { points: leaf.debug.points, updatable: true };
        const lineMesh = BABYLON.MeshBuilder.CreateLines("rayLine", leaf.debug.options, this.scene);
        lineMesh.material = lm;
        leaf.debug.options.instance = lineMesh;
    }
    else
    {
        leaf.debug.points[0] = start;
        leaf.debug.points[1] = Control.world.sun.position;
        BABYLON.MeshBuilder.CreateLines("rayLine", leaf.debug.options, this.scene);
    }
}

            // hit something before reaching the sun... we can't see it
            if (raycastResult.hasHit)
            {
                // raytrace along the normal and check if the ray can extend a decent distance
                const end = start.add(leaf.normal.scale(20)).add(plantPos);
                this.physEngine.raycastToRef(start, end);
                if (raycastResult.hasHit)
                {
                    // ambient light received
                    leaf.light += Control.world.ambient.intensity;
                    console.log("ambient " + leaf.light);
                }
                else
                {
                    // indirect sunlight received
                    leaf.light += Control.world.ambient.intensity + Control.world.sun.intensity * Control.indirectLightPercent;
                    console.log("indirect " + leaf.light);
                }
            }
            else
            {
                // direct sunlight received
                leaf.light = Control.world.ambient.intensity + Control.world.sun.intensity;
                //console.log("direct " + leaf.light);
            }
        }
    }
*/

    lightAmount()
    {
        const sunPos = Control.world.sun.position;
        const plantPos = this.mesh.position;
        const ray = new BABYLON.Ray(BABYLON.Vector3.Zero(), BABYLON.Vector3.Up());

const lm = new BABYLON.StandardMaterial("material", this.scene);
lm.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
lm.diffuseColor = new BABYLON.Color3(1, 1, 1);

        const l = this.leaves.length;
        for(var i = 0; i < l; i++)
        {
            const leaf = this.leaves[i];

            // raycast from leaf (plus a small offset along the normal) towards the sun, detect collisions (shadow casters)
            const start = leaf.position.add(leaf.normal.scale(15)).add(plantPos);
            ray.origin = start;
            ray.direction = sunPos.subtract(start).normalize();
            ray.length = 20;

/*
// TODO: debug only - draw ray lines from nearly flat up-facing surfaces
if (leaf.normal.y > 0.8)
{
    if (!leaf.debug.points)
    {
        leaf.debug.points = [start, start.add(ray.direction.scale(ray.length))];
        leaf.debug.options = { points: leaf.debug.points, updatable: true };
        const lineMesh = BABYLON.MeshBuilder.CreateLines("rayLine", leaf.debug.options, this.scene);
        lineMesh.material = lm;
        leaf.debug.options.instance = lineMesh;
    }
    else
    {
        leaf.debug.points[0] = start;
        leaf.debug.points[1] = start.add(ray.direction.scale(ray.length));
        BABYLON.MeshBuilder.CreateLines("rayLine", leaf.debug.options, this.scene);
    }
}
*/
            var hitInfo = this.scene.pickWithRay(ray);

            // hit something before reaching the sun... we can't see it
            if (hitInfo.hit)
            {
                console.log(hitInfo.pickedMesh.name);

                // raytrace along the normal and check if the ray can extend a decent distance
                ray.direction = leaf.normal;
                hitInfo = this.scene.pickWithRay(ray);
                if (hitInfo.hit)
                {
                    // ambient light received
                    leaf.light += Control.world.ambient.intensity;
                    //console.log("ambient " + leaf.light);
                }
                else
                {
                    // indirect sunlight received
                    leaf.light += Control.world.ambient.intensity + Control.world.sun.intensity * World.indirectLightPercent;
                    console.log("indirect " + leaf.light);
                }
            }
            else
            {
                // direct sunlight received
                leaf.light = Control.world.ambient.intensity + Control.world.sun.intensity;
                //console.log("direct " + leaf.light);
            }
        }
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

