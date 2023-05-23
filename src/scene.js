

class Scene
{

    constructor()
    {
        this.scene = null;
        this.camera = null;
    }


    create()
    {
        // Create a new scene
        var scene = new BABYLON.Scene(Control.engine);

        // Create a camera and attach it to the scene
        this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, World.eyeLevel, -World.mapSize * 0.85), scene);
        this.camera.attachControl(Control.canvas, true);
        this.camera.rotation = new BABYLON.Vector3(10 * Math.PI / 180, 0, 0);
        this.camera.inertia = 0;
        this.camera.speed = 1.0;
        this.camera.angularSensibility = 500.0;

        // Modify camera's keyboard controls
        const dsm = new BABYLON.DeviceSourceManager(scene.getEngine());
        dsm.onDeviceConnectedObservable.add((eventData) => this.registerWASD( dsm, eventData, scene ));
        this.scene = scene;
    }


    registerWASD( dsm, eventData, scene )
    {
        if (eventData.deviceType === BABYLON.DeviceType.Keyboard) {
            const keyboard = dsm.getDeviceSource(BABYLON.DeviceType.Keyboard);
            let shiftPressed = false;

            // listen for system keys, set flags
            scene.onKeyboardObservable.add((kbInfo) => {
                switch (kbInfo.type)
                {
                    case BABYLON.KeyboardEventTypes.KEYDOWN:
                        switch (kbInfo.event.key)
                        {
                            case "Shift":
                                shiftPressed = true;
                                break;
                            // "Ctrl" etc
                        }
                        break;
        
                    case BABYLON.KeyboardEventTypes.KEYUP:
                        switch (kbInfo.event.key)
                        {
                            case "Shift":
                                shiftPressed = false;
                                break;
                        }
                }
            });            

            // check keypressed for movement control keys
            scene.beforeRender = () => {
                const w = keyboard.getInput(87);
                const a = keyboard.getInput(65);
                const s = keyboard.getInput(83);
                const d = keyboard.getInput(68);
                const e = keyboard.getInput(69);
                const q = keyboard.getInput(81);
                const speed = World.cameraSpeed + (shiftPressed ? World.boostSpeed : 0);
                if (w === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Forward().scale(speed)));
                }
                if (s === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Backward().scale(speed)));
                }
                if (a === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Left().scale(speed)));
                }
                if (d === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Right().scale(speed)));
                }
                if (e === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Up().scale(speed)));
                }
                if (q === 1) {
                    this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Down().scale(speed)));
                }
                if (this.camera.position.y < World.groundLevel + 1.0)
                    this.camera.position.y = World.groundLevel + 1.0;
            };
        }
    }

}
