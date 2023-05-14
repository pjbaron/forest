

class Cubish
{
    // an irregular cube
    irregularCube = {
        positions :
        [
            // bottom
            -0.5, 0, 0.5,
            0.5, 0, 0.5,
            0.5, 0, -0.5,
            -0.5, 0, -0.5,
            // top
            -0.5, 1, 0.5,
            0.5, 1, 0.5,
            0.5, 1, -0.5,
            -0.5, 1, -0.5,
        ],
        indices :
        [
            // bottom (-y)
            0, 1, 2,
            0, 2, 3,
            // back (+z)
            0, 4, 5,
            0, 5, 1,
            // right (+x)
            1, 5, 2,
            5, 6, 2,
            // front (-z)
            2, 6, 3,
            3, 6, 7,
            // left (-x)
            3, 7, 4,
            3, 4, 0,
            // top (+y)
            4, 6, 5,
            4, 7, 6,
        ]
    }


    /// add x,y,z to all the positions [x0,y0,z0, ... xn,yn,zn]
    offsetPositions(positions, x, y, z)
    {
        for(var i = 0, l = positions.length; i < l; i += 3)
        {
            positions[i + 0] += x;
            positions[i + 1] += y;
            positions[i + 2] += z;
        }
    }


    /// add offset to all the indices
    offsetIndices(indices, offset)
    {
        for(var i = 0, l = indices.length; i < l; i++)
            indices[i] += offset;
    }


    /// attach a new irregular cube to the positions/indices at the given offset
    attach(positions, indices, x, y, z)
    {
        // get the indices for an irregular cube and offset them to start at the end of the position list
        const newIndices = this.irregularCube.indices.slice();
        this.offsetIndices(newIndices, positions.length / 3)

        // get the vertex positions for an irregular cube and move them according to the offsets
        const newPositions = this.irregularCube.positions.slice();
        this.offsetPositions(newPositions, x, y, z);

        // add the new positions and indices to the end of the existing arrays
        positions.push(... newPositions);
        indices.push(... newIndices);
    }


    createCustomMesh(scene)
    {
        // create buffer for the vertex data
        var vertexData = new BABYLON.VertexData();

        // create data for an irregular cube
        var normals = [];
        var positions = this.irregularCube.positions.slice();
        var indices = this.irregularCube.indices.slice();

        // DEBUG: attach more cubes to make the shape more interesting
        this.attach(positions, indices, 0, 1, 0);
        this.attach(positions, indices, 0, 2, 0);
        this.attach(positions, indices, 0, 3, 0);
        this.attach(positions, indices, 1, 2, 0);
        this.attach(positions, indices, -1, 2, 0);
        this.attach(positions, indices, -2, 2, 0);
        this.attach(positions, indices, 1, 2, -1);
        this.attach(positions, indices, 1, 2, -2);

        // compute normals for this shape
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);

        // store the shape data in the vertexData buffer
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;

        // create a material for this new mesh
        var material = new BABYLON.StandardMaterial("material", scene);
        material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        material.diffuseColor = new BABYLON.Color3(0, 1, 0);

        // create a new custom mesh
        var mesh = new BABYLON.Mesh("customMesh", scene);
        mesh.material = material;

        // apply the vertex data to the new mesh
        vertexData.applyToMesh(mesh, true);        // updatable!

        // weld co-located vertices to make the mesh simpler
        mesh.forceSharedVertices();

        return mesh;
    }
}