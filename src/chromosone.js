

// a Chromosone dictates when a new cuboid is spawned
// what type of cuboid it is
// how quickly it grows
// and it calculates the current size of the cuboid and increases it
class Chromosone
{
    static growthCost = {
        "seed": 1.0,
        "wood": 5.0,
        "leaf": 2.0
    };

    constructor( stage, type, _side, _speed )
    {
        this.withered = 0.0;
        this.size = 0.0;
        this.waitForStage = stage;
        this.type = type;
        this.growSide = _side || "seed";
        this.growSpeed = _speed || 1.0;
    }

    // return energy used in this growth
    // 0 if not yet started
    grow( dt, stage )
    {
        const maxGrowth = 1.0 - this.withered / 2.0;
        const startSize = this.size;

        if (stage >= this.waitForStage)
        {
            if (this.size < 0.1)
            {
                // begin growth
                this.size = 0.1;
            }
            else
            {
                // grow until max size (1.0)
                this.size = Math.min(this.size + this.growSpeed * dt, maxGrowth);
            }
        }

        const growthCost = (this.size - startSize) * Chromosone.growthCost[this.type];
        const maintenanceCost = this.size * dt * World.energyCostMultiplier;
        return growthCost + maintenanceCost;
    }

    // withering causes permanent damage, hindering the cuboids ability to collect sunlight, nutrients
    // it will also prevent growing cuboids from reaching full size
    // return true if still in the process of withering
    wither( dt )
    {
        if (this.size > 0)
        {
            this.withered += dt;
            if (this.withered >= 1.0)
            {
                this.withered = 1.0;
                return false;
            }
        }
        return true;
    }

    sunlight( dt )
    {
        if (this.size > 0)
        {
            // TODO: calculate amount of sun received directly, and indirectly if in the shade
            // size and withered are both factors
            return (1.0 - this.withered) * this.size * World.sunlightMultiplier * dt;
        }
        return 0;
    }
}