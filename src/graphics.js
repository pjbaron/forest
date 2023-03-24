

// three.js scene
Graphics.scene = new THREE.Scene();

// materials
Graphics.nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x5f1f00 });
Graphics.rodMaterial = new THREE.MeshBasicMaterial({ color: 0x7f2f00 });


// constants
const nodeRadius = 3.0;
const cylinderRadius = 2.0;


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
    this.camera.position.y = World.groundLevel + World.eyeLevel;
    this.camera.position.z = World.worldSize * 2;
    this.camera.rotation.x = -10 * Math.PI / 180.0;

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
    const vertices = verlet.vertices;
    
    const nodes = shape.nodes;
    const rods = shape.rods;

    const l = nodes.length;
    for(var i = 0; i < l; i++)
    {
        const v = vertices[i];
        const v1 = this.objectToPoint(v);

        const node = nodes[i];
        node.position.copy(v1);

        const constraints = v.constraints;
        const k = constraints.length;
        for(var j = 0; j < k; j++)
        {
            const v2 = this.objectToPoint(constraints[j].otherEnd(v));
            const rod = this.findRod(rods, constraints[j].i1, constraints[j].i2);
            this.setRod(rod, v1, v2);
        }
    }
}


Graphics.prototype.findRod = function(rods, i1, i2)
{
    const l = rods.length;
    for(var i = 0; i < l; i++)
    {
        if (rods[i].i1 == i1 && rods[i].i2 == i2)
            return rods[i];
        if (rods[i].i1 == i2 && rods[i].i2 == i1)
            return rods[i];
    }
    return null;
}


Graphics.prototype.render = function()
{
    this.renderer.render(Graphics.scene, this.camera);
}


/// create a Shape from a Verlet object, with a node at every vertex and a rod connecting every connected pair
Graphics.prototype.createShape = function( verlet )
{
    const nodes = [];
    const rods = [];

    const shape = verlet.shape;
    const vertices = verlet.vertices;
    
    const l = shape.length;
    for(var i = 0; i < l; i++)
    {
        // create a sphere to indicate the location of vertices[i]
        const node = this.createNode(this.objectToPoint(vertices[i]), nodeRadius, Graphics.nodeMaterial);
        nodes.push(node);

        const connections = shape[i].connected;
        const k = connections.length;
        for(var j = 0; j < k; j++)
        {
            const c = connections[j];
            // create a cylinder to link shape[i] with shape[c]
            const rod = this.createRod(this.objectToPoint(vertices[i]), this.objectToPoint(vertices[c]), cylinderRadius, Graphics.rodMaterial);
            rod.i1 = i;
            rod.i2 = c;
            rods.push(rod);
            //console.log("rod[" + (rods.length - 1) + "] connects vertices " + i + " and " + c + " " + j);
        }
    }

    // attach the new graphics to the shape object
    shape.nodes = nodes;
    shape.rods = rods;
    //console.log(`${shape.length} has ${nodes.length} nodes and ${rods.length} constraints`);

    return shape;
}


Graphics.prototype.createNode = function(position, radius, material)
{
    const node = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), material);
    node.position.copy(position);
    this.scene.add(node);
    return node;
}


Graphics.prototype.createRod = function(position1, position2, radius, material)
{
    // Connect the new node to the previous node with a cylinder
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1.0, 32), material);
    this.setRod(cylinder, position1, position2);
    this.scene.add(cylinder);
    return cylinder;
}


Graphics.prototype.setRod = function(cylinder, position1, position2)
{
    const l = this.distance(position1, position2);
    cylinder.scale.y = l;

    cylinder.position.copy(position1.lerp(position2, 0.5));

    var axis = new THREE.Vector3(0, 1, 0);
    cylinder.quaternion.setFromUnitVectors(axis, (position2.sub(position1)).normalize());
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


Graphics.prototype.distance = function(p1, p2)
{
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}


Graphics.prototype.objectToPoint = function(object)
{
    return new THREE.Vector3(object.x, object.y, object.z);
}
