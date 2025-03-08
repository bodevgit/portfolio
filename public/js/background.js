// Three.js Space Background with Mouse Interaction
// Create an immersive space environment with particles and interactive effects

let scene, camera, renderer, particles, stars;
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let particleGroup;
let animationRunning = false; // Flag to track if animation is running
let animationLoopId = null; // Store the animation frame ID

function initBackground() {
    try {
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded. Background will not be initialized.');
            setupFallbackBackground();
            return;
        }
        
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) {
            console.error('Canvas element not found. Background will not be initialized.');
            setupFallbackBackground();
            return;
        }
        
        // Create scene
        scene = new THREE.Scene();
        
        // Create camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.z = 500;
        
        // Configure renderer with explicit error handling
        try {
            renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                antialias: true, 
                alpha: true 
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000, 1); // Pure black background
        } catch (rendererError) {
            console.error('Error creating WebGL renderer:', rendererError);
            setupFallbackBackground();
            return; // Exit early to prevent further errors
        }
        
        // Add event listeners
        document.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('resize', onWindowResize, false);
        
        // Create particle systems
        createParticles();
        createStars();
        
        // Start animation loop
        startAnimation();
        
        console.log('Space background initialized successfully');
    } catch (error) {
        console.error('Error initializing background:', error);
        // Make sure the site is still usable even if the background fails
        setupFallbackBackground();
    }
}

// Create a separate function to start animation with safety checks
function startAnimation() {
    try {
        if (!animationRunning) {
            animationRunning = true;
            animate();
            console.log('Animation loop started');
        }
    } catch (error) {
        console.error('Failed to start animation:', error);
        animationRunning = false;
        setupFallbackBackground();
    }
}

function createParticles() {
    try {
        // Main particle group
        particleGroup = new THREE.Object3D();
        scene.add(particleGroup);
        
        // Create purple particles
        const purpleParticleCount = 500;
        const purpleGeometry = new THREE.BufferGeometry();
        const purplePositions = new Float32Array(purpleParticleCount * 3);
        const purpleSizes = new Float32Array(purpleParticleCount);
        
        for (let i = 0; i < purpleParticleCount; i++) {
            const i3 = i * 3;
            // Spread particles throughout the scene
            purplePositions[i3] = (Math.random() - 0.5) * 2000;
            purplePositions[i3 + 1] = (Math.random() - 0.5) * 2000;
            purplePositions[i3 + 2] = (Math.random() - 0.5) * 2000;
            
            // Randomize particle sizes
            purpleSizes[i] = Math.random() * 5 + 1;
        }
        
        purpleGeometry.setAttribute('position', new THREE.BufferAttribute(purplePositions, 3));
        purpleGeometry.setAttribute('size', new THREE.BufferAttribute(purpleSizes, 1));
        
        // Purple particle material with glow effect
        const purpleMaterial = new THREE.PointsMaterial({
            size: 4,
            color: 0x8a2be2, // Purple
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            map: createParticleTexture()
        });
        
        // Create particle system
        particles = new THREE.Points(purpleGeometry, purpleMaterial);
        particleGroup.add(particles);
        
        // Create another set of particles with slightly different properties
        const blueParticleCount = 300;
        const blueGeometry = new THREE.BufferGeometry();
        const bluePositions = new Float32Array(blueParticleCount * 3);
        const blueSizes = new Float32Array(blueParticleCount);
        
        for (let i = 0; i < blueParticleCount; i++) {
            const i3 = i * 3;
            bluePositions[i3] = (Math.random() - 0.5) * 2000;
            bluePositions[i3 + 1] = (Math.random() - 0.5) * 2000;
            bluePositions[i3 + 2] = (Math.random() - 0.5) * 2000;
            blueSizes[i] = Math.random() * 3 + 1;
        }
        
        blueGeometry.setAttribute('position', new THREE.BufferAttribute(bluePositions, 3));
        blueGeometry.setAttribute('size', new THREE.BufferAttribute(blueSizes, 1));
        
        // Blue particle material
        const blueMaterial = new THREE.PointsMaterial({
            size: 3,
            color: 0x3a86ff, // Blue
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            map: createParticleTexture()
        });
        
        // Create blue particle system
        const blueParticles = new THREE.Points(blueGeometry, blueMaterial);
        particleGroup.add(blueParticles);
    } catch (error) {
        console.error('Error creating particles:', error);
    }
}

function createStars() {
    try {
        // Create distant stars for depth
        const starCount = 2000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            starPositions[i3] = (Math.random() - 0.5) * 3000;
            starPositions[i3 + 1] = (Math.random() - 0.5) * 3000;
            starPositions[i3 + 2] = (Math.random() - 0.5) * 3000;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        
        // Star material
        const starMaterial = new THREE.PointsMaterial({
            size: 1.5,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // Create star system
        stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
    } catch (error) {
        console.error('Error creating stars:', error);
    }
}

function createParticleTexture() {
    try {
        // Create a custom particle texture for better glow effect
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(240,240,255,0.8)');
        gradient.addColorStop(0.4, 'rgba(220,220,255,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,20,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    } catch (error) {
        console.error('Error creating particle texture:', error);
        return null;
    }
}

function createMouseFollower() {
    try {
        // Create special particles that follow the mouse
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(100 * 3);
        
        for (let i = 0; i < 100; i++) {
            const i3 = i * 3;
            positions[i3] = mouseX;
            positions[i3 + 1] = mouseY;
            positions[i3 + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 3,
            color: 0xff00ff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        const mouseParticles = new THREE.Points(geometry, material);
        scene.add(mouseParticles);
        
        return mouseParticles;
    } catch (error) {
        console.error('Error creating mouse follower:', error);
        return null;
    }
}

function onMouseMove(event) {
    // Track mouse position
    targetMouseX = (event.clientX - windowHalfX) * 0.05;
    targetMouseY = (event.clientY - windowHalfY) * 0.05;
}

function onWindowResize() {
    try {
        // Update camera and renderer on window resize
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        
        if (camera) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        
        if (renderer) {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    } catch (error) {
        console.error('Error resizing window:', error);
    }
}

function animate() {
    try {
        // Store animation frame ID to allow cancellation if needed
        animationLoopId = requestAnimationFrame(animate);
        render();
    } catch (error) {
        console.error('Error in animation loop:', error);
        stopAnimation();
        setupFallbackBackground();
    }
}

// Add function to stop animation if needed
function stopAnimation() {
    if (animationLoopId !== null) {
        cancelAnimationFrame(animationLoopId);
        animationLoopId = null;
    }
    animationRunning = false;
    console.log('Animation stopped due to errors');
}

function render() {
    try {
        // Smooth mouse movement
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        
        // Rotate particle group based on mouse position
        if (particleGroup) {
            particleGroup.rotation.x += 0.0003;
            particleGroup.rotation.y += 0.0005;
            
            // Add mouse responsiveness
            particleGroup.rotation.x += (mouseY * 0.0001);
            particleGroup.rotation.y += (mouseX * 0.0001);
        }
        
        // Move stars for parallax effect
        if (stars) {
            stars.rotation.x += 0.0001;
            stars.rotation.y += 0.0001;
        }
        
        // Animate individual particles - with additional checks
        if (particles && 
            particles.geometry && 
            particles.geometry.attributes && 
            particles.geometry.attributes.position && 
            particles.geometry.attributes.position.array) {
            
            const positions = particles.geometry.attributes.position.array;
            const count = positions.length / 3;
            
            // Limit processing in case of performance issues
            const processingLimit = Math.min(count, 1000); // Cap at 1000 particles max
            
            for (let i = 0; i < processingLimit; i++) {
                const i3 = i * 3;
                // Add gentle wave motion - with reduced intensity
                positions[i3 + 1] += Math.sin(i + Date.now() * 0.0005) * 0.05;
                positions[i3] += Math.cos(i + Date.now() * 0.0005) * 0.05;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Render scene - with additional checks
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        } else {
            console.warn('Cannot render: missing renderer, scene, or camera');
        }
    } catch (error) {
        console.error('Error in render loop:', error);
        
        // If a critical rendering error occurs, stop the animation
        if (error.toString().includes('WebGL') || error.toString().includes('context')) {
            console.error('Critical WebGL error detected, stopping animation');
            stopAnimation();
            setupFallbackBackground();
        }
    }
}

// Add a fallback static background color just in case
function setupFallbackBackground() {
    try {
        // Apply fallback background to both body and canvas
        document.body.style.backgroundColor = "#000000";
        
        // Make sure content remains visible
        ensureContentVisibility();
        
        console.log('Fallback background applied');
    } catch (error) {
        console.error('Error setting fallback background:', error);
    }
}

// New function to ensure content stays visible even if background fails
function ensureContentVisibility() {
    try {
        // Display a message for debugging purposes (can be removed in production)
        console.log('Ensuring content visibility...');
        
        // Make sure the main container is visible
        const mainContainer = document.querySelector('main.container');
        if (mainContainer) {
            mainContainer.style.display = 'block';
            mainContainer.style.visibility = 'visible';
            mainContainer.style.opacity = '1';
        }
        
        // Make sure all cards and content elements are visible
        const contentElements = document.querySelectorAll('.container, .card, h1, h2, h3, p, .btn');
        contentElements.forEach(element => {
            element.style.visibility = 'visible';
            element.style.opacity = '1';
        });
        
        console.log('Content visibility enforced');
    } catch (error) {
        console.error('Error ensuring content visibility:', error);
    }
}

// Initialize background when DOM content is loaded with error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Initializing background...');
        
        // Apply fallback first as a safety measure
        setupFallbackBackground();
        
        // Check if Three.js is available
        if (typeof THREE !== 'undefined') {
            // Delay Three.js initialization slightly to ensure DOM is fully ready
            setTimeout(function() {
                initBackground();
                // Double-check content visibility after a delay
                setTimeout(ensureContentVisibility, 500);
            }, 100);
        } else {
            console.warn('Three.js not available. Using fallback background.');
        }
        
        // Final safety check - ensure content is visible after 1 second
        setTimeout(ensureContentVisibility, 1000);
    } catch (error) {
        console.error('Error during initialization:', error);
        setupFallbackBackground();
    }
});
