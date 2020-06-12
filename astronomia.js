
let renderer = null, scene = null, camera = null,
root = null,group = null,objectList = [],orbitControls = null, stars = null, starGeo = null, 
car = null, animator = null;

let objLoader = null;

let currentTime = Date.now();
let now = null , deltat = null;

let directionalLight = null;
let spotLight = null;
let mapUrl = "images/checker_large.gif";
let roadUrl = "images/road.jpg";

let duration = 12; // sec
const NUMBER_OF_STARS = 4000;


let audio = null, analyser = null, context = null, src = null, dataArray = null;
var test = true;

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

async function loadObj()
{

    new THREE.GLTFLoader().load( 'models/mazda/scene.gltf', function ( gltf ) {

        var model = gltf.scene;
        model.position.set(-30, 18, 80)

        model.rotation.y = 1;
        model.scale.set(20,20,20);
        model.rotation.y = Math.PI/2;
        model.position.set(-120, 25, 33);
        model.name = "objObject";
        car = model
        scene.add( car );
        makeCarAnimation();
        animator.start();

    } );
    
        
        update();
}
function makeCarAnimation(){
    animator = new KF.KeyFrameAnimator;
    animator.init({
            interps:
                [
                    {
                        keys: [0, 0.5, 1],
                        values: [
                            {x: -100},
                            {x: -60},
                            {x: 0}
                            
                        ],
                        target:car.position
                    },
                ],
            loop: false,
            duration: 10000, //ms
        });
        console.log(animator);
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


function createStars(){
    starGeo = new THREE.Geometry();
    for(let i=0;i<NUMBER_OF_STARS;i++) {
        let star = new THREE.Vector3(
        Math.random() * 600 - 300,
        Math.random() * 600 - 300,
        Math.random() * 600 - 300
        );
        star.velocity = 0;
        star.acceleration = 0.02;
        starGeo.vertices.push(star);
    }

    let texture = new THREE.TextureLoader().load( 'images\\star.png' );
    let starMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.7,
        map: texture
    });


    stars = new THREE.Points(starGeo,starMaterial);
    scene.add(stars);
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
    camera.position.set(-106, 16, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));
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
    let geometry = new THREE.PlaneGeometry(500, 500, 50, 50);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add( mesh );

    createRoad()

    
    scene.add( root );

    //var startButton = document.getElementById( 'startButton' );
    //startButton.addEventListener( 'click', createAudio );

    window.addEventListener( 'resize', onWindowResize);
    loadObj();
    addEffects();
    createAudio();
    createStars();

}

function createRoad(){
    // Create a texture map
    let map = new THREE.TextureLoader().load(roadUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);
    let color = 0xffffff;

    // Put in a ground plane to show off the lighting
    let geometry = new THREE.PlaneGeometry(200, 50, 50, 50);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y += 1;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add( mesh );
}

function update()
{
    requestAnimationFrame(update);
    render();
    KF.update();

    /Changing effects according the time
    if(deltat>4){
        bloomPass.enabled = true;
        pointLight.color.setHex( 0x32ff84 );
    }if(deltat>12){
        pointLight.intensity += .01;
    }if(deltat>19.4){
        bloomPass.enabled = false;
        effectDot.enabled = true;
        effectRgb.enabled = true;
        pointLight.intensity -= 0.009;
    }if(deltat>42){
        effectDot.enabled = false;
        pointLight.color.setHex( 0xff0c0c );
        //bloomPass.enabled = true;
    }if(deltat>50){
        //pixelPass.enabled = true;
        bloomPass.enabled = true;
        //pointLight.intensity = 1;
        effectDot.enabled = false;
        effectRgb.enabled = false;
        pointLight.color.setHex( 0x7d32ff );
        pointLight.intensity -= 0.009;
    }if(deltat>65){
        pointLight.intensity += .014;
    }if(deltat>72.8){
        pixelPass.enabled = false;
        effectGrayScale.enabled = true;
        effectSobel.enabled = true;
        pointLight.intensity -= 0.01;
    }if(deltat>80){
        pointLight.intensity = 1;
    }if(deltat>118.4){
        pixelPass.enabled = true;
    }if(deltat>133.5){ 
        pixelPass.enabled = false;
        effectGrayScale.enabled = false;
        effectSobel.enabled = false;
        bloomPass.enabled = false;
        effectDot.enabled = true;
        effectRgb.enabled = true;
        pointLight.intensity = 3;
    }if(deltat>164){
        pointLight.intensity = 1;
        //pointLight.intensity -= .01;
        effectDot.enabled = false;
        effectRgb.enabled = false;
        bloomPass.enabled = true;
        pointLight.color.setHex( 0xfcfc0c );
    }if(deltat>187){
        pixelPass.enabled = true;
        pointLight.color.setHex( 0xff3255 );
        //pointLight.intensity += .01;
    }if(deltat>194.5){
        pixelPass.enabled = false;
        bloomPass.enabled = false;
        pointLight.intensity = 0;
    }
    


}

function animateStars(){
    //Move stars
    starGeo.vertices.forEach(p => {
        p.velocity += p.acceleration;
        p.x -= p.velocity;
        
        if (p.x < -200) {
          p.x = 200;
          p.velocity = 0;
        }
      });
      starGeo.verticesNeedUpdate = true; 
      stars.rotation.x +=0.002;
}

function render()
{
    // Traditional render: take a scene and a camera and render to the canvas
    // renderer.render(scene, camera);
    now = Date.now();
    deltat = (now - currentTime) /1000;
    //console.log(deltat);
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

    //currentTime = now;
    //console.log(deltat);
    //console.log();
    animateStars()
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
