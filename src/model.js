

class Model
{
    
    constructor()
    {
        this.size = null;
        this.voxels = null;
        this.cellCount = 0;
    }


    create()
    {
        this.size = { x:World.plantSizeLimits.x, y:World.plantSizeLimits.y, z:World.plantSizeLimits.z };

        const cell = new Cell();
        cell.create(World.seedEnergy, World.seedNutrients);

        this.voxels = new Array(this.size.x).fill(null).map(() => new Array(this.size.y).fill(null).map(() => new Array(this.size.z).fill(null)));
        const mx = Math.floor(this.size.x / 2);
        const mz = Math.floor(this.size.z / 2);

        this.voxels[mx][0][mz] = cell;
        this.cellCount = 1;
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
        this.cellCount++;
    }


    /// clone this entire model
    clone()
    {
        const m = new Model();
        m.size = { x:this.size.x, y:this.size.y, z:this.size.z };
        m.voxels = new Array(this.size.x).fill(null).map(() => new Array(this.size.y).fill(null).map(() => new Array(this.size.z).fill(null)));
        for(var y = 0; y < m.size.y; y++)
        {
            for(var z = 0; z < m.size.z; z++)
            {
                for(var x = 0; x < m.size.x; x++)
                {
                    m.voxels[x][y][z] = this.voxels[x][y][z].clone();
                }
            }
        }
        m.cellCount = this.cellCount;
        return m;
    }

}
