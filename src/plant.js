


class Plant
{
	constructor( scene, cubish )
	{
        this.scene = scene;
        this.cubish = cubish;

        this.mesh = null;
        this.vertices = null;
	}


	create()
	{
		this.mesh = this.cubish.createCustomMesh(this.scene);
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

