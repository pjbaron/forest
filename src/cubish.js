

class Cubish
{
    static id = 0;
    
    // an irregular cube
    irregularCube = {
        positions : // begin as a regular unit cube with the origin at the C.O.M.
        [
            // bottom
            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, -0.5, -0.5,
            -0.5, -0.5, -0.5,
            // top
            -0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, -0.5,
        ],
        indices :   // cw winding, middle value is the 90 degree corner vertex, diagonals are all implied (loop back to start)
        [
            // bottom (-y)
            0, 1, 2,
            2, 3, 0,
            // back (+z)
            0, 4, 5,
            5, 1, 0,
            // right (+x)
            2, 1, 5,
            5, 6, 2,
            // front (-z)
            3, 2, 6,
            6, 7, 3,
            // left (-x)
            3, 7, 4,
            4, 0, 3,
            // top (+y)
            6, 5, 4,
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


    createCustomMesh(scene, model, vertexOffset)
    {
        // create buffer for the vertex data
        var vertexData = new BABYLON.VertexData();

        // create data for an irregular cube
        var normals = [];
        var positions = [];
        var indices = [];

        const mx = model.size.x / 2;
        const mz = model.size.z / 2;
        for(var y = 0; y < model.size.y; y++)
        {
            for(var x = -mx; x < mx; x++)
            {
                for(var z = -mz; z < mz; z++)
                {
                    if (model.voxels[x+mx][y][z+mz] != null)
                    {
                        this.attach(positions, indices, x, y, z);
                    }
                }
            }
        }

        // compute normals for this shape
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);

        // store the shape data in the vertexData buffer
        this.offsetPositions(positions, vertexOffset.x, vertexOffset.y, vertexOffset.z);
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;

        // create a material for this new mesh
        var material = new BABYLON.StandardMaterial("material", scene);
        material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        material.diffuseColor = new BABYLON.Color3(0, 1, 0);

        // create a new custom mesh
        var mesh = new BABYLON.Mesh("plant" + Cubish.id++, scene);
        mesh.material = material;

        // apply the vertex data to the new mesh
        vertexData.applyToMesh(mesh, true);        // updatable!

        // weld co-located vertices to make the mesh simpler
        mesh.forceSharedVertices();

        return mesh;
    }


    getFaceNormal( faceIndex, vertices, indices )
    {
        const f = faceIndex * 6;    // there are 6 indices per face (two triangles)

        // find normalised normals for both triangles
        const n0 = this.calculateTriangleNormal(f + 0, vertices, indices);
        const n1 = this.calculateTriangleNormal(f + 3, vertices, indices);

        // return the average of both normals
        return [ (n0[0] + n1[0]) / 2, (n0[1] + n1[1]) / 2, (n0[2] + n1[2]) / 2 ];
    }


    calculateTriangleNormal( first, vertices, indices )
    {
        const v0 = indices[first + 0] * 3;
        const Ax = vertices[v0 + 0];
        const Ay = vertices[v0 + 1];
        const Az = vertices[v0 + 2];

        const v1 = indices[first + 1] * 3;
        const Bx = vertices[v1 + 0];
        const By = vertices[v1 + 1];
        const Bz = vertices[v1 + 2];

        const v2 = indices[first + 2] * 3;
        const Cx = vertices[v2 + 0];
        const Cy = vertices[v2 + 1];
        const Cz = vertices[v2 + 2];

        // Calculate the edge vectors
        const AB = [Bx - Ax, By - Ay, Bz - Az];
        const AC = [Cx - Ax, Cy - Ay, Cz - Az];

        // Compute the cross product (AC x AB)
        const normal = [
            AC[1] * AB[2] - AC[2] * AB[1],
            AC[2] * AB[0] - AC[0] * AB[2],
            AC[0] * AB[1] - AC[1] * AB[0]
        ];

        // Normalise the normal vector
        const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
        const normalisedNormal = [
            normal[0] / length,
            normal[1] / length,
            normal[2] / length
        ];

        return normalisedNormal;
    }


    // spin the cube so that faceNormal is facing down, without moving it otherwise
    adjustCubeToGround( faceNormal, vertices )
    {
        const targetNormal = [0, -1, 0];    // Normal vector for the target face (ground)

        // Calculate rotation axis
        const rotationAxis = [
            faceNormal[1] * targetNormal[2] - faceNormal[2] * targetNormal[1],
            faceNormal[2] * targetNormal[0] - faceNormal[0] * targetNormal[2],
            faceNormal[0] * targetNormal[1] - faceNormal[1] * targetNormal[0]
        ];

        // Calculate rotation angle
        const dotProduct = faceNormal[0] * targetNormal[0] +
        faceNormal[1] * targetNormal[1] +
        faceNormal[2] * targetNormal[2];
        const rotationAngle = Math.acos(dotProduct);

        // Apply rotation transformation to each vertex
        const l = vertices.length;
        for (var i = 0; i < l; i += 3)
        {
            const x = vertices[i + 0];
            const y = vertices[i + 1];
            const z = vertices[i + 2];

            const s = Math.sin(rotationAngle);
            const c = Math.cos(rotationAngle);

            // Perform rotation using rotation axis and angle
            const rotatedX = x * c +
                (rotationAxis[1] * z - rotationAxis[2] * y) * s +
                rotationAxis[0] * (rotationAxis[0] * x + rotationAxis[1] * y + rotationAxis[2] * z) * (1 - c);
            const rotatedY = y * c +
                (rotationAxis[2] * x - rotationAxis[0] * z) * s +
                rotationAxis[1] * (rotationAxis[0] * x + rotationAxis[1] * y + rotationAxis[2] * z) * (1 - c);
            const rotatedZ = z * c +
                (rotationAxis[0] * y - rotationAxis[1] * x) * s +
                rotationAxis[2] * (rotationAxis[0] * x + rotationAxis[1] * y + rotationAxis[2] * z) * (1 - c);

            vertices[i + 0] = rotatedX;
            vertices[i + 1] = rotatedY;
            vertices[i + 2] = rotatedZ;
        }
    }

}