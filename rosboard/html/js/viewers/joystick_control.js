"use strict";

// Class that handles two joysticks and publishes a Twist message.
class JoystickTwistController {
  constructor(options) {
    // Containers for the joysticks (HTML elements)
    this.linearContainer = options.linearContainer;
    this.angularContainer = options.angularContainer;

    // Current twist values
    this.linearValue = 0;  // for forward/backward motion (linear.x)
    this.angularValue = 0; // for rotation (angular.z)

    // Maximum values for each component (you can adjust these)
    this.maxLinear = options.maxLinear || 1.0;
    this.maxAngular = options.maxAngular || 1.0;

    // Create the joysticks using nipplejs
    this.createJoysticks();

    // Set how often (in ms) the twist message should be published
    this.publishInterval = options.publishInterval || 100;
    // The publisher callback to call with twist data
    this.publisher = options.publisher;
    
    // Start periodic publishing of twist messages
    this.startPublishing();
  }

  createJoysticks() {
    // Create the linear (forward/back) joystick
    this.linearJoystick = nipplejs.create({
      zone: this.linearContainer,
      mode: 'static',
      position: { left: '50%', bottom: '50%' },
      color: 'blue',
      size: 150
    });
    this.linearJoystick.on('move', (evt, data) => {
      if (data.distance > 0) {
        // Use the vertical component (sin) of the joystick angle.
        // In nipplejs, 90° (or PI/2) is upward.
        let angleRad = data.angle.radian;
        let forward = Math.sin(angleRad);
        // Normalize the distance (assuming 100 pixels equals full deflection)
        let normalized = Math.min(data.distance / 100, 1.0);
        this.linearValue = normalized * forward * this.maxLinear;
      }
    });
    this.linearJoystick.on('end', () => {
      this.linearValue = 0;
    });

    // Create the angular (rotation) joystick
    this.angularJoystick = nipplejs.create({
      zone: this.angularContainer,
      mode: 'static',
      position: { right: '50%', bottom: '50%' },
      color: 'red',
      size: 150
    });
    this.angularJoystick.on('move', (evt, data) => {
      if (data.distance > 0) {
        // Use the horizontal component (cos) for rotation.
        // In nipplejs, 0° is to the right and 180° is to the left.
        let angleRad = data.angle.radian;
        let rotation = Math.cos(angleRad);
        let normalized = Math.min(data.distance / 100, 1.0);
        this.angularValue = normalized * rotation * this.maxAngular;
      }
    });
    this.angularJoystick.on('end', () => {
      this.angularValue = 0;
    });
  }

  startPublishing() {
    this.publishTimer = setInterval(() => {
      // Create a Twist-style message.
      let twist = {
        linear: { x: this.linearValue, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: this.angularValue }
      };
      // Call the publisher callback with the twist message.
      if (this.publisher && typeof this.publisher === 'function') {
        this.publisher(twist);
      }
    }, this.publishInterval);
  }

  stopPublishing() {
    if (this.publishTimer) {
      clearInterval(this.publishTimer);
      this.publishTimer = null;
    }
  }
}

// Example usage: set up two joystick containers in your HTML.
// For example, your HTML might include:
//   <div id="linearJoystick" style="width: 200px; height: 200px;"></div>
//   <div id="angularJoystick" style="width: 200px; height: 200px;"></div>
document.addEventListener("DOMContentLoaded", function() {
  const linearContainer = document.getElementById('linearJoystick');
  const angularContainer = document.getElementById('angularJoystick');

  // A dummy publisher function that logs the twist message.
  // In a real app, you might send this JSON to ROSBridge or another backend.
  const publisher = function(twist) {
    console.log("Publishing Twist:", twist);
  };

  // Instantiate the joystick controller.
  const joystickController = new JoystickTwistController({
    linearContainer: linearContainer,
    angularContainer: angularContainer,
    maxLinear: 1.0,      // Maximum forward/backward value
    maxAngular: 1.0,     // Maximum rotation value
    publishInterval: 100, // Publish every 100ms
    publisher: publisher
  });
});

