

class Control
{

	constructor(document, canvasName)
	{
		Control.document = document;
		Control.canvas = Control.document.getElementById(canvasName);
        Control.engine = new BABYLON.Engine(Control.canvas, true);
        Control.engine.renderingCanvasRatio = null;
        Control.scene = this.createScene();

        Control.world = new World();
        Control.world.create(Control.scene);

        Control.engine.runRenderLoop(function () {
            Control.scene.render();
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


    createScene()
    {
        // Create a new scene
        var scene = new BABYLON.Scene(Control.engine);

        // Create a camera and attach it to the scene
        Control.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, World.eyeLevel, -World.mapSize * 0.75), scene);
        Control.camera.attachControl(Control.canvas, true);
        Control.camera.rotation = new BABYLON.Vector3(10 * Math.PI / 180, 0, 0);
        Control.camera.inertia = 0;
        Control.camera.speed = 1.0;

        // Create lights and attach to the scene
        const light = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 50, 0), scene);
        light.intensity = 1.0;

        const ambient = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
        ambient.intensity = 0.6;

        return scene;
    }
}