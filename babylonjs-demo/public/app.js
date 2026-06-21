// Obtener el canvas del DOM
const canvas = document.getElementById("renderCanvas");

// Crear el motor de renderizado Babylon.js
const engine = new BABYLON.Engine(canvas, true);

// Crear la escena principal
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    
    // Configurar color de fondo (cielo azul claro)
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1);
    
    // Crear cámara de arco (permite rotar con el mouse)
    const camera = new BABYLON.ArcRotateCamera(
        "camera", 
        -Math.PI / 2, 
        Math.PI / 2.5, 
        10, 
        BABYLON.Vector3.Zero(), 
        scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 20;
    
    // Agregar luz hemisférica (luz ambiental)
    const light = new BABYLON.HemisphericLight(
        "light", 
        new BABYLON.Vector3(0, 1, 0), 
        scene
    );
    light.intensity = 0.7;
    
    // Crear una esfera
    const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere", 
        {diameter: 2, segments: 32}, 
        scene
    );
    sphere.position.x = -3;
    
    // Material para la esfera (color rojo brillante)
    const sphereMaterial = new BABYLON.StandardMaterial("sphereMat", scene);
    sphereMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    sphereMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    sphere.material = sphereMaterial;
    
    // Crear un cubo
    const box = BABYLON.MeshBuilder.CreateBox(
        "box", 
        {size: 2}, 
        scene
    );
    box.position.x = 3;
    
    // Material para el cubo (color azul brillante)
    const boxMaterial = new BABYLON.StandardMaterial("boxMat", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 1);
    boxMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    box.material = boxMaterial;
    
    // Crear un plano (suelo)
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground", 
        {width: 20, height: 20}, 
        scene
    );
    
    // Material para el suelo (color verde)
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    ground.material = groundMaterial;
    
    // Animación: rotar los objetos
    scene.registerBeforeRender(function () {
        sphere.rotation.y += 0.01;
        sphere.rotation.x += 0.005;
        
        box.rotation.y -= 0.01;
        box.rotation.z += 0.005;
    });
    
    return scene;
};

// Crear la escena y ejecutar el motor de renderizado
const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

// Ajustar el canvas cuando se redimensiona la ventana
window.addEventListener("resize", function () {
    engine.resize();
});
