


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
    }


    create( worldPosition )
    {
        this.model = new Model();
        this.model.create();
        this.model.add({x: 0, y: 1, z: 0});
        this.model.add({x: 0, y: 2, z: 0});
        this.model.add({x: 0, y: 3, z: 0});
        this.model.add({x: 1, y: 1, z: 0});
        this.model.add({x: -1, y: 1, z: 0});
        this.model.add({x: 0, y: 2, z: -1});
        this.model.add({x: 0, y: 2, z: 1});
        this.mesh = this.cubish.createCustomMesh(this.scene, this.model);
        this.vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        this.indices = this.mesh.getIndices();
        this.mesh.setAbsolutePosition( worldPosition );
        this.verlet = new Verlet( this.vertices, this.indices );

        // find all the leaves (triangles which have a normal with y >= 0)
        this.leaves = this.findLeaves();

        // calculate the amount of light landing on each triangle
        this.lightAmount();

        //this.debugLightLevels();
    }


    /// return false if the plant dies
    update( force )
    {

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
                leaves.push( { i0: i0, i1: i1, i2: i2, v0: v0, v1: v1, v2: v2, position: pos, normal: normal });
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
        const l = this.leaves.length;
        //const raycastResult = new BABYLON.PhysicsRaycastResult();
        for(var i = 0; i < l; i++)
        {
            const leaf = this.leaves[i];
            // raycast from leaf (plus a small offset along the normal) towards the sun, detect if we can see it (direct sunlight)

            const start = leaf.position.add(leaf.normal.scale(5.0))
            // if not, raytrace along the normal and check if the ray hits the skybox first (indirect sunlight)
            // otherwise use ambient light
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

