

// three.js scene
Graphics.scene = new THREE.Scene();

// materials
Graphics.nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x5f1f00 });
Graphics.rodMaterial = new THREE.MeshBasicMaterial({ color: 0x7f2f00 });
Graphics.redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// constants
const nodeRadius = 0.75;
const cylinderRadius = 0.5;


function Graphics()
{
    this.sky = null;
    this.sun = null;
    this.groundGeometry = null;
    this.groundMaterial = null;
    this.ground = null;
    this.camera = null;
    this.renderer = null;
    this.scene = Graphics.scene;    // ref dupe, makes it easier to copy code from elsewhere!

    this.create();
}


Graphics.prototype.create = function()
{
    this.camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );
    //this.camera.rotation.x = -10 * Math.PI / 180.0;
    this.camera.rotation.y = 0 * Math.PI / 180.0;
    this.camera.position.y = World.groundLevel + World.eyeLevel;
    this.camera.position.z = World.worldSize * 0.75;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // create a green ground plane
    this.groundGeometry = new THREE.PlaneGeometry(15000, 15000);
    this.groundMaterial = new THREE.MeshBasicMaterial({ color: 0x305020 });
    this.ground = new THREE.Mesh(this.groundGeometry, this.groundMaterial);
    this.ground.rotation.x = -Math.PI / 2; // rotate the ground so it's horizontal
    this.ground.position.y = World.groundLevel;
    Graphics.scene.add(this.ground);
    
    // create a sky
    this.createSky();

    // add fog
    Graphics.scene.fog = new THREE.Fog( 0xb5b5b5, World.worldSize * 0.25, World.worldSize * 3 );
}


/// update the rods and nodes to match the verlet locations
Graphics.prototype.update = function( verlet )
{
    const shape = verlet.shape;
    const vertices = shape.vertices;
    
    const edges = shape.edges;
    
    for(var i = 0, l = edges.length; i < l; i++)
    {
        const edge = edges[i];
        const v1 = this.objectToPoint(edge.startData.vertex);
        const v2 = this.objectToPoint(edge.endData.vertex);
        this.setRod(edge.graphicRod, v1, v2);
    }

    for(var i = 0, l = vertices.length; i < l; i++)
    {
        const v = vertices[i];
        this.setSphere(shape.nodes[i], v);
    }
    

    this.updateShape(shape.solidMesh, vertices);
}


Graphics.prototype.render = function()
{
    this.renderer.render(Graphics.scene, this.camera);
}


/// create the graphics for a Shape from a Verlet object
// with a node at every vertex and a rod between every connected pair
Graphics.prototype.createShape = function( verlet )
{
    const shape = verlet.shape;
    const vertices = shape.vertices;
    const faces = shape.faces;

    const edges = shape.edges;

    const nodes = [];
    for(var i = 0, l = vertices.length; i < l; i++)
    {
        // add a sphere at each node
        const sphere = this.createSphere(vertices[i]);
        // TODO: debug hint - show which vertices have high staticFriction
        if (vertices[i].staticFriction > 0.9) sphere.material = Graphics.redMaterial;
        nodes[i] = sphere;
    }
    shape.nodes = nodes;

    for(var i = 0, l = edges.length; i < l; i++)
    {
        // create a rod to join all node pairs (edges)
        const edge = edges[i];
        const rod = this.createEdge(edge);
        edge.graphicRod = rod;
    }

    // create a solid to enclose this cuboid
    const solidMesh = this.createSolid(vertices, faces);
    shape.solidMesh = solidMesh;
}


Graphics.prototype.createSolid = function(vertices, indices)
{
    const positions = [];
    for(var i = 0, l = vertices.length; i < l; i++)
    {
        positions.push(vertices[i].x);
        positions.push(vertices[i].y);
        positions.push(vertices[i].z);
    }
    // Create a new BufferGeometry and set its attributes
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    //geometry.computeVertexNormals();
    //geometry.computeFaceNormals();

    // Create a new Mesh and add it to the scene
    const material = new THREE.MeshLambertMaterial({ color: 0x5f1f00 });
    material.side = THREE.FrontSide;
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    return mesh;
}


// Update the positions of the vertices
Graphics.prototype.updateShape = function( mesh, vertices )
{
    // TODO: dry
    const positions = [];
    for(var i = 0, l = vertices.length; i < l; i++)
    {
        positions.push(vertices[i].x);
        positions.push(vertices[i].y);
        positions.push(vertices[i].z);
    }

    const positionsAttribute = mesh.geometry.getAttribute('position');
    positionsAttribute.set(positions);
    positionsAttribute.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}


Graphics.prototype.createSphere = function( vertex )
{
    // create a sphere to indicate the location of vertices[i]
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(nodeRadius, 32, 32), Graphics.nodeMaterial);
    sphere.position.copy(this.objectToPoint(vertex));
    this.scene.add(sphere);
    return sphere;
}


// create a placeholder edge cylinder using the shape vertices
// this will be replaced in Verlet, and setRod will move the cylinder to the correct world positions thereafter
Graphics.prototype.createEdge = function( edge )
{
    const v1 = edge.startData.vertex;
    const v2 = edge.endData.vertex;

    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, 1.0, 32), Graphics.rodMaterial);
    this.setRod(cylinder, this.objectToPoint(v1), this.objectToPoint(v2));
    this.scene.add(cylinder);

    return cylinder;
}


// make this cylinder point stretch from position1 to position2
Graphics.prototype.setRod = function( cylinder, position1, position2 )
{
    const l = this.distance(position1, position2);
    cylinder.scale.y = l;
    cylinder.position.copy(position1.lerp(position2, 0.5));

    var axis = new THREE.Vector3(0, 1, 0);
    cylinder.quaternion.setFromUnitVectors(axis, (position2.sub(position1)).normalize());
}


// position this sphere at vertex
Graphics.prototype.setSphere = function( sphere, vertex )
{
    sphere.position.copy(this.objectToPoint(vertex));
}


Graphics.prototype.createSky = function()
{
    // https://threejs.org/examples/webgl_shaders_sky.html

    this.sky = new Sky();
    this.sky.scale.setScalar( 500000 );
    Graphics.scene.add( this.sky );

    this.sun = new THREE.Vector3();

    const effectController = {
        turbidity: 3.0,
        rayleigh: 0.2,
        mieCoefficient: 0.004,
        mieDirectionalG: 0.5,
        elevation: 25,
        azimuth: 180,                                   // angle to the sun around Y (vertical) axis, 180 = straight ahead
        exposure: this.renderer.toneMappingExposure
    };

    const uniforms = this.sky.material.uniforms;
    uniforms[ 'turbidity' ].value = effectController.turbidity;
    uniforms[ 'rayleigh' ].value = effectController.rayleigh;
    uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
    uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
    const theta = THREE.MathUtils.degToRad( effectController.azimuth );

    this.sun.setFromSphericalCoords( 1, phi, theta );

    // Create a new DirectionalLight and add it to the scene
    const light = new THREE.DirectionalLight(0xffffff, 5);
    light.position.set(-0.5, 1, -0.5);
    this.scene.add(light);

    uniforms[ 'sunPosition' ].value.copy( this.sun );

    this.renderer.toneMappingExposure = effectController.exposure;
}


Graphics.prototype.distance = function( p1, p2 )
{
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}


Graphics.prototype.objectToPoint = function( object )
{
    return new THREE.Vector3(object.x, object.y, object.z);
}
