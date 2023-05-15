


class Plant
{
	constructor( scene, cubish )
	{
        this.scene = scene;
        this.cubish = cubish;

        this.model = null;
        this.mesh = null;
        this.vertices = null;
	}


	create()
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
	}


	/// return false if the plant dies
	update()
	{
		this.mesh.rotation.y += 0.1 * Math.PI / 180.0;

		// // DEBUG: move a vertex to ensure the mesh is properly updated
		// this.vertices[0] = Math.min(Math.sin(this.tick * 0.02) * 0.5, 0);
		// this.vertices[2] = Math.max(Math.sin(this.tick * 0.02) * 0.5, 0);
		// this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this.vertices);

		return true;
	}

}

