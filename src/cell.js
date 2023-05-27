

class Cell
{
    
    constructor()
    {
        this.energy = 0;
        this.nutrients = 0;

        this.lightReceived = 0;
        this.grown = false;
        this.seed = false;

        // TODO: urgh! used by recursive search to avoid infinite loops in model...
        this.checked = false;
    }


    create( energy, nutrients, isSeed )
    {
        this.energy = energy;
        this.nutrients = nutrients;
        this.seed = isSeed;
        this.grown = isSeed;
    }


    clone()
    {
        var c = new Cell();
        c.create(this.energy, this.nutrients, this.seed);
        return c;
    }

}