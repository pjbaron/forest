

class Control
{

	constructor(document, canvasName)
	{
        Control.instance = this;
		Control.document = document;
		Control.canvas = Control.document.getElementById(canvasName);

        Control.engine = new BABYLON.Engine(Control.canvas, true);
        Control.engine.renderingCanvasRatio = null;

        Control.scene = new Scene();
        Control.scene.create();

        Control.ui = new UI();
        Control.ui.create();

        Control.world = new World();
        Control.world.create();

        Control.title = Control.ui.add("text", { text: "Forest", x: 0, y: 0, width: 120, height: 50, color: "#006f00" });

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