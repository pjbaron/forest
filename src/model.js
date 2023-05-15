

class Model
{
	
	constructor()
	{
		this.size = null;
		this.voxels = null;
	}


	create()
	{
		this.size = {x:World.plantSize.x, y:World.plantSize.y, z:World.plantSize.z};

		const cell = new Cell();
		cell.create(World.seedEnergy, World.seedNutrients);

		this.voxels = new Array(this.size.x).fill(null).map(() => new Array(this.size.y).fill(null).map(() => new Array(this.size.z).fill(null)));
		const mx = Math.floor(this.size.x / 2);
		const mz = Math.floor(this.size.z / 2);

		this.voxels[mx][0][mz] = cell;
	}


	add(location)
	{
		// add it
		// TODO: replace 5's with energy and nutrients
		const cell = new Cell();
		cell.create(5, 5);

		const mx = Math.floor(this.size.x / 2);
		const mz = Math.floor(this.size.z / 2);
		this.voxels[location.x + mx][location.y][location.z + mz] = cell;
	}

}
