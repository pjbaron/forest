//
// a single plant in the World
//



class Plant
{
    constructor(shapeName, x, y, z)
    {
        // create the VerletShape which represents the physics object for this plant
        this.verletShape = new VerletShape(shapeName);
        this.verletShape.create({ x: x, y: y, z: z });

        // create the graphic representation of the VerletShape
        World.graphics.createShape(this.verletShape);
    }

    update( wind )
    {
        // update physics, including wind-force
        this.verletShape.update(wind);

        // update the graphic representation to match the current physics configuration
        World.graphics.update(this.verletShape);
    }
}

    // TODO: display shapes as solids
    // - find minimal closed loops in the adjacency list (nodes & edges) that have evolved for the plant
    // - create faces for each closed loop
    // - use the three.js buffer geometry as shown below by chatGpt

/*
//The function takes an adjacency list as input, where the keys are the nodes and the values are arrays of neighbors.
//The function first performs a depth-first search (DFS) starting from each node to find all closed loops in the graph.
//It does this by keeping track of the visited nodes and the current path during the DFS, and checking if a visited node
// is also the starting node of the path (indicating a closed loop).

//Once all loops are found, the function filters out any loops that are shorter than another loop (i.e., a subarray of another loop).
//The remaining loops are the minimal loops, which are returned by the function.

//Note that the function assumes the input adjacency list is a valid graph (i.e., has no isolated nodes or duplicate edges),
// and that the nodes are represented as strings.


function findMinimalLoops(adjList) {
  const loops = [];
  const visited = new Set();

  function dfs(node, path) {
    visited.add(node);

    for (let neighbor of adjList[node]) {
      if (path.length > 2 && neighbor === path[0]) {
        // We found a closed loop
        loops.push([...path, neighbor]);
      } else if (!visited.has(neighbor)) {
        // Continue the DFS with the neighbor
        dfs(neighbor, [...path, neighbor]);
      }
    }

    visited.delete(node);
  }

  for (let node of Object.keys(adjList)) {
    dfs(node, [node]);
  }

  // Find the minimal loops by filtering out shorter loops
  const minimalLoops = loops.filter((loop, i) => {
    for (let j = 0; j < loops.length; j++) {
      if (i !== j && isSubarray(loop, loops[j])) {
        // loop is a subarray of a longer loop, so it's not minimal
        return false;
      }
    }
    return true;
  });

  return minimalLoops;
}

// Helper function to check if one array is a subarray of another
function isSubarray(sub, arr) {
  for (let i = 0; i < arr.length - sub.length + 1; i++) {
    if (arr.slice(i, i + sub.length).every((x, j) => x === sub[j])) {
      return true;
    }
  }
  return false;
}
*/

/*
  // Define the vertices of the pyramid
  var vertices = [
    new THREE.Vector3(-1, 0, -1),
    new THREE.Vector3(1, 0, -1),
    new THREE.Vector3(1, 0, 1),
    new THREE.Vector3(-1, 0, 1),
    new THREE.Vector3(0, 1, 0)
  ];
  
  // Define the faces of the pyramid using indices of the vertices
  var faces = [
    0, 1, 4,
    1, 2, 4,
    2, 3, 4,
    3, 0, 4,
    2, 1, 0,
    3, 2, 0
  ];
  
  // Define the geometry of the pyramid by passing the vertices and faces to the BufferGeometry constructor
  var pyramidGeometry = new THREE.BufferGeometry();
  pyramidGeometry.setFromPoints(vertices);
  pyramidGeometry.setIndex(faces);
  
  // Define the material of the pyramid
  var pyramidMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
  
  // Create a mesh by combining the geometry and material
  var pyramidMesh = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
  
  // Add the mesh to the scene
  scene.add(pyramidMesh);
*/


