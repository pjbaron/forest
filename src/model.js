

class Model
{
    
    constructor()
    {
        this.size = null;
        this.voxels = null;
        this.cellCount = 0;
        this.seedLocation = null;
    }


    create()
    {
        this.size = { x:World.plantSizeLimits.x, y:World.plantSizeLimits.y, z:World.plantSizeLimits.z };

        const cell = new Cell();
        cell.create(World.seedEnergy, World.seedNutrients, true);

        this.voxels = new Array(this.size.x).fill(null).map(() => new Array(this.size.y).fill(null).map(() => new Array(this.size.z).fill(null)));
        const mx = Math.floor(this.size.x / 2);
        const mz = Math.floor(this.size.z / 2);

        this.voxels[mx][0][mz] = cell;
        this.seedLocation = { x: mx, y: 0, z: mz };
        this.cellCount = 1;
    }


    add(location)
    {
        // add a cell to the model design

        // TODO: replace 5's with energy and nutrients
        const cell = new Cell();
        cell.create(5, 5, false);

        const mx = Math.floor(this.size.x / 2);
        const mz = Math.floor(this.size.z / 2);
        this.voxels[location.x + mx][location.y][location.z + mz] = cell;
        this.cellCount++;
    }


    /// find an ungrown cell, adjacent to a grown cell, and grow it
    /// return false if none found
    grow()
    {
        // recursive neighbour search, breadth first
        function checkNeighbours(x, y, z)
        {
            let canGrow = [];
            if (x - 1 >= 0)
            {
                let lft = this.voxels[x - 1][y][z];
                if (lft)
                {
                    if (lft.grown)
                        canGrow.concat(checkNeighbours(x - 1, y, z));
                    else
                        canGrow.push(lft);
                }
            }
            if (x + 1 < this.size.x)
            {
                let rgt = this.voxels[x + 1][y][z];
                if (rgt)
                {
                    if (rgt.grown)
                        canGrow.concat(checkNeighbours(x + 1, y, z));
                    else
                        canGrow.push(rgt);
                }
            }
            // TODO: up/down/forward/back
            return canGrow;
        }

        const list = checkNeighbours(this.seedLocation.x, this.seedLocation.y, this.seedLocation.z);
        if (list.length > 0)
        {
            const i = Math.floor(Math.random() * list.length);
            const cell = list[i];
            cell.grown = true;
            return true;
        }

        return false;
    }


    /// clone this entire model, but only the seed is grown yet
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
                    var cell = this.voxels[x][y][z].clone();
                    cell.grown = cell.seed;
                    m.voxels[x][y][z] = cell;
                }
            }
        }
        m.cellCount = this.cellCount;
        return m;
    }

}
