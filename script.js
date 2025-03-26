// Audio Context Setup
let audioContext;
let selectedWaveform = 'sine';
let activeOscillators = {};
let masterGainNode, reverbGainNode, convolver, delayNode;
let attackTime = 0.01;
let releaseTime = 0.1;
let distortionNode, filterNode;
let themeColor = 'default';
let particles = [];
let particlesEnabled = true;
let animatedBackgroundEnabled = true;
let noteTrailsEnabled = false;
let soundBank = 'synth'; // New - default sound bank
let soundSamples = {}; // Will hold our loaded samples

// Three.js variables
let scene, camera, renderer;
let keyboard;
let noteShapes = {};
let raycaster, mouse;
let particleSystem, backgroundAnimation;
let clock;
let hoveredKey = null;
let cameraTarget = new THREE.Vector3(0, 0, 0);

// Constants for note frequencies and colors
const noteFrequencies = {
    'C': [130.81, 261.63, 523.25, 1046.50], // Added C2 (130.81)
    'C#': [138.59, 277.18, 554.37, 1108.73],
    'D': [146.83, 293.66, 587.33, 1174.66],
    'D#': [155.56, 311.13, 622.25, 1244.51],
    'E': [164.81, 329.63, 659.25, 1318.51],
    'F': [174.61, 349.23, 698.46, 1396.91],
    'F#': [185.00, 369.99, 739.99, 1479.98],
    'G': [196.00, 392.00, 783.99, 1567.98],
    'G#': [207.65, 415.30, 830.61, 1661.22],
    'A': [220.00, 440.00, 880.00, 1760.00],
    'A#': [233.08, 466.16, 932.33, 1864.66],
    'B': [246.94, 493.88, 987.77, 1975.53]
};

const noteColors = {
    'C': 0xff0000, // red
    'D': 0x8b4513, // brown
    'E': 0x808080, // gray
    'F': 0x0000ff, // blue
    'G': 0x000000, // black
    'A': 0xffff00, // yellow
    'B': 0x008000  // green
};

// Define which notes have black keys
const hasBlackKey = {
    'C': true,  // C has C# after it
    'D': true,  // D has D# after it
    'E': false, // E has no black key after it
    'F': true,  // F has F# after it
    'G': true,  // G has G# after it
    'A': true,  // A has A# after it
    'B': false  // B has no black key after it
};

// Sound banks - paths to samples
const soundBanks = {
    'synth': null, // Use built-in oscillator
    'piano': {
        baseUrl: 'https://gleitz.github.io/midi-js-soundfonts/FatBoy/',
        extension: 'mp3',
        velocity: 1,
        nameMapping: {
            'C': 'c',
            'C#': 'cs',
            'D': 'd',
            'D#': 'ds',
            'E': 'e',
            'F': 'f',
            'F#': 'fs',
            'G': 'g',
            'G#': 'gs',
            'A': 'a',
            'A#': 'as',
            'B': 'b'
        }
    },
    'marimba': {
        baseUrl: 'https://gleitz.github.io/midi-js-soundfonts/FatBoy/',
        extension: 'mp3',
        velocity: 1,
        nameMapping: {
            'C': 'c',
            'C#': 'cs',
            'D': 'd',
            'D#': 'ds',
            'E': 'e',
            'F': 'f',
            'F#': 'fs',
            'G': 'g',
            'G#': 'gs',
            'A': 'a',
            'A#': 'as',
            'B': 'b'
        }
    }
};

// Recording Variables
let mediaRecorder;
let audioChunks = [];

// Add new variable to track Shift key state
let isShiftPressed = false;

// Add new variables for mouse tracking and effects
let lastMouseX = 0;
let lastMouseY = 0;
let baseFrequencies = {}; // Store base frequencies for active notes

// Language dictionary
const translations = {
    en: {
        settings: "Settings",
        sound: "Sound",
        visual: "Visual",
        help: "Help",
        soundBank: "Sound Bank",
        waveform: "Waveform",
        theme: "Theme",
        volume: "Volume",
        attack: "Attack",
        release: "Release",
        reverb: "Reverb",
        delay: "Delay",
        distortion: "Distortion",
        filter: "Filter",
        particles: "Particles",
        animatedBackground: "Animated Background",
        noteTrails: "Note Trails",
        default: "Default",
        neon: "Neon",
        classic: "Classic",
        helpTitle: "How to Play",
        helpContent: "Click on the piano keys to play notes. Hold Shift to sustain notes. Use the side menu to adjust sound and visual settings.",
        record: "Record",
        stopRecord: "Stop Recording",
        fullscreen: "Fullscreen",
        language: "Language"
    },
    he: {
        settings: "הגדרות",
        sound: "סאונד",
        visual: "ויזואל",
        help: "עזרה",
        soundBank: "בנק צלילים",
        waveform: "צורת גל",
        theme: "ערכת נושא",
        volume: "עוצמה",
        attack: "התקפה",
        release: "שחרור",
        reverb: "ריוורב",
        delay: "דיליי",
        distortion: "דיסטורשן",
        filter: "פילטר",
        particles: "חלקיקים",
        animatedBackground: "רקע מונפש",
        noteTrails: "שובלי צלילים",
        default: "ברירת מחדל",
        neon: "ניאון",
        classic: "קלאסי",
        helpTitle: "איך לנגן",
        helpContent: "לחץ על מקשי הפסנתר כדי לנגן צלילים. החזק Shift כדי להחזיק צלילים. השתמש בתפריט הצד כדי לשנות הגדרות סאונד וויזואליזציה.",
        record: "הקלטה",
        stopRecord: "עצור הקלטה",
        fullscreen: "מסך מלא",
        language: "שפה"
    }
};

// Current language
let currentLang = 'en';

// Function to update UI language
function updateUILanguage() {
    // Update all text elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
    
    // Update RTL/LTR direction
    document.body.dir = currentLang === 'he' ? 'rtl' : 'ltr';
    
    // Update controls panel direction
    const controlsPanel = document.querySelector('.controls-panel');
    if (controlsPanel) {
        controlsPanel.style.direction = currentLang === 'he' ? 'rtl' : 'ltr';
    }
}

// Add language switching functionality
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Update language
        currentLang = btn.getAttribute('data-lang');
        // Update UI
        updateUILanguage();
    });
});

// Initialize UI language
updateUILanguage();

// Initialize everything when the window loads
window.addEventListener('load', init);

function init() {
    initAudio();
    initThreeJS();
    loadSoundSamples();
    createKeyboard();
    setupEventListeners();
    setupUI();
    setupBackgroundEffects();
    animate();
}

// Load sound samples
function loadSoundSamples() {
    // Only load if we're using a sample-based sound bank
    if (soundBank !== 'synth' && soundBanks[soundBank]) {
        const bank = soundBanks[soundBank];
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const octaves = [2, 3, 4, 5]; // All octaves we'll use
        
        // Create audio buffer loader
        notes.forEach(note => {
            octaves.forEach(octave => {
                const noteKey = `${note}${octave}`;
                const mappedNote = bank.nameMapping[note] || note.toLowerCase();
                const url = `${bank.baseUrl}${mappedNote}${octave}.${bank.extension}`;
                
                // Create a new howl for each note
                soundSamples[noteKey] = new Howl({
                    src: [url],
                    volume: 0.5,
                    preload: true,
                    onloaderror: function() {
                        console.warn(`Failed to load sample: ${url}`);
                    }
                });
            });
            
            // Also load sharps where needed
            if (hasBlackKey[note]) {
                octaves.forEach(octave => {
                    const noteKey = `${note}#${octave}`;
                    const mappedNote = bank.nameMapping[note + '#'] || (note.toLowerCase() + 's');
                    const url = `${bank.baseUrl}${mappedNote}${octave}.${bank.extension}`;
                    
                    soundSamples[noteKey] = new Howl({
                        src: [url],
                        volume: 0.5,
                        preload: true,
                        onloaderror: function() {
                            console.warn(`Failed to load sample: ${url}`);
                        }
                    });
                });
            }
        });
    }
}

// Set up the audio context and nodes
function initAudio() {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create gain nodes
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = 0.5;
    masterGainNode.connect(audioContext.destination);
    
    reverbGainNode = audioContext.createGain();
    reverbGainNode.gain.value = 0;
    reverbGainNode.connect(masterGainNode);
    
    // Create convolver for reverb
    convolver = audioContext.createConvolver();
    convolver.connect(reverbGainNode);
    
    // Create delay node
    delayNode = audioContext.createDelay(5.0);
    delayNode.delayTime.value = 0;
    delayNode.connect(masterGainNode);
    
    // Create distortion
    distortionNode = audioContext.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(0);
    distortionNode.oversample = '4x';
    distortionNode.connect(masterGainNode);
    
    // Create filter
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 20000; // Default to max
    filterNode.connect(masterGainNode);
    
    // Create impulse response for reverb
    createImpulseResponse();
}

// Create a distortion curve
function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 0;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    
    return curve;
}

// Create a reverb impulse response
function createImpulseResponse() {
    const sampleRate = audioContext.sampleRate;
    const length = 2 * sampleRate; // 2 seconds
    const impulseResponse = audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulseResponse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            // Decay curve
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
    }
    
    convolver.buffer = impulseResponse;
}

// Initialize Three.js
function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    
    // Set up camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    camera.position.set(0, 0, 25);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Add renderer to the page
    const container = document.getElementById('canvas-container');
    container.appendChild(renderer.domElement);
    
    // Add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 20);
    scene.add(directionalLight);
    
    // Create keyboard group
    keyboard = new THREE.Group();
    scene.add(keyboard);
    
    // Set up responsive design
    window.addEventListener('resize', onWindowResize);
    
    // Setup raycaster for interactions
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Setup clock for animation
    clock = new THREE.Clock();
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Adjust keyboard size based on screen width
    resizeKeyboard();
}

// Create a material that can be highlighted
function createHighlightableMaterial(color) {
    return new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0,
        specular: 0x222222,
        shininess: 30
    });
}

// Create the piano keyboard
function createKeyboard() {
    // Larger key sizes
    const whiteKeyWidth = 1.5;
    const whiteKeyHeight = 6;
    const whiteKeyDepth = 1.2;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const blackKeyHeight = whiteKeyHeight * 0.6;
    const blackKeyDepth = whiteKeyDepth * 1.5;
    const keySpacing = 0.1;
    
    // Notes and octaves
    const whiteNotes = ['C', 'D', 'E' || 'Fb', 'F', 'G', 'A', 'B' || 'Cb'];
    const blackNotes = ['C#' || 'Db', 'D#' || 'Eb', 'F#' || 'Gb', 'G#' || 'Ab', 'A#' || 'Bb'];
    const numOctaves = 4; // Increased to 4
    
    // Calculate layout positions for each row
    let whiteKeyIndex = 0;
    let totalWhiteKeys = whiteNotes.length * (numOctaves / 2); // Half for each row
    let totalWidth = totalWhiteKeys * (whiteKeyWidth + keySpacing) - keySpacing;
    
    // Create first row (octaves 2-3)
    for (let octave = 2; octave <= 3; octave++) {
        for (let i = 0; i < whiteNotes.length; i++) {
            const note = whiteNotes[i];
            
            // Position for this white key
            const x = (whiteKeyIndex * (whiteKeyWidth + keySpacing)) - (totalWidth / 2) + (whiteKeyWidth / 2);
            const y = 4; // Changed from 3 to 4 for upper row
            
            // Create white key
            createWhiteKey(note, octave, x, y, whiteKeyWidth, whiteKeyHeight, whiteKeyDepth);
            
            whiteKeyIndex++;
        }
    }
    
    // Reset index for second row
    whiteKeyIndex = 0;
    
    // Create second row (octaves 4-5)
    for (let octave = 4; octave <= 5; octave++) {
        for (let i = 0; i < whiteNotes.length; i++) {
            const note = whiteNotes[i];
            
            // Position for this white key
            const x = (whiteKeyIndex * (whiteKeyWidth + keySpacing)) - (totalWidth / 2) + (whiteKeyWidth / 2);
            const y = -4; // Changed from -3 to -4 for lower row
            
            // Create white key
            createWhiteKey(note, octave, x, y, whiteKeyWidth, whiteKeyHeight, whiteKeyDepth);
            
            whiteKeyIndex++;
        }
    }
    
    // Now add black keys for first row
    whiteKeyIndex = 0;
    for (let octave = 2; octave <= 3; octave++) {
        for (let i = 0; i < whiteNotes.length; i++) {
            const note = whiteNotes[i];
            
            // Position for the white key
            const x = (whiteKeyIndex * (whiteKeyWidth + keySpacing)) - (totalWidth / 2) + (whiteKeyWidth / 2);
            const y = 4; // Changed from 3 to 4 for upper row
            
            // Add black key if needed
            if (hasBlackKey[note]) {
                const blackNote = note + '#';
                const blackKeyX = x + (whiteKeyWidth / 2) + (keySpacing / 2) + (blackKeyWidth / 2);
                
                createBlackKey(blackNote, octave, blackKeyX, y, blackKeyWidth, blackKeyHeight, blackKeyDepth);
            }
            
            whiteKeyIndex++;
        }
    }
    
    // Reset index for second row black keys
    whiteKeyIndex = 0;
    
    // Now add black keys for second row
    for (let octave = 4; octave <= 5; octave++) {
        for (let i = 0; i < whiteNotes.length; i++) {
            const note = whiteNotes[i];
            
            // Position for the white key
            const x = (whiteKeyIndex * (whiteKeyWidth + keySpacing)) - (totalWidth / 2) + (whiteKeyWidth / 2);
            const y = -4; // Changed from -3 to -4 for lower row
            
            // Add black key if needed
            if (hasBlackKey[note]) {
                const blackNote = note + '#';
                const blackKeyX = x + (whiteKeyWidth / 2) + (keySpacing / 2) + (blackKeyWidth / 2);
                
                createBlackKey(blackNote, octave, blackKeyX, y, blackKeyWidth, blackKeyHeight, blackKeyDepth);
            }
            
            whiteKeyIndex++;
        }
    }
    
    // Adjust the keyboard scale for the initial view
    resizeKeyboard();
}

// Create a white key with note indicator
function createWhiteKey(note, octave, x, y, width, height, depth) {
    // Create the key
    const keyGeometry = new THREE.BoxGeometry(width, height, depth);
    const keyMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0x111111,
        shininess: 30
    });
    
    const key = new THREE.Mesh(keyGeometry, keyMaterial);
    key.position.set(x, y, 0);
    keyboard.add(key);
    
    // Create the note indicator based on octave
    createNoteIndicator(note, octave, x, y + height / 2 + 0.2);
    
    // Create hit area for the black key for better interaction
    createHitArea(note, octave, x, y, depth/2, width * 1.5, height, depth * 3);
}

// Create a black key
function createBlackKey(note, octave, x, y, width, height, depth) {
    // Create the key
    const keyGeometry = new THREE.BoxGeometry(width, height, depth);
    const keyMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        specular: 0x222222,
        shininess: 30
    });
    
    const key = new THREE.Mesh(keyGeometry, keyMaterial);
    key.position.set(x, y, depth/2);
    keyboard.add(key);
    
    // Create hit area for better interaction
    createHitArea(note, octave, x, y, 0, width * 1.2, height, depth * 3);
}

// Create a note indicator based on octave (X, square, circle, or triangle)
function createNoteIndicator(note, octave, x, yOffset) {
    // Skip creating indicators for black keys (sharps)
    if (note.includes('#')) return;
    
    const noteColor = noteColors[note];
    let noteShape;
    
    const size = 0.9; // Larger size for the indicators
    
    if (octave === 2) {
        // X shape for octave 2 - using multiple lines for thickness
        const material = new THREE.LineBasicMaterial({ 
            color: noteColor,
            linewidth: 24 // Increased thickness
        });
        
        // Create two crossed lines for the X
        const points1 = [
            new THREE.Vector3(-size/2, -size/2, 0),
            new THREE.Vector3(size/2, size/2, 0)
        ];
        const points2 = [
            new THREE.Vector3(-size/2, size/2, 0),
            new THREE.Vector3(size/2, -size/2, 0)
        ];
        
        const geometry1 = new THREE.BufferGeometry().setFromPoints(points1);
        const geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
        
        const line1 = new THREE.Line(geometry1, material);
        const line2 = new THREE.Line(geometry2, material);
        
        // Create a group to hold both lines
        noteShape = new THREE.Group();
        noteShape.add(line1);
        noteShape.add(line2);
        
    } else if (octave === 3) {
        // Square for octave 3
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = createHighlightableMaterial(noteColor);
        noteShape = new THREE.Mesh(geometry, material);
        
    } else if (octave === 4) {
        // Circle for octave 4 - using CircleGeometry with more segments
        const geometry = new THREE.CircleGeometry(size/2, 32);
        const material = createHighlightableMaterial(noteColor);
        noteShape = new THREE.Mesh(geometry, material);
        noteShape.rotation.x = -Math.PI * 2; // Rotate to face camera
        
    } else if (octave === 5) {
        // Triangle for octave 5
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, size/2, 0,      // top
            -size/2, -size/2, 0, // bottom left
            size/2, -size/2, 0   // bottom right
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        
        const material = createHighlightableMaterial(noteColor);
        noteShape = new THREE.Mesh(geometry, material);
    }
    
    // Position the note shape at the top or bottom of the key based on row
    const isTopRow = yOffset > 0.2;
    const verticalOffset = isTopRow ? -0.4 : -6; // Changed only bottom row offset from -6 to -8
    noteShape.position.set(x, yOffset + verticalOffset, 0.6);
    
    // Store the note data for use when playing
    noteShape.userData = {
        note: note,
        octave: octave,
        isPlaying: false
    };
    
    // Add to the scene
    keyboard.add(noteShape);
    
    // Store reference to the note shape for easy access
    if (!noteShapes[note]) {
        noteShapes[note] = {};
    }
    noteShapes[note][octave] = noteShape;
}

// Create an invisible hit area for better touch interaction
function createHitArea(note, octave, x, y, z, width, height, depth) {
    const hitAreaGeometry = new THREE.BoxGeometry(width, height, depth);
    const hitAreaMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.0 // Completely invisible
    });
    
    const hitArea = new THREE.Mesh(hitAreaGeometry, hitAreaMaterial);
    hitArea.position.set(x, y, z);
    hitArea.userData = {
        note: note,
        octave: octave,
        isNoteHitArea: true
    };
    
    keyboard.add(hitArea);
}

// Resize keyboard based on screen size
function resizeKeyboard() {
    const isMobile = window.innerWidth < 768;
    
    // Different scaling factors based on device
    let scale;
    if (isMobile) {
        scale = Math.min(window.innerWidth / 600, window.innerHeight / 800) * 0.8;
    } else {
        scale = Math.min(window.innerWidth / 800, window.innerHeight / 600) * 0.8;
    }
    
    keyboard.scale.set(scale, scale, scale);
    
    // Adjust camera position based on screen size
    if (isMobile) {
        camera.position.z = 30;
    } else {
        camera.position.z = 25;
    }
}

// Event listeners for UI controls and interaction
function setupEventListeners() {
    // Waveform selection
    document.querySelectorAll('.waveform').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.waveform').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            selectedWaveform = button.getAttribute('data-wave');
        });
    });
    
    // Sound bank selection
    document.querySelectorAll('.sound-bank').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.sound-bank').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            soundBank = button.getAttribute('data-bank');
            
            // Load samples if we switched to a sample-based bank
            if (soundBank !== 'synth' && Object.keys(soundSamples).length === 0) {
                loadSoundSamples();
            }
        });
    });
    
    // Volume control
    document.getElementById('volume').addEventListener('input', (event) => {
        masterGainNode.gain.value = event.target.value;
    });
    
    // Reverb control
    document.getElementById('reverb').addEventListener('input', (event) => {
        reverbGainNode.gain.value = event.target.value;
    });
    
    // Delay control
    document.getElementById('delay').addEventListener('input', (event) => {
        delayNode.delayTime.value = parseFloat(event.target.value);
    });
    
    // Set up raycaster for mouse/touch interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Mouse/touch interactions
    const canvas = renderer.domElement;
    
    // Mouse down / touch start
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        onPointerDown({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
    
    // Mouse move - for hover effects
    canvas.addEventListener('mousemove', onPointerMove);
    
    function onPointerMove(event) {
        const rect = canvas.getBoundingClientRect();
        const currentMouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const currentMouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update mouse position for raycaster
        mouse.x = currentMouseX;
        mouse.y = currentMouseY;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(keyboard.children);
        
        // Find if we're hovering over a new note
        let newNote = null;
        let newOctave = null;
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData.isNoteHitArea || (object.userData.note && object.userData.octave)) {
                newNote = object.userData.note;
                newOctave = object.userData.octave;
            }
        }
        
        // If we have an active oscillator and we're hovering over a new note
        if (Object.keys(activeOscillators).length > 0 && newNote && newOctave) {
            const currentKey = Object.keys(activeOscillators)[0];
            const [currentNote, currentOctave] = currentKey.match(/([A-G]#?)(\d)/).slice(1);
            
            // If we're hovering over a different note than the current one
            if (currentNote !== newNote || currentOctave !== newOctave) {
                const currentOscillator = activeOscillators[currentKey];
                
                // Only change note if it's an oscillator (not a sample)
                if (currentOscillator.type === 'oscillator') {
                    // Get the new frequency
                    const newFreq = noteFrequencies[newNote][newOctave - 2];
                    
                    // Smoothly transition to the new frequency
                    const now = audioContext.currentTime;
                    currentOscillator.oscillator.frequency.setValueAtTime(currentOscillator.oscillator.frequency.value, now);
                    currentOscillator.oscillator.frequency.linearRampToValueAtTime(newFreq, now + 0.1);
                    
                    // Update the base frequency
                    baseFrequencies[currentKey] = newFreq;
                    
                    // Update the note data
                    currentOscillator.note = newNote;
                    currentOscillator.octave = newOctave;
                    
                    // Update visual feedback
                    highlightNote(currentNote, currentOctave, false);
                    highlightNote(newNote, newOctave, true);
                    
                    // Create particle effect if enabled
                    if (particlesEnabled && !newNote.includes('#')) {
                        createParticlesForNote(newNote, newOctave);
                    }
                    
                    // Create note trail if enabled
                    if (noteTrailsEnabled && !newNote.includes('#')) {
                        createNoteTrail(newNote, newOctave);
                    }
                }
            }
        }
        
        // Update hover effects
        if (hoveredKey) {
            if (hoveredKey.material instanceof THREE.MeshPhongMaterial) {
                hoveredKey.material.emissiveIntensity = 0;
            } else if (hoveredKey.material instanceof THREE.LineBasicMaterial) {
                hoveredKey.material.opacity = 0.5;
            }
            hoveredKey = null;
        }
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData.isNoteHitArea || (object.userData.note && object.userData.octave)) {
                const note = object.userData.note;
                const octave = object.userData.octave;
                
                if (!note.includes('#') && noteShapes[note] && noteShapes[note][octave]) {
                    const noteShape = noteShapes[note][octave];
                    
                    if (noteShape.material instanceof THREE.MeshPhongMaterial) {
                        noteShape.material.emissiveIntensity = 0.3;
                    } else if (noteShape.material instanceof THREE.LineBasicMaterial) {
                        noteShape.material.opacity = 1;
                    }
                    
                    hoveredKey = noteShape;
                    cameraTarget.copy(noteShape.position);
                }
            }
        }
        
        // Update last mouse position
        lastMouseX = currentMouseX;
        lastMouseY = currentMouseY;
    }
    
    function onPointerDown(event) {
        // Ensure audio context is running (needed for iOS)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Calculate mouse position
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Cast ray
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(keyboard.children);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Check if it's a note hit area or note shape
            if (object.userData.isNoteHitArea || 
                (object.userData.note && object.userData.octave)) {
                
                const note = object.userData.note;
                const octave = object.userData.octave;
                
                // Play the note
                playNote(note, octave);
            }
        }
    }
    
    // Mouse up / touch end
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('mouseleave', onPointerUp);
    canvas.addEventListener('touchend', onPointerUp);
    canvas.addEventListener('touchcancel', onPointerUp);
    
    function onPointerUp() {
        if (!isShiftPressed) {
            // Stop all playing notes when mouse is released (if Shift is not pressed)
            Object.keys(activeOscillators).forEach(key => {
                const [note, octave] = key.match(/([A-G]#?)(\d)/).slice(1);
                stopNote(note, octave);
            });
        }
    }
}

// Add event listeners for Shift key
window.addEventListener('keydown', (event) => {
    if (event.key === 'Shift') {
        isShiftPressed = true;
    }
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') {
        isShiftPressed = false;
        // Stop all playing notes when Shift is released
        Object.keys(activeOscillators).forEach(key => {
            const [note, octave] = key.match(/([A-G]#?)(\d)/).slice(1);
            stopNote(note, octave);
        });
    }
});

// Play a note
function playNote(note, octave) {
    // Resume audio context if needed
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // If using samples
    if (soundBank !== 'synth' && soundSamples[`${note}${octave}`]) {
        // Stop the previous sound if it's playing
        stopNote(note, octave);
        
        // Play the sample
        const soundId = soundSamples[`${note}${octave}`].play();
        soundSamples[`${note}${octave}`].volume(masterGainNode.gain.value, soundId);
        
        // Store reference for stopping later
        activeOscillators[`${note}${octave}`] = {
            type: 'sample',
            soundId: soundId
        };
        
        // Highlight the note
        highlightNote(note, octave, true);
        
        // Create particle effect if enabled
        if (particlesEnabled && !note.includes('#')) {
            createParticlesForNote(note, octave);
        }
        
        // Create note trail if enabled
        if (noteTrailsEnabled && !note.includes('#')) {
            createNoteTrail(note, octave);
        }
        
        return;
    }
    
    // Get the frequency for this note - for oscillator
    const frequency = noteFrequencies[note][octave - 2];
    baseFrequencies[`${note}${octave}`] = frequency;
    
    // If there's already an oscillator for this note, stop it
    stopNote(note, octave);
    
    // Create a new oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = selectedWaveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Create a gain node for envelope
    const gainNode = audioContext.createGain();
    
    // Connect oscillator to effects chain
    oscillator.connect(gainNode);
    gainNode.connect(filterNode);
    gainNode.connect(distortionNode);
    gainNode.connect(convolver);
    gainNode.connect(delayNode);
    
    // Apply envelope
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.7, now + attackTime); // Attack
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1 + attackTime); // Decay
    
    // Start the oscillator
    oscillator.start();
    
    // Store the oscillator and gain node for later stopping
    activeOscillators[`${note}${octave}`] = {
        type: 'oscillator',
        oscillator: oscillator,
        gainNode: gainNode
    };
    
    // Highlight the note
    highlightNote(note, octave, true);
    
    // Create particle effect if enabled
    if (particlesEnabled && !note.includes('#')) {
        createParticlesForNote(note, octave);
    }
    
    // Create note trail if enabled
    if (noteTrailsEnabled && !note.includes('#')) {
        createNoteTrail(note, octave);
    }
}

// Stop a specific note
function stopNote(note, octave) {
    const key = `${note}${octave}`;
    delete baseFrequencies[key];
    
    if (activeOscillators[key]) {
        if (activeOscillators[key].type === 'sample') {
            soundSamples[key].stop(activeOscillators[key].soundId);
            delete activeOscillators[key];
        } else {
        // Apply release curve
            activeOscillators[key].gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + releaseTime);
        
        // Stop the oscillator after the release
        setTimeout(() => {
            if (activeOscillators[key]) {
                activeOscillators[key].oscillator.stop();
                delete activeOscillators[key];
            }
            }, releaseTime * 1000);
        }
        
        // Remove highlight
        highlightNote(note, octave, false);
    }
}

// Highlight/unhighlight a note
function highlightNote(note, octave, isPlaying) {
    // Skip black keys/sharps as they don't have note shapes
    if (note.includes('#')) return;
    
    if (noteShapes[note] && noteShapes[note][octave]) {
        const noteShape = noteShapes[note][octave];
        
        // Handle different material types
        if (noteShape.material instanceof THREE.MeshPhongMaterial) {
        noteShape.material.emissiveIntensity = isPlaying ? 0.5 : 0;
        } else if (noteShape.material instanceof THREE.LineBasicMaterial) {
            noteShape.material.opacity = isPlaying ? 1 : 0.5;
        } else if (noteShape.type === 'Group') {
            // Handle group of lines (X shape)
            noteShape.children.forEach(line => {
                if (line.material instanceof THREE.LineBasicMaterial) {
                    line.material.opacity = isPlaying ? 1 : 0.5;
                }
            });
        }
        
        // Update the userData state
        noteShape.userData.isPlaying = isPlaying;
    }
}

// Setup UI interactions
function setupUI() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length > 0 && tabContents.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Deactivate all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Activate selected tab
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                const targetContent = document.getElementById(tabId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }
    
    // Waveform selection
    const waveformButtons = document.querySelectorAll('.waveform-btn');
    if (waveformButtons.length > 0) {
        waveformButtons.forEach(button => {
            button.addEventListener('click', () => {
                waveformButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                selectedWaveform = button.getAttribute('data-waveform');
            });
        });
    }
    
    // Sound bank selection
    const soundBankButtons = document.querySelectorAll('.sound-bank-btn');
    if (soundBankButtons.length > 0) {
        soundBankButtons.forEach(button => {
            button.addEventListener('click', () => {
                soundBankButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                soundBank = button.getAttribute('data-bank');
                
                // Load samples if we switched to a sample-based bank
                if (soundBank !== 'synth' && Object.keys(soundSamples).length === 0) {
                    loadSoundSamples();
                }
            });
        });
    }
    
    // Volume control
    const volumeSlider = document.getElementById('volume');
    if (volumeSlider) {
        const volumeDisplay = volumeSlider.nextElementSibling;
        volumeSlider.addEventListener('input', (event) => {
            const value = event.target.value;
            masterGainNode.gain.value = value;
            if (volumeDisplay) {
                volumeDisplay.textContent = Math.round(value * 100) + '%';
            }
        });
    }
    
    // Attack control
    const attackSlider = document.getElementById('attack');
    if (attackSlider) {
        const attackDisplay = attackSlider.nextElementSibling;
        attackSlider.addEventListener('input', (event) => {
            attackTime = parseFloat(event.target.value);
            if (attackDisplay) {
                attackDisplay.textContent = Math.round(attackTime * 1000) + 'ms';
            }
        });
    }
    
    // Release control
    const releaseSlider = document.getElementById('release');
    if (releaseSlider) {
        const releaseDisplay = releaseSlider.nextElementSibling;
        releaseSlider.addEventListener('input', (event) => {
            releaseTime = parseFloat(event.target.value);
            if (releaseDisplay) {
                releaseDisplay.textContent = Math.round(releaseTime * 1000) + 'ms';
            }
        });
    }
    
    // Reverb control
    const reverbSlider = document.getElementById('reverb');
    if (reverbSlider) {
        const reverbDisplay = reverbSlider.nextElementSibling;
        reverbSlider.addEventListener('input', (event) => {
            const value = event.target.value;
            reverbGainNode.gain.value = value;
            if (reverbDisplay) {
                reverbDisplay.textContent = Math.round(value * 100) + '%';
            }
        });
    }
    
    // Delay control
    const delaySlider = document.getElementById('delay');
    if (delaySlider) {
        const delayDisplay = delaySlider.nextElementSibling;
        delaySlider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            delayNode.delayTime.value = value * 0.5; // Max 500ms delay
            if (delayDisplay) {
                delayDisplay.textContent = Math.round(value * 100) + '%';
            }
        });
    }
    
    // Distortion control
    const distortionSlider = document.getElementById('distortion');
    if (distortionSlider) {
        const distortionDisplay = distortionSlider.nextElementSibling;
        distortionSlider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            distortionNode.curve = makeDistortionCurve(value * 400);
            if (distortionDisplay) {
                distortionDisplay.textContent = Math.round(value * 100) + '%';
            }
        });
    }
    
    // Filter control
    const filterSlider = document.getElementById('filter');
    if (filterSlider) {
        const filterDisplay = filterSlider.nextElementSibling;
        filterSlider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            filterNode.frequency.value = 200 * Math.pow(100, value);
            if (filterDisplay) {
                filterDisplay.textContent = Math.round(value * 100) + '%';
            }
        });
    }
    
    // Theme buttons
    const themeButtons = document.querySelectorAll('.theme-btn');
    if (themeButtons.length > 0) {
        themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                themeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                themeColor = button.getAttribute('data-theme');
                applyTheme(themeColor);
            });
        });
    }
    
    // Visual checkboxes
    const particlesCheckbox = document.getElementById('particles');
    if (particlesCheckbox) {
        particlesCheckbox.addEventListener('change', (event) => {
            particlesEnabled = event.target.checked;
            if (particleSystem) {
                particleSystem.visible = particlesEnabled;
            }
        });
    }
    
    const animatedBackgroundCheckbox = document.getElementById('animatedBackground');
    if (animatedBackgroundCheckbox) {
        animatedBackgroundCheckbox.addEventListener('change', (event) => {
            animatedBackgroundEnabled = event.target.checked;
            if (backgroundAnimation) {
                backgroundAnimation.visible = animatedBackgroundEnabled;
            }
        });
    }
    
    const noteTrailsCheckbox = document.getElementById('noteTrails');
    if (noteTrailsCheckbox) {
        noteTrailsCheckbox.addEventListener('change', (event) => {
            noteTrailsEnabled = event.target.checked;
        });
    }
    
    // Help Modal
    const helpBtn = document.querySelector('.help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeBtn = document.querySelector('.close');
    
    if (helpBtn && helpModal && closeBtn) {
        helpBtn.addEventListener('click', () => {
            helpModal.style.display = 'block';
        });
        
        closeBtn.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }
    
    // Fullscreen button
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
    }
    
    // Record button
    const recordBtn = document.querySelector('.record-btn');
    if (recordBtn) {
        recordBtn.addEventListener('click', () => {
            alert('יכולת הקלטה תהיה זמינה בגרסה הבאה!');
        });
    }
}

// Apply visual theme
function applyTheme(theme) {
    const root = document.documentElement;
    
    switch(theme) {
        case 'neon':
            document.body.style.background = 'linear-gradient(135deg, #000000, #1a0031, #003137)';
            document.querySelector('h1').style.color = '#00ffff';
            document.querySelector('h1').style.textShadow = '0 0 15px #00ffff, 0 0 25px #00ffff, 0 0 35px #00ffff';
            
            // Update note colors
            for (let note in noteColors) {
                if (noteShapes[note]) {
                    for (let octave in noteShapes[note]) {
                        const material = noteShapes[note][octave].material;
                        material.emissive.set(0x00ffff);
                        material.emissiveIntensity = 0.7;
                    }
                }
            }
            break;
            
        case 'classic':
            document.body.style.background = 'linear-gradient(135deg, #6b472f, #8b704b, #4c3520)';
            document.querySelector('h1').style.color = '#f8e7b7';
            document.querySelector('h1').style.textShadow = '4px 4px 0 #3c2817, 0 0 15px #f8e7b7';
            
            // Revert note colors to originals but with less glow
            for (let note in noteColors) {
                if (noteShapes[note]) {
                    for (let octave in noteShapes[note]) {
                        const material = noteShapes[note][octave].material;
                        material.emissive.setHex(noteColors[note]);
                        material.emissiveIntensity = 0.2;
                    }
                }
            }
            break;
            
        default: // default theme
            document.body.style.background = 'linear-gradient(135deg, #2c0252, #1a3a5f, #00566e)';
            document.querySelector('h1').style.color = '#ffeb3b';
            document.querySelector('h1').style.textShadow = '0 0 15px rgba(255, 235, 59, 0.7), 0 0 25px rgba(255, 235, 59, 0.5), 4px 4px 0 rgba(0, 0, 0, 0.3)';
            
            // Revert note colors to originals
            for (let note in noteColors) {
                if (noteShapes[note]) {
                    for (let octave in noteShapes[note]) {
                        const material = noteShapes[note][octave].material;
                        material.emissive.setHex(noteColors[note]);
                        material.emissiveIntensity = 0;
                    }
                }
            }
            break;
    }
}

// Setup background effects
function setupBackgroundEffects() {
    // Create particle system for background
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 100;
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 100;
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    
    backgroundAnimation = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(backgroundAnimation);
    
    // Create container for note particles
    particleSystem = new THREE.Group();
    scene.add(particleSystem);
}

// Create particles for played note
function createParticlesForNote(note, octave) {
    if (!noteShapes[note] || !noteShapes[note][octave]) return;
    
    const noteShape = noteShapes[note][octave];
    const position = new THREE.Vector3();
    noteShape.getWorldPosition(position);
    
    // Create particle geometry
    const particleCount = 10;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create particle material
    const material = new THREE.PointsMaterial({
        color: noteColors[note],
        size: 0.3,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    // Create particle system and add to scene
    const particleObj = new THREE.Points(geometry, material);
    
    // Add velocity data
    particleObj.userData = {
        velocities: Array(particleCount).fill().map(() => ({
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() * 0.2) + 0.1,
            z: (Math.random() - 0.5) * 0.2
        })),
        life: 2  // Life in seconds
    };
    
    particleSystem.add(particleObj);
    particles.push(particleObj);
}

// Create a visual trail for a played note
function createNoteTrail(note, octave) {
    if (!noteShapes[note] || !noteShapes[note][octave]) return;
    
    const noteShape = noteShapes[note][octave];
    const position = new THREE.Vector3();
    noteShape.getWorldPosition(position);
    
    // Create a small shape that will follow a path
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshPhongMaterial({
        color: noteColors[note],
        emissive: noteColors[note],
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
    });
    
    const trail = new THREE.Mesh(geometry, material);
    trail.position.copy(position);
    
    // Add animation data - changed target position to go downward
    trail.userData = {
        startPosition: position.clone(),
        targetPosition: new THREE.Vector3(
            position.x + (Math.random() - 0.5) * 10,
            position.y - (Math.random() * 5) - 5, // Changed from + to - to go downward
            position.z + (Math.random() - 0.5) * 10
        ),
        life: 3,  // Life in seconds
        elapsedTime: 0
    };
    
    scene.add(trail);
    particles.push(trail); // Reuse particles array for trails
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock ? clock.getDelta() : 0.016;
    
    // Smoothly move camera to hover over keys
    if (cameraTarget) {
        // Create subtle camera movement towards the target
        camera.position.x += (cameraTarget.x * 0.5 - camera.position.x) * delta * 2;
        camera.position.y += (cameraTarget.y * 0.2 - camera.position.y) * delta * 2;
    }
    
    // Animate background particles
    if (backgroundAnimation && animatedBackgroundEnabled) {
        backgroundAnimation.rotation.y += delta * 0.05;
        backgroundAnimation.rotation.x += delta * 0.02;
    }
    
    // Animate note particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        if (particle.userData.life <= 0) {
            // Remove dead particles
            if (particle.parent) {
                particle.parent.remove(particle);
    } else {
                scene.remove(particle);
            }
            particles.splice(i, 1);
            continue;
        }
        
        // Update particle life
        particle.userData.life -= delta;
        
        // Handle different types of particles
        if (particle.type === 'Points') {
            // Standard particles
            const positions = particle.geometry.attributes.position.array;
            
            for (let j = 0; j < positions.length / 3; j++) {
                positions[j * 3] += particle.userData.velocities[j].x;
                positions[j * 3 + 1] += particle.userData.velocities[j].y;
                positions[j * 3 + 2] += particle.userData.velocities[j].z;
                
                // Apply some gravity
                particle.userData.velocities[j].y -= 0.01;
            }
            
            particle.geometry.attributes.position.needsUpdate = true;
            particle.material.opacity = particle.userData.life / 2;
        } else if (particle.type === 'Mesh') {
            // Trail particles
            particle.userData.elapsedTime += delta;
            const progress = particle.userData.elapsedTime / particle.userData.life;
            
            // Interpolate between start and target position
            particle.position.lerpVectors(
                particle.userData.startPosition,
                particle.userData.targetPosition,
                Math.min(1, progress)
            );
            
            // Fade out
            particle.material.opacity = 1 - progress;
            particle.scale.multiplyScalar(0.99);
        }
    }
    
    renderer.render(scene, camera);
}

// Controls Panel Functionality
const toggleControls = document.querySelector('.toggle-controls');
const controlsPanel = document.querySelector('.controls-panel');

if (toggleControls && controlsPanel) {
    // Toggle Controls Panel
    toggleControls.addEventListener('click', () => {
        controlsPanel.classList.toggle('active');
        toggleControls.classList.toggle('active');
        // הסתרת המילה "הגדרות" כאשר התפריט נפתח
        const settingsText = toggleControls.querySelector('span');
        if (settingsText) {
            settingsText.style.display = controlsPanel.classList.contains('active') ? 'none' : 'inline';
        }
    });
}

// Tab Switching
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

if (tabBtns.length > 0 && tabContents.length > 0) {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Sound Bank Selection
const soundBankBtns = document.querySelectorAll('.sound-bank-btn');
if (soundBankBtns.length > 0) {
    soundBankBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            soundBankBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const bank = btn.getAttribute('data-bank');
            soundBank = bank;
            loadSoundSamples();
        });
    });
}

// Waveform Selection
const waveformBtns = document.querySelectorAll('.waveform-btn');
if (waveformBtns.length > 0) {
    waveformBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            waveformBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const wave = btn.getAttribute('data-waveform');
            selectedWaveform = wave;
        });
    });
}

// Theme Selection
const themeBtns = document.querySelectorAll('.theme-btn');
if (themeBtns.length > 0) {
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const theme = btn.getAttribute('data-theme');
            themeColor = theme;
            updateTheme();
        });
    });
}

// Slider Controls
const volumeSlider = document.getElementById('volume');
if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        volumeSlider.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
        masterGainNode.gain.value = value;
    });
}

const attackSlider = document.getElementById('attack');
if (attackSlider) {
    attackSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        attackSlider.nextElementSibling.textContent = `${Math.round(value * 1000)}ms`;
        attackTime = value;
    });
}

const releaseSlider = document.getElementById('release');
if (releaseSlider) {
    releaseSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        releaseSlider.nextElementSibling.textContent = `${Math.round(value * 1000)}ms`;
        releaseTime = value;
    });
}

const reverbSlider = document.getElementById('reverb');
if (reverbSlider) {
    reverbSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        reverbSlider.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
        reverbGainNode.gain.value = value;
    });
}

const delaySlider = document.getElementById('delay');
if (delaySlider) {
    delaySlider.addEventListener('input', (e) => {
        const value = e.target.value;
        delaySlider.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
        delayNode.delayTime.value = value * 0.5; // Max 500ms delay
    });
}

const distortionSlider = document.getElementById('distortion');
if (distortionSlider) {
    distortionSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        distortionSlider.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
        distortionNode.curve = makeDistortionCurve(value * 400);
    });
}

const filterSlider = document.getElementById('filter');
if (filterSlider) {
    filterSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        filterSlider.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
        filterNode.frequency.value = 200 * Math.pow(100, value);
    });
}

// Checkbox Controls
const particlesCheckbox = document.getElementById('particles');
if (particlesCheckbox) {
    particlesCheckbox.addEventListener('change', (e) => {
        particlesEnabled = e.target.checked;
        if (particleSystem) {
            particleSystem.visible = particlesEnabled;
        }
    });
}

const animatedBackgroundCheckbox = document.getElementById('animatedBackground');
if (animatedBackgroundCheckbox) {
    animatedBackgroundCheckbox.addEventListener('change', (e) => {
        animatedBackgroundEnabled = e.target.checked;
        if (backgroundAnimation) {
            backgroundAnimation.visible = animatedBackgroundEnabled;
        }
    });
}

const noteTrailsCheckbox = document.getElementById('noteTrails');
if (noteTrailsCheckbox) {
    noteTrailsCheckbox.addEventListener('change', (e) => {
        noteTrailsEnabled = e.target.checked;
    });
}

// Help Modal
const helpBtn = document.querySelector('.help-btn');
const helpModal = document.getElementById('help-modal');
const closeBtn = document.querySelector('.close');

if (helpBtn && helpModal && closeBtn) {
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
}

// Fullscreen
const fullscreenBtn = document.querySelector('.fullscreen-btn');
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
}

// Record Button
const recordBtn = document.querySelector('.record-btn');
if (recordBtn) {
    recordBtn.addEventListener('click', () => {
        alert('יכולת הקלטה תהיה זמינה בגרסה הבאה!');
    });
}

// Update Theme
function updateTheme() {
    // Implementation depends on your theming system
    console.log('Updating theme to:', themeColor);
}

// Start Recording
function startRecording() {
    const stream = audioContext.destination.stream;
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    };
    
    mediaRecorder.start();
}

// Stop Recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}