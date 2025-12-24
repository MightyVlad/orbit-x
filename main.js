// Initialize Three.js Scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.002);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Create Starfield
const starGeometry = new THREE.BufferGeometry();
const starCount = 5000;
const posArray = new Float32Array(starCount * 3);

for(let i = 0; i < starCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100; // Spread stars within 100 units
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const starMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
});

const starMesh = new THREE.Points(starGeometry, starMaterial);
scene.add(starMesh);

// Create a Central "Planet" or "Void Object" (Wireframe Sphere)
const geometry = new THREE.IcosahedronGeometry(10, 2);
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00f3ff, 
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Ambient Light
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

// Positioning
camera.position.z = 30;

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Scroll Interaction
let scrollPercent = 0;

document.addEventListener('scroll', () => {
    scrollPercent =
        ((document.documentElement.scrollTop || document.body.scrollTop) /
        ((document.documentElement.scrollHeight || document.body.scrollHeight) -
            document.documentElement.clientHeight)) * 100;
});


// Animation Loop
const clock = new THREE.Clock();

const animate = () => {
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    const elapsedTime = clock.getElapsedTime();

    // Rotate Stars
    starMesh.rotation.y += 0.0005;
    starMesh.rotation.x += 0.0002;

    // Rotate Sphere
    sphere.rotation.y += 0.005;
    sphere.rotation.x += 0.002;

    // Distort Sphere based on time (simple pulsing effect)
    const scale = 1 + Math.sin(elapsedTime) * 0.05;
    sphere.scale.set(scale, scale, scale);

    // Mouse Parallax
    sphere.rotation.y += 0.05 * (targetX - sphere.rotation.y);
    sphere.rotation.x += 0.05 * (targetY - sphere.rotation.x);

    // Scroll Effects
    // Move camera forward based on scroll
    camera.position.z = 30 - (scrollPercent * 0.2); 
    
    // Rotate sphere faster on scroll
    sphere.rotation.z = scrollPercent * 0.05;

    // Change sphere color based on scroll (Subtle shift)
    // We can't easily animate hex directly this way without HSL, but let's try opacity
    material.opacity = 0.3 + (scrollPercent * 0.005);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

animate();

// GSAP Animations for Content
gsap.registerPlugin(ScrollTrigger);

// Animate Sections
gsap.utils.toArray('.content-section').forEach(section => {
    gsap.from(section.querySelectorAll('.text-block, .tech-card, h2'), {
        scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
    });
});

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Text Scramble Effect
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="dud">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// Apply Scramble to Hero Title on Load
const el = document.querySelector('.glitch');
if (el) {
    const fx = new TextScramble(el);
    let counter = 0;
    const phrases = [
        'TRANSCEND',
        'EXPLORE',
        'ORBIT X'
    ];
    
    const next = () => {
        fx.setText(phrases[counter]).then(() => {
            setTimeout(next, 3000);
        });
        counter = (counter + 1) % phrases.length;
    };
    
    next();
}

// Random Coordinate Update
function updateCoordinates() {
    const coordEl = document.querySelector('.coordinates');
    if (coordEl) {
        setInterval(() => {
            const lat = (Math.random() * 180 - 90).toFixed(4);
            const lng = (Math.random() * 360 - 180).toFixed(4);
            coordEl.innerText = `LAT: ${lat}° | LNG: ${lng}° | SYNC: ${(Math.random() * 100).toFixed(1)}%`;
        }, 2000);
    }
}

updateCoordinates();
