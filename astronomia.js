
let renderer = null, scene = null, camera = null,
root = null,group = null,objectList = [],orbitControls = null;

let objLoader = null;

let currentTime = Date.now();
let now = null , deltat = null;

let directionalLight = null;
let spotLight = null;
let mapUrl = "images/checker_large.gif";

let duration = 12; // sec


let audio = null, analyser = null, context = null, src = null, dataArray = null;

let composer = null, bloomPass = null, effectDot = null, effectRgb = null, pixelPass = null, effectGrayScale = null, effectSobel = null;
let renderPass = null;
var params = {
	    exposure: .9,
		bloomStrength: 1,
		bloomThreshold: 0,
		bloomRadius: 0 };

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
        update();

    }
    catch (err) {
        return onError(err);
    }
}

function createAudio(){
    audio = document.getElementById('audio');
    audio.load();
    audio.play();
    context = new AudioContext();  // create context
    src = context.createMediaElementSource(audio); //create src inside ctx
    analyser = context.createAnalyser(); //create analyser in ctx
    src.connect(analyser);         //connect analyser node to the src
    analyser.connect(context.destination); // connect the destination 
                                        

    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
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
    pointLight = new THREE.PointLight(0xff6666, 1);
    pointLight.position.set( 0, 25, 0 );
    root.add(pointLight);

    // Create the objects

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
    scene.add( root );

    //var startButton = document.getElementById( 'startButton' );
    //startButton.addEventListener( 'click', createAudio );

    window.addEventListener( 'resize', onWindowResize);
    loadObj(objModelUrl, objectList);
    addEffects();
    createAudio();

}

function update()
{
    requestAnimationFrame(update);
    render();

    //Changing effects according the time
    if(deltat>4){
        bloomPass.enabled = true;
    }if(deltat>19.2){
        bloomPass.enabled = false;
        effectDot.enabled = true;
        effectRgb.enabled = true;
    }if(deltat>41.9){
        bloomPass.enabled = true;
    }if(deltat>50){
        pixelPass.enabled = true;
        effectDot.enabled = false;
        effectRgb.enabled = false;
    }if(deltat>72.8){
        pixelPass.enabled = false;
        effectGrayScale.enabled = true;
        effectSobel.enabled = true;
    }if(deltat>118.4){
        pixelPass.enabled = true;
    }if(deltat>133.5){ 
        pixelPass.enabled = false;
        effectGrayScale.enabled = false;
        effectSobel.enabled = false;
        bloomPass.enabled = false;
        effectDot.enabled = true;
        effectRgb.enabled = true;
    }if(deltat>164){
        effectDot.enabled = false;
        effectRgb.enabled = false;
        bloomPass.enabled = true;
    }if(deltat>187){
        pixelPass.enabled = true;
    }if(deltat>194.5){
        pixelPass.enabled = false;
        bloomPass.enabled = false;
    }

}
 

function render()
{
    // Traditional render: take a scene and a camera and render to the canvas
    // renderer.render(scene, camera);
    now = Date.now();
    deltat = (now - currentTime) /1000;
    console.log(deltat);
    // Rendering using an effect composer
    composer.render();

    orbitControls.update();

    
    analyser.getByteFrequencyData(dataArray);
    /*
    var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
    var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);
    // do some basic reductions/normalisations
    var lowerMax = Math.max(...lowerHalfArray);
    var lowerAvg = avg(lowerHalfArray);
    var upperAvg = avg(upperHalfArray);
    var lowerMaxFr = lowerMax / lowerHalfArray.length;
    var lowerAvgFr = lowerAvg / lowerHalfArray.length;
    var upperAvgFr = upperAvg / upperHalfArray.length;
    //console.log(lowerMaxFr, upperAvgFr);*/

}

function addEffects()
{
    // First, we need to create an effect composer: instead of rendering to the WebGLRenderer, we render using the composer.
    composer = new THREE.EffectComposer(renderer);

    // The effect composer works as a chain of post-processing passes. These are responsible for applying all the visual effects to a scene. They are processed in order of their addition. The first pass is usually a Render pass, so that the first element of the chain is the rendered scene.
    renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // UnrealBloomPass
    bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.5, 0.2, 1 );
    bloomPass.threshold = 0;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;
    renderer.toneMappingExposure = Math.pow( params.exposure, 1.0 );
    composer.addPass(bloomPass);
    bloomPass.enabled = false;
    /*GlitchPass won't work
    var glitchPass = new THREE.GlitchPass();
    glitchPass.renderToScreen = true;
    composer.addPass( glitchPass );*/
    
    //Postprocessing effect 
    effectDot = new THREE.ShaderPass( THREE.DotScreenShader );
	effectDot.uniforms[ 'scale' ].value = 12;
    composer.addPass( effectDot );
    effectDot.enabled = false;

    effectRgb = new THREE.ShaderPass( THREE.RGBShiftShader );
    effectRgb.uniforms[ 'amount' ].value = 0.0030;
    composer.addPass( effectRgb );
    effectRgb.enabled = false;

    //Pixel shader 
    pixelPass = new THREE.ShaderPass( THREE.PixelShader );
	pixelPass.uniforms[ "resolution" ].value = new THREE.Vector2( window.innerWidth, window.innerHeight );
    pixelPass.uniforms[ "resolution" ].value.multiplyScalar( window.devicePixelRatio );
    pixelPass.uniforms[ "pixelSize" ].value = 2.5;
    composer.addPass( pixelPass );
    pixelPass.enabled = false;

    //Sobel effect
    effectGrayScale = new THREE.ShaderPass( THREE.LuminosityShader );        composer.addPass( effectGrayScale );
    effectGrayScale.enabled = false;
    effectSobel = new THREE.ShaderPass( THREE.SobelOperatorShader );
	effectSobel.uniforms[ 'resolution' ].value.x = window.innerWidth * window.devicePixelRatio;
    effectSobel.uniforms[ 'resolution' ].value.y = window.innerHeight * window.devicePixelRatio;
    composer.addPass( effectSobel );
    effectSobel.enabled = false;
        
}


function avg (numbers) {
    let sum = 0;
    for (let i = 0; i < numbers.length; i++){
        sum += numbers[i];
    }
    return sum / numbers.length;
}

function onWindowResize() 
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

