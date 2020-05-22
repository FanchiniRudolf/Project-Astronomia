

let renderer = null, 
scene = null, 
camera = null,
root = null,
group = null,
objectList = [];

let objLoader = null;

let currentTime = Date.now();

let directionalLight = null;
let spotLight = null;
let ambientLight = null;
let pointLight = null;
let mapUrl = "images/checker_large.gif";

let duration = 12, // sec
    crateAnimator = null,
    animateCrate = true,
    animateWaves = true,
    animateLight = true,
    animateWater = true,
    loopAnimation = true;

var composer;

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

/*
function playAnimations(){

    let rad = 20;

    objectList.forEach(idx=>{
        console.log('idx: ',idx);
        idx.position.set(0,0,0);

        if (animateCrate) {

            crateAnimator = new KF.KeyFrameAnimator;
            crateAnimator.init({
                interps:
                    [
                        {
                            keys: [.1, .2, .3, .4, .5, .6, .7, .75, .8, 0.85, 0.9, 1],
                            values: [

                                {x: 0, z: 0},

                                { x: Math.cos((10 * Math.PI) / 5) * rad, z:  Math.sin((10 * Math.PI) / 5) * rad },
                                { x: Math.cos((1 * Math.PI) / 5) * rad, z:  Math.sin((1 * Math.PI) / 5) * rad },
                                { x: Math.cos((2 * Math.PI) / 5) * rad, z:  Math.sin((2 * Math.PI) / 5) * rad },
                                { x: Math.cos((3 * Math.PI) / 5) * rad, z:  Math.sin((3 * Math.PI) / 5) * rad },
                                { x: Math.cos((4 * Math.PI) / 5) * rad, z:  Math.sin((4 * Math.PI) / 5) * rad },
                                { x: Math.cos((5 * Math.PI) / 5) * rad, z:  Math.sin((5 * Math.PI) / 5) * rad },

                                { x: Math.cos((9 * Math.PI) / 5) * rad, z:  Math.sin((9 * Math.PI) / 5) * rad },
                                { x: Math.cos((8 * Math.PI) / 5) * rad, z:  Math.sin((8 * Math.PI) / 5) * rad },
                                { x: Math.cos((7 * Math.PI) / 5) * rad, z:  Math.sin((7 * Math.PI) / 5) * rad },
                                { x: Math.cos((6 * Math.PI) / 5) * rad, z:  Math.sin((6 * Math.PI) / 5) * rad },

                                {x: 0, z: 0},


                            ],
                            target:idx.position
                        },
                        {
                            keys:[0, 0.02, 0.04, 0.08, 0.1,
                                0.12, 0.14, 0.16, 0.18, 0.2,
                                0.22, 0.24, 0.26, 0.28, 0.3,
                                0.32, 0.34, 0.36, 0.38, 0.4, 
                                0.42, 0.44, 0.46, 0.48, 0.5,
                                0.52, 0.54, 0.56, 0.58, 0.6,
                                0.62, 0.64, 0.66, 0.68, 0.7,
                                0.72, 0.74, 0.76, 0.78, 0.8,
                                0.82, 0.84, 0.86, 0.88, 0.9,
                                0.92, 0.94, 0.96, 0.98, 1],
                            values:[
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 },
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 },
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 },
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 },
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 },
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 },
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 },
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 },
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 },
                                { x : 0, z : 0 },{ x : 0.2, z : 0.2 },{ x : 0, z : 0 },{ x : 0.2, z : -0.2 },{ x : 0, z : 0 }
                            ],
                            target:idx.rotation
                        },
                    ],
                loop: loopAnimation,
                duration:duration * 1000,
            });
            crateAnimator.start();
        }

    });

}*/

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

        object.scale.set(15, 15, 15);
        object.rotation.y = 1;
        object.name = "objObject";
        objectList.push(object);
        scene.add(object);

    }
    catch (err) {
        return onError(err);
    }
}



function run() 
{
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render( scene, camera );

    // Update the animations
    KF.update();

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

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    ambientLight = new THREE.AmbientLight ( 0xffffff, 0.8);
    root.add(ambientLight);

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
    mesh.position.y = -40;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add( mesh );

    /*
    var renderScene = new RenderPass( scene, camera );

	var bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = params.bloomThreshold;
	bloomPass.strength = params.bloomStrength;
	bloomPass.radius = params.bloomRadius;

	composer = new EffectComposer( renderer );
	composer.addPass( renderScene );
	composer.addPass( bloomPass );*/

    scene.add( root );

}
