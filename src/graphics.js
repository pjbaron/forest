

// three.js scene
Graphics.scene = new THREE.Scene();

// materials
Graphics.nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x5f1f00 });
Graphics.rodMaterial = new THREE.MeshBasicMaterial({ color: 0x7f2f00 });


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
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    this.camera.rotation.x = -10 * Math.PI / 180.0;
    this.camera.position.y = World.groundLevel + World.eyeLevel;
    this.camera.position.z = World.worldSize * 2;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // create a green ground plane
    this.groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    this.groundMaterial = new THREE.MeshBasicMaterial({ color: 0x305020 });
    this.ground = new THREE.Mesh(this.groundGeometry, this.groundMaterial);
    this.ground.rotation.x = -Math.PI / 2; // rotate the ground so it's horizontal
    this.ground.position.y = World.groundLevel;
    Graphics.scene.add(this.ground);
    
    // create a sky
    this.createSky();
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
        //console.log(i + " " + JSON.stringify(v1) + " " + JSON.stringify(v2));
        // TODO: we should not link the graphic to the edge like this, but it's an easy place to start
        this.setRod(edge.graphicRod, v1, v2);
    }

    for(var i = 0, l = vertices.length; i < l; i++)
    {
        const v = vertices[i];
        this.setSphere(shape.nodes[i], v);
    }
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

    const nodes = [];
    const vertices = shape.vertices;
    for(var i = 0, l = vertices.length; i < l; i++)
    {
        const sphere = this.createSphere(vertices[i]);
        nodes[i] = sphere;
    }
    shape.nodes = nodes;

    const edges = shape.edges;
    for(var i = 0, l = edges.length; i < l; i++)
    {
        const edge = edges[i];
        const rod = this.createEdge(edge);
        edge.graphicRod = rod;
    }
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
    this.sky.scale.setScalar( 450000 );
    Graphics.scene.add( this.sky );

    this.sun = new THREE.Vector3();

    const effectController = {
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 2,
        azimuth: 180,
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
