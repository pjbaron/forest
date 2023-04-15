//
// a single plant in the World
//



class Plant
{
    static maxEnergyStore = 1024;
    static growthMultiplier = 0.1;
    static sizeMultiplier = 10.0;


    constructor( x, y, z, energy )
    {
        this.energy = energy;
        this.dna = [ new Chromosone(0, "wood", "top", 0.2), new Chromosone(1, "leaf", "top", 1.0) ];
        this.stage = 0;
        this.lastUpdate = Date.now();

        // create the VerletShape which represents the physics object for the seed
        const verletShape = new VerletShape("cube");
        verletShape.create({ x: x, y: y, z: z });

        // create the graphic representation of the VerletShape
        World.graphics.createShape(verletShape);

        // start the cuboids list with the seed
        this.cuboids = [ { verletShape:verletShape, chromosone: this.dna[0] } ];
    }

    update( wind )
    {
        var now = Date.now();
        var dt = (now - this.lastUpdate) / 1000.0;
        this.lastUpdate = now;

        // absorb sunlight
        this.sunlight(dt);

        // absorb nutrients
        this.nutrients(dt);

        // wither when out of energy
        if (this.energy == 0)
            this.wither(dt);

        // grow each cuboid until it is full-sized
        if (this.stage < this.dna.length)
        {
            this.grow(dt);
        }

        // update and draw all the cuboids in this plant
        this.cuboids.forEach((cuboid) => {
            if (cuboid.chromosone.size > 0)
            {
                // update physics, including wind-force
                cuboid.verletShape.update(wind, cuboid.chromosone.size);

                // update the graphic representation to match the current physics configuration
                World.graphics.update(cuboid.verletShape);
            }
        });
    }

    grow( dt )
    {
        var growing = 0;
        for(var i = 0, l = this.dna.length; i < l; i++)
        {
            const chromosone = this.dna[i];
            const energyUse = chromosone.grow(dt, this.stage);
            if (energyUse > 0)
            {
                growing++;
                this.energy -= energyUse;
                if (this.energy <= 0)
                {
                    this.energy = 0;
                }
            }
        }

        if (growing == 0)
        {
            this.stage++;
        }
    }

    wither( dt )
    {
        var alive = 0;

        for(var i = 0, l = this.dna.length; i < l; i++)
        {
            const chromosone = this.dna[i];
            if (chromosone.wither(dt))
            {
                alive++;
            }
        }

        if (alive == 0)
        {
            // TODO: this entire plant has withered entirely
            console.log("plant died");
        }
    }

    sunlight( dt )
    {
        for(var i = 0, l = this.dna.length; i < l; i++)
        {
            const chromosone = this.dna[i];
            const sun = chromosone.sunlight(dt);
            if (sun > 0)
            {
                this.energy = Math.min(this.energy + sun, Plant.maxEnergyStore);
            }
        }
    }

    nutrients( dt )
    {

    }

}
