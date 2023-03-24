//
// a single plant in the World
//



function Plant( shapeName, x, y, z )
{
    this.verlet = new Verlet( shapeName );
    this.verlet.create( { x:x, y:y, z:z } );

    this.shape = World.graphics.createShape( this.verlet );

    /* TODO: add a method to move the Verlet Shape and set up these parameters
    new Shape(
        scene,
        new THREE.Vector3(x, y, z),
        3,
        100,
        0.25,
        nodeMaterial,
        stickMaterial
    );
    */
}


Plant.prototype.update = function()
{
    // update including wind-force
    this.verlet.update( { x: Math.cos(Date.now() / 1000.0) * 1.5, y: 0, z: 0 } );
    World.graphics.update( this.verlet );
}
