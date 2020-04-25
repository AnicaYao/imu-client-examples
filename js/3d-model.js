import {
    onSensorData,
    bleAvailable,
    bleConnect,
} from 'https://cdn.jsdelivr.net/npm/imu-tools@0.1.4/index.js';
import {
    isMobile,
    quatToMatrix,
} from 'https://cdn.jsdelivr.net/npm/imu-tools@0.1.4/utils.js';

let modelObj; // setup initializes this to a p5.js 3D model
let img;
let img2;
let SWH1;
let SWH2;
let SWH3;
const devices = {}; // sensor data for each device, indexed by device id

const AXIS_LENGTH = 400;

const settings = {
    draw_axes: false,
    dx: 0,
    dy: 0,
    dz: 0,
    rx: 0,
    ry: 0,
    rz: 180,
    model_name: 'camera',
};

// Constants for physics simulation
const SPRING_LENGTH = 500;
const SPRING_K = 0.001; // strength of spring between bodies
const ORIGIN_SPRING_K = 0.99; // strength of spring towards origin
const VISCOSITY = 0.99;

function loadModelFromSettings() {
    let modelName = settings.model_name || 'camera';
    if (!modelName.match(/\.(obj|stl)$/)) {
        modelName += '.obj';
    }
    modelObj = loadModel('models/' + modelName, true);
}

var datControllers = {};
if (window.dat && !isMobile) {
    const gui = new dat.GUI();
    // gui.remember(settings);  // uncomment to store settings to localStorage
    gui.add(settings, 'draw_axes').name('Draw axes');
    gui.add(settings, 'dx', -300, 300).name('x displacement');
    gui.add(settings, 'dy', -300, 300).name('y displacement');
    gui.add(settings, 'dz', -300, 300).name('z displacement');
    datControllers = {
        rx: gui.add(settings, 'rx', 0, 180).name('x rotation'),
        ry: gui.add(settings, 'ry', 0, 180).name('y rotation'),
        rz: gui.add(settings, 'rz', 0, 360).name('z rotation'),
    };
    gui.add(settings, 'model_name')
        .name('Model name')
        .onFinishChange(loadModelFromSettings);
}

export function preload() {
    loadModelFromSettings();
    img = loadImage("models/dog.jpeg");
    img2 = loadImage("models/dog2.jpeg");
}

let sensorData = {};// adjust from error report

// preload(); setup(); draw(); draw(); draw(); handleSensorData(); draw(); draw();

export function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    imuConnection.onSensorData(handleSensorData);
    createButton('Calibrate').position(0, 0).mousePressed(calibrateModels);

    //let button = createButton('say hello');
    //button.mousePressed(greet);

    //button.onClick = greet;
    
  SWH1 = random(1, 2);
  SWH2 = random(3, 5);
  SWH3 = random(10, 13);
    
}

// function greet() {
//     alert("hello");
// }

function handleSensorData(device) {
    sensorData = device.data;
}

export function draw() {
    noStroke();
  background(30,60,70);
  
  //stars in the universe
  fill(250, 200, 0);
  ellipse(mouseX*1.1, mouseY*1.8, SWH1, SWH1);
  ellipse(mouseX*1.3, mouseY*2.5, SWH2, SWH2);
  ellipse(mouseX*2.3, mouseY*1.5, SWH3, SWH3);
  ellipse(mouseX/1.1, mouseY/1.8, SWH1, SWH1);
  ellipse(mouseX/1.3, mouseY/2.5, SWH2, SWH2);
  ellipse(mouseX/2.3, mouseY/1.5, SWH3, SWH3);
  
  //glow
  fill(200, 130, 10, 20);
  ellipse(0, 0, (frameCount % 500)*2, (frameCount % 500)*2);
  ellipse(0, 0, (frameCount % 500)*4, (frameCount % 500)*4);
  ellipse(0, 0, (frameCount % 500)*8, (frameCount % 500)*8);
  ellipse(0, 0, (frameCount % 500)*16, (frameCount % 500)*16);
  ellipse(0, 0, (frameCount % 500)*24, (frameCount % 500)*24);
  
  //sun
  fill(200, 130, 10);
  ellipse(0, 0, 0.1, 0.1);
  fill(250, 200, 0);
  ellipse(0, 0, 0.1 , 0.1 );
    
    console.log('sensorData =', sensorData);
    console.log('sensorData.euler =', sensorData.euler);
    if (sensorData.euler!= undefined){
    console.log('sensorData.euler[0] = ',sensorData.euler[0]);
    console.log('sensorData.euler[1] = ',sensorData.euler[1]);
    console.log('sensorData.euler[2] = ',sensorData.euler[2]);}

    const currentTime = +new Date();

    // background(200, 200, 212);
    noStroke();
    lights();
    // directionalLight(226, 192, 141, 0, 0, 0); //test
    let dirY = (mouseY / height - 0.5) *2;
    let dirX = (mouseX / width - 0.5) *2;
    directionalLight(250, 250, 250, dirX, -dirY, 0.25);
    ambientMaterial(250);
    //test above
    // orbitControl();
    

    console.log('sensorData =', sensorData.euler);
    if (sensorData.euler!= undefined){ //hightlight
    normalMaterial();
    push();  
    translate(-sin(sensorData.euler[2]*Math.PI/180)*200,-sin(sensorData.euler[1]*Math.PI/180)*200,cos(sensorData.euler[0]*Math.PI/180)*400);
    fill(240,161,168);
    // rotateZ(frameCount * 0.01);
    rotateX(frameCount * 0.01);
    rotateY(frameCount * 0.01);
    if (frameCount>1200 && frameCount<2000 ){
    texture(img); }
    else if(frameCount>2000){
        texture(img2);
    }
    plane(100);
    pop();

}
    
    


    const models = Object.values(devices);
    // apply the physics simulation just to the models that have recent sensor data
    updatePhysics(
        models.filter(({ receivedAt }) => currentTime - receivedAt < 500)
    );
    
    
    models.forEach((data) => {
        push();
        // Place the object in world coordinates
        if (data.position) {
            translate.apply(null, data.position);
        }

        if (data.calibrationMatrix) {
            applyMatrix.apply(null, data.calibrationMatrix);
        }

        applyMatrix.apply(null, data.orientationMatrix);

        // Draw the axes in model coordinates
        if (settings.draw_axes) {
            drawAxes();
        }

        // Fade the model out, if the sensor data is stale
        const age = Math.max(0, currentTime - data.receivedAt - 250);
        const alpha = Math.max(5, 255 - age / 10);
        fill(255, 255, 255, alpha);

        // Fully uncalibrated models are shown in red
        if (data.calibration === 0) {
            fill(255, 0, 0, alpha);
        }

        // Apply the GUI rotation settings
        rotateX((settings.rx * Math.PI) / 180);
        rotateY((settings.ry * Math.PI) / 180);
        rotateZ((settings.rz * Math.PI) / 180);

        // Translate the position in model coordinates. This swings it around
        // the end of a stick.
        translate(settings.dx, settings.dy, settings.dz);

        // Render the model
        noStroke();
        model(modelObj);

        pop();
    });
}

// Set its model's calibration matrix to the inverse of the model's current orientation.
// This will cause it to be drawn in its native orientation whenever
function calibrateModels() {
    const models = Object.values(devices);
    models.forEach((model) => {
        const [q0, q1, q2, q3] = model.quaternion;
        const mat = quatToMatrix(q3, q1, q0, q2);
        const inv = math.inv([
            mat.slice(0, 3),
            mat.slice(4, 7),
            mat.slice(8, 11),
        ]);
        model.calibrationMatrix = [
            ...inv[0],
            0,
            ...inv[1],
            0,
            ...inv[2],
            0,
            ...[0, 0, 0, 1],
        ];
    });
    // reset the GUI rotation, and update the GUI slider display
    settings.rx = 0;
    settings.ry = 0;
    settings.rz = 0;
    Object.values(datControllers).forEach((c) => c.updateDisplay());
}

function drawAxes() {
    strokeWeight(3);
    [0, 1, 2].forEach((axis) => {
        const color = [0, 0, 0];
        const vector = [0, 0, 0, 0, 0, 0];
        color[axis] = 128;
        vector[axis + 3] = AXIS_LENGTH;
        stroke.apply(null, color);
        line.apply(null, vector);
    });
}

function updatePhysics(models) {
    // initialize positions and velocities of new models
    models.forEach((data) => {
        if (!data.position) {
            // Offset models from the origin so they disperse
            const e = 0.0001;
            const rand = () => (Math.random() - 0.5) * 2 * e;
            data.position = [rand(), rand(), rand()];
            data.velocity = [0, 0, 0];
        }
    });

    // Apply spring forces between every object pair
    models.forEach((d1) => {
        models.forEach((d2) => {
            if (d1 === d2) {
                return;
            }
            const v = d1.position.map((p0, i) => d2.position[i] - p0);
            const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
            const v_norm = v.map((x) => x / len);
            const f = SPRING_K * (len - SPRING_LENGTH);
            const fv = v_norm.map((x) => x * f);
            d1.velocity = d1.velocity.map((x, i) => x + fv[i]);
            d2.velocity = d2.velocity.map((x, i) => x - fv[i]);
        });
    });

    // Add velocities to positions. Spring positions to origin. Damp velocities.
    models.forEach((data) => {
        const { position, velocity } = data;
        data.position = position.map(
            (x, i) => (x + velocity[i]) * ORIGIN_SPRING_K
        );
        data.velocity = velocity.map((v) => v * VISCOSITY);
    });
}

onSensorData(
    ({ deviceId, data }) =>
        (devices[deviceId] = {
            ...(devices[deviceId] || {}),
            ...data,
        })
);

export function keyPressed(evt) {
    if (evt.key.match(/b/i) && bleAvailable) {
        bleConnect();
    }
}
