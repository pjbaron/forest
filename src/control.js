

class Control
{

	constructor(document, canvasName)
	{
        Control.instance = this;
		Control.document = document;
		Control.canvas = Control.document.getElementById(canvasName);

        Control.engine = new BABYLON.Engine(Control.canvas, true);
        Control.engine.renderingCanvasRatio = null;

        Control.world = new World();
        Control.world.create();

        Control.engine.runRenderLoop(function () {
            Control.world.scene.render();
        });

		// resize the canvas when the window is resized
        window.addEventListener("resize", function () {
        	Control.canvas.width = window.innerWidth;
        	Control.canvas.height = window.innerHeight;
            Control.engine.resize();
        });

		// resize the canvas when the document finishes loading
		Control.document.addEventListener('DOMContentLoaded', function() {
			Control.canvas.width = window.innerWidth;
			Control.canvas.height = window.innerHeight;
			Control.engine.resize();
		});
	}

}