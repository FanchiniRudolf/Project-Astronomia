

let renderer = null, scene = null, camera = null,
root = null,group = null,objectList = [],orbitControls = null;

let objLoader = null;

let currentTime = Date.now();

let directionalLight = null;
let spotLight = null;
let mapUrl = "images/checker_large.gif";

let duration = 12; // sec


var composer, analyser, uniforms, listener, dataArray;

var params = {
	    exposure: 1,
		bloomStrength: 1.5,
		bloomThreshold: 0,
		bloomRadius: 0 };

let SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;
let objModelUrl = {obj:'models/75-chevrolet_camaro_ss/Chevrolet_Camaro_SS_Low.obj', map:'models/DeLorean/DeLorean.jpg'};


function promisifyLoader ( loader, onProgress ) 
{
    function promiseLoader ( url ) {
  
      return new Promise( ( resolve, reject ) => {
  
        loader.load( url, resolve, onProgress, reject );
  
      } );
    }
  
    return {
      originalLoader: loader,
      load: promiseLoader,
    };
}

const onError = ( ( err ) => { console.error( err ); } );

async function loadObj(objModelUrl, objectList)
{
    const objPromiseLoader = promisifyLoader(new THREE.OBJLoader());

    try {
        const object = await objPromiseLoader.load(objModelUrl.obj);
        
        let texture = objModelUrl.hasOwnProperty('map') ? new THREE.TextureLoader().load(objModelUrl.map) : null;
        let normalMap = objModelUrl.hasOwnProperty('normalMap') ? new THREE.TextureLoader().load(objModelUrl.normalMap) : null;
        let specularMap = objModelUrl.hasOwnProperty('specularMap') ? new THREE.TextureLoader().load(objModelUrl.specularMap) : null;

        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.map = texture;
                child.material.normalMap = normalMap;
                child.material.specularMap = specularMap;
            }
        });

        object.scale.set(8, 8, 8);
        object.rotation.y = 1;
        object.position.set(0,10,-8);
        object.name = "objObject";
        objectList.push(object);
        scene.add(object);
        run();

    }
    catch (err) {
        return onError(err);
    }
}

function createAudio(){
    listener = new THREE.AudioListener();

	var audio = new THREE.Audio( listener );

	var audioLoader = new THREE.AudioLoader();
        audioLoader.load( 'astronomia.mp3', function( buffer ) {
            audio.setBuffer( buffer );
            audio.setLoop(true);
            audio.setVolume(0.5);
            audio.play();
        });

     // create an AudioAnalyser, passing in the sound and desired fftSize
    var analyser = new THREE.AudioAnalyser( audio, 2048 );

    //var bufferLength = analyser.frequencyBinCount;;
    console.log(analyser.getFrequencyData());
    console.log(analyser.data);  
    scene.add(listener);
}


function run() 
{
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render(scene, camera);
    //composer.render();

    // Update the animations
    KF.update();

    // Update the camera controller
    orbitControls.update();

}


function createScene(canvas) {

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;

    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.BasicShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 80, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(-5, 40, 150);
    scene.add(camera);

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    ambientLight = new THREE.AmbientLight ( 0x404040, 0.8);
    root.add(ambientLight);
    pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set( 0, 30, 0 );
    root.add(pointLight);

    // Create the objects
    loadObj(objModelUrl, objectList);

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    let map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);
    let color = 0xffffff;

    // Put in a ground plane to show off the lighting
    let geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add( mesh );
    new THREE.GLTFLoader().load( 'models/mazda/scene.gltf', function ( gltf ) {

        var model = gltf.scene;
        model.position.set(-30, 18, 80)

        model.rotation.y = 1;
        model.scale.set(15,15,15);
        scene.add( model );

    } );

    composer = new THREE.EffectComposer( renderer );
    var renderPass = new THREE.RenderPass( scene, camera );
    composer.addPass( renderPass );

	var bloomPass = new THREE.BloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.5, 0.85 );
    bloomPass.threshold = params.bloomThreshold;
	bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;
    bloomPass.renderToScreen = true;
    composer.addPass( bloomPass );

    scene.add( root );

    var startButton = document.getElementById( 'startButton' );
	startButton.addEventListener( 'click', createAudio );


}

