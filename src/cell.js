

class Cell
{
	
	constructor()
	{
		this.energy = 0;
		this.nutrients = 0;

		this.lightReceived = 0;
	}


	create( energy, nutrients )
	{
		this.energy = energy;
		this.nutrients = nutrients;
	}


	grow()
	{

	}

}