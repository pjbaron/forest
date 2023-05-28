

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
            const neighbours = [
                {x:-1,y:0,z:0},{x:1,y:0,z:0},
                {x:0,y:-1,z:0},{x:0,y:1,z:0},
                {x:0,y:0,z:-1},{x:0,y:0,z:1}
            ];
            
            const l = neighbours.length;
            for(var i = 0; i < l; i++)
            {
                var nx = x + neighbours[i].x;
                if (nx < 0 || nx >= this.size.x) continue;
                var ny = y + neighbours[i].y;
                if (ny < 0 || ny >= this.size.y) continue;
                var nz = z + neighbours[i].z;
                if (nz < 0 || nz >= this.size.z) continue;
                let cell = this.voxels[nx][ny][nz];
                if (!cell || cell.checked) continue;
                cell.checked = true;
                if (cell.grown)
                    canGrow = canGrow.concat(checkNeighbours.call(this, nx, ny, nz));
                else
                    canGrow.push(cell);
            }
            return canGrow;
        }

        this.clearChecks();

        const list = checkNeighbours.call(this, this.seedLocation.x, this.seedLocation.y, this.seedLocation.z);

        if (list.length > 0)
        {
            // pick one at random
            // TODO: use highest cell energy if I start to store it on a per-cell basis
            const i = Math.floor(Math.random() * list.length);
            const cell = list[i];
            cell.grown = true;
            return true;
        }

        return false;
    }


    clearChecks()
    {
        for(var y = 0; y < this.size.y; y++)
        {
            for(var z = 0; z < this.size.z; z++)
            {
                for(var x = 0; x < this.size.x; x++)
                {
                    const cell = this.voxels[x][y][z];
                    if (cell) cell.checked = false;
                }
            }
        }
    }


    /// clone this entire model, but only the seed is grown yet
    clone()
    {
        const m = new Model();
        m.size = { x:this.size.x, y:this.size.y, z:this.size.z };
        m.voxels = new Array(this.size.x).fill(null).map(() => new Array(this.size.y).fill(null).map(() => new Array(this.size.z).fill(null)));
        m.seedLocation = { x: this.seedLocation.x, y: this.seedLocation.y, z: this.seedLocation.z };
        for(var y = 0; y < m.size.y; y++)
        {
            for(var z = 0; z < m.size.z; z++)
            {
                for(var x = 0; x < m.size.x; x++)
                {
                    const cell = this.voxels[x][y][z];
                    if (!cell)
                        m.voxels[x][y][z] = cell;
                    else
                    {
                        const ccell = cell.clone();
                        ccell.grown = ccell.seed;
                        m.voxels[x][y][z] = ccell;
                    }
                }
            }
        }
        m.cellCount = this.cellCount;
        return m;
    }

}
