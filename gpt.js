
// Note that in this code, `Node` is a class that represents a verlet integration node, with properties for position, old position, mass, and radius.
// The code also assumes that you have a `scene` object that is a reference to the BabylonJS scene where the simulation is being rendered.
// You may need to adjust the values of the stiffness, length, and other parameters depending on your specific use case.

class Link
{
    constructor(nodeIndex1, nodeIndex2, stiffness, length)
    {
        this.nodeIndex1 = nodeIndex1;
        this.nodeIndex2 = nodeIndex2;
        this.stiffness = stiffness;
        this.length = length;
    }
}

const nodes = [];
const links = [];
const gravity = new BABYLON.Vector3(0, -9.81, 0);
const deltaTime = 0.016;
const angularThreshold = Math.PI / 4; // 45 degrees in radians

// create nodes
nodes.push(new Node(0, 0, 0, 1));
nodes.push(new Node(0, 1, 0, 1));
nodes.push(new Node(0, 2, 0, 1));

// create links
links.push(new Link(0, 1, 1, 1));
links.push(new Link(1, 2, 1, 1));

// update node positions
for (let i = 0; i < nodes.length; i++)
{
    const node = nodes[i];
    const acceleration = gravity.scale(node.mass);
    const newPosition = node.position
        .scale(2)
        .subtract(node.oldPosition)
        .add(acceleration.scale(deltaTime * deltaTime));
    node.oldPosition = node.position;
    node.position = newPosition;
}

// apply threshold for angular bending
for (let i = 0; i < links.length - 1; i++)
{
    const link1 = links[i];
    const node1 = nodes[link1.nodeIndex1];
    const node2 = nodes[link1.nodeIndex2];
    const link2 = links[i + 1];
    const node3 = nodes[link2.nodeIndex2];

    const v1 = node1.position.subtract(node2.position);
    const v2 = node3.position.subtract(node2.position);
    const angle = Math.acos(BABYLON.Vector3.Dot(v1.normalize(), v2.normalize()));

    if (angle < angularThreshold)
    {
        const correction = v1.cross(v2).normalize().scale((angularThreshold - angle) * 0.5);
        const force1 = correction.scale(node2.mass * link1.stiffness);
        const force2 = correction.scale(-node2.mass * link2.stiffness);

        node1.position = node1.position.add(force1.scale(deltaTime * deltaTime));
        node2.position = node2.position.add(force1.add(force2).scale(deltaTime * deltaTime));
        node3.position = node3.position.add(force2.scale(deltaTime * deltaTime));
    }
}

// render nodes using BabylonJS
for (let i = 0; i < nodes.length; i++)
{
    const node = nodes[i];
    const sphere = BABYLON.MeshBuilder.CreateSphere(node, { diameter: node.radius * 2 });
    sphere.position.copyFrom(node.position);
    sphere.material = new BABYLON.StandardMaterial(material, scene);
    sphere.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
}

